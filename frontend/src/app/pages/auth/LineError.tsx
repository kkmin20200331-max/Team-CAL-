import { useSearchParams } from "react-router-dom";
import "../../../styles/LineError.css";

const LineError = () => {
  const [searchParams] = useSearchParams();

  const message =
    searchParams.get("message") || "LINE 연동 중 오류가 발생했습니다.";

  return (
    <div className="line-error-container">
      <div className="line-error-card">
        <div className="line-error-icon">⚠️</div>

        <h2>LINE 연동 실패</h2>

        <p>{message}</p>

        <button
          className="line-error-btn"
          onClick={() => {
            window.opener?.location.reload();
            window.close();
          }}
        >
          닫기
        </button>
      </div>
    </div>
  );
};

export default LineError;
