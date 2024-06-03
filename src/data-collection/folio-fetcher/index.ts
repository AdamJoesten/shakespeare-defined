import { FolioFetcher } from "./FolioFetcher";

const PLAY_ABBREVIATIONS = [
  "tem",
  // "tgv",
  // "wiv",
  // "mm",
  // "err",
  // "ado",
  // "lll",
  // "mnd",
  // "mv",
  // "ayl",
  // "shr",
  // "aww",
  // "tn",
  // "wt",
  // "jn",
  // "r2",
  // "1h4",
  // "2h4",
  // "h5",
  // "1h6",
  // "2h6",
  // "3h6",
  // "r3",
  // "h8",
  // "tro",
  // "cor",
  // "rom",
  // "tim",
  // "jc",
  // "mac",
  // "ham",
  // "lr",
  // "oth",
  // "ant",
  // "cym",
];

const folioFetcher = new FolioFetcher(PLAY_ABBREVIATIONS);

folioFetcher.init().catch((error) => {
  console.error(error);
});
