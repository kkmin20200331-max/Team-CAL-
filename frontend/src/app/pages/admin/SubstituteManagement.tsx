import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Search,
  Phone,
  CheckCircle,
  AlertCircle,
  Calendar,
  Plus,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import ProfilePanel from './ProfilePanel';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';

const API = axios.create({ baseURL: "http://localhost:8080/api" });

/* ─── 타입 ─────────────────────────────────────────── */
interface UserVo {
  id: string;
  username: string;
  name: string;
  phone: string;
  role: string;
  status: string;
}

interface StoreVo {
  id: string;
  name: string;
}

interface SubstitutePostVO {
  id: string;
  shift_id: string;
  store_id: string;
  requester_user_id: string;
  reason: string;
  status: string;
  created_at: string;
  closed_at: string;
}

interface ShiftVO {
  id: string;
  store_id: string;
  user_id: string;
  work_date: string;
  start_at: string;
  end_at: string;
  status: string;
}

/* ─── 유틸 ─────────────────────────────────────────── */
const toDateStr = (d: Date) => d.toISOString().slice(0, 10);

const formatDate = (s: string) => {
  if (!s) return "-";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s.slice(0, 10);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate(),
  ).padStart(2, "0")}`;
};

/* ─── 컴포넌트 ──────────────────────────────────────── */
const SubstituteManagement: React.FC = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const language = useLanguage();
  const t = translations.substituteManagement[language];

  const user = useMemo(() => {
    try {
      return JSON.parse(sessionStorage.getItem("user") || "{}");
    } catch {
      return {};
    }
  }, []);

  const [searchTerm, setSearchTerm] = useState("");

  /* 직원 목록 + 최근 근무일 */
  const [employees, setEmployees] = useState<UserVo[]>([]);
  const [lastWorkedByUser, setLastWorkedByUser] = useState<
    Record<string, string>
  >({});
  const [loadingStaff, setLoadingStaff] = useState(true);

  /* 대타 요청하기 모달 */
  const [stores, setStores] = useState<StoreVo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalStoreId, setModalStoreId] = useState(branchId ?? "");
  const [modalDate, setModalDate] = useState(toDateStr(new Date()));
  const [modalCount, setModalCount] = useState(1);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  /* ── 현재 지점 직원 + 최근 근무일 로드 ─────────────── */
  useEffect(() => {
    if (!branchId) return;

    const today = new Date();
    const past90 = new Date(today);
    past90.setDate(today.getDate() - 90);

    Promise.all([
      API.get("/users", { params: { store_id: branchId } }),
      API.get("/shift", {
        params: {
          store_id: branchId,
          start_date: toDateStr(past90),
          end_date: toDateStr(today),
        },
      }),
    ])
      .then(([usersRes, shiftsRes]) => {
        setEmployees(Array.isArray(usersRes.data) ? usersRes.data : []);

        const shifts: ShiftVO[] = Array.isArray(shiftsRes.data)
          ? shiftsRes.data
          : [];
        const lastWorked: Record<string, string> = {};
        shifts.forEach((s) => {
          if (s.status !== "VACANT" && s.status !== "CANCELLED" && s.user_id) {
            if (!lastWorked[s.user_id] || s.work_date > lastWorked[s.user_id]) {
              lastWorked[s.user_id] = s.work_date;
            }
          }
        });
        setLastWorkedByUser(lastWorked);
      })
      .catch(() => {})
      .finally(() => setLoadingStaff(false));
  }, [branchId]);

  /* ── admin 관리 지점 목록 (모달 지점 선택용) ───────── */
  useEffect(() => {
    if (!user.id) return;
    API.get("/store", { params: { user_id: user.id } })
      .then((res) => setStores(Array.isArray(res.data) ? res.data : []))
      .catch(() => {});
  }, [user.id]);

  /* ── 모달 열기 ──────────────────────────────────────── */
  const openModal = () => {
    setModalStoreId(branchId ?? stores[0]?.id ?? "");
    setModalDate(toDateStr(new Date()));
    setModalCount(1);
    setIsModalOpen(true);
  };

  /* ── 대타 요청 생성 ──────────────────────────────────── */
  const handleCreatePost = () => {
    setModalSubmitting(true);

    // TODO: 인원수 전용 DB 컬럼 추가 시 reason 대신 별도 필드로 교체
    const payload: Partial<SubstitutePostVO> = {
      shift_id: "",
      store_id: modalStoreId,
      requester_user_id: user.id,
      reason: `인원 ${modalCount}명 필요`,
      status: "open",
    };

    API.post("/substitute/staff", payload)
      .then(() => setIsModalOpen(false))
      .catch(() => alert(t.errCreate))
      .finally(() => setModalSubmitting(false));
  };

  /* ── SMS 연락 ───────────────────────────────────────── */
  const handleContact = (phone: string, name: string) => {
    if (!phone) return;
    // TODO: SMS API 연동 시 이 부분을 교체
    const msg = encodeURIComponent(t.smsMessage(name));
    window.open(`sms:${phone}?body=${msg}`);
  };

  /* ── 필터 ───────────────────────────────────────────── */
  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone?.includes(searchTerm),
  );

  /* ── 상태 뱃지 ──────────────────────────────────────── */
  const getEmployeeStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE" || s === "APPROVED")
      return (
        <Badge className="bg-green-500 text-white flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />{t.statusActive}
        </Badge>
      );
    if (s === 'INACTIVE')
      return <Badge className="bg-gray-400 text-white">{t.statusInactive}</Badge>;
    return <Badge variant="outline" className="text-gray-500">{status}</Badge>;
  };

  /* ── 렌더링 ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/admin/dashboard/${branchId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.backToDashboard}
            </Button>
            <ProfilePanel />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t.title}</h1>
              <p className="text-gray-600 mt-1">{t.subtitle}</p>
            </div>
            <Button onClick={openModal}>
              <Plus className="w-4 h-4 mr-2" />
              {t.createRequest}
            </Button>
          </div>
        </div>

        {/* 통계 */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.currentBranchStaff}</p>
                  <p className="text-3xl font-bold text-gray-900">{employees.length}</p>
                </div>
                <UserPlus className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{t.noWorkToday}</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {employees.filter((e) => !lastWorkedByUser[e.id]).length}
                  </p>
                </div>
                <AlertCircle className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 검색 */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>
          </CardContent>
        </Card>

        {/* 직원 카드 목록 */}
        {loadingStaff ? (
          <div className="text-center py-16 text-gray-400">{t.loading}</div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            {searchTerm ? t.noSearchResult : t.noEmployees}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredEmployees.map((emp) => (
              <Card key={emp.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  {/* 프로필 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-blue-600 font-semibold text-lg">
                          {emp.name?.[0] ?? "?"}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg leading-tight">
                          {emp.name}
                        </h3>
                        <p className="text-sm text-gray-400">{emp.username}</p>
                      </div>
                    </div>
                    {getEmployeeStatusBadge(emp.status)}
                  </div>

                  {/* 연락처 · 최근 근무 */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{emp.phone || "-"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>
                        {t.recentWork}{' '}
                        {lastWorkedByUser[emp.id]
                          ? formatDate(lastWorkedByUser[emp.id])
                          : t.noRecord}
                      </span>
                    </div>
                  </div>

                  {/* 근무 가능 요일·시간 (DB 컬럼 추가 후 연동 예정) */}
                  <div className="mb-5">
                    <p className="text-xs font-medium text-gray-400 mb-2">
                      {t.availableSchedule}{' '}
                      <span className="text-gray-300">({t.settingPending})</span>
                    </p>
                    <div className="flex gap-1">
                      {t.dayLabels.map((day: string) => (
                        <div
                          key={day}
                          className="flex-1 text-center py-1 rounded text-sm bg-gray-100 text-gray-400"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 연락 버튼 */}
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled={!emp.phone}
                    onClick={() => handleContact(emp.phone, emp.name)}
                  >
                    <Phone className="w-4 h-4 mr-2" />
                    {t.contactBtn}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── 대타 요청하기 모달 ────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">{t.modalTitle}</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-5">
              {/* 지점 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.branchLabel}</label>
                <select
                  value={modalStoreId}
                  onChange={(e) => setModalStoreId(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 날짜 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.dateLabel}</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {/* 인원수 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t.staffCountLabel}</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setModalCount((c) => Math.max(1, c - 1))}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 text-gray-600 text-xl font-bold hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center"
                  >
                    −
                  </button>
                  <span className="text-2xl font-bold text-gray-900 w-16 text-center">
                    {t.count(modalCount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalCount((c) => Math.min(20, c + 1))}
                    className="w-10 h-10 rounded-full border-2 border-gray-300 text-gray-600 text-xl font-bold hover:border-blue-400 hover:text-blue-600 transition-colors flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)} disabled={modalSubmitting}>
                {t.cancelBtn}
              </Button>
              <Button className="flex-1" onClick={handleCreatePost} disabled={modalSubmitting}>
                {modalSubmitting ? t.requesting : t.requestBtn}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubstituteManagement;
