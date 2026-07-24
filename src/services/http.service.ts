import Axios, { 
  AxiosInstance, 
  AxiosRequestConfig, 
  AxiosResponse, 
  InternalAxiosRequestConfig 
} from 'axios';
import type { RequestMethod, ApiResponse, ApiError } from '@/types';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8001') + '/api/';
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
      timeout: 100000,
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
      const token = localStorage.getItem('token');
      const config: AxiosRequestConfig = {
        responseType: 'blob',
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
      let filename: string | undefined = undefined;
      if (contentDisposition) {
        // RFC 5987 : filename*=UTF-8''nom%20avec%20espaces.pdf
        const rfc5987 = contentDisposition.match(/filename\*=(?:UTF-8'')?([^\s;]+)/i);
        if (rfc5987?.[1]) {
          filename = decodeURIComponent(rfc5987[1]);
        } else {
          // Guillemets doubles : filename="nom avec espaces.pdf"
          const quoted = contentDisposition.match(/filename="([^"]+)"/i);
          // Sans guillemets : filename=simple.pdf
          const unquoted = contentDisposition.match(/filename=([^\s;]+)/i);
          filename = quoted?.[1] ?? unquoted?.[1];
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
      // Supprime tout Content-Type pour laisser Axios gérer multipart/form-data
      delete options.headers?.['Content-Type'];
      delete options.headers?.['content-type'];

      // Injection explicite du token — garantit que le header Authorization
      // est présent même quand l'intercepteur async ne s'applique pas
      // correctement sur les requêtes multipart.
      const token = localStorage.getItem('token');
      if (token) {
        options.headers = {
          ...(options.headers ?? {}),
          Authorization: `Bearer ${token}`,
        };
      }

      this._axios
        .post(options.url, options.data, {
          headers: options.headers,
          timeout: options.timeout,
        })
        .then((res: AxiosResponse<ApiResponse<T>>) => resolve(res.data as T))
        .catch((ex: any) => {
          const error: ApiError = {
            message: ex.response?.data?.message || ex.message || 'Une erreur est survenue',
            status: ex.response?.status || 500,
            ...(ex.response?.data || {})
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
          const error: ApiError = {
            message: ex.response?.data?.message || ex.message || 'Une erreur est survenue',
            status: ex.response?.status || 500,
            ...(ex.response?.data || {})
          };
          reject(error);
        });
    }
  });
}
}

export default new HttpService();
