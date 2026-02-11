'use client';

import { useRouter } from 'next/navigation';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function Header({ title, showBack, rightAction }: HeaderProps) {
  const router = useRouter();

  return (
    <header className="page-header">
      <div className="page-header-left">
        {showBack && (
          <button
            className="page-header-back"
            onClick={() => router.back()}
            aria-label="Go back"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
      </div>
      <h1 className="page-header-title">{title}</h1>
      <div className="page-header-right">
        {rightAction || null}
      </div>
    </header>
  );
}
