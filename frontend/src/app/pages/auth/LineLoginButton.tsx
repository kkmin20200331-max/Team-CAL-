import React from "react";
import { API_BASE } from "../../../lib/axiosInstance";

const LineLoginButton = () => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const handleLineLogin = () => {
    // Spring Boot 로그인 시작 API로 이동
    window.open(
      `${API_BASE}/line/login?userId=${user.id}`,
      "_blank",
      "width=500,height=700",
    );
  };
  return (
    <button
      onClick={handleLineLogin}
      style={{
        padding: "12px 20px",
        borderRadius: "8px",
        border: "none",
        cursor: "pointer",
        backgroundColor: "#06C755", // LINE green
        color: "#fff",
        fontWeight: "bold",
        fontSize: "14px",
      }}
    >
      LINE 로그인
    </button>
  );
};

export default LineLoginButton;
