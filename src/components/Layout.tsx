import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Bell, BarChart3, Settings, Shield, Search, User, ChevronLeft, ChevronRight, Menu, X } from 'lucide-react';
import { alerts } from '@/data/mockData';

const navItems = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Agency Directory', path: '/agencies', icon: Building2 },
  { label: 'Alerts', path: '/alerts', icon: Bell, badge: true },
  { label: 'Analytics', path: '/analytics', icon: BarChart3 },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unackAlerts = alerts.filter(a => !a.acknowledged).length;

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const pageTitle = (() => {
    if (location.pathname === '/') return 'Command Center';
    if (location.pathname === '/agencies') return 'Agency Directory';
    if (location.pathname.startsWith('/agency/')) return 'Agency Profile';
    if (location.pathname === '/alerts') return 'Alerts Center';
    if (location.pathname === '/analytics') return 'Analytics';
    if (location.pathname === '/settings') return 'Settings';
    return 'RiskSense AI';
  })();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 border-b border-border">
        <Shield className="w-7 h-7 text-primary flex-shrink-0" />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-heading text-base text-foreground tracking-wider">RISKSENSE</span>
            <span className="text-[10px] text-primary font-mono tracking-widest">AI PLATFORM</span>
          </div>
        )}
        {/* Mobile close button */}
        <button onClick={() => setMobileOpen(false)} className="ml-auto md:hidden text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {navItems.map(item => {
          const active = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors relative ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span className="font-medium">{item.label}</span>}
              {item.badge && unackAlerts > 0 && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {unackAlerts}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-border px-3 py-3 space-y-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-band-clear pulse-live" />
          {!collapsed && <span className="text-xs text-muted-foreground">API: Live</span>}
        </div>
        {!collapsed && <p className="text-[10px] text-muted-foreground">Last sync: 2 min ago</p>}
        <button onClick={() => setCollapsed(!collapsed)} className="w-full hidden md:flex items-center justify-center py-1 text-muted-foreground hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-background/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-sidebar transition-all duration-200 ${collapsed ? 'w-16' : 'w-56'}`}>
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile drawer */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar border-r border-border transform transition-transform duration-200 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card flex-shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="font-heading text-base md:text-lg tracking-wider text-foreground">{pageTitle}</h1>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <div className="relative">
              {searchOpen ? (
                <input
                  autoFocus
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onBlur={() => { setSearchOpen(false); setSearchQuery(''); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      navigate(`/agencies?search=${encodeURIComponent(searchQuery)}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }
                  }}
                  placeholder="Search agencies..."
                  className="bg-secondary border border-border rounded-md px-3 py-1.5 text-sm text-foreground w-40 md:w-56 focus:outline-none focus:ring-1 focus:ring-primary"
                />
              ) : (
                <button onClick={() => setSearchOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Search className="w-[18px] h-[18px]" />
                </button>
              )}
            </div>
            <button onClick={() => navigate('/alerts')} className="relative text-muted-foreground hover:text-foreground transition-colors">
              <Bell className="w-[18px] h-[18px]" />
              {unackAlerts > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unackAlerts}</span>
              )}
            </button>
            <div className="flex items-center gap-2 pl-2 border-l border-border">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden md:flex flex-col">
                <span className="text-xs text-foreground font-medium">Admin</span>
                <span className="text-[10px] text-muted-foreground">Risk Officer</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
