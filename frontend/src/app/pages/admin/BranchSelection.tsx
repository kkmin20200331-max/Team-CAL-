import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { Clock, MapPin, LayoutGrid } from 'lucide-react';

const STORE_SVG = (
  <svg width="22" height="22" viewBox="1004 49 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M1007.23 49.4509H1030.31L1033.35 57.7411V60.3872C1033.35 61.6049 1032.89 62.7307 1032.14 63.5736V77.3991H1005.4V63.5736C1004.64 62.7307 1004.19 61.6049 1004.19 60.3872V57.7411L1007.23 49.4509ZM1028.79 65.0742C1029.11 65.0742 1029.41 65.0421 1029.7 64.9812V74.9688H1023.63V67.678H1013.91V74.9688H1007.83V64.9812C1008.13 65.0421 1008.43 65.0742 1008.74 65.0742C1010.08 65.0742 1011.26 64.4917 1012.09 63.5736C1012.91 64.4917 1014.09 65.0742 1015.43 65.0742C1016.76 65.0742 1017.94 64.4917 1018.77 63.5736C1019.59 64.4917 1020.78 65.0742 1022.11 65.0742C1023.44 65.0742 1024.63 64.4917 1025.45 63.5736C1026.28 64.4917 1027.46 65.0742 1028.79 65.0742ZM1016.34 74.9688H1021.2V70.1082H1016.34V74.9688ZM1030.92 59.172V60.3872C1030.92 61.6776 1029.92 62.6439 1028.79 62.6439C1027.66 62.6439 1026.67 61.6776 1026.67 60.3872V59.172H1030.92ZM1030.4 56.7417L1028.61 51.8812H1008.92L1007.14 56.7417H1030.4ZM1006.62 59.172V60.3872C1006.62 61.6776 1007.61 62.6439 1008.74 62.6439C1009.87 62.6439 1010.87 61.6776 1010.87 60.3872V59.172H1006.62ZM1013.3 59.172V60.3872C1013.3 61.6776 1014.3 62.6439 1015.43 62.6439C1016.56 62.6439 1017.55 61.6776 1017.55 60.3872V59.172H1013.3ZM1019.98 59.172V60.3872C1019.98 61.6776 1020.98 62.6439 1022.11 62.6439C1023.24 62.6439 1024.24 61.6776 1024.24 60.3872V59.172H1019.98Z" fill="#18A022"/>
  </svg>
);
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
          <p style={{ fontSize: 20, color: 'rgba(255,255,255,0.85)', marginTop: 6 }}>{t.subtitle}</p>
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
                  {STORE_SVG}
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
                    background: GREEN,
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
