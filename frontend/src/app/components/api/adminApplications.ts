import axiosInstance from "../../../lib/axiosInstance";

export interface AdminApplication {
  id: string;
  user_id: string;
  store_name: string;
  store_address?: string;
  store_type?: string;
  business_number?: string;
  status: string;
  reject_reason?: string;
  created_at?: string;
  user_name?: string;
  username?: string;
  phone?: string;
}

export const getAdminApplicationsAPI = (status = "PENDING") =>
  axiosInstance.get<AdminApplication[]>("/admin-applications", {
    params: { status },
  });

export const approveAdminApplicationAPI = (id: string, reviewedBy?: string) =>
  axiosInstance.put(`/admin-applications/${id}/approve`, {
    reviewed_by: reviewedBy,
  });

export const rejectAdminApplicationAPI = (
  id: string,
  rejectReason: string,
  reviewedBy?: string,
) =>
  axiosInstance.put(`/admin-applications/${id}/reject`, {
    reject_reason: rejectReason,
    reviewed_by: reviewedBy,
  });

