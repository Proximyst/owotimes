export const PAPER_COLOURS = [
  { name: "Newsprint", hex: "#e9dfc8" },
  { name: "Cream", hex: "#f4ecd8" },
  { name: "Parchment", hex: "#e6d3a8" },
  { name: "Buff", hex: "#dcc8a0" },
  { name: "Pale grey", hex: "#d8d8d2" },
  { name: "White", hex: "#faf8f2" },
  { name: "Pink", hex: "#f0d9cf" },
  { name: "Pale green", hex: "#d7e3cf" },
  { name: "Pale blue", hex: "#d5e0e8" },
] as const;

// Each method is a different height field fed to feDiffuseLighting. `noise` picks
// the feTurbulence mode: "turbulence" gives sharp, crease-like valleys, while
// "fractalNoise" gives smoother, broader undulations.
export const CRUMPLE_METHODS = {
  creases: {
    label: "Creases",
    noise: "turbulence",
    frequency: 0.018,
    octaves: 5,
    relief: (amount: number) => 2 + (amount / 100) * 10,
  },
  wrinkles: {
    label: "Fine wrinkles",
    noise: "turbulence",
    frequency: 0.06,
    octaves: 4,
    relief: (amount: number) => 1 + (amount / 100) * 6,
  },
  folds: {
    label: "Soft folds",
    noise: "fractalNoise",
    frequency: 0.007,
    octaves: 3,
    relief: (amount: number) => 4 + (amount / 100) * 14,
  },
} as const;

export type CrumpleMethod = keyof typeof CRUMPLE_METHODS;

export function isCrumpleMethod(value: unknown): value is CrumpleMethod {
  return typeof value === "string" && Object.hasOwn(CRUMPLE_METHODS, value);
}

// The amount (0-100) scales relief; 0 means flat paper.
export function crumpleBackground(amount: number, method: CrumpleMethod): string {
  if (amount <= 0) return "none";

  const { noise, frequency, octaves, relief } = CRUMPLE_METHODS[method];
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">',
    '<filter id="crumple" x="0" y="0" width="800" height="800" filterUnits="userSpaceOnUse">',
    `<feTurbulence type="${noise}" baseFrequency="${frequency}" numOctaves="${octaves}" seed="11" result="noise"/>`,
    `<feDiffuseLighting in="noise" surfaceScale="${relief(amount)}" diffuseConstant="1.15" lighting-color="#ffffff">`,
    '<feDistantLight azimuth="225" elevation="60"/>',
    "</feDiffuseLighting>",
    "</filter>",
    '<rect width="800" height="800" filter="url(#crumple)"/>',
    "</svg>",
  ].join("");

  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
