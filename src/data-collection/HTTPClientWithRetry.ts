import axios, {
  Axios,
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { RetryConfig, CustomAxiosRequestConfig } from "./axiosExtended";
import { delay } from "./utils";

export type IHTTPClientWithRetry = {
  baseUrl: string;
} & Pick<CustomAxiosRequestConfig, "retryDelay" | "retryLimit">;

class HTTPClientWithRetryError extends AxiosError {}

export class HTTPClientWithRetry {
  client: AxiosInstance;
  private retryDelay: number;
  private retryLimit: number;
  private retryCount: number;
  constructor({ baseUrl, retryDelay, retryLimit }: IHTTPClientWithRetry) {
    this.retryDelay = retryDelay;
    this.retryLimit = retryLimit;
    this.retryCount = 0;

    this.client = axios.create({ baseURL: baseUrl });
    this.client.interceptors.request.use(this.addCustomConfig.bind(this));
    this.client.interceptors.response.use(
      (response) => response,
      this.retry.bind(this)
    );
  }

  private addCustomConfig(config: InternalAxiosRequestConfig) {
    const customConfig = config as CustomAxiosRequestConfig;
    customConfig.retryLimit = this.retryLimit;
    customConfig.retryDelay = this.retryDelay;
    customConfig.retryCount = customConfig.retryCount || this.retryCount;

    return customConfig;
  }

  private async retry(err: any) {
    try {
      if (err instanceof AxiosError) {
        const { response, config } = err;
        const customConfig = config as CustomAxiosRequestConfig;
        if (
          !customConfig ||
          customConfig.retryCount === customConfig.retryLimit
        )
          return Promise.reject(err);
        if (response && response.status === 429) {
          customConfig.retryCount += 1;
          customConfig.retryDelay = response.headers["Retry-After"]
            ? parseInt(response.headers["Retry-After"]) * 1000
            : this.calculateDelay({
                retryCount: customConfig.retryCount,
                retryDelay: customConfig.retryDelay,
              });
          console.info(
            `${new Date().toISOString()} - WARNING: 429 recieved, backing off for ${
              customConfig.retryDelay / 1000
            }s`
          );
          await delay(customConfig.retryDelay);
          return this.client(customConfig);
        }
      }
      return Promise.reject(err);
    } catch (e) {
      let message;
      if (e instanceof AxiosError) throw new Error(JSON.stringify(e.toJSON()));
      else if (e instanceof Error) throw e;
    }
  }

  private calculateDelay({
    retryDelay,
    retryCount,
  }: {
    retryDelay: number;
    retryCount: number;
  }) {
    return Math.min(retryDelay * Math.pow(2, retryCount), 30000);
  }
}
