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

  useEffect(() => {
    notifyOpener();

    if (friendUrl) {
      window.location.replace(friendUrl);
    }
  }, [friendUrl, userId]);

  const closePopup = () => {
    notifyOpener();

    if (window.opener) {
      window.close();
      return;
    }

    window.location.href = "/";
  };

  return (
    <div className="line-error-container">
      <div className="line-error-card">
        <div className="line-error-icon">LINE</div>
        <h2 className="line-success-title">LINE 로그인 완료</h2>
        <p>
          알림 연동을 완료하려면 LINE 공식계정을 친구로 추가해 주세요.
          친구추가가 완료되면 연동 상태가 자동으로 반영됩니다.
        </p>

        {friendUrl && (
          <button
            className="line-error-btn"
            onClick={() => window.location.replace(friendUrl)}
          >
            공식계정 친구추가 열기
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
