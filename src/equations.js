const math = String.raw;

const wave = [math`\psi(\mathbf r,t)`, 'The complex amplitude at position r and time t. Its squared magnitude gives the probability density.'];
const hbar = [math`\hbar`, 'The reduced Planck constant. It relates an eigenstate’s energy to the rate at which its phase rotates.'];
const mass = ['m', 'The electron mass in this fixed-nucleus model.'];
const potential = ['V(r)', 'The potential energy from the proton’s attraction. It varies as −1/r, where r is the distance from the nucleus.'];
const weight = ['w', 'The weight of 2p_z, between 0 and 1. The weight of 1s is 1 − w.'];
const phase = [math`\varphi`, 'The phase of 2p_z relative to 1s. It can increase the density on one side of the nucleus and decrease it on the other.'];
const coherence = ['c', 'A factor between 0 and 1 that sets the strength of the interference terms.'];

export const schrodinger = [
  ['Time evolution', math`i\hbar\,\partial_t\psi`, 'This term describes how the complex amplitude changes over time. In the animation, each orbital’s energy determines how quickly its phase rotates.', [
    ['i', 'The imaginary unit. It makes a fixed-energy state evolve by a rotation of its complex phase.'],
    hbar, [math`\partial_t`, 'The time derivative at a fixed position.'], wave,
  ]],
  '=',
  ['Kinetic energy', math`-\frac{\hbar^2}{2m}\nabla^2\psi`, 'The kinetic-energy operator acts on the wavefunction according to its spatial curvature.', [
    hbar, mass, [math`\nabla^2`, 'The Laplacian adds the second derivatives along x, y and z.'], wave,
  ]],
  '+',
  ['Potential energy', math`V(r)\psi`, 'The potential multiplies the wavefunction at each point in space.', [potential, wave]],
];

export const lagrangian = [
  ['Lagrangian density', math`\mathcal L`, 'Integrating this density over space and time gives the action. Varying the action with respect to ψ* gives the Schrödinger equation.', [
    ['S', 'The action is the integral of the Lagrangian density over space and time.'],
  ]],
  '=',
  ['Time term', math`\frac{i\hbar}{2}(\psi^*\dot\psi-\dot\psi^*\psi)`, 'This term produces the time derivative in the Schrödinger equation.', [
    ['i', 'The imaginary unit, with i² = −1.'], hbar, wave,
    [math`\psi^*`, 'The complex conjugate of ψ. It reverses the sign of the imaginary part.'],
    [math`\dot\psi`, 'The dot represents a time derivative.'],
  ]],
  '−',
  ['Kinetic term', math`\frac{\hbar^2}{2m}|\nabla\psi|^2`, 'This term depends on how the wavefunction varies in space. Varying the action turns the squared gradient into a term involving the Laplacian.', [
    hbar, mass, [math`\nabla\psi`, 'The gradient of ψ collects its three first spatial derivatives.'],
    [math`|\nabla\psi|^2`, 'The sum of the squared magnitudes of those three derivatives.'],
  ]],
  '−',
  ['Potential term', math`V(r)|\psi|^2`, 'The potential is weighted by the local probability density.', [potential, [math`|\psi|^2`, wave[1]]]],
];

export const diracPure = [
  ['Ket', math`|\psi\rangle`, 'The ket represents the state in Hilbert space. The 1s and 2p_z orbitals form the two-dimensional basis used here.', [
    [math`|\psi\rangle`, 'The state vector. Its representation in position space is ψ(r, t).'],
  ]],
  '=',
  ['1s component', math`a|1s\rangle`, 'The coefficient a sets the contribution of 1s. Its squared magnitude is 1 − w.', [
    [math`a=\langle 1s|\psi\rangle`, 'The bra ⟨1s| projects the ket onto the 1s orbital. The result is a complex amplitude.'], weight,
  ]],
  '+',
  ['2p_z component', math`b|2p_z\rangle`, 'The coefficient b carries the weight of the second orbital and, when both orbitals are present, their relative phase.', [
    [math`b=\langle 2p_z|\psi\rangle`, 'The projection onto 2p_z. Choosing a real, positive a gives b as √w times the relative phase factor.'], weight, phase,
  ]],
];

export const diracMixed = [
  ['Density matrix', math`\rho_{12}`, 'This off-diagonal entry links the two orbitals. The diagonal entries, 1 − w and w, give their weights in this basis.', [
    [math`\rho`, 'The matrix describing the electron’s preparation. It also predicts probabilities for mixed states.'],
    [math`\operatorname{Tr}(\rho^2)`, 'Purity equals 1 for a pure state and drops to ½ for an equal mixture with zero coherence in this basis.'],
  ]],
  '=',
  ['Coherence amplitude', math`c\sqrt{w(1-w)}`, 'The interference term vanishes at zero coherence or when only one orbital is occupied.', [coherence, weight]],
  ['Phase factor', math`e^{-i\varphi}`, 'This complex factor sets the phase of the off-diagonal entry. The minus sign comes from conjugating the coefficient of 2p_z.', [phase, ['i', 'The imaginary unit, with i² = −1.']]],
];

