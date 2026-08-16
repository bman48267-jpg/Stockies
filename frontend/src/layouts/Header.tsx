import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart2,
  TrendingUp,
  Briefcase,
  Search,
  Sun,
  Moon,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { getMarketStatusLabel } from '@/utils/format';
import { cn } from '@/utils/cn';
import { APP_NAME } from '@/constants';
import { useAuth } from '@/context/AuthContext';


const navItems = [
  { to: '/stocks', label: 'Stocks', icon: TrendingUp },
  { to: '/mutual-funds', label: 'Mutual Funds', icon: BarChart2 },
  { to: '/portfolio', label: 'Portfolio', icon: Briefcase },
];

interface HeaderProps {
  onMenuToggle: () => void;
  mobileMenuOpen: boolean;
}

export function Header({ onMenuToggle, mobileMenuOpen }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const marketStatus = getMarketStatusLabel();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (searchValue.trim()) {
        navigate(`/stocks?q=${encodeURIComponent(searchValue.trim())}`);
        setSearchOpen(false);
        setSearchValue('');
      }
    },
    [searchValue, navigate]
  );

  return (
    <header
      className="sticky top-0 z-50 flex items-center gap-4 px-4 md:px-6"
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuToggle}
        className="md:hidden p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Logo */}
      <Link
        to="/"
        className="flex items-center gap-2 shrink-0 hover:opacity-80 transition-opacity"
      >
        <div
          className="flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm"
          style={{
            background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
            color: '#fff',
          }}
        >
          S
        </div>
        <span
          className="font-bold text-base hidden sm:block"
          style={{ color: 'var(--text-primary)' }}
        >
          {APP_NAME}
        </span>
      </Link>

      {/* Desktop Navigation */}
      <nav className="hidden md:flex items-center gap-1 ml-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                isActive
                  ? 'text-accent'
                  : 'hover:bg-muted'
              )
            }
            style={({ isActive }) => ({
              color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--accent-subtle)' : '',
            })}
          >
            <Icon size={15} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Market Status */}
      <div
        className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
        style={{
          backgroundColor: 'var(--bg-muted)',
          color: 'var(--text-secondary)',
        }}
      >
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse-dot"
          style={{ backgroundColor: marketStatus.isOpen ? 'var(--positive)' : 'var(--negative)' }}
        />
        <span style={{ color: marketStatus.isOpen ? 'var(--positive)' : 'var(--text-secondary)' }}>
          {marketStatus.label}
        </span>
      </div>

      {/* Search */}
      <div className="relative">
        {searchOpen ? (
          <form onSubmit={handleSearchSubmit} className="flex items-center">
            <input
              autoFocus
              type="search"
              placeholder="Search stocks, funds..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onBlur={() => {
                if (!searchValue) setSearchOpen(false);
              }}
              className="w-48 md:w-64 px-3 py-1.5 text-sm rounded-lg outline-none"
              style={{
                backgroundColor: 'var(--bg-muted)',
                color: 'var(--text-primary)',
                border: '1px solid var(--accent)',
              }}
            />
          </form>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            className="p-2 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Search"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* User profile dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setUserDropdownOpen(!userDropdownOpen)}
          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all transform hover:scale-105 active:scale-95"
          style={{
            background: 'linear-gradient(135deg, var(--accent), #a855f7)',
            color: '#fff',
          }}
          title={user?.name || 'My Account'}
        >
          {(user?.name || 'U').charAt(0).toUpperCase()}
        </button>

        {userDropdownOpen && (
          <div
            className="absolute right-0 mt-2 w-48 rounded-xl shadow-lg py-2 border animate-fade-in z-50 text-xs"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border)',
            }}
          >
            <div className="px-4 py-2 border-b border-token mb-1">
              <p className="font-bold truncate text-primary">
                {user?.name || 'User'}
              </p>
              <p className="text-[10px] truncate text-muted">
                {user?.email || 'user@stockies.com'}
              </p>
            </div>
            
            <button
              onClick={() => {
                logout();
                setUserDropdownOpen(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-muted flex items-center gap-2 font-semibold text-rose-400 hover:text-rose-500 transition-colors bg-transparent border-0 cursor-pointer"
            >
              <LogOut size={13} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

// Mobile Slide-out Navigation
interface MobileNavProps {
  open: boolean;
  onClose: () => void;
}

export function MobileNav({ open, onClose }: MobileNavProps) {
  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className="fixed top-0 left-0 bottom-0 z-50 w-64 md:hidden flex flex-col"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRight: '1px solid var(--border)',
          paddingTop: 'var(--header-height)',
        }}
      >
        <nav className="flex flex-col gap-1 p-4">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all',
                  isActive ? '' : 'hover:bg-muted'
                )
              }
              style={({ isActive }) => ({
                color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--accent-subtle)' : '',
              })}
            >
              <Icon size={18} strokeWidth={2} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
