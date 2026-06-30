/**
 * 공통 Axios 인스턴스
 *
 * 백엔드 주소는 .env 파일의 VITE_API_BASE_URL 하나에서 관리됩니다.
 * 모바일 테스트 시 .env 파일에서 IP만 바꾸면 전체에 적용됩니다.
 */
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "https://bitemate.kro.kr/api";

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default axiosInstance;

/** 순수 fetch() 사용 시 base URL 조합용 */
export const API_BASE = API_BASE_URL;
