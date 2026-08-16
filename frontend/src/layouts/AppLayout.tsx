import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Header, MobileNav } from './Header';
import { DISCLAIMER } from '@/constants';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-dvh" style={{ backgroundColor: 'var(--bg-base)' }}>
      <Header
        onMenuToggle={() => setMobileMenuOpen((p) => !p)}
        mobileMenuOpen={mobileMenuOpen}
      />
      <MobileNav
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 w-full max-w-screen-2xl mx-auto px-4 md:px-6 py-6">
        <Outlet />
      </main>

      <footer
        className="text-center py-4 text-xs"
        style={{
          color: 'var(--text-muted)',
          borderTop: '1px solid var(--border)',
        }}
      >
        {DISCLAIMER}
      </footer>
    </div>
  );
}
