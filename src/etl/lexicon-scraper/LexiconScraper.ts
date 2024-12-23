import { JSDOM } from "jsdom";
import fs from "fs/promises";
import { AxiosInstance } from "axios";
import path from "path";

const document = new JSDOM().window.document;
type document = typeof document;
export class LexiconScraper {
  client: AxiosInstance;
  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async init(startPath: string) {
    const startUrl = this.client.defaults?.baseURL + startPath;
    try {
      return await this.scrape([startUrl]);
    } catch (error) {
      if (error instanceof Error) throw error;
      else throw new Error(JSON.stringify(error));
    }
  }

  private getNextUrl = (doc: document) => {
    return Array.from(doc.querySelectorAll("a.arrow"))
      .filter(this.isAnchorElement)
      .filter((a) =>
        Array.from(a.children)
          .filter(this.isImageElement)
          .some((child) => child.alt === "next")
      )
      .map((el) => this.createUrl(el.href))
      .filter((href) => this.isValidUrl(href));
  };

  private async getDefinitions(doc: document) {
    try {
      const definitionUrls = this.getDefinitionUrls(doc);
      const definitions: any[] = [];

      for (const url of definitionUrls) {
        console.info(
          `${new Date().toISOString()} - INFO: Getting definition: ${url}`
        );
        const definition = await this.client.get(url);
        definitions.push(definition.data);
      }

      return definitions;
    } catch (error) {
      if (error instanceof Error) throw error;
      else throw new Error(JSON.stringify(error));
    }
  }

  private getDefinitionUrls(doc: document) {
    const definitionUrls = Array.from(doc.querySelectorAll("a.xml"))
      .filter(this.isAnchorElement)
      .filter((a) => a.href.includes("xmlchunk"))
      .map((el) => this.createUrl(el.href))
      .filter((href) => this.isValidUrl(href));

    return definitionUrls;
  }

  private async scrape(rawUrls: string[]) {
    const visitedUrls = new Set();
    const definitions: any[] = [];
    try {
      while (rawUrls.length) {
        const url = rawUrls.shift();
        if (!this.isValidUrl(url) || visitedUrls.has(url)) continue;

        const response = await this.client.get(url);
        visitedUrls.add(url);

        const { document } = new JSDOM(response.data).window;

        const nextUrls = this.getNextUrl(document);

        const definitions = await this.getDefinitions(document);

        for (const url of nextUrls) {
          if (!visitedUrls.has(url)) rawUrls.push(url);
        }

        for (let definition of definitions) {
          const entryFree = new JSDOM(definition).window.document.querySelector('entryFree')
          if (entryFree && entryFree.hasAttribute("key")) {
            const key = entryFree.getAttribute("key")!;

            const filename = `${key}.xml`;
            await fs.writeFile(
              path.resolve(__dirname, `./out/lexicons/c-t-onions/${filename}`),
              String(definition)
            );
          } else {
            throw new Error("Malformed xml");
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) throw error;
      else throw new Error(JSON.stringify(error));
    }
  }

  private createUrl(path: string) {
    return this.client.defaults?.baseURL + path;
  }

  private isValidUrl(data: unknown): data is string {
    if (typeof data !== "string") {
      return false;
    }

    try {
      new URL(data);
      return true;
    } catch (e) {
      return false;
    }
  }

  private isAnchorElement(element: Element): element is HTMLAnchorElement {
    return element.tagName.toLowerCase() === "a";
  }

  private isImageElement(element: Element): element is HTMLImageElement {
    return element.tagName.toLowerCase() === "img";
  }
}
