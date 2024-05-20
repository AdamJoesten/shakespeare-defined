import { AxiosClient, AxiosClientInterface } from "../AxiosClient";
import { LexiconScraper } from "./LexiconScraper";
import { ErrorManager } from "../ErrorManager";

const CONFIG: AxiosClientInterface = {
  maxRetries: 5,
  baseURL: "https://www.perseus.tufts.edu/hopper/",
};

const client = new AxiosClient(CONFIG);
const scraper = new LexiconScraper(client);

scraper
  .init("text?doc=Perseus%3Atext%3A1999.03.0079%3Aentry%3DA1")
  .then((result) => {
    console.log(JSON.stringify(result, null, 4));
  })
  .catch((error) => {
    if (error instanceof Error) {
      ErrorManager.handleError(error);
    }
    else ErrorManager.handleError(new Error(JSON.stringify(error)));
  });
