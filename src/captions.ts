export const CAPTION_IDEAS: readonly string[] = [
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
];

// Picks a caption other than `current`, so pressing the dice always changes the text.
export function randomCaption(current = "", random: () => number = Math.random): string {
  const choices = CAPTION_IDEAS.filter((caption) => caption !== current);
  return choices[Math.floor(random() * choices.length)];
}
