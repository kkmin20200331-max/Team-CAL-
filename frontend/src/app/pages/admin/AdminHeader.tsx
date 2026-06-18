import ProfilePanel from './ProfilePanel';
import { useLanguage } from '../../i18n/useLanguage';
import { useNavigate } from 'react-router';
import { useTheme } from 'next-themes';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const LIGHT_GREEN = '#80D180';

const logoMap: Record<string, string> = {
  ko: '/logo_ko_long.png',
  en: '/logo_en_long.png',
  ja: '/logo_ja_long.png',
};

const STORE_SVG = (
  <svg width="25" height="26" viewBox="1004 49 30 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M1007.23 49.4509H1030.31L1033.35 57.7411V60.3872C1033.35 61.6049 1032.89 62.7307 1032.14 63.5736V77.3991H1005.4V63.5736C1004.64 62.7307 1004.19 61.6049 1004.19 60.3872V57.7411L1007.23 49.4509ZM1028.79 65.0742C1029.11 65.0742 1029.41 65.0421 1029.7 64.9812V74.9688H1023.63V67.678H1013.91V74.9688H1007.83V64.9812C1008.13 65.0421 1008.43 65.0742 1008.74 65.0742C1010.08 65.0742 1011.26 64.4917 1012.09 63.5736C1012.91 64.4917 1014.09 65.0742 1015.43 65.0742C1016.76 65.0742 1017.94 64.4917 1018.77 63.5736C1019.59 64.4917 1020.78 65.0742 1022.11 65.0742C1023.44 65.0742 1024.63 64.4917 1025.45 63.5736C1026.28 64.4917 1027.46 65.0742 1028.79 65.0742ZM1016.34 74.9688H1021.2V70.1082H1016.34V74.9688ZM1030.92 59.172V60.3872C1030.92 61.6776 1029.92 62.6439 1028.79 62.6439C1027.66 62.6439 1026.67 61.6776 1026.67 60.3872V59.172H1030.92ZM1030.4 56.7417L1028.61 51.8812H1008.92L1007.14 56.7417H1030.4ZM1006.62 59.172V60.3872C1006.62 61.6776 1007.61 62.6439 1008.74 62.6439C1009.87 62.6439 1010.87 61.6776 1010.87 60.3872V59.172H1006.62ZM1013.3 59.172V60.3872C1013.3 61.6776 1014.3 62.6439 1015.43 62.6439C1016.56 62.6439 1017.55 61.6776 1017.55 60.3872V59.172H1013.3ZM1019.98 59.172V60.3872C1019.98 61.6776 1020.98 62.6439 1022.11 62.6439C1023.24 62.6439 1024.24 61.6776 1024.24 60.3872V59.172H1019.98Z" fill="white"/>
  </svg>
);

interface Props {
  children?: React.ReactNode;
}

export default function AdminHeader({ children }: Props) {
  const language = useLanguage();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const storeName = sessionStorage.getItem('store_name') || '';

  const headerBg = isDark ? '#2c2c2e' : '#fff';
  const nameColor = isDark ? '#4cd964' : DARK_GREEN;
  const shadow = isDark ? '0 1px 0 rgba(255,255,255,0.06)' : '0 1px 0 rgba(0,162,0,0.12)';

  return (
    <header style={{
      background: headerBg, position: 'sticky', top: 0, zIndex: 100,
      boxShadow: shadow,
    }}>
      <div style={{
        height: 120, display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 40px',
      }}>
        <img
          src={logoMap[language]} alt="logo"
          style={{ height: 60, width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
          onClick={() => navigate('/admin/branch-selection')}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          {storeName && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              height: 48, flexShrink: 0, width: 320, padding: '0 24px',
              background: `linear-gradient(to right, ${LIGHT_GREEN} 0%, ${LIGHT_GREEN} 10%, ${GREEN} 30%, ${DARK_GREEN} 100%)`,
              borderRadius: 999,
            }}>
              {STORE_SVG}
              <span style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>{storeName}</span>
            </div>
          )}

          <div style={{ textAlign: 'right', marginRight: -20 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: nameColor }}>{currentUser?.name ?? ''}</div>
            <div style={{ fontSize: 15, fontWeight: 300, color: nameColor }}>{currentUser?.role ?? ''}</div>
          </div>

          <ProfilePanel />
        </div>
      </div>

      {children && (
        <div style={{
          background: `linear-gradient(to right, ${GREEN}, ${DARK_GREEN})`,
          padding: '36px 40px 48px',
          color: '#fff',
        }}>
          {children}
        </div>
      )}
    </header>
  );
}
