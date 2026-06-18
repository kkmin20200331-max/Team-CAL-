import React from "react";

interface LineLoginButtonProps {
  role: "ADMIN" | "STAFF";
}

const LineLoginButton: React.FC<LineLoginButtonProps> = ({ role }) => {
  const user = JSON.parse(sessionStorage.getItem("user") || "{}");
  const handleLineLogin = () => {
    // Spring Boot 로그인 시작 API로 이동
    window.location.href = `http://localhost:8080/api/line/login?userId=${user.id}`;
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
      LINE으로 로그인 ({role})
    </button>
  );
};

export default LineLoginButton;
