import { JSDOM } from "jsdom";
import { WebScraper } from "../WebScraper";
import { AxiosClient } from "../AxiosClient";

const document = new JSDOM().window.document;
type document = typeof document;
export class LexiconScraper implements WebScraper {
  client: AxiosClient;
  constructor(client: AxiosClient) {
    this.client = client;
  }

  async init(startPath: string) {
    const startUrl = this.client.baseUrl.href + startPath;
    try {
      return await this.scrape([startUrl]);
    } catch (error) {
      if (error instanceof Error) throw error
      else throw new Error(JSON.stringify(error))
    }
  }

  private getPageUrls(doc: document) {
    const pageUrls = Array.from(doc.querySelectorAll("a.arrow"))
      .filter(this.isAnchorElement)
      .filter((a) =>
        Array.from(a.children)
          .filter(this.isImageElement)
          .some((child) => child.alt === "next")
      )
      .map((el) => this.createUrl(el.href))
      .filter((href) => this.isValidUrl(href));

    return pageUrls;
  }

  private async getDefinitions(doc: document) {
    try {
      const definitionUrls = this.getDefinitionUrls(doc).filter(
        (url) => url !== undefined
      );
      const definitions: any[] = [];

      for (const url of definitionUrls) {
        const definition = await this.client.get({ url });
        definitions.push(definition);
      }

      return definitions;
    } catch (error) {
      if (error instanceof Error) throw error
      else throw new Error(JSON.stringify(error))
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

  private async scrape(pageUrls: string[]) {
    const visitedUrls = new Set();
    const definitions: unknown[] = [];
    try {
      while (pageUrls.length) {
        const currUrl = pageUrls.shift();
        if (!currUrl || visitedUrls.has(currUrl)) continue;
        const data = await this.client.get({ url: currUrl }); // TODO How to type this?
        const html = data as string;
        const { document } = new JSDOM(html).window;
        visitedUrls.add(currUrl);

        console.info(
          `${new Date().toISOString()} - INFO: Getting page urls: ${currUrl}`
        );
        const newPageUrls = this.getPageUrls(document);

        console.info(
          `${new Date().toISOString()} - INFO: Getting definitions: ${currUrl}`
        );
        const currDefinitions = (await this.getDefinitions(document)) || [];

        for (const url of newPageUrls) {
          if (!visitedUrls.has(url)) pageUrls.push(url!);
        }
        definitions.push(...currDefinitions);
      }
      return definitions;
    } catch (error) {
      if (error instanceof Error) throw error
      else throw new Error(JSON.stringify(error))
    }
  }

  private createUrl(path: string) {
    return this.client.baseUrl.href + path;
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
