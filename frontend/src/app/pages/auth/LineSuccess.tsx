import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../../i18n/useLanguage";
import "../../../styles/LineError.css";

const LineSuccess = () => {
  const [searchParams] = useSearchParams();
  const userId = searchParams.get("userId") || "";
  const friendUrl = searchParams.get("friendUrl") || "";
  const language = useLanguage();

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

  const title =
    language === "ja"
      ? "LINEログイン完了"
      : language === "en"
        ? "LINE Login Completed"
        : "LINE 로그인 완료";

  const description =
    language === "en"
      ? "To complete the notification connection, please add the LINE official account as a friend. The connection status will automatically reflect once added."
      : "알림 연동을 완료하려면 LINE 공식계정을 친구로 추가해 주세요. 친구추가가 완료되면 연동 상태가 자동으로 반영됩니다.";

  // Let's refine the Japanese description to be 100% Japanese
  const finalDesc = language === "ja"
    ? "通知連携を完了するには、LINE公式アカウントを友だち追加してください。追加されると、連携状態が自動的に反映されます。"
    : description;

  const addFriendText =
    language === "ja"
      ? "公式アカウントを友だち追加"
      : language === "en"
        ? "Add Official Account"
        : "공식계정 친구추가 열기";

  const closeText =
    language === "ja"
      ? "閉じる"
      : language === "en"
        ? "Close"
        : "닫기";

  return (
    <div className="line-error-container">
      <div className="line-error-card">
        <div className="line-error-icon">LINE</div>
        <h2 className="line-success-title">{title}</h2>
        <p>{finalDesc}</p>

        {friendUrl && (
          <button
            className="line-error-btn"
            onClick={() => window.location.replace(friendUrl)}
          >
            {addFriendText}
          </button>
        )}

        <button className="line-secondary-btn" onClick={closePopup}>
          {closeText}
        </button>
      </div>
    </div>
  );
};

export default LineSuccess;
