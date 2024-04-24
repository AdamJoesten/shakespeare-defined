import axios from 'axios';
import { JSDOM } from 'jsdom';
import fs from 'fs/promises';

export class WebScraper {
  baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async scrape(startPath: string) {
    const startUrl = `${this.baseUrl}${startPath}`;
    try {
      return await this.processUrls([startUrl]);
    } catch (e) {
      await this.logError(e);
    }
  }

  async processUrls(pageUrls: string[]) {
    const visitedUrls = new Set();
    const definitions = [];

    while (pageUrls.length) {
      const currUrl = pageUrls.shift();
      if (currUrl && visitedUrls.has(currUrl) === false) {
        visitedUrls.add(currUrl);
      } else {
        continue;
      }

      const html = await this.fetchData(currUrl);
      const dom = new JSDOM(html);

      const definitionUrls = Array.from(
        dom.window.document.querySelectorAll('a.xml')
      )
        .filter((a) => {
          if (a instanceof HTMLAnchorElement)
            return a.href.includes('xmlchunk');
          return false;
        })
        .map((el) => {
          if (el instanceof HTMLAnchorElement) return el.href;
          this.logError(
            new Error(`Definition url not found in anchor tag: ${el}`)
          );
          return '';
        });

      const newPageUrls = Array.from(
        dom.window.document.querySelectorAll('a.arrow')
      )
        .filter((a) => {
          return Array.from(a.children).some((child) => {
            if (child instanceof HTMLImageElement) return child.alt === 'next';
          });
        })
        .map((el) => {
          if (el instanceof HTMLAnchorElement) return el.href;
          this.logError(new Error(`Page url not found in anchor tag: ${el}`));
          return '';
        });

      pageUrls.push(...newPageUrls);
      while (definitionUrls.length) {
        const currUrl = definitionUrls.shift();
        if (currUrl) {
          const data = await this.fetchData(currUrl);
          definitions.push(data);
        }
      }
    }
    return definitions;
  }

  async fetchData(url: string) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (e) {
      await this.logError(e);
    }
  }

  isValidUrl(str: string): boolean {
    try {
      new URL(str);
      return true;
    } catch (e) {
      console.error('ERROR: Failed to validate URL:', str, e);
      return false;
    }
  }

  async logError(e: unknown): Promise<void> {
    let message: string;
    if (e instanceof Error)
      message = `${new Date().toISOString()} - ERROR: ${e.message}\n`;
    else message = `${new Date().toISOString()} - ERROR: Unknown error\n`;
    try {
      await fs.appendFile('error.log', message);
    } catch (err) {
      console.error('WARNING: Error writing to log file', err);
    }
  }
}

module.exports = WebScraper;
