import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { API_BASE } from "../../../lib/axiosInstance";
import { useLanguage } from "../../i18n/useLanguage";

const GREEN = "#18A022";
const DARK_GREEN = "#07790F";
const BORDER_GREEN = "#00A200";
const LIGHT_GREEN = "#E6F5C8";

type StoredUser = {
  id?: string;
  user_id?: string;
  userId?: string;
};

type LineStatusResponse = {
  linked?: boolean;
  followed?: boolean;
  follow_yn?: string;
  followYn?: string;
  user_id?: string;
  userId?: string;
  line_user_id?: string;
  lineUserId?: string;
};

type LineLinkedMessage = {
  type?: string;
  userId?: string;
};

const getStoredUser = (): StoredUser => {
  try {
    return JSON.parse(sessionStorage.getItem("user") || "{}");
  } catch {
    return {};
  }
};

const isLinkedResponse = (data: LineStatusResponse | null) => {
  if (!data) {
    return false;
  }

  return Boolean(
    data.followed ||
      data.follow_yn?.toUpperCase() === "Y" ||
      data.followYn?.toUpperCase() === "Y",
  );
};

const LineLoginButton = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const language = useLanguage();
  const popupRef = useRef<Window | null>(null);
  const [isLinked, setIsLinked] = useState(false);
  const user = getStoredUser();
  const userId = user.id ?? user.user_id ?? user.userId ?? "";

  const label = isLinked
    ? language === "ja"
      ? "LINE連携解除"
      : language === "en"
        ? "Disconnect LINE"
        : "LINE 연동 해제"
    : language === "ja"
      ? "LINE連携"
      : language === "en"
        ? "LINE Connect"
        : "LINE 연동";

  const fetchLineStatus = useCallback(async () => {
    if (!userId) {
      setIsLinked(false);
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/user-line?user_id=${encodeURIComponent(userId)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        setIsLinked(false);
        return;
      }

      const data = (await response.json()) as LineStatusResponse | null;
      setIsLinked(isLinkedResponse(data));
    } catch {
      setIsLinked(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLineStatus();

    const handleFocus = () => {
      fetchLineStatus();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchLineStatus();
      }
    };

    const handleLineMessage = (event: MessageEvent<LineLinkedMessage>) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type !== "LINE_LINKED") {
        return;
      }

      if (event.data.userId && event.data.userId !== userId) {
        return;
      }

      fetchLineStatus();
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("message", handleLineMessage);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("message", handleLineMessage);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchLineStatus, userId]);

  const handleLineLogin = () => {
    if (!userId || isLinked) {
      return;
    }

    popupRef.current = window.open(
      `${API_BASE}/line/login?userId=${encodeURIComponent(userId)}`,
      "_blank",
      "width=500,height=700",
    );

    const poll = window.setInterval(() => {
      if (!popupRef.current || popupRef.current.closed) {
        window.clearInterval(poll);
        fetchLineStatus();
      }
    }, 1000);
  };

  const handleDisconnect = async () => {
    if (!userId) {
      return;
    }

    const confirmed = window.confirm(
      language === "ja"
        ? "LINE連携を解除しますか？"
        : language === "en"
          ? "Are you sure you want to disconnect LINE?"
          : "정말 LINE 연동을 해제하시겠습니까?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/user-line?user_id=${encodeURIComponent(userId)}`,
        {
          method: "DELETE",
          cache: "no-store",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to disconnect LINE");
      }

      setIsLinked(false);
    } catch {
      window.alert(
        language === "ja"
          ? "LINE連携解除に失敗しました。"
          : language === "en"
            ? "Failed to disconnect LINE."
            : "LINE 연동 해제에 실패했습니다.",
      );
    }
  };

  const background = isLinked
    ? GREEN
    : isDark
      ? "rgba(255,255,255,0.06)"
      : LIGHT_GREEN;
  const color = isLinked ? "#fff" : DARK_GREEN;
  const hoverBackground = isLinked
    ? DARK_GREEN
    : isDark
      ? "rgba(255,255,255,0.12)"
      : "#d2f0a0";

  return (
    <button
      onClick={isLinked ? handleDisconnect : handleLineLogin}
      style={{
        width: "100%",
        padding: "13px 0",
        borderRadius: 14,
        border: `1px solid ${BORDER_GREEN}`,
        background,
        color,
        fontWeight: 700,
        fontSize: 15,
        cursor: userId ? "pointer" : "not-allowed",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        transition: "background 0.15s",
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = hoverBackground;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = background;
      }}
    >
      <svg width="17" height="17" viewBox="0 0 24 24" fill={color}>
        <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
      </svg>
      {label}
    </button>
  );
};

export default LineLoginButton;
