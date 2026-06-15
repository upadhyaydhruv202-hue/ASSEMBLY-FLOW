import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Wrench,
  FileText,
  CheckCircle,
  Warehouse,
  Truck,
  MapPin,
  RotateCcw,
  History,
  BarChart3,
  Menu,
  X,
  Sun,
  Moon,
  LogOut,
  Boxes,
  Factory,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useState, useEffect } from 'react';

const SIDEBAR_WIDTH = 'w-[260px]';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { path: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: 'Manufacturing',
    items: [
      { path: '/ready-for-assembly', label: 'Ready For Assembly', icon: Package },
      { path: '/assembly', label: 'Door Assembly', icon: Wrench },
      { path: '/fips', label: 'FIPS Tracking', icon: FileText },
      { path: '/quality-check', label: 'Quality Check', icon: CheckCircle },
    ],
  },
  {
    label: 'Storage & Logistics',
    items: [
      { path: '/storage/bh', label: 'BH Storage', icon: Warehouse },
      { path: '/storage', label: 'Storage Management', icon: Boxes },
      { path: '/deliveries', label: 'Delivery / Collection', icon: Truck },
      { path: '/sites', label: 'Site Management', icon: MapPin },
      { path: '/returns', label: 'Returns', icon: RotateCcw },
    ],
  },
  {
    label: 'Analytics',
    items: [
      { path: '/movements', label: 'Movement History', icon: History },
      { path: '/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
];

function isActive(path: string, pathname: string, exact?: boolean) {
  if (exact) return pathname === path;
  return pathname === path || (path !== '/' && pathname.startsWith(path));
}

export function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const NavContent = () => (
    <>
      <div className={cn('flex items-center gap-3 border-b border-sidebar-border px-5 py-5', SIDEBAR_WIDTH)}>
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Factory className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-[15px] font-bold tracking-tight text-foreground">AssemblyFlow</h1>
          <p className="truncate text-[11px] text-muted-foreground">Manufacturing ERP</p>
        </div>
      </div>

      <nav className={cn('flex-1 overflow-y-auto px-3 py-4', SIDEBAR_WIDTH)}>
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, location.pathname, 'exact' in item ? item.exact : undefined);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-all duration-150',
                      active
                        ? 'bg-primary/10 font-medium text-primary shadow-sm'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground',
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className={cn('border-t border-sidebar-border p-4', SIDEBAR_WIDTH)}>
        <div className="mb-3 flex items-center gap-3 rounded-lg bg-sidebar-accent px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{user?.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{user?.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 h-8" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 h-8" onClick={logout}>
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)] lg:hidden">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 shrink-0"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Factory className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold tracking-tight">AssemblyFlow</p>
            <p className="truncate text-[10px] text-muted-foreground">Manufacturing ERP</p>
          </div>
        </div>
      </header>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-sidebar-border bg-sidebar shadow-xl transition-transform duration-200 supports-[padding:env(safe-area-inset-top)]:pt-[env(safe-area-inset-top)] lg:translate-x-0 lg:shadow-none',
          SIDEBAR_WIDTH,
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <NavContent />
      </aside>
    </>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="lg:pl-[260px]">
        <div className="min-h-screen bg-muted/25 px-3 pb-6 pt-[calc(3.5rem+0.75rem)] sm:px-4 sm:pt-[calc(3.5rem+1rem)] md:px-6 lg:p-8 lg:pt-8 supports-[padding:env(safe-area-inset-bottom)]:pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
          <div className="mx-auto w-full max-w-[1600px]">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
