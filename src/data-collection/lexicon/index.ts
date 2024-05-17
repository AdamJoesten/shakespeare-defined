import { HTTPClientWithRetry, IHTTPClientWithRetry } from "../HTTPClientWithRetry";
import { WebScraper } from "./WebScraper";

const CLIENT_OPTIONS: IHTTPClientWithRetry = {
  retryDelay: 200,
  retryLimit: 5,
  baseUrl: "https://www.perseus.tufts.edu/hopper/",
};
const client = new HTTPClientWithRetry(CLIENT_OPTIONS);
const scraper = new WebScraper(client.client);

scraper
  .init("text?doc=Perseus%3Atext%3A1999.03.0079%3Aentry%3DA1")
  .then((result) => {
    console.log(JSON.stringify(result, null, 4));
  })
  .catch(console.error);
