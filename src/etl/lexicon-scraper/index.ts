import { LexiconScraper } from "./LexiconScraper";
import { ErrorManager } from "./ErrorManager";
import { client } from "./lexiconClient";

const path = process.argv[2];
const scraper = new LexiconScraper(client);

scraper
  .init(path)
  .then((result) => {
    console.log(JSON.stringify(result, null, 4));
  })
  .catch((error) => {
    if (error instanceof Error) {
      ErrorManager.handleError(error);
    } else {
      console.error(String(error));
    }
  });

// missing buttock, flouting-stock, laughing-stock, Linstock, Mattock, Nether-stocks, Pin-buttock, Pointing-stock, Puke-stocking, Puttock, Quatch-buttock, Stoccado, Stoccata, Stock, Stock, Stock-fish, Stockings, Stockish, Stock-punished, Whipstock, Woodstock, Worsted-stocking
