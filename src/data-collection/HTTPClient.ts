export interface HTTPClient {
  get(config: any): Promise<unknown>;
  baseUrl: URL;
}