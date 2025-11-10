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
        'Content-Type': 'application/json',
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

  get = async <T = any>(url: string): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('get', url));
  };

  post = async <T = any>(url: string, data?: any): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('post', url, data));
  };

  put = async <T = any>(url: string, data?: any): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('put', url, data));
  };

  patch = async <T = any>(url: string, data?: any): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('patch', url, data));
  };

  delete = async <T = any>(url: string, data?: any): Promise<T> => {
    return await this.request<T>(this.getOptionsConfig('delete', url, data));
  };

  downloadFile = async (url: string): Promise<Blob> => {
    const response = await this._axios.get(url, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf',
      },
    });
    return response.data;
  };

  private getOptionsConfig = (
    method: RequestMethod,
    url: string,
    data?: any
  ): RequestOptions => {
    return {
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    };
  };

  private request<T = any>(options: RequestOptions): Promise<T> {
    return new Promise((resolve, reject) => {
      this._axios
        .request<ApiResponse<T>>(options)
        .then((res: AxiosResponse<ApiResponse<T>>) => resolve(res.data as T))
        .catch((ex: any) => {
          const error: ApiError = ex.response?.data || {
            message: ex.message || 'Une erreur est survenue',
            status: ex.response?.status,
          };
          reject(error);
        });
    });
  }
}

export default new HttpService();
