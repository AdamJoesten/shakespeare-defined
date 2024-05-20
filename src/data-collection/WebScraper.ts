export interface WebScraper {
  init(startPath: string): Promise<any>
}