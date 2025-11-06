import HttpService from "./http.service.ts";

export const setupAxiosInterceptors = (onUnauthenticated: any) => {
  const onRequestSuccess = async (config: any) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  };
  const onRequestFail = (error: any) => Promise.reject(error);

  HttpService.addRequestInterceptor(onRequestSuccess, onRequestFail);

  const onResponseSuccess = (response: any) => response;

  const onResponseFail = (error: any) => {
    const status = error.status || error.response.status;
    if (status === 403 || status === 401) {
      onUnauthenticated();
    }

    return Promise.reject(error);
  };
  HttpService.addResponseInterceptor(onResponseSuccess, onResponseFail);
};
