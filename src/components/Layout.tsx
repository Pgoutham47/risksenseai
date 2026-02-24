import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Building2, Bell, BarChart3, Settings, Shield, Search, User, ChevronLeft, ChevronRight, Menu, X, LogOut, Moon, Sun, Sliders, ClipboardList, FileText, ChevronRight as ChevronR, Command, Wifi, Clock, Rows3, Rows4 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { alerts, agencies } from '@/data/mockData';
import { useNotifications, useNotificationListener } from '@/hooks/useNotifications';
import NotificationDrawer from '@/components/NotificationDrawer';
import { toast } from '@/hooks/use-toast';

// Live clock hook
function useLiveClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return now;
}

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, description: 'Command Center overview' },
  { label: 'Agency Directory', path: '/agencies', icon: Building2, description: 'Browse and filter agencies' },
  { label: 'Alerts', path: '/alerts', icon: Bell, badge: true, description: 'Active alerts and escalations' },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, description: 'Charts and trend analysis' },
  { label: 'Simulator', path: '/simulator', icon: Sliders, description: 'Fraud scenario testing' },
  { label: 'Audit Log', path: '/audit-log', icon: ClipboardList, description: 'Decision history trail' },
  { label: 'Reports', path: '/reports', icon: FileText, description: 'Build and export reports' },
  { label: 'Settings', path: '/settings', icon: Settings, description: 'Platform configuration' },
];

// Page metadata
const pageMeta: Record<string, { title: string; description: string; breadcrumbs: { label: string; path?: string }[] }> = {
  '/dashboard': { title: 'Command Center', description: 'Real-time risk monitoring and KPI overview', breadcrumbs: [{ label: 'Dashboard' }] },
  '/agencies': { title: 'Agency Directory', description: 'Browse, filter, and manage agency portfolios', breadcrumbs: [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Agencies' }] },
  '/alerts': { title: 'Alerts Center', description: 'Active alerts, escalations, and acknowledgements', breadcrumbs: [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Alerts' }] },
  '/analytics': { title: 'Analytics', description: 'Portfolio trends, cohort analysis, and risk metrics', breadcrumbs: [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Analytics' }] },
  '/simulator': { title: 'Fraud Scenario Simulator', description: 'Test signal combinations and score impact', breadcrumbs: [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Simulator' }] },
  '/audit-log': { title: 'Audit Log', description: 'Chronological record of all system decisions', breadcrumbs: [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Audit Log' }] },
  '/reports': { title: 'Report Builder', description: 'Generate and export risk assessment reports', breadcrumbs: [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Reports' }] },
  '/settings': { title: 'Settings', description: 'Configure thresholds, notifications, and preferences', breadcrumbs: [{ label: 'Dashboard', path: '/dashboard' }, { label: 'Settings' }] },
};

// Command palette
const CommandPalette: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const allItems = [
    ...navItems.map(n => ({ type: 'page' as const, label: n.label, description: n.description, path: n.path, icon: n.icon })),
    ...agencies.slice(0, 8).map(a => ({ type: 'agency' as const, label: a.name, description: `${a.band} · Score ${a.trustScore}`, path: `/agency/${a.id}`, icon: Building2 })),
  ];

  const filtered = query
    ? allItems.filter(item => item.label.toLowerCase().includes(query.toLowerCase()) || item.description.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-[60]"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[15%] left-1/2 -translate-x-1/2 w-full max-w-lg z-[61]"
          >
            <div className="panel-glass border border-border shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  autoFocus
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') onClose();
                    if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0].path);
                  }}
                  placeholder="Search pages, agencies..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
                <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-secondary text-[10px] text-muted-foreground font-mono">ESC</kbd>
              </div>
              <div className="max-h-72 overflow-y-auto p-2">
                {filtered.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-6">No results found</p>
                )}
                {filtered.map((item, i) => (
                  <button
                    key={`${item.type}-${item.path}-${i}`}
                    onClick={() => handleSelect(item.path)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-secondary/60 transition-colors group"
                  >
                    <item.icon className="w-4 h-4 text-muted-foreground group-hover:text-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-foreground font-medium block truncate">{item.label}</span>
                      <span className="text-[11px] text-muted-foreground block truncate">{item.description}</span>
                    </div>
                    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{item.type}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'compact'>(() => {
    return (localStorage.getItem('ui-density') as any) || 'comfortable';
  });
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const clock = useLiveClock();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.classList.toggle('density-compact', density === 'compact');
    localStorage.setItem('ui-density', density);
  }, [density]);

  // ⌘K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(o => !o);
      }
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const dd = document.getElementById('profile-dropdown');
      if (dd && !dd.classList.contains('hidden') && !(e.target as HTMLElement)?.closest('.relative.group')) {
        dd.classList.add('hidden');
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const { unreadCount } = useNotifications();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useNotificationListener((n) => {
    const variant = n.severity === 'CRITICAL' ? 'destructive' : 'default';
    toast({ title: n.title, description: n.message, variant });
  });

  const unackAlerts = alerts.filter(a => !a.acknowledged).length;

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Resolve page metadata
  const currentMeta = (() => {
    if (location.pathname.startsWith('/agency/')) {
      const id = location.pathname.split('/agency/')[1];
      const agency = agencies.find(a => a.id === id);
      return {
        title: agency?.name || 'Agency Profile',
        description: agency ? `${agency.band} · Score ${agency.trustScore} · ${agency.cohort}` : 'Agency details and risk profile',
        breadcrumbs: [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Agencies', path: '/agencies' },
          { label: agency?.name || id },
        ],
      };
    }
    return pageMeta[location.pathname] || { title: 'RiskSense AI', description: '', breadcrumbs: [] };
  })();

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center shadow-sm">
          <Shield className="w-5 h-5 text-sidebar-primary" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-heading text-sm text-sidebar-primary tracking-wider">RiskSense</span>
            <span className="text-[9px] text-gold-soft font-mono tracking-widest">AI PLATFORM</span>
          </div>
        )}
        <button onClick={() => setMobileOpen(false)} className="ml-auto md:hidden text-sidebar-foreground hover:text-sidebar-primary">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {navItems.map(item => {
          const active = item.path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(item.path);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-200 relative group ${
                active
                  ? 'bg-sidebar-accent text-sidebar-primary font-semibold shadow-sm border-l-2 border-gold/60'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground border-l-2 border-transparent'
              }`}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
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
      <div className="border-t border-sidebar-border px-3 py-3 space-y-2">
        <div className="flex items-center gap-2 px-1">
          <span className="w-2 h-2 rounded-full bg-band-clear pulse-live" />
          {!collapsed && <span className="text-xs text-sidebar-foreground">API: Live</span>}
        </div>
        {!collapsed && <p className="text-[10px] text-sidebar-foreground/50 px-1">Last sync: 2 min ago</p>}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-colors"
        >
          <div className="flex items-center gap-2">
            {darkMode ? <Moon className="w-4 h-4 flex-shrink-0" /> : <Sun className="w-4 h-4 flex-shrink-0" />}
            {!collapsed && <span>{darkMode ? 'Dark' : 'Light'}</span>}
          </div>
          {!collapsed && (
            <div className={`w-9 h-[20px] rounded-full transition-colors relative ${darkMode ? 'bg-primary' : 'bg-muted'}`}>
              <span className={`absolute top-[3px] w-[14px] h-[14px] rounded-full transition-transform shadow-sm ${darkMode ? 'left-[19px] bg-primary-foreground' : 'left-[3px] bg-muted-foreground'}`} />
            </div>
          )}
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="w-full hidden md:flex items-center justify-center py-1 text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Subtle background texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015] dark:opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 0.5px, transparent 0)', backgroundSize: '24px 24px' }}
      />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar — desktop */}
      <aside className={`hidden md:flex flex-col bg-sidebar transition-all duration-200 z-10 ${collapsed ? 'w-16' : 'w-60'}`}>
        {sidebarContent}
      </aside>

      {/* Sidebar — mobile */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-sidebar shadow-2xl transform transition-transform duration-200 md:hidden ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebarContent}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* Header */}
        <header className="border-b border-border flex flex-col bg-card flex-shrink-0 shadow-sm">
          {/* Top bar */}
          <div className="h-14 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-3">
              <button onClick={() => setMobileOpen(true)} className="md:hidden text-muted-foreground hover:text-foreground active:scale-95 transition-transform">
                <Menu className="w-5 h-5" />
              </button>
              <div>
                <h1 className="font-heading text-base md:text-lg tracking-wider text-foreground leading-tight">{currentMeta.title}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              {/* Command palette trigger */}
              <button
                onClick={() => setCmdOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/60 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all text-xs"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search...</span>
                <kbd className="ml-2 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono">⌘K</kbd>
              </button>

              <div className="relative sm:hidden">
                {searchOpen ? (
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onBlur={() => { setSearchOpen(false); setSearchQuery(''); }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && searchQuery.trim()) {
                        navigate(`/agencies?search=${encodeURIComponent(searchQuery)}`);
                        setSearchOpen(false); setSearchQuery('');
                      }
                    }}
                    placeholder="Search agencies..."
                    className="bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground w-40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                  />
                ) : (
                  <button onClick={() => setSearchOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors active:scale-95">
                    <Search className="w-[18px] h-[18px]" />
                  </button>
                )}
              </div>

              {/* Density toggle */}
              <button
                onClick={() => setDensity(d => d === 'comfortable' ? 'compact' : 'comfortable')}
                className="hidden md:flex text-muted-foreground hover:text-foreground transition-colors active:scale-95"
                title={density === 'comfortable' ? 'Switch to compact' : 'Switch to comfortable'}
              >
                {density === 'comfortable' ? <Rows4 className="w-[18px] h-[18px]" /> : <Rows3 className="w-[18px] h-[18px]" />}
              </button>

              <button onClick={() => setDrawerOpen(true)} className="relative text-muted-foreground hover:text-foreground transition-colors active:scale-95">
                <Bell className="w-[18px] h-[18px]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>

              {/* Clock + user */}
              <div className="hidden md:flex items-center gap-2 pl-3 border-l border-border">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                  {clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                </span>
              </div>

              <div className="relative group">
                <button
                  className="flex items-center gap-2 pl-3 border-l border-border hover:opacity-80 transition-opacity"
                  onClick={() => {
                    const el = document.getElementById('profile-dropdown');
                    if (el) el.classList.toggle('hidden');
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-sm">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="hidden md:flex flex-col text-left">
                    <span className="text-xs text-foreground font-medium">Admin</span>
                    <span className="text-[10px] text-muted-foreground">Risk Officer</span>
                  </div>
                </button>
                <div id="profile-dropdown" className="hidden absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-4 border-b border-border bg-secondary/30">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Admin User</p>
                        <p className="text-[11px] text-muted-foreground">Risk Officer · Level 3</p>
                        <p className="text-[10px] text-muted-foreground font-mono">admin@risksense.ai</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={() => { navigate('/settings'); document.getElementById('profile-dropdown')?.classList.add('hidden'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <Settings className="w-4 h-4 text-muted-foreground" />
                      Settings & Preferences
                    </button>
                    <button
                      onClick={() => { navigate('/audit-log'); document.getElementById('profile-dropdown')?.classList.add('hidden'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-foreground hover:bg-secondary/60 transition-colors"
                    >
                      <ClipboardList className="w-4 h-4 text-muted-foreground" />
                      My Activity Log
                    </button>
                  </div>
                  <div className="border-t border-border p-2">
                    <button
                      onClick={() => { navigate('/'); document.getElementById('profile-dropdown')?.classList.add('hidden'); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Breadcrumb + description bar */}
          {currentMeta.breadcrumbs.length > 0 && (
            <div className="px-4 md:px-6 pb-2.5 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-[11px]">
                {currentMeta.breadcrumbs.map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <ChevronR className="w-3 h-3 text-muted-foreground/50" />}
                    {crumb.path ? (
                      <button
                        onClick={() => navigate(crumb.path!)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {crumb.label}
                      </button>
                    ) : (
                      <span className="text-foreground font-medium">{crumb.label}</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              {currentMeta.description && (
                <span className="hidden lg:block text-[10px] text-muted-foreground">{currentMeta.description}</span>
              )}
            </div>
          )}
        </header>

        {/* Page content with route transition */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Status footer */}
        <footer className="hidden md:flex h-7 border-t border-border bg-card/80 backdrop-blur-sm items-center justify-between px-4 md:px-6 text-[10px] text-muted-foreground flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--band-clear))] pulse-live" />
              <span>System Healthy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Wifi className="w-3 h-3" />
              <span>API: 42ms</span>
            </div>
            <span>Last sync: {clock.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-mono">v2.4.1</span>
            <span className="px-1.5 py-0.5 rounded bg-[hsl(var(--band-clear))/0.1] text-[hsl(var(--band-clear))] font-semibold uppercase tracking-wider">PROD</span>
          </div>
        </footer>
      </div>

      <NotificationDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
};

export default Layout;
