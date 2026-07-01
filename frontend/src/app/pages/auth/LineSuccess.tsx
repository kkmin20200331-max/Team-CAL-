import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import "../../../styles/LineError.css";

const LineSuccess = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const friendUrl = searchParams.get("friendUrl") || "";

  const notifyOpener = () => {
    window.opener?.postMessage(
      {
        type: "LINE_LINKED",
        userId,
      },
      window.location.origin,
    );
  };

  const goToQrCheckIn = () => {
    notifyOpener();

    if (window.opener) {
      window.opener.location.href = "/employee/checkin";
      window.close();
      return;
    }

    window.location.href = "/employee/checkin";
  };

  useEffect(() => {
    goToQrCheckIn();
  }, [userId]);

  const closePopup = () => {
    goToQrCheckIn();
  };

  return (
    <div className="line-error-container">
      <div className="line-error-card">
        <div className="line-error-icon">LINE</div>
        <h2 className="line-success-title">LINE 연동 완료</h2>
        <p>
          계정과 LINE 계정이 연결되었습니다. 알림을 받으려면 공식계정도
          친구로 추가해 주세요.
        </p>

        {friendUrl && (
          <button
            className="line-error-btn"
            onClick={() => window.open(friendUrl, "_blank", "noopener,noreferrer")}
          >
            공식계정 친구 추가
          </button>
        )}

        <button className="line-secondary-btn" onClick={closePopup}>
          닫기
        </button>
      </div>
    </div>
  );
};

export default LineSuccess;
