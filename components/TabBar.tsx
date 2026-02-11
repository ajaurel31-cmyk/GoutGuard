'use client';

import { usePathname, useRouter } from 'next/navigation';

const tabs = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/scan', label: 'Scan', icon: 'scan' },
  { path: '/foods', label: 'Foods', icon: 'search' },
  { path: '/uric-acid', label: 'Tracker', icon: 'chart' },
  { path: '/settings', label: 'Settings', icon: 'gear' },
];

function TabIcon({ name, active }: { name: string; active: boolean }) {
  const color = active ? '#1a56db' : '#94a3b8';

  switch (name) {
    case 'home':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z" />
          <polyline points="9 21 9 14 15 14 15 21" />
        </svg>
      );
    case 'scan':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7V2h5" />
          <path d="M17 2h5v5" />
          <path d="M22 17v5h-5" />
          <path d="M7 22H2v-5" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case 'search':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <line x1="16.5" y1="16.5" x2="21" y2="21" />
        </svg>
      );
    case 'chart':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="3 20 7 12 11 15 15 7 21 4" />
          <line x1="3" y1="20" x2="21" y2="20" />
        </svg>
      );
    case 'gear':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
        </svg>
      );
    default:
      return null;
  }
}

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => {
        const isActive = tab.path === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.path);

        return (
          <button
            key={tab.path}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => router.push(tab.path)}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="tab-icon">
              <TabIcon name={tab.icon} active={isActive} />
            </span>
            <span className="tab-label">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
