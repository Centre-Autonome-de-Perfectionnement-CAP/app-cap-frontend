import Axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  InternalAxiosRequestConfig 
} from 'axios';
import type { RequestMethod, ApiResponse, ApiError } from '@/types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000') + '/api/';
Axios.defaults.baseURL = API_URL;

interface RequestOptions extends AxiosRequestConfig {
  method: RequestMethod;
  url: string;
  data?: any;
}

type RequestInterceptorFulfilled = (
  config: InternalAxiosRequestConfig
) => InternalAxiosRequestConfig | Promise<InternalAxiosRequestConfig>;
type RequestInterceptorRejected = (error: any) => any;

type ResponseInterceptorFulfilled = (
  response: AxiosResponse
) => AxiosResponse | Promise<AxiosResponse>;
type ResponseInterceptorRejected = (error: any) => any;

export class HttpService {
  private _axios: AxiosInstance;

  constructor() {
    this._axios = Axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        // 'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  addRequestInterceptor = (
    onFulfilled?: RequestInterceptorFulfilled,
    onRejected?: RequestInterceptorRejected
  ): number => {
    return this._axios.interceptors.request.use(onFulfilled, onRejected);
  };

  addResponseInterceptor = (
    onFulfilled?: ResponseInterceptorFulfilled,
    onRejected?: ResponseInterceptorRejected
  ): number => {
    return this._axios.interceptors.response.use(onFulfilled, onRejected);
  };

  get = async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('get' as const, url, undefined, config));
  };

  post = async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('post' as const, url, data, config));
  };

  put = async <T = any>(url: string, data?: any): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('put' as const, url, data));
  };

  patch = async <T = any>(url: string, data?: any): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('patch' as const, url, data));
  };

  delete = async <T = any>(url: string, data?: any): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('delete' as const, url, data));
  };

  downloadFile = async (url: string, options?: { method?: string; body?: string }): Promise<{success: true, url: string, filename?: string}> => {
    try {
      const method = options?.method?.toLowerCase() || 'get';
      const config: AxiosRequestConfig = {
        responseType: 'blob',
        headers: {
          'Accept': 'application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Type': 'application/json',
        },
      };
      
      const response = method === 'post' 
        ? await this._axios.post(url, options?.body ? JSON.parse(options.body) : {}, config)
        : await this._axios.get(url, config);
      
      const blob = new Blob([response.data], { 
        type: response.headers['content-type'] || 'application/octet-stream' 
      });
      const blobUrl = URL.createObjectURL(blob);
      
      const contentDisposition = response.headers['content-disposition'];
      let filename = undefined;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/i);
        if (filenameMatch) {
          filename = filenameMatch[1];
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

  private getOptionsConfig = (
    method: RequestMethod,
    url: string,
    data?: any,
    config?: AxiosRequestConfig  // Nouveau paramètre
  ): RequestOptions => {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };

    // Ne pas forcer Content-Type si FormData (Axios le gère automatiquement)
    if (data instanceof FormData) {
      // Laisse Axios définir le Content-Type avec boundary
      // Ne touche pas à 'Content-Type'
    } else {
      headers['Content-Type'] = 'application/json';
    }

    const result: RequestOptions = {
      method,
      url,
      data,
      headers,
    };
    
    if (config) {
      Object.assign(result, config);
    }
    
    return result;
  };

private request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    if (options.data instanceof FormData) {
      // Supprime tout Content-Type pour laisser Axios gérer multipart
      delete options.headers?.['Content-Type'];
      delete options.headers?.['content-type'];

      this._axios
        .post(options.url, options.data, {
          headers: options.headers,
          timeout: options.timeout,
        })
        .then((res: AxiosResponse<ApiResponse<T>>) => resolve(res.data as T))
        .catch((ex: any) => {
          const error: ApiError = ex.response?.data || {
            message: ex.message || 'Une erreur est survenue',
            status: ex.response?.status,
          };
          reject(error);
        });
    } else {
      this._axios
        .request<ApiResponse<T>>({
          ...options,
          method: options.method as any
        })
        .then((res: AxiosResponse<ApiResponse<T>>) => resolve(res.data as T))
        .catch((ex: any) => {
          const error: ApiError = ex.response?.data || {
            message: ex.message || 'Une erreur est survenue',
            status: ex.response?.status,
          };
          reject(error);
        });
    }
  });
}
}

export default new HttpService();
