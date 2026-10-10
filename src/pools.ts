// Random text pools. A dice roll picks a different text from the pool.
export const KICKER_IDEAS = [
  "FROM OUR VILLAGE CORRESPONDENTS",
  "EXCLUSIVE REPORT",
  "BREAKING FROM THE SQUARE",
  "OVERHEARD AT THE TAVERN",
  "A NOTE FROM THE FARMS",
  "LIBRARIAN'S CORNER",
  "REPORTED BY A VILLAGER",
  "DISPATCH FROM THE MINESHAFT",
  "WEATHER REPORT: CLEAR, WITH CREEPER RISK",
  "NEWS FROM THE NETHER ROAD",
] as const;

export const PRICE_IDEAS = [
  "PRICE 1 EMERALD",
  "PRICE 3 IRON INGOTS",
  "PRICE 1 LOAF OF BREAD",
  "PRICE 16 COBBLESTONE",
] as const;

export const TOP_RIGHT_IDEAS = [
  "THE VILLAGE'S PREMIERE NEWSPAPER",
  "ALL THE NEWS THAT FITS IN A CHEST",
  "NEWS FIT TO PRINT ON BIRCH PAPER",
  "THE NEWS OF EVERY BIOME",
  "DELIVERED BY IRON GOLEM",
  "EXTRA! EXTRA! READ ALL ABOUT IT",
  "SEALED WITH A LIBRARIAN'S STAMP",
  "NO CREEPERS WERE HARMED IN THE PRINTING",
  "FRESHLY PRESSED AT THE VILLAGE PRESS",
  "EVERY MORNING SINCE THE FIRST SUNRISE",
] as const;

export const TAGLINE_IDEAS = [
  "THE TRUTHFUL CHRONICLE OF VILLAGE AFFAIRS",
  "REPORTED AT THE SPEED OF A PICKAXE",
  "COVERING EVERY BLOCK OF THE VILLAGE",
  "APPROVED BY THE VILLAGE COUNCIL",
  "WHERE VILLAGERS GO FOR THE LATEST TRADES",
  "A CHRONICLE OF TRADES, RAIDS, AND HARVESTS",
  "SERVING THE VILLAGE SINCE THE FIRST NIGHT",
  "THE ONLY PAPER WITH AN IRON GOLEM AS EDITOR",
  "ALL THE TRADES WORTH KNOWING ABOUT",
  "TRUE REPORTS FROM THE SURFACE AND BEYOND",
] as const;

export const BYLINE_IDEAS = [
  "By the village librarian",
  "By the village cartographer",
  "By the wandering trader",
  "By the farmer, between harvests",
  "By the iron golem on night watch",
  "By the village cleric",
  "By the apprentice blacksmith",
  "By the fisherman at the dock",
  "By a very confused villager",
  "By the village mason",
] as const;

export const CAPTION_IDEAS = [
  "Pictured: the crowd outside the town hall",
  "A quiet moment on the high street",
  "The prize marrow, as judged on Tuesday",
  "Our photographer braved the drizzle for this shot",
  "Local dignitaries cut the ribbon",
  "Early risers gather at the market",
  "The new bridge, seen from the north bank",
  "A view from the harbour wall",
  "The winning team, with trophy",
  "Photograph by our staff correspondent",
] as const;

// Returns a text from `pool` other than `current`, so a roll always changes the text.
export function randomFrom(pool: readonly string[], current = "", random: () => number = Math.random): string {
  const choices = pool.filter((text) => text !== current);
  return choices[Math.floor(random() * choices.length)];
}
