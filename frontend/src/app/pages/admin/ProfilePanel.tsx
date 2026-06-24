import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ibspdrfjncacwrpslckb.supabase.co',
  'sb_secret_W6zz0sf66YsJfR6VudJNaQ_MQcddHwo'
);
import { useNavigate } from 'react-router';
import { useTheme } from 'next-themes';
import axios from 'axios';
import { useLanguage } from '../../i18n/useLanguage';
import { Avatar, AvatarImage, AvatarFallback } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import {
  X,
  Bell,
  CheckCircle,
  XCircle,
  Store,
  User,
  LogOut,
  Camera,
  Clock,
  FileText,
  UserCheck,
} from "lucide-react";
import { Switch } from "../../components/ui/switch";
import LineLoginButton from "../auth/LineLoginButton";
function SunIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 29 29"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M20.1565 14.4456C20.1565 11.2915 17.5996 8.73453 14.4455 8.73453C11.2914 8.73453 8.73446 11.2914 8.73446 14.4456C8.73447 17.5997 11.2914 20.1565 14.4455 20.1565C17.5996 20.1565 20.1565 17.5997 20.1565 14.4456ZM22.1721 14.4456C22.1721 18.7129 18.7128 22.1722 14.4455 22.1722C10.1782 22.1722 6.71882 18.7129 6.71881 14.4456C6.71881 10.1782 10.1782 6.71887 14.4455 6.71887C18.7128 6.71888 22.1721 10.1782 22.1721 14.4456Z"
        fill={color}
      />
      <path
        d="M13.4377 3.69538V1.00783C13.4377 0.451219 13.8889 0 14.4455 0C15.0021 0 15.4533 0.451219 15.4533 1.00783V3.69538C15.4533 4.25198 15.0021 4.7032 14.4455 4.7032C13.8889 4.7032 13.4377 4.25198 13.4377 3.69538Z"
        fill={color}
      />
      <path
        d="M13.4377 27.8832V25.1957C13.4377 24.6391 13.8889 24.1879 14.4455 24.1879C15.0021 24.1879 15.4533 24.6391 15.4533 25.1957V27.8832C15.4533 28.4398 15.0021 28.8911 14.4455 28.8911C13.8889 28.8911 13.4377 28.4398 13.4377 27.8832Z"
        fill={color}
      />
      <path
        d="M3.69538 13.4377C4.25198 13.4377 4.7032 13.8889 4.7032 14.4455C4.7032 15.0021 4.25198 15.4533 3.69538 15.4533H1.00783C0.451219 15.4533 0 15.0021 0 14.4455C0 13.8889 0.451219 13.4377 1.00783 13.4377H3.69538Z"
        fill={color}
      />
      <path
        d="M27.8832 13.4377C28.4398 13.4377 28.8911 13.8889 28.8911 14.4455C28.8911 15.0021 28.4398 15.4533 27.8832 15.4533H25.1957C24.6391 15.4533 24.1879 15.0021 24.1879 14.4455C24.1879 13.8889 24.6391 13.4377 25.1957 13.4377H27.8832Z"
        fill={color}
      />
      <path
        opacity="0.5"
        d="M24.2171 3.25079C24.6278 2.87521 25.2653 2.90374 25.6409 3.31453C26.0165 3.72531 25.988 4.36278 25.5772 4.73836L22.5913 7.46835C22.1805 7.84392 21.5431 7.81539 21.1675 7.40461C20.7919 6.99382 20.8204 6.35633 21.2312 5.98074L24.2171 3.25079Z"
        fill={color}
      />
      <path
        opacity="0.5"
        d="M3.25012 3.31453C3.6257 2.90374 4.26316 2.87521 4.67395 3.25079L7.65983 5.98074C8.07062 6.35632 8.09915 6.99382 7.72357 7.40461C7.34798 7.81539 6.71049 7.84393 6.2997 7.46835L3.31386 4.73836C2.90307 4.36277 2.87454 3.72532 3.25012 3.31453Z"
        fill={color}
      />
      <path
        opacity="0.5"
        d="M6.26737 21.1984C6.66095 20.8049 7.29907 20.8049 7.69265 21.1984C8.08623 21.592 8.08623 22.2302 7.69265 22.6237L4.70649 25.6098C4.31291 26.0034 3.67479 26.0034 3.28121 25.6098C2.88763 25.2163 2.88763 24.5781 3.28121 24.1846L6.26737 21.1984Z"
        fill={color}
      />
      <path
        opacity="0.5"
        d="M21.1987 21.1976C21.5923 20.8041 22.2304 20.8041 22.624 21.1977L25.6098 24.1838C26.0034 24.5774 26.0033 25.2155 25.6097 25.6091C25.2161 26.0026 24.578 26.0026 24.1845 25.609L21.1986 22.6229C20.805 22.2293 20.8051 21.5912 21.1987 21.1976Z"
        fill={color}
      />
    </svg>
  );
}
function MoonIcon({ color }: { color: string }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        opacity="0.5"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27.898 13.9496C27.898 21.6533 21.6527 27.8986 13.949 27.8986C12.325 27.8986 10.7658 27.621 9.31634 27.1109C8.70609 25.6344 8.36938 24.016 8.36938 22.319C8.36938 19.2206 9.49182 16.3844 11.3522 14.1948C12.9865 16.5739 15.7267 18.1343 18.8311 18.1343C22.1252 18.1343 25.009 16.3775 26.5968 13.7498C26.9306 13.1974 27.898 13.3041 27.898 13.9496Z"
        fill={color}
      />
      <path
        d="M0 13.949C0 20.0288 3.88971 25.2001 9.31636 27.1103C8.70611 25.6338 8.36941 24.0155 8.36941 22.3184C8.36941 19.2201 9.49184 16.3838 11.3523 14.1942C10.3505 12.7359 9.76431 10.9698 9.76431 9.06686C9.76431 5.77273 11.521 2.88891 14.1488 1.30111C14.7011 0.967322 14.5944 0 13.949 0C6.24518 0 0 6.24518 0 13.949Z"
        fill={color}
      />
    </svg>
  );
}

const API = axios.create({ baseURL: "http://localhost:8080/api" });

interface PendingEmployee {
  id: string;
  name: string;
  phone: string;
  username: string;
  store_id: string;
  store_name: string;
}

interface LeaveRequestVO {
  id: string;
  shift_id: string;
  user_id: string;
  reason: string;
  status: string;
  requested_at: any;
  processed_at: any;
  store_id: string;
  store_name: string;
}

interface ShiftVO {
  id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}

interface StoreVO {
  id: string;
  name: string;
}

interface SubstitutePendingApp {
  app_id: string;
  post_id: string;
  store_id: string;
  store_name: string;
  applicant_user_id: string;
  message: string;
  applied_at: any;
  reason: string;
}

const getDatePart = (s: string) => {
  if (!s) return "";
  return s.includes("T") ? s.split("T")[0] : s.split(" ")[0];
};

const formatTimePart = (s: string) => {
  if (!s) return "";
  const t = s.includes("T") ? s.split("T")[1] : s.split(" ")[1];
  return t ? t.substring(0, 5) : "";
};

const getDayLabel = (dateStr: string) => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const p = getDatePart(dateStr).split("-");
  return days[new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2])).getDay()];
};

export default function ProfilePanel() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const language = useLanguage();

  const changeLanguage = (lang: "ko" | "en" | "ja") => {
    sessionStorage.setItem("app-language", lang);
    window.dispatchEvent(
      new CustomEvent("app-language-change", { detail: lang }),
    );
  };

  const panelBg = isDark ? "#2a2a2e" : "white";
  const textMain = isDark ? "#f0f0f0" : "#111827";
  const textSub = isDark ? "#b0b0b8" : "#6b7280";
  const divider = isDark ? "#44444a" : "#e5e7eb";
  const closeBg = isDark ? "#3a3a40" : "#E6F5C8";
  const closeIcon = isDark ? "#ccc" : "#07790F";
  const cardBg = isDark ? "#35353c" : "#f9fafb";
  const cardBorder = isDark ? "#4a4a52" : "#e5e7eb";
  const logoutBg = isDark ? "#35353c" : "#f5f5f5";
  const logoutHov = isDark ? "#44444a" : "#ebebeb";
  const logoutTxt = isDark ? "#d0d0d8" : "#555";
  const darkCard = "#35353c";
  const darkCardBorder = "#4a8a50";

  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = JSON.parse(sessionStorage.getItem('user') || localStorage.getItem('user') || '{}');

  const [profileImage, setProfileImage] = useState<string>(
    () => currentUser.profile_image || ''
  );

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser.id) return;
    try {
      const ext = file.name.split('.').pop();
      const path = `profile/${currentUser.id}.${ext}`;
      const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(path);
      const url = urlData.publicUrl;
      await fetch(`http://localhost:8080/api/users/${currentUser.id}/profile-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image: url }),
      });
      setProfileImage(url);
      const updatedUser = { ...currentUser, profile_image: url };
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('프로필 이미지 업로드 실패:', err);
    }
  };

  // ── 직원 가입 승인 대기 ──
  const [pendingList, setPendingList] = useState<PendingEmployee[]>(() => {
    try {
      const cached = sessionStorage.getItem("pendingList");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  // ── 휴무 신청 ──
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestVO[]>([]);
  const [shiftMap, setShiftMap] = useState<Record<string, ShiftVO>>({});
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});

  // ── 대타 지원 알림 ──
  const [substituteApps, setSubstituteApps] = useState<SubstitutePendingApp[]>(
    [],
  );

  // ── 게시판 푸시 알림 ──
  interface BoardNotification {
    id: string;
    title: string;
    content: string;
    store_id: string;
    created_at: string;
    is_read: string;
  }
  const [boardNotifications, setBoardNotifications] = useState<
    BoardNotification[]
  >([]);
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    if (!open || !currentUser.id) return;

    setNotifLoading(true);
    API.get("/store", { params: { user_id: currentUser.id } })
      .then(async (res) => {
        const stores: StoreVO[] = Array.isArray(res.data) ? res.data : [];

        const [leaveResults, userResults] = await Promise.all([
          Promise.allSettled(
            stores.map((store) =>
              API.get("/leave_request", {
                params: { store_id: store.id },
              }).then((r) =>
                (Array.isArray(r.data) ? r.data : []).map((lr: any) => ({
                  ...lr,
                  store_id: store.id,
                  store_name: store.name,
                })),
              ),
            ),
          ),
          Promise.allSettled(
            stores.map((store) =>
              API.get("/users", { params: { store_id: store.id } }),
            ),
          ),
        ]);

        const allLeaves: LeaveRequestVO[] = [];
        leaveResults.forEach((r) => {
          if (r.status === "fulfilled") allLeaves.push(...r.value);
        });
        setLeaveRequests(allLeaves);

        const nameMap: Record<string, string> = {};
        userResults.forEach((r) => {
          if (r.status === "fulfilled") {
            (Array.isArray(r.value.data) ? r.value.data : []).forEach(
              (u: any) => {
                nameMap[u.id] = u.name;
              },
            );
          }
        });
        setUserNameMap(nameMap);

        const uniqueShiftIds = [...new Set(allLeaves.map((lr) => lr.shift_id))];
        if (uniqueShiftIds.length > 0) {
          const shiftResults = await Promise.allSettled(
            uniqueShiftIds.map((sid) => API.get(`/shift/${sid}`)),
          );
          const newShiftMap: Record<string, ShiftVO> = {};
          shiftResults.forEach((r, i) => {
            if (r.status === "fulfilled")
              newShiftMap[uniqueShiftIds[i]] = r.value.data;
          });
          setShiftMap(newShiftMap);
        }

        const subPostResults = await Promise.allSettled(
          stores.map((store) =>
            API.get("/substitute", { params: { store_id: store.id } }).then(
              (r) => ({ store, posts: Array.isArray(r.data) ? r.data : [] }),
            ),
          ),
        );

        const allPendingApps: SubstitutePendingApp[] = [];
        const appFetches: Promise<void>[] = [];

        subPostResults.forEach((r) => {
          if (r.status !== "fulfilled") return;
          const { store, posts } = r.value;
          posts
            .filter((p: any) => (p.status || "").toLowerCase() === "open")
            .forEach((post: any) => {
              appFetches.push(
                API.get("/substitute/manager", { params: { post_id: post.id } })
                  .then((r2) => {
                    const apps = Array.isArray(r2.data) ? r2.data : [];
                    apps
                      .filter(
                        (a: any) =>
                          (a.status || "").toLowerCase() === "pending",
                      )
                      .forEach((app: any) => {
                        allPendingApps.push({
                          app_id: app.id,
                          post_id: post.id,
                          store_id: store.id,
                          store_name: store.name,
                          applicant_user_id: app.applicant_user_id,
                          message: app.message || "",
                          applied_at: app.applied_at,
                          reason: post.reason || "",
                        });
                      });
                  })
                  .catch(() => {}),
              );
            });
        });

        await Promise.allSettled(appFetches);
        setSubstituteApps(allPendingApps);

        if (currentUser.id) {
          API.get("/notification", { params: { user_id: currentUser.id } })
            .then((r) =>
              setBoardNotifications(
                Array.isArray(r.data)
                  ? r.data.filter((n: any) => n.is_read === "N")
                  : [],
              ),
            )
            .catch(() => {});
        }
      })
      .catch((err) => console.error("[ProfilePanel] 알림 조회 실패:", err))
      .finally(() => setNotifLoading(false));
  }, [open]);

  const handleApproveLeave = async (leave: LeaveRequestVO) => {
    try {
      await API.put(`/leave_request/${leave.id}`, null, {
        params: { status: "APPROVED" },
      });
      setLeaveRequests((prev) => prev.filter((l) => l.id !== leave.id));
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  const handleRejectLeave = async (leave: LeaveRequestVO) => {
    const name = userNameMap[leave.user_id] || "직원";
    if (!confirm(`${name}님의 휴무 신청을 거절하시겠습니까?`)) return;
    try {
      await API.put(`/leave_request/${leave.id}`, null, {
        params: { status: "REJECTED" },
      });
      setLeaveRequests((prev) => prev.filter((l) => l.id !== leave.id));
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  const handleApproveSubstitute = async (app: SubstitutePendingApp) => {
    try {
      await API.put("/substitute/manager", null, {
        params: { application_id: app.app_id, status: "APPROVED" },
      });
      setSubstituteApps((prev) => prev.filter((a) => a.app_id !== app.app_id));
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  const handleRejectSubstitute = async (app: SubstitutePendingApp) => {
    const name = userNameMap[app.applicant_user_id] || "직원";
    if (!confirm(`${name}님의 대타 지원을 거절하시겠습니까?`)) return;
    try {
      await API.delete("/substitute/staff", { params: { id: app.app_id } });
      setSubstituteApps((prev) => prev.filter((a) => a.app_id !== app.app_id));
    } catch {
      alert("처리 중 오류가 발생했습니다.");
    }
  };

  const handleApprove = async (emp: PendingEmployee) => {
    try {
      await API.put("/users/approve", null, { params: { id: emp.id } });
      await API.put("/store_member", null, {
        params: { user_id: emp.id, store_id: emp.store_id },
      });
      setPendingList((prev) => {
        const updated = prev.filter((p) => p.id !== emp.id);
        sessionStorage.setItem("pendingList", JSON.stringify(updated));
        return updated;
      });
      alert(`${emp.name}님이 승인되었습니다.`);
    } catch {
      alert("승인 처리 중 오류가 발생했습니다.");
    }
  };

  const handleReject = async (emp: PendingEmployee) => {
    if (!confirm(`${emp.name}님의 가입 요청을 거절하시겠습니까?`)) return;
    try {
      await API.delete("/users", { params: { id: emp.id } });
      setPendingList((prev) => {
        const updated = prev.filter((p) => p.id !== emp.id);
        sessionStorage.setItem("pendingList", JSON.stringify(updated));
        return updated;
      });
    } catch {
      alert("거절 처리 중 오류가 발생했습니다.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("store_id");
    localStorage.removeItem("store_name");
    sessionStorage.removeItem("pendingList");
    navigate("/auth/login");
  };

  const handleDeleteAccount = async () => {
    if (!confirm("정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다."))
      return;
    try {
      await API.delete("/users", { params: { id: currentUser.id } });
      handleLogout();
    } catch {
      alert("탈퇴 처리 중 오류가 발생했습니다.");
    }
  };

  const totalBadge =
    pendingList.length +
    leaveRequests.length +
    substituteApps.length +
    boardNotifications.length;

  return (
    <>
      {/* 프로필 아이콘 */}
      <div style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
        <button
          onClick={() => setOpen(true)}
          style={{
            borderRadius: '50%',
            border: '3px solid #E6F5C8',
            width: 64, height: 64, overflow: 'hidden',
            background: '#80D180', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {profileImage
            ? <img src={profileImage} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 22, fontWeight: 800, color: '#fff' }}>{currentUser?.name?.[0] ?? '?'}</span>
          }
        </button>
        {totalBadge > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            minWidth: 18, height: 18, padding: '0 4px',
            background: '#e53e3e', borderRadius: 9,
            border: '2px solid #fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, color: '#fff', fontWeight: 700, lineHeight: 1,
          }}>
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </div>

      {/* 슬라이드 패널 오버레이 */}
      {open && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'rgba(0,0,0,0.35)' }}
          onClick={() => setOpen(false)}
        />
      )}

      {/* 슬라이드 패널 */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, height: '100%', width: 420,
          background: panelBg, zIndex: 50,
          boxShadow: '-4px 0 32px rgba(0,0,0,0.24)',
          display: 'flex', flexDirection: 'column',
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease',
        }}
      >
        <div className="flex flex-col h-full">

            {/* 헤더 */}
            <div
              className="flex items-center justify-between px-6 py-5"
              style={{
                borderBottom: "2.5px solid #18A022",
                background: panelBg,
              }}
            >
              <span style={{ fontWeight: 800, fontSize: 18, color: "#18A022" }}>
                내 프로필
              </span>
              <button
                onClick={() => setOpen(false)}
                style={{
                  background: closeBg,
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X className="w-4 h-4" style={{ color: closeIcon }} />
              </button>
            </div>

            {/* 프로필 정보 */}
            <div className="flex flex-col items-center px-6 pb-12 pt-8">
              <div
                className="relative cursor-pointer group mb-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar
                  className="w-20 h-20 border-4 border-[#E6F5C8]"
                  style={{ background: "#80D180" }}
                >
                  <AvatarImage src={profileImage} className="object-cover" />
                  <AvatarFallback className="bg-green-600 text-white font-bold text-3xl">
                    {currentUser?.name?.[0] ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <p className="text-xs mb-2" style={{ color: "#aaa" }}>
                사진을 클릭하여 변경
              </p>
              <h2 className="text-xl font-bold" style={{ color: textMain }}>
                {currentUser?.name ?? ""}
              </h2>
              <p className="text-sm mt-1" style={{ color: textSub }}>
                {currentUser?.username ?? ""}
              </p>
              <span
                className="mt-2 px-3 py-1 text-xs font-semibold rounded-full"
                style={{
                  background: isDark ? darkCard : "#E6F5C8",
                  color: isDark ? "#7dd87d" : "#07790F",
                }}
              >
                관리자
              </span>
            </div>

            <div style={{ borderTop: `1px solid ${divider}` }} />

            {/* 알림 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4" style={{ color: textSub }} />
                <h3
                  className="font-semibold text-sm"
                  style={{ color: textMain }}
                >
                  알림
                </h3>
                {totalBadge > 0 && (
                  <Badge className="text-white text-xs" style={{ background: "#C0392B" }}>
                    {totalBadge}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                {totalBadge === 0 && (
                  <div
                    className="flex flex-col items-center justify-center"
                    style={{ paddingTop: 100, paddingBottom: 100, color: textSub }}
                  >
                    <CheckCircle className="w-8 h-8 mb-2" style={{ color: "#18A022" }} />
                    <p className="text-xs">대기 중인 요청이 없습니다.</p>
                  </div>
                )}

                {/* ── 직원 가입 승인 요청 ── */}
                {pendingList.map((emp) => (
                  <div
                    key={emp.id}
                    className="rounded-xl p-4 space-y-3"
                    style={{
                      border: `1px solid ${cardBorder}`,
                      background: cardBg,
                    }}
                  >
                    <div
                      className="flex items-center gap-1 text-xs font-semibold"
                      style={{ color: "#18A022" }}
                    >
                      <Store className="w-3 h-3" />
                      {emp.store_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: "#E6F5C8" }}
                      >
                        <User
                          className="w-4 h-4"
                          style={{ color: "#07790F" }}
                        />
                      </div>
                      <div>
                        <p
                          className="font-semibold text-xs"
                          style={{ color: textMain }}
                        >
                          {emp.name}
                        </p>
                        <p className="text-xs" style={{ color: textSub }}>
                          {emp.phone}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs" style={{ color: textSub }}>
                      직원 승인 요청이 있습니다.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white gap-1 text-xs h-7"
                        onClick={() => handleApprove(emp)}
                      >
                        <CheckCircle className="w-3 h-3" />
                        승인
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-500 border-red-300 hover:bg-red-50 gap-1 text-xs h-7"
                        onClick={() => handleReject(emp)}
                      >
                        <XCircle className="w-3 h-3" />
                        거절
                      </Button>
                    </div>
                  </div>
                ))}

                {/* ── 대타 지원 알림 ── */}
                {substituteApps.map((app) => {
                  const applicantName =
                    userNameMap[app.applicant_user_id] || "직원";
                  return (
                    <div
                      key={app.app_id}
                      className="rounded-xl p-4 space-y-3"
                      style={{
                        border: `1px solid ${isDark ? darkCardBorder : "#00A200"}`,
                        background: isDark ? darkCard : "#E6F5C8",
                      }}
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#07790F" }}>
                        <Store className="w-3 h-3" />
                        {app.store_name}
                        <span className="ml-1 font-normal" style={{ color: "#18A022" }}>
                          · 대타 지원
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E6F5C8" }}>
                          <UserCheck className="w-4 h-4" style={{ color: "#07790F" }} />
                        </div>
                        <div>
                          <p
                            className="font-semibold text-xs"
                            style={{ color: textMain }}
                          >
                            {applicantName}
                          </p>
                          <p className="text-xs" style={{ color: textSub }}>
                            대타 지원 신청이 있습니다.
                          </p>
                        </div>
                      </div>
                      {app.message && (
                        <p
                          className="text-xs rounded p-2"
                          style={{
                            color: textSub,
                            background: isDark ? "#3c3c46" : "#fff",
                            border: `1px solid ${isDark ? darkCardBorder : "#00A200"}`,
                          }}
                        >
                          "{app.message}"
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 text-white gap-1 text-xs h-7" style={{ background: "#18A022" }}
                          onClick={() => handleApproveSubstitute(app)}
                        >
                          <CheckCircle className="w-3 h-3" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1 text-xs h-7" style={{ color: "#C0392B", borderColor: "#C0392B" }}
                          onClick={() => handleRejectSubstitute(app)}
                        >
                          <XCircle className="w-3 h-3" />
                          거절
                        </Button>
                      </div>
                    </div>
                  );
                })}

                {/* ── 게시판 푸시 알림 ── */}
                {boardNotifications.map((notif) => (
                  <div
                    key={notif.id}
                    className="rounded-xl p-4 space-y-2"
                    style={{
                      border: `1px solid #00A200`,
                      background: isDark ? "rgba(24,160,34,0.12)" : "#E6F5C8",
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-1 text-xs font-semibold"
                        style={{ color: "#07790F" }}
                      >
                        <Bell className="w-3 h-3" />
                        게시판 알림
                      </div>
                      <button
                        onClick={() => {
                          fetch(
                            `http://localhost:8080/api/notification/read?id=${notif.id}`,
                            { method: "PUT" },
                          ).catch(() => {});
                          setBoardNotifications((prev) =>
                            prev.filter((n) => n.id !== notif.id),
                          );
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#888",
                          fontSize: 12,
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <p
                      className="font-semibold text-xs"
                      style={{ color: textMain }}
                    >
                      {notif.title}
                    </p>
                    {notif.content && (
                      <p className="text-xs" style={{ color: textSub }}>
                        {notif.content}
                      </p>
                    )}
                  </div>
                ))}

                {/* ── 휴무 신청 ── */}
                {leaveRequests.map((leave) => {
                  const shift = shiftMap[leave.shift_id];
                  const empName = userNameMap[leave.user_id] || "직원";
                  const datePart = shift ? getDatePart(shift.work_date) : "";
                  return (
                    <div
                      key={leave.id}
                      className="rounded-xl p-4 space-y-3"
                      style={{
                        border: `1px solid ${isDark ? darkCardBorder : "#00A200"}`,
                        background: isDark ? darkCard : "#E6F5C8",
                      }}
                    >
                      <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#07790F" }}>
                        <Store className="w-3 h-3" />
                        {leave.store_name}
                        <span className="ml-1 font-normal" style={{ color: "#18A022" }}>
                          · 휴무 신청
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "#E6F5C8" }}>
                          <User className="w-4 h-4" style={{ color: "#07790F" }} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <p
                            className="font-semibold text-sm"
                            style={{ color: textMain }}
                          >
                            {empName}
                          </p>
                          {shift ? (
                            <div
                              className="flex items-center gap-1 text-xs"
                              style={{ color: textSub }}
                            >
                              <Clock className="w-3 h-3" />
                              {datePart} ({getDayLabel(shift.work_date)}){" "}
                              {formatTimePart(shift.start_at)}~
                              {formatTimePart(shift.end_at)}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-400">
                              근무 정보 불러오는 중...
                            </p>
                          )}
                        </div>
                      </div>
                      <p
                        className="text-xs rounded p-2"
                        style={{
                          color: textSub,
                          background: isDark ? darkCard : "#fff",
                          border: `1px solid ${isDark ? darkCardBorder : "#00A200"}`,
                        }}
                      >
                        "{leave.reason}"
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 text-white gap-1 text-xs h-7" style={{ background: "#18A022" }}
                          onClick={() => handleApproveLeave(leave)}
                        >
                          <CheckCircle className="w-3 h-3" />
                          승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-1 text-xs h-7" style={{ color: "#C0392B", borderColor: "#C0392B" }}
                          onClick={() => handleRejectLeave(leave)}
                        >
                          <XCircle className="w-3 h-3" />
                          거절
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${divider}` }} />

            {/* 로그아웃 / 탈퇴 */}
            <div
              className="px-6 pb-7 pt-4"
              style={{ display: "flex", flexDirection: "column", gap: 14 }}
            >
              {/* 다크모드 토글 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 500, color: logoutTxt }}
                >
                  {language === "ko"
                    ? "다크 모드"
                    : language === "en"
                      ? "Dark Mode"
                      : "ダークモード"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <SunIcon color="#18A022" />
                  <Switch
                    checked={isDark}
                    onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
                    className="data-[state=checked]:bg-[#00A200]"
                  />
                  <MoonIcon color="#18A022" />
                </div>
              </div>

              {/* 언어 선택 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{ fontSize: 14, fontWeight: 500, color: logoutTxt }}
                >
                  {language === "ko"
                    ? "언어"
                    : language === "en"
                      ? "Language"
                      : "言語"}
                </span>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["ko", "en", "ja"] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => changeLanguage(lang)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 20,
                        border: "none",
                        fontWeight: 600,
                        fontSize: 12,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        background: language === lang ? "#18A022" : logoutBg,
                        color: language === lang ? "#fff" : logoutTxt,
                      }}
                    >
                      {lang === "ko" ? "한" : lang === "en" ? "EN" : "日"}
                    </button>
                  ))}
                </div>
              </div>

              <LineLoginButton />

              <button
                onClick={handleLogout}
                style={{
                  width: "100%",
                  padding: "13px 0",
                  borderRadius: 14,
                  border: "none",
                  background: logoutBg,
                  color: logoutTxt,
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) =>
                  (e.currentTarget.style.background = logoutHov)
                }
                onMouseOut={(e) =>
                  (e.currentTarget.style.background = logoutBg)
                }
              >
                <LogOut style={{ width: 16, height: 16, color: "#e03434" }} />
                로그아웃
              </button>
              <div className="text-center pt-1">
                <button
                  onClick={handleDeleteAccount}
                  className="text-xs underline transition-colors hover:text-red-500"
                  style={{ color: textSub }}
                >
                  회원 탈퇴하기
                </button>
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
