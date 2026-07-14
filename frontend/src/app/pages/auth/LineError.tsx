import { useSearchParams } from "react-router-dom";
import { useLanguage } from "../../i18n/useLanguage";
import "../../../styles/LineError.css";

const LineError = () => {
  const [searchParams] = useSearchParams();
  const language = useLanguage();

  const getTranslatedDefaultMessage = () => {
    if (language === "ja") return "LINE連携中にエラーが発生しました。";
    if (language === "en") return "An error occurred during LINE connection.";
    return "LINE 연동 중 오류가 발생했습니다.";
  };

  const message = searchParams.get("message") || getTranslatedDefaultMessage();

  const title =
    language === "ja"
      ? "LINE連携 失敗"
      : language === "en"
        ? "LINE Connection Failed"
        : "LINE 연동 실패";

  const closeText =
    language === "ja"
      ? "閉じる"
      : language === "en"
        ? "Close"
        : "닫기";

  return (
    <div className="line-error-container">
      <div className="line-error-card">
        <div className="line-error-icon">⚠️</div>

        <h2>{title}</h2>

        <p>{message}</p>

        <button
          className="line-error-btn"
          onClick={() => {
            window.opener?.location.reload();
            window.close();
          }}
        >
          {closeText}
        </button>
      </div>
    </div>
  );
};

export default LineError;
