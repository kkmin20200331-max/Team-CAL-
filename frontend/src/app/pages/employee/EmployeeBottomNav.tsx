import { useNavigate, useLocation } from 'react-router';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
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

  const labels = [t.home, t.schedule, t.checkin, t.payrollNav, t.boardNav];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: 114, background: '#fff',
      display: 'flex',
      boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
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
              background: active ? DARK_GREEN : '#fff',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'flex-end',
              paddingBottom: 18, gap: 5,
            }}
          >
            <NavIcon size={28} color={active ? '#fff' : GREEN} />
            <span style={{ fontSize: 18, fontWeight: 600, color: active ? '#fff' : GREEN }}>
              {labels[i]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
