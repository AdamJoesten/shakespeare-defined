import axios, { AxiosError, HttpStatusCode } from "axios";

export const client = axios.create({
  baseURL: "https://www.perseus.tufts.edu/hopper/",
});

// const requestInterceptor = client.interceptors.request.use(
//   (config) => {},
//   (error) => {}
// );

const responseInterceptor = client.interceptors.response.use(
  null,
  async (error) => {
    try {
      if (axios.isAxiosError(error)) {
        const { config } = error;
        if (!config) return Promise.reject(error);

        switch (error.response?.status) {
          case HttpStatusCode.TooManyRequests: {
            const delay = retryAfter(error);
            console.error(
              `${new Date().toISOString()} - WARNING: ${HttpStatusCode.TooManyRequests} status received, backing off for ${
                delay / 1000
              }s`
            );
            await wait(delay);
            return await client.request(config);
          }
          default: {
            break;
          }
        }
      }
      return Promise.reject(error);
    } catch(e) {
      // TODO
    }
  }
);

const retryAfter = (error: AxiosError) => {
  const retryAfterHeader = error.response?.headers["retry-after"];
  if (!retryAfterHeader) return 0;

  let retryAfterMs = Number(retryAfterHeader || 0) * 1000;
  if (retryAfterMs === 0) {
    retryAfterMs = Date.parse(retryAfterHeader) - Date.now();
  }
  return Math.max(0, retryAfterMs);
};

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
