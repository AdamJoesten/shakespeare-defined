import axios, { AxiosError, AxiosInstance } from "axios";
import { JSDOM } from "jsdom";
import fs from "fs/promises";
import path from "path";

const document = new JSDOM().window.document;
type document = typeof document;
export class WebScraper {
  client: AxiosInstance;
  constructor(client: AxiosInstance) {
    this.client = client;
  }

  async init(startPath: string) {
    await fs.writeFile(path.resolve(__dirname, "error.log"), "");
    const startUrl = this.client.defaults.baseURL + startPath;
    try {
      return await this.scrape([startUrl]);
    } catch (e) {
      await this.logError(e);
      return [];
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
        const definition = await this.fetchData(url!);
        definitions.push(definition);
      }

      return definitions;
    } catch (e) {
      this.logError(e);
      return [];
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

        const { document } = new JSDOM(await this.fetchData(currUrl)).window;
        visitedUrls.add(currUrl);

        console.info(`${new Date().toISOString()} - INFO: Getting page urls: ${currUrl}`);
        const newPageUrls = this.getPageUrls(document);

        console.info(`${new Date().toISOString()} - INFO: Getting definitions: ${currUrl}`);
        const currDefinitions = await this.getDefinitions(document);

        for (const url of newPageUrls) {
          if (!visitedUrls.has(url)) pageUrls.push(url!);
        }
        definitions.push(...currDefinitions);
      }
      return definitions;
    } catch (e) {
      await this.logError(e);
    }
  }

  private async fetchData(url: string) {
    try {
      const response = await this.client.get(url);
      return response.data;
    } catch (e) {
      await this.logError(e);
    }
  }

  private get baseUrl() {
    return this.client.defaults.baseURL;
  }

  private createUrl(path: string) {
    return this.baseUrl?.concat(path);
  }

  private isValidUrl(data: unknown): data is string {
    if (typeof data !== "string") {
      this.logError(new Error(`isValidUrl() - Invalid Input: ${data}`));
      return false;
    }

    try {
      new URL(data);
      return true;
    } catch (e) {
      this.logError(e);
      return false;
    }
  }

  private isAnchorElement(element: Element): element is HTMLAnchorElement {
    return element.tagName.toLowerCase() === "a";
  }

  private isImageElement(element: Element): element is HTMLImageElement {
    return element.tagName.toLowerCase() === "img";
  }

  private async logError(e: unknown) {
    let message: string;
    let logMessage: string;
    if (e instanceof AxiosError) {
      message = `${new Date().toISOString()} - ERROR: ${e.message}\n`;
      // prettier-ignore
      logMessage = `${new Date().toISOString()} - ERROR: ${JSON.stringify(e.toJSON())}\n`;
    } else if (e instanceof Error) {
      message = `${new Date().toISOString()} - ERROR: ${e.message}\n`;
      // prettier-ignore
      logMessage = `${new Date().toISOString()} - ERROR: ${JSON.stringify(e)}\n`;
    } else {
      message = `${new Date().toISOString()} - ERROR: Unknown error\n`;
      logMessage = `${new Date().toISOString()} - ERROR: Unknown error\n`;
    }
    try {
      console.error(`${new Date().toISOString()} - ERROR: ${message}`);
      await fs.appendFile(path.resolve(__dirname, "error.log"), logMessage);
    } catch (err) {
      console.error(
        `${new Date().toISOString()} - WARNING: Error writing to log file`,
        err
      );
    }
  }
}
