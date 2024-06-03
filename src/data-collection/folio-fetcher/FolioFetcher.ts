import fs from "fs";
import path from "path";
import CETEI from "CETEIcean";
export class FolioFetcher {
  abbrs: string[];
  constructor(abbrs: string[]) {
    this.abbrs = abbrs;
  }

  async init() {
    try {
      const data = await this.fetchAll();
      const xmlData = await Promise.all(
        data.map(async (datum) => {
          const response = await datum.response;
          const text = await response.text();
          return {
            abbr: datum.abbr,
            text: text,
          };
        })
      );
      const htmlData = await Promise.all(
        xmlData.map(async (xmlDatum) => {
          const TEIParser = new CETEI.getHTML5();
          return {
            abbr: xmlDatum.abbr,
            html: await TEIParser.getHTML5(xmlDatum.text),
          };
        })
      );
      htmlData.forEach(async (htmlData) => {
        const html = JSON.stringify(htmlData, null, 2);
        const playPath = path.join(
          __dirname,
          `../../../data/folios/${htmlData.abbr}.html`
        );

        const dir = path.dirname(playPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      });
    } catch (error) {
      if (error instanceof Error) throw error;
      else throw new Error(JSON.stringify(error));
    }
  }

  private async fetchAll() {
    try {
      const promises = this.abbrs.map((abbr) => ({
        abbr: abbr,
        response: fetch(
          `https://firstfolio.bodleian.ox.ac.uk/download/xml/F-${abbr}.xml`
        ),
      }));
      return await Promise.all(promises);
    } catch (error) {
      if (error instanceof Error) throw error;
      else throw new Error(JSON.stringify(error));
    }
  }
}
