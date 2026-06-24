import axiosInstance from "../../../lib/axiosInstance";

// 모든 매장 목록 조회
export const getAllStoresAPI = () => axiosInstance.get("/store/all");

// 매장 직원 등록 (근무 신청)
export const createStoreMemberAPI = (data: {
  id: string;
  store_id: string;
  user_id: string;
}) => axiosInstance.post("/store_member", data);
