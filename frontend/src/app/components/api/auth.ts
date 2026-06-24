import axiosInstance from "../../../lib/axiosInstance";

// 로그인
export const loginAPI = (username: string, password: string) =>
  axiosInstance.post("/users/login", { username, password });

// 로그인 확인 함수
export const isLogin = (): boolean => {
  return sessionStorage.getItem("user") !== null;
};

// 로그인 정보 가져오기
export const getLoginUser = () => {
  const user = sessionStorage.getItem("user");
  return user ? JSON.parse(user) : null;
};

// 회원가입
export const signupAPI = (data: {
  username: string;
  password: string;
  name: string;
  phone: string;
  role: "ADMIN" | "STAFF";
  brandName?: string;
  branchName?: string | null;
  storeAddress?: string;
  storeType?: string;
  businessNumber?: string;
  openTime?: string;
  closeTime?: string;
  maxCapacity?: number;
  selectedBrand?: string;
  selectedBranch?: string;
}) => axiosInstance.post("/users", data);
