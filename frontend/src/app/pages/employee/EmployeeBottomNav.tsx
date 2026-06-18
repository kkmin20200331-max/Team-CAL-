import { useNavigate, useLocation } from 'react-router';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { useTheme } from 'next-themes';
import {
  HomeNavIcon, CalendarNavIcon, QrNavIcon, PayrollNavIcon, BoardNavIcon,
} from './figma/FigmaIcons';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';

const NAV_ITEMS = [
  { path: '/employee/home',      NavIcon: HomeNavIcon },
  { path: '/employee/schedule',  NavIcon: CalendarNavIcon },
  { path: '/employee/checkin',   NavIcon: QrNavIcon },
  { path: '/employee/payroll',   NavIcon: PayrollNavIcon },
  { path: '/employee/board',     NavIcon: BoardNavIcon },
];

export default function EmployeeBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const language = useLanguage();
  const t = translations.employeeHome[language];
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const labels = [t.home, t.schedule, t.checkin, t.payrollNav, t.boardNav];

  const navBg = isDark ? '#1c1c1e' : '#fff';
  const inactiveColor = isDark ? '#4cd964' : GREEN;
  const activeBg = isDark ? '#07790F' : DARK_GREEN;

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 114, background: navBg,
      display: 'flex',
      boxShadow: isDark ? '0 -2px 8px rgba(0,0,0,0.4)' : '0 -2px 8px rgba(0,0,0,0.06)',
      zIndex: 40,
    }}>
      {NAV_ITEMS.map(({ path, NavIcon }, i) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            style={{
              flex: 1, border: 'none', cursor: 'pointer',
              background: active ? activeBg : navBg,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end',
              paddingBottom: 18, gap: 5,
            }}
          >
            <NavIcon size={28} color={active ? '#fff' : inactiveColor} />
            <span style={{ fontSize: 18, fontWeight: 600, color: active ? '#fff' : inactiveColor }}>
              {labels[i]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
