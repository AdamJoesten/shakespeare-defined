import { WebScraper } from './WebScraper';
const scraper = new WebScraper('https://www.perseus.tufts.edu/hopper/');

scraper
  .scrape('text?doc=Perseus%3Atext%3A1999.03.0079')
  .then((result) => {
    console.log(JSON.stringify(result, null, 4));
  })
  .catch(console.error);
