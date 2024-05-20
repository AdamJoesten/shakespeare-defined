import axios, {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { HTTPClient } from "./HTTPClient";

export type AxiosClientInterface = Parameters<(typeof axios)["create"]>[0] & {
  maxRetries: number;
  baseURL: string;
};
type CustomInternalAxiosRequestConfig<T = any> =
  InternalAxiosRequestConfig<T> & {
    retryCount: number;
    maxRetries: number;
  };

interface AxiosGetMethodInterface {
  url: Parameters<AxiosInstance["get"]>[0];
  config?: Parameters<AxiosInstance["get"]>[1];
}

export class AxiosClient implements HTTPClient {
  client: AxiosInstance;
  baseUrl: URL;
  maxRetries: number;
  constructor(config: AxiosClientInterface) {
    this.client = axios.create(config);
    this.maxRetries = config.maxRetries;
    this.baseUrl = new URL(this.client.defaults.baseURL!);
    this.configureClient(this.client);
  }

  async get({ url, config }: AxiosGetMethodInterface) {
    try {
      const response = await this.client.get(url, config);
      return response.data;
    } catch (error) {
      if (error instanceof Error) throw error;
      else throw new Error(JSON.stringify(error));
    }
  }

  private configureClient(client: AxiosInstance) {
    this.configureInterceptors(client);
  }

  private configureInterceptors(this: AxiosClient, client: AxiosInstance) {
    client.interceptors.request.use(this.requestInterceptor.bind(this));
    client.interceptors.response.use(
      this.responseInterceptor.bind(this),
      this.responseErrorInterceptor.bind(this)
    );
  }

  private requestInterceptor(
    this: AxiosClient,
    config: InternalAxiosRequestConfig
  ) {
    const customConfig = config as CustomInternalAxiosRequestConfig;
    customConfig.retryCount = customConfig.retryCount || 0;
    customConfig.maxRetries = customConfig.maxRetries || this.maxRetries;
    return customConfig;
  }

  private responseInterceptor(
    this: AxiosClient,
    response: AxiosResponse<any, any>
  ) {
    return response;
  }

  private async responseErrorInterceptor(this: AxiosClient, error: any) {
    if (axios.isAxiosError(error)) return await this.errorHandler(error);
    else if (error instanceof Error) throw error;
    else throw new Error(JSON.stringify(error));
  }

  private async errorHandler(error: AxiosError) {
    const { response, config } = error;
    const customConfig = config as CustomInternalAxiosRequestConfig;
    if (this.shouldRetry({ response, config: customConfig }))
      return await this.retry(error);
    else throw error;
  }

  private shouldRetry({
    response,
    config,
  }: {
    response?: AxiosResponse;
    config: CustomInternalAxiosRequestConfig;
  }) {
    return (
      response &&
      response.status === 429 &&
      config.retryCount < config.maxRetries
    );
  }

  private async retry({ response, config }: AxiosError) {
    const RETRY_HEADER = "Retry-After";
    const customConfig = config as CustomInternalAxiosRequestConfig;
    try {
      const retryHeaderValue =
        undefined ||
        response!.headers[RETRY_HEADER] ||
        response!.headers[RETRY_HEADER.toLowerCase()] ||
        this.calculateRetryAfter(customConfig!);
      const delay = Number(retryHeaderValue) * 1000;
      console.info(
        `${new Date().toISOString()} - WARNING: 429 recieved, backing off for ${
          delay / 1000
        }s`
      );
      return new Promise((resolve) => setTimeout(resolve, delay)).then(() => {
        customConfig!.retryCount++;
        console.info(
          `${new Date().toISOString()} - INFO: Retrying request ${
            customConfig.retryCount
          } of ${customConfig.maxRetries} attempts...`
        );
        return this.client.request(customConfig!);
      });
    } catch (e) {
      throw new Error(JSON.stringify(e));
    }
  }

  private calculateRetryAfter(config: CustomInternalAxiosRequestConfig) {
    return Math.min((1 + (config.retryCount) / 10) ** config.retryCount, 30);
  }
}
