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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/ready-for-assembly', label: 'Ready For Assembly', icon: Package },
  { path: '/assembly', label: 'Door Assembly', icon: Wrench },
  { path: '/fips', label: 'FIPS Tracking', icon: FileText },
  { path: '/quality-check', label: 'Quality Check', icon: CheckCircle },
  { path: '/storage/bh', label: 'BH Storage', icon: Warehouse },
  { path: '/storage', label: 'Storage Management', icon: Boxes },
  { path: '/deliveries', label: 'Delivery / Collection', icon: Truck },
  { path: '/sites', label: 'Site Management', icon: MapPin },
  { path: '/returns', label: 'Returns', icon: RotateCcw },
  { path: '/movements', label: 'Movement History', icon: History },
  { path: '/reports', label: 'Reports', icon: BarChart3 },
];

export function Sidebar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="p-4 border-b">
        <h1 className="text-lg font-bold text-primary">AssemblyFlow ERP</h1>
        <p className="text-xs text-muted-foreground">Manufacturing • Storage • Delivery • Tracking</p>
      </div>
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t space-y-2">
        <div className="px-3 text-sm text-muted-foreground truncate">{user?.name}</div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={logout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar border-r transition-transform lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
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
      <main className="lg:pl-64">
        <div className="p-4 pt-16 lg:pt-6 lg:p-6 max-w-[1600px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
