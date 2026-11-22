// Names, symbols and atomic numbers follow the IUPAC periodic table.
const rows = [
  'H Hydrogen|He Helium',
  'Li Lithium|Be Beryllium|B Boron|C Carbon|N Nitrogen|O Oxygen|F Fluorine|Ne Neon',
  'Na Sodium|Mg Magnesium|Al Aluminium|Si Silicon|P Phosphorus|S Sulfur|Cl Chlorine|Ar Argon',
  'K Potassium|Ca Calcium|Sc Scandium|Ti Titanium|V Vanadium|Cr Chromium|Mn Manganese|Fe Iron|Co Cobalt|Ni Nickel|Cu Copper|Zn Zinc|Ga Gallium|Ge Germanium|As Arsenic|Se Selenium|Br Bromine|Kr Krypton',
  'Rb Rubidium|Sr Strontium|Y Yttrium|Zr Zirconium|Nb Niobium|Mo Molybdenum|Tc Technetium|Ru Ruthenium|Rh Rhodium|Pd Palladium|Ag Silver|Cd Cadmium|In Indium|Sn Tin|Sb Antimony|Te Tellurium|I Iodine|Xe Xenon',
  'Cs Caesium|Ba Barium|La Lanthanum|Ce Cerium|Pr Praseodymium|Nd Neodymium|Pm Promethium|Sm Samarium|Eu Europium|Gd Gadolinium|Tb Terbium|Dy Dysprosium|Ho Holmium|Er Erbium|Tm Thulium|Yb Ytterbium|Lu Lutetium|Hf Hafnium|Ta Tantalum|W Tungsten|Re Rhenium|Os Osmium|Ir Iridium|Pt Platinum|Au Gold|Hg Mercury|Tl Thallium|Pb Lead|Bi Bismuth|Po Polonium|At Astatine|Rn Radon',
  'Fr Francium|Ra Radium|Ac Actinium|Th Thorium|Pa Protactinium|U Uranium|Np Neptunium|Pu Plutonium|Am Americium|Cm Curium|Bk Berkelium|Cf Californium|Es Einsteinium|Fm Fermium|Md Mendelevium|No Nobelium|Lr Lawrencium|Rf Rutherfordium|Db Dubnium|Sg Seaborgium|Bh Bohrium|Hs Hassium|Mt Meitnerium|Ds Darmstadtium|Rg Roentgenium|Cn Copernicium|Nh Nihonium|Fl Flerovium|Mc Moscovium|Lv Livermorium|Ts Tennessine|Og Oganesson',
];

function placement(period, position) {
  if (period === 1) return [period, position === 1 ? 1 : 18];
  if (period <= 3) return [period, position <= 2 ? position : position + 10];
  if (period <= 5 || position <= 2) return [period, position];
  if (position <= 17) return [period + 2, position + 1];
  return [period, position - 14];
}

let atomicNumber = 0;
export const elements = rows.flatMap((row, index) => row.split('|').map((entry, position) => {
  const [symbol, name] = entry.split(' ');
  const period = index + 1;
  const [displayRow, column] = placement(period, position + 1);
  return { atomicNumber: ++atomicNumber, symbol, name, period, displayRow, column };
}));

export const oneElectronSystems = [
  { charge: 1, label: 'Hydrogen (H)', symbol: 'H' },
  { charge: 2, label: 'Helium ion (He⁺)', symbol: 'He⁺' },
  { charge: 3, label: 'Lithium ion (Li²⁺)', symbol: 'Li²⁺' },
];

const subshells = [
  { shell: 1, label: '1s', capacity: 2 }, { shell: 2, label: '2s', capacity: 2 },
  { shell: 2, label: '2p', capacity: 6 }, { shell: 3, label: '3s', capacity: 2 },
  { shell: 3, label: '3p', capacity: 6 },
];
const superscripts = ['', '¹', '²', '³', '⁴', '⁵', '⁶'];

export function lightAtomConfiguration(atomicNumber) {
  if (atomicNumber < 1 || atomicNumber > 18) return null;
  let remaining = atomicNumber;
  const shellCounts = [0, 0, 0];
  const entries = [];
  for (const { shell, label, capacity } of subshells) {
    const count = Math.min(remaining, capacity);
    if (count === 0) break;
    shellCounts[shell - 1] += count;
    entries.push(label + superscripts[count]);
    remaining -= count;
  }
  return { notation: entries.join(' '), shellCounts: shellCounts.filter(Boolean) };
}
