export const MAX_SHELL = 8;
export const orbitalLetters = ['s', 'p', 'd', 'f', 'g', 'h', 'i', 'k'];

export function laguerre(order, alpha, x) {
  let previous = 1;
  if (order === 0) return previous;
  let current = 1 + alpha - x;
  for (let k = 2; k <= order; k++) {
    const next = ((2 * k - 1 + alpha - x) * current - (k - 1 + alpha) * previous) / k;
    previous = current;
    current = next;
  }
  return current;
}

function legendre(degree, order, x) {
  let base = 1;
  for (let j = 1; j <= order; j++) base *= -(2 * j - 1) * Math.sqrt(Math.max(0, 1 - x * x));
  if (degree === order) return base;
  let previous = base;
  let current = x * (2 * order + 1) * base;
  for (let j = order + 2; j <= degree; j++) {
    const next = ((2 * j - 1) * x * current - (j + order - 1) * previous) / (j - order);
    previous = current;
    current = next;
  }
  return current;
}

function cumulative(min, max, density, steps = 4096) {
  const values = new Float64Array(steps + 1);
  const step = (max - min) / steps;
  let previous = density(min);
  for (let j = 1; j <= steps; j++) {
    const next = density(min + j * step);
    values[j] = values[j - 1] + (previous + next) * step / 2;
    previous = next;
  }
  return { values, min, step };
}

function inverseSample({ values, min, step }, random) {
  let low = 0;
  let high = values.length - 1;
  const target = random * values[high];
  while (high - low > 1) {
    const mid = (low + high) >> 1;
    if (target < values[mid]) high = mid;
    else low = mid;
  }
  const spacing = values[high] - values[low];
  const fraction = spacing === 0 ? 0 : (target - values[low]) / spacing;
  return min + (low + fraction) * step;
}

function seededRandom() {
  let state = 54321;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return (state + .5) / 4294967296;
  };
}

export function sampleOrbital({ n, l, m, basis, count = 9600 }) {
  const radialPart = rho => laguerre(n - l - 1, 2 * l + 1, rho);
  const radial = cumulative(0, 6 * n + 24, rho => Math.exp(-rho) * rho ** (2 * l + 2) * radialPart(rho) ** 2);
  const order = Math.abs(m);
  const polar = cumulative(-1, 1, u => legendre(l, order, u) ** 2);
  const random = seededRandom();
  return Array.from({ length: count }, () => {
    const rho = inverseSample(radial, random());
    const radius = rho * n / 2;
    const u = inverseSample(polar, random());
    let phi = random() * 2 * Math.PI;
    let azimuthSign = 1;
    if (basis === 'real' && m !== 0) {
      const trig = m > 0 ? Math.cos : Math.sin;
      let amplitude = trig(order * phi);
      while (random() >= amplitude ** 2) {
        phi = random() * 2 * Math.PI;
        amplitude = trig(order * phi);
      }
      azimuthSign = Math.sign(amplitude);
    }
    const transverse = radius * Math.sqrt(Math.max(0, 1 - u ** 2));
    const negative = radialPart(rho) * legendre(l, order, u) * azimuthSign < 0;
    const phase = (basis === 'complex' ? m * phi : 0) + (negative ? Math.PI : 0);
    return { x: transverse * Math.cos(phi), y: transverse * Math.sin(phi), z: radius * u, radius, phase };
  });
}

export function orbitalName(n, l, m, basis) {
  const prefix = n + orbitalLetters[l];
  if (l === 0) return prefix;
  if (basis === 'complex') return prefix + ', m = ' + m;
  if (l === 1) return prefix + '_' + (m === 0 ? 'z' : m > 0 ? 'x' : 'y');
  if (l === 2) return prefix + '_' + ['xy', 'yz', 'z²', 'xz', 'x²−y²'][m + 2];
  return prefix + (m === 0 ? ' · axial' : ' · ' + (m > 0 ? 'cos' : 'sin') + ' ' + Math.abs(m) + 'φ');
}

export function pointInsideOrbitalVolume(point, charge, volume) {
  const x = point.x / charge - volume.x;
  const y = point.y / charge;
  const z = point.z / charge - volume.z;
  return x * x + y * y + z * z <= volume.radius * volume.radius;
}
