import axios from "axios";
import { config } from "./config";

const API_BASE_URL = config.apiUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
});

// 요청 인터셉터: 관리자 토큰이 있으면 자동으로 헤더에 추가
api.interceptors.request.use((reqConfig) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token) {
      reqConfig.headers.Authorization = `Bearer ${token}`;
    }
  }
  return reqConfig;
});

// 응답 인터셉터: 401 에러 시 토큰 제거 및 로그인 페이지로 이동
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // 관리자 페이지에서만 리다이렉트
      if (window.location.pathname.startsWith("/admin")) {
        localStorage.removeItem("admin_token");
        // 로그인 페이지로는 리다이렉트하지 않음 (layout에서 처리)
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
