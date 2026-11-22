export function orbitals(x, z) {
  const r = Math.hypot(x, z);
  return [Math.exp(-r) / Math.sqrt(Math.PI), z * Math.exp(-r / 2) / Math.sqrt(32 * Math.PI)];
}

export function positionDensity(s, p, weight, interference) {

  return Math.max(0, (1 - weight) * s * s + weight * p * p
    + interference * s * p);
}

export function orbitalCoordinates(weight, phase, coherence) {
  const a = Math.sqrt(1 - weight);
  const bReal = Math.sqrt(weight) * Math.cos(phase);
  const bImag = Math.sqrt(weight) * Math.sin(phase);
  return { a, bReal, bImag, x: 2 * coherence * a * bReal, y: 2 * coherence * a * bImag, z: 1 - 2 * weight };
}

export function waveAtPoint(x, z, weight, phase, coherence) {
  const [s, p] = orbitals(x, z);
  const { a, bReal, bImag, x: coherenceTerm } = orbitalCoordinates(weight, phase, coherence);
  const oneS = a * s;
  const twoP = [bReal * p, bImag * p];
  return {
    oneS,
    twoP,
    amplitude: [oneS + twoP[0], twoP[1]],
    contributions: [(1 - weight) * s ** 2, weight * p ** 2, coherenceTerm * s * p],
    density: positionDensity(s, p, weight, coherenceTerm),
  };
}

export function spinVector(theta, phase) {
  const polar = theta * Math.PI / 180;
  const azimuth = phase * Math.PI / 180;
  return { x: Math.sin(polar) * Math.cos(azimuth), y: Math.sin(polar) * Math.sin(azimuth), z: Math.cos(polar) };
}

export function spinOutcomeProbability(vector, axis) {
  return Math.min(1, Math.max(0, (1 + vector[axis]) / 2));
}

export function measureSpin(vector, axis, random) {
  const positive = spinOutcomeProbability(vector, axis);
  const sign = random < positive ? 1 : -1;
  return { axis, sign, positive, vector: { x: 0, y: 0, z: 0, [axis]: sign } };
}

