import Axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import type { RequestMethod, ApiResponse, ApiError } from '@/types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001') + '/';
Axios.defaults.baseURL = API_URL;

interface RequestOptions extends AxiosRequestConfig {
  method: RequestMethod;
  url: string;
  data?: any;
}

type RequestInterceptorFulfilled = (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
type RequestInterceptorRejected = (error: any) => any;
type ResponseInterceptorFulfilled = (response: AxiosResponse) => AxiosResponse | Promise<AxiosResponse>;
type ResponseInterceptorRejected = (error: any) => any;

export class HttpService {
  private _axios: AxiosInstance;

  constructor() {
    this._axios = Axios.create({
      baseURL: API_URL,
      timeout: 100000,
      headers: {
        Accept: 'application/json',
      },
    });
  }

  addRequestInterceptor = (onFulfilled?: RequestInterceptorFulfilled, onRejected?: RequestInterceptorRejected): number => {
    return this._axios.interceptors.request.use(onFulfilled, onRejected);
  };

  addResponseInterceptor = (onFulfilled?: ResponseInterceptorFulfilled, onRejected?: ResponseInterceptorRejected): number => {
    return this._axios.interceptors.response.use(onFulfilled, onRejected);
  };

  get = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> =>
    this.request<T>({ url, method: 'get', ...(config || {}) });

  post = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    this.request<T>({ url, method: 'post', data, ...(config || {}) });

  put = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    this.request<T>({ url, method: 'put', data, ...(config || {}) });

  patch = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    this.request<T>({ url, method: 'patch', data, ...(config || {}) });

  delete = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> =>
    this.request<T>({ url, method: 'delete', data, ...(config || {}) });

  downloadFile = async (url: string, options?: { method?: string; body?: string }): Promise<{ success: true; url: string; filename?: string }> => {
    try {
      const method = options?.method?.toLowerCase() || 'get';
      const token = localStorage.getItem('token');
      const config: AxiosRequestConfig = {
        responseType: 'blob',
        headers: {
          Accept: 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      };

      const response = method === 'post'
        ? await this._axios.post(url, options?.body ? JSON.parse(options.body) : {}, config)
        : await this._axios.get(url, config);

      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const blobUrl = URL.createObjectURL(blob);

      const contentDisposition = response.headers['content-disposition'];
      let filename: string | undefined;
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[*]?=['"]?([^'"\s;]+)['"]?/i);
        if (match && match[1]) {
          filename = decodeURIComponent(match[1]);
        }
      }

      return { success: true, url: blobUrl, filename };
    } catch (error: any) {
      if (error.response?.data instanceof Blob) {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.message);
      }
      throw error;
    }
  };

  private request<T = any>(options: RequestOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      // FormData => multipart, Axios gère le Content-Type
      if (options.data instanceof FormData) {
        delete options.headers?.['Content-Type'];
        delete options.headers?.['content-type'];

        this._axios
          .post(options.url, options.data, { headers: options.headers, timeout: options.timeout })
          .then((res: AxiosResponse<ApiResponse<T>>) => resolve(res.data as T))
          .catch((ex: any) => reject(this.formatError(ex)));
      } else {
        this._axios
          .request<ApiResponse<T>>({ ...options, method: options.method as any })
          .then((res: AxiosResponse<ApiResponse<T>>) => resolve(res.data as T))
          .catch((ex: any) => reject(this.formatError(ex)));
      }
    });
  }

  private formatError(ex: any): ApiError {
    return {
      message: ex.response?.data?.message || ex.message || 'Une erreur est survenue',
      statut: ex.response?.statut || 500,
      ...(ex.response?.data || {}),
    };
  }
}

export default new HttpService();
