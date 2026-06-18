import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { Store, Clock, MapPin, LayoutGrid } from 'lucide-react';
import AdminHeader from './AdminHeader';
import { useTheme } from 'next-themes';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

const API = axios.create({ baseURL: "http://localhost:8080/api" });

interface StoreVo {
  id: string;
  name: string;
  address: string;
  capacity: number;
  open_time: string;
  close_time: string;
}

interface PendingEmployee {
  id: string;
  name: string;
  phone: string;
  username: string;
  store_id: string;
  store_name: string;
}

export default function BranchSelection() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.branchSelection[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [stores, setStores] = useState<StoreVo[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);

  // 페이지 로드 시 매장 목록 + 가입 대기 직원 sessionStorage에 적재
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const user = JSON.parse(sessionStorage.getItem("user") || "{}");
        const res = await API.get("/store", { params: { user_id: user.id } });
        const storeList: StoreVo[] = Array.isArray(res.data) ? res.data : [];
        setStores(storeList);

        // 각 매장의 가입 대기 직원 조회 → sessionStorage 저장 (ProfilePanel이 읽어감)
        const pending: PendingEmployee[] = [];
        for (const store of storeList) {
          try {
            const guestRes = await API.get("/users/guest", {
              params: { store_id: store.id, role: "ADMIN" },
            });
            const guests = Array.isArray(guestRes.data) ? guestRes.data : [];
            guests.forEach((g: any) => {
              pending.push({
                id: g.id,
                name: g.name,
                phone: g.phone,
                username: g.username,
                store_id: store.id,
                store_name: store.name,
              });
            });
          } catch {}
        }
        sessionStorage.setItem("pendingList", JSON.stringify(pending));
      } catch (err) {
        console.error("매장 조회 실패:", err);
      } finally {
        setStoresLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSelectStore = (store: StoreVo) => {
    sessionStorage.setItem("store_id", store.id);
    sessionStorage.setItem("store_name", store.name);
    navigate(`/admin/dashboard/${store.id}`);
  };

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const cardBg = isDark ? '#2c2c2e' : 'rgba(255,255,255,0.5)';
  const textColor = isDark ? '#fff' : '#111';
  const subTextColor = isDark ? '#aaa' : '#555';

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB' }}>{t.title}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t.subtitle}</p>
        </div>
      </AdminHeader>

      {/* Store Cards */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px' }}>
        <button
          onClick={() => navigate("/admin/multibranch")}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            width: '100%', marginBottom: 24, padding: '14px 0',
            background: isDark ? '#3a3a3c' : LIGHT_GREEN,
            border: `1px solid ${BORDER_GREEN}`, borderRadius: 54,
            color: DARK_GREEN, fontSize: 16, fontWeight: 600, cursor: 'pointer',
          }}
        >
          <LayoutGrid size={18} />
          {t.viewAllBranches}
        </button>

        {storesLoading ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: subTextColor, fontSize: 16 }}>{t.loading}</div>
        ) : stores.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', color: subTextColor, fontSize: 16 }}>{t.noStores}</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
            {stores.map((store) => (
              <div
                key={store.id}
                onClick={() => handleSelectStore(store)}
                style={{
                  background: cardBg, border: `1px solid ${BORDER_GREEN}`, borderRadius: 26,
                  boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)', padding: '24px',
                  cursor: 'pointer', transition: 'box-shadow 0.2s',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <Store size={20} color={GREEN} />
                  <span style={{ fontSize: 20, fontWeight: 700, color: textColor }}>{store.name}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: subTextColor, fontSize: 14, marginBottom: 6 }}>
                  <MapPin size={13} />
                  <span>{store.address}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: subTextColor, fontSize: 14, marginBottom: 20 }}>
                  <Clock size={13} />
                  <span>{t.operatingHours(store.open_time, store.close_time)}</span>
                </div>
                <button
                  style={{
                    width: '100%', padding: '12px 0',
                    background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`,
                    border: 'none', borderRadius: 54, color: '#fff',
                    fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectStore(store);
                  }}
                >
                  {t.viewDetails}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
