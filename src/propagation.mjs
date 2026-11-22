export const gridSize = 1024;
export const extent = 80;
export const dx = 2 * extent / gridSize;
export const dt = 0.025;
export const duration = 26;
export const totalSteps = Math.round(duration / dt);
const checkpointInterval = 40;

export function positionAt(index) {
  return index * dx - extent;
}

const permutation = Uint16Array.from({ length: gridSize }, (_, index) => {
  let reversed = 0;
  for (let bit = 1; bit < gridSize; bit *= 2) {
    reversed = (reversed << 1) | (index & 1);
    index >>= 1;
  }
  return reversed;
});

const twiddles = Array.from({ length: gridSize / 2 }, (_, index) => {
  const angle = 2 * Math.PI * index / gridSize;
  return [Math.cos(angle), Math.sin(angle)];
});

function fourier(real, imag, inverse) {
  for (let index = 0; index < gridSize; index++) {
    const reversed = permutation[index];
    if (reversed > index) {
      [real[index], real[reversed]] = [real[reversed], real[index]];
      [imag[index], imag[reversed]] = [imag[reversed], imag[index]];
    }
  }
  for (let length = 2; length <= gridSize; length *= 2) {
    for (let start = 0; start < gridSize; start += length) {
      for (let offset = 0; offset < length / 2; offset++) {
        const [cos, sin] = twiddles[offset * gridSize / length];
        const s = inverse ? sin : -sin;
        const a = start + offset;
        const b = a + length / 2;
        const re = cos * real[b] - s * imag[b];
        const im = s * real[b] + cos * imag[b];
        real[b] = real[a] - re;
        imag[b] = imag[a] - im;
        real[a] += re;
        imag[a] += im;
      }
    }
  }
  if (inverse) {
    for (let index = 0; index < gridSize; index++) {
      real[index] /= gridSize;
      imag[index] /= gridSize;
    }
  }
}

const kineticPhase = Array.from({ length: gridSize }, (_, index) => {
  const mode = index < gridSize / 2 ? index : index - gridSize;
  const k = Math.PI * mode / extent;
  const angle = -dt * k * k / 2;
  return [Math.cos(angle), Math.sin(angle)];
});

export function createPacket(momentum, height, width, hardWall = false) {
  const real = new Float64Array(gridSize);
  const imag = new Float64Array(gridSize);
  const potentialPhase = Array.from({ length: gridSize }, (_, index) => {
    const x = positionAt(index);
    const angle = !hardWall && Math.abs(x) < width / 2 ? -height * dt / 2 : 0;
    return [Math.cos(angle), Math.sin(angle)];
  });
  let norm = 0;
  for (let index = 0; index < gridSize; index++) {
    // For a wall at x = 0, evolve an odd extension of the physical packet on
    // x < 0. Its node at the wall stays fixed under free kinetic evolution.
    if (hardWall && (index === 0 || index >= gridSize / 2)) continue;
    const x = positionAt(index);
    const envelope = Math.exp(-((x + 26) ** 2) / 36);
    const phase = momentum * (x + 26);
    real[index] = envelope * Math.cos(phase);
    imag[index] = envelope * Math.sin(phase);
    norm += envelope ** 2 * dx;
    if (hardWall) {
      real[gridSize - index] = -real[index];
      imag[gridSize - index] = -imag[index];
    }
  }
  const scale = 1 / Math.sqrt(norm);
  for (let index = 0; index < gridSize; index++) {
    real[index] *= scale;
    imag[index] *= scale;
  }
  const checkpoints = new Map([[0, [real.slice(), imag.slice()]]]);
  return { real, imag, potentialPhase, width, hardWall, steps: 0, checkpoints };
}

function rotate(real, imag, phases) {
  for (let index = 0; index < gridSize; index++) {
    const [cos, sin] = phases[index];
    const re = real[index];
    real[index] = cos * re - sin * imag[index];
    imag[index] = sin * re + cos * imag[index];
  }
}

export function advancePacket(packet, frames) {
  const { real, imag, potentialPhase, checkpoints } = packet;
  // Symmetric split-step evolution. The potential is local in position space
  // and the kinetic operator is diagonal in the Fourier (momentum) basis.
  const steps = Math.min(frames, totalSteps - packet.steps);
  for (let frame = 0; frame < steps; frame++) {
    rotate(real, imag, potentialPhase);
    fourier(real, imag, false);
    rotate(real, imag, kineticPhase);
    fourier(real, imag, true);
    rotate(real, imag, potentialPhase);
    packet.steps++;
    if (packet.steps % checkpointInterval === 0 && !checkpoints.has(packet.steps)) {
      checkpoints.set(packet.steps, [real.slice(), imag.slice()]);
    }
  }
}

export function seekPacket(packet, target) {
  const checkpoint = Math.min(target - target % checkpointInterval, (packet.checkpoints.size - 1) * checkpointInterval);
  if (target < packet.steps || checkpoint > packet.steps) {
    const [real, imag] = packet.checkpoints.get(checkpoint);
    packet.real.set(real);
    packet.imag.set(imag);
    packet.steps = checkpoint;
  }
  advancePacket(packet, target - packet.steps);
}

export function packetProbabilities({ real, imag, width, hardWall }) {
  let left = 0;
  let inside = 0;
  let right = 0;
  for (let index = 0; index < gridSize; index++) {
    if (hardWall && index >= gridSize / 2) break;
    const mass = (real[index] ** 2 + imag[index] ** 2) * dx;
    const x = positionAt(index);
    if (hardWall || x <= -width / 2) left += mass;
    else if (x >= width / 2) right += mass;
    else inside += mass;
  }
  return { left, inside, right };
}
