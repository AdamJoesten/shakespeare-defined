import { InternalAxiosRequestConfig } from "axios";

interface RetryConfig {
    retryLimit: number;
    retryDelay: number;
    retryCount: number;
}

interface CustomAxiosRequestConfig<D = RetryConfig> extends InternalAxiosRequestConfig<D>, RetryConfig {}