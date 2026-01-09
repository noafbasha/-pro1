
import React, { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { AgencyProvider, useAgency } from './context/AgencyContext';
import { NotificationProvider } from './context/NotificationContext';

// Components
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import SalesPage from './components/SalesPage';
import PurchasesPage from './components/PurchasesPage';
import DebtsPage from './components/DebtsPage';
import SuppliersPage from './components/SuppliersPage';
import CustomersPage from './components/CustomersPage';
import ExpensesPage from './components/ExpensesPage';
import AiAssistant from './components/AiAssistant';
import SettingsPage from './components/SettingsPage';
import ReportsPage from './components/ReportsPage';
import ClosingPage from './components/ClosingPage';
import JournalPage from './components/JournalPage';
import InventoryPage from './components/InventoryPage';
import NotificationsCenter from './components/NotificationsCenter';
import Login from './components/Login';
import DeveloperPage from './components/DeveloperPage';
import ExchangePage from './components/ExchangePage';
import PinLock from './components/PinLock';

const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error("Caught error:", error);
      setHasError(true);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-4 bg-slate-50 dark:bg-slate-950">
        <span className="text-6xl" aria-hidden="true">⚠️</span>
        <h1 className="text-2xl font-black">عذراً، حدث خطأ غير متوقع</h1>
        <p className="text-slate-500 max-w-md">نواجه مشكلة تقنية بسيطة. يرجى تحديث الصفحة أو المحاولة لاحقاً.</p>
        <button onClick={() => window.location.reload()} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black shadow-lg">تحديث الصفحة ↺</button>
      </div>
    );
  }

  return <>{children}</>;
};

const GlobalLoader: React.FC = () => {
  const { isLoading } = useAgency();
  const [show, setShow] = useState(isLoading);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => setShow(false), 200);
      return () => clearTimeout(timer);
    } else {
      setShow(true);
    }
  }, [isLoading]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[300] bg-white dark:bg-slate-950 flex flex-col items-center justify-center transition-opacity duration-300 ${!isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} role="status" aria-live="polite">
      <div className="relative">
        <div className="w-16 h-16 border-4 border-slate-100 dark:border-slate-800 rounded-full" aria-hidden="true"></div>
        <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0" aria-hidden="true"></div>
      </div>
      <div className="mt-6 text-center">
        <p className="text-slate-400 font-bold text-sm tracking-widest animate-pulse">جاري تهيئة سجلات الوكالة...</p>
      </div>
    </div>
  );
};

const NavigationDock: React.FC = React.memo(() => {
  const location = useLocation();
  const { setIsAiOpen } = useAgency();
  
  const dockItems = useMemo(() => [
    { to: '/dashboard', icon: '🏠', label: 'الرئيسة' },
    { to: '/sales', icon: '💰', label: 'البيع' },
    { to: '/debts', icon: '👥', label: 'الديون' },
    { to: '/customers', icon: '📋', label: 'العملاء' },
    { to: '/expenses', icon: '💸', label: 'مصروف' },
  ], []);

  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/developer') return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pb-[env(safe-area-inset-bottom)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border-t border-slate-200 dark:border-white/10 md:hidden">
      <div className="flex items-center justify-around px-2 py-3">
        {dockItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`flex flex-col items-center flex-1 transition-all duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'opacity-50 grayscale'}`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-2xl mb-1" aria-hidden="true">{item.icon}</span>
              <span className={`text-[10px] font-black ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button 
          onClick={() => setIsAiOpen(true)} 
          className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center text-xl shadow-lg animate-glow"
          aria-label="مساعد الذكاء الاصطناعي"
        >🪄</button>
      </div>
    </div>
  );
});

// Desktop Dock remains as previously designed for larger screens
const DesktopDock: React.FC = React.memo(() => {
  const location = useLocation();
  const { setIsAiOpen } = useAgency();
  
  const dockItems = useMemo(() => [
    { to: '/dashboard', icon: '🏠', label: 'الرئيسة' },
    { to: '/sales', icon: '💰', label: 'البيع' },
    { to: '/debts', icon: '👥', label: 'الديون' },
    { to: '/customers', icon: '📋', label: 'العملاء' },
    { to: '/expenses', icon: '💸', label: 'مصروف' },
  ], []);

  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/developer') return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-4xl hidden md:block">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-slate-200 dark:border-white/10 px-10 py-6 rounded-[3rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex items-center justify-between gap-0.5">
        {dockItems.map(item => {
          const isActive = location.pathname === item.to;
          return (
            <Link 
              key={item.to} 
              to={item.to} 
              className={`flex flex-col items-center flex-1 transition-all duration-300 group ${isActive ? 'scale-110 -translate-y-1.5' : 'opacity-50 hover:opacity-100 grayscale hover:grayscale-0'}`}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="text-4xl mb-1" aria-hidden="true">{item.icon}</span>
              <span className={`text-sm font-black uppercase tracking-tight text-center transition-all ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
        <button 
          onClick={() => setIsAiOpen(true)} 
          className="w-20 h-20 bg-emerald-600 hover:bg-emerald-50 text-white rounded-full flex items-center justify-center text-3xl shadow-xl shadow-emerald-600/30 animate-glow"
          aria-label="مساعد الذكاء الاصطناعي"
        >🪄</button>
      </div>
    </div>
  );
});

const ProfileMenu: React.FC = React.memo(() => {
  const { user, profile, appSettings, logout } = useAgency();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = useMemo(() => {
    return profile?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '👤';
  }, [profile?.full_name]);

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-emerald-500/20"
        aria-label="قائمة المستخدم"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-sm md:text-lg" aria-hidden="true">
          {initials}
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] md:text-xs font-black text-slate-800 dark:text-white leading-none">{profile?.full_name || 'مدير النظام'}</p>
        </div>
        <span className={`text-[8px] text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true">▼</span>
      </button>

      {isOpen && (
        <div 
          className="absolute left-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 p-2 z-[110] animate-in zoom-in origin-top-left"
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="user-menu-button"
        >
           <div className="p-4 border-b dark:border-slate-800 mb-2">
              <p className="text-sm font-black dark:text-white">{profile?.full_name}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">{user?.email}</p>
           </div>
           <Link to="/settings" onClick={() => setIsOpen(false)} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold" role="menuitem">
              <span aria-hidden="true">⚙️</span> إعدادات الحساب
           </Link>
           <button onClick={logout} className="flex items-center gap-3 w-full p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/20 text-rose-600 font-black text-right" role="menuitem">
              <span aria-hidden="true">🚪</span> تسجيل الخروج
           </button>
        </div>
      )}
    </div>
  );
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading, isAppLocked } = useAgency();
  const hasCache = !!localStorage.getItem('agency_cache');
  
  if (isLoading && !hasCache) return <GlobalLoader />;
  if (!user && !isLoading) return <Navigate to="/login" replace />;
  if (isAppLocked) return <PinLock />;
  
  return <>{children}</>;
};

const AppLayout: React.FC = () => {
  const { isAiOpen, notifications, appSettings, togglePrivacyMode, user, cloudStatus } = useAgency();
  const location = useLocation();
  const [isDarkMode, setIsDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const toggleDarkMode = () => {
    const n = !isDarkMode;
    setIsDarkMode(n);
    if (n) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  };

  const isFullPage = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/developer';

  const cloudIndicator = useMemo(() => {
    switch(cloudStatus) {
      case 'connected': return { color: 'bg-emerald-500', text: 'مؤمن سحابياً' };
      case 'syncing': return { color: 'bg-blue-500 animate-pulse', text: 'جاري المزامنة...' };
      case 'offline': return { color: 'bg-amber-500 animate-pulse', text: 'يعمل أوفلاين' };
      case 'error': return { color: 'bg-red-500 animate-ping', text: 'خطأ في الربط' };
      default: return { color: 'bg-slate-400', text: 'غير معروف' };
    }
  }, [cloudStatus]);

  return (
    <div className={`min-h-screen flex flex-col bg-softBackground dark:bg-slate-950 font-['Tajawal'] relative overflow-x-hidden pb-[100px] md:pb-32`}>
      <GlobalLoader />
      {!isFullPage && user && (
        <>
          <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b dark:border-slate-800 p-3 md:p-6 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
              <Link to="/dashboard" className="flex items-center gap-2 md:gap-4 group" aria-label="الرئيسية: وكالة الشويع">
                <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-xl relative" aria-hidden="true">
                   🌿
                   <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${cloudIndicator.color}`} aria-label={`حالة الربط السحابي: ${cloudIndicator.text}`}></div>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-sm md:text-xl font-black dark:text-white leading-none">وكالة الشويع</h1>
                  <p className="text-[7px] md:text-[9px] font-bold text-green-600 uppercase mt-1" role="status" aria-live="polite">{cloudIndicator.text}</p>
                </div>
              </Link>
              
              <div className="flex gap-2 items-center">
                <button 
                  onClick={togglePrivacyMode} 
                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${appSettings.appearance.privacyMode ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}
                  aria-label={appSettings.appearance.privacyMode ? 'إلغاء وضع الخصوصية' : 'تفعيل وضع الخصوصية'}
                >
                  <span aria-hidden="true">{appSettings.appearance.privacyMode ? '👁️‍ق' : '👁️'}</span>
                </button>
                <button 
                  onClick={() => setIsNotifOpen(true)} 
                  className="relative w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center"
                  aria-label={`التنبيهات، لديك ${unreadCount} تنبيه غير مقروء`}
                >
                  <span aria-hidden="true">🔔</span>
                  {unreadCount > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900" aria-label={`${unreadCount} تنبيهات جديدة`}>{unreadCount}</span>}
                </button>
                <button 
                  onClick={toggleDarkMode} 
                  className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center"
                  aria-label={isDarkMode ? 'تبديل للوضع الفاتح' : 'تبديل للوضع الداكن'}
                >
                  <span aria-hidden="true">{isDarkMode ? '☀️' : '🌙'}</span>
                </button>
                <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" role="separator" aria-orientation="vertical"></div>
                <ProfileMenu />
              </div>
            </div>
          </header>

          <nav className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-[57px] md:top-[88px] z-40 border-b dark:border-slate-800 overflow-x-auto no-scrollbar" aria-label="الروابط الأساسية">
            <div className="max-w-7xl mx-auto flex">
              <NavLink to="/inventory" label="🌿 المخزن" />
              <NavLink to="/purchases" label="📦 المشتريات" />
              <NavLink to="/suppliers" label="🚜 الموردين" />
              <NavLink to="/journal" label="📑 اليومية" />
              <NavLink to="/exchange" label="💱 العملات" />
              <NavLink to="/reports" label="📈 التقارير" />
              <NavLink to="/closing" label="🏁 الإغلاق" />
              <NavLink to="/settings" label="⚙️ الإعدادات" />
            </div>
          </nav>
        </>
      )}

      <main className={`flex-grow ${isFullPage ? '' : 'max-w-7xl mx-auto w-full p-4 md:p-4'}`}>
        <Suspense fallback={<div className="p-20 text-center font-black animate-pulse text-2xl" role="alert" aria-live="polite">جاري المعالجة...</div>}>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<Login />} />
            <Route path="/developer" element={<DeveloperPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><InventoryPage /></ProtectedRoute>} />
            <Route path="/sales" element={<ProtectedRoute><SalesPage /></ProtectedRoute>} />
            <Route path="/purchases" element={<ProtectedRoute><PurchasesPage /></ProtectedRoute>} />
            <Route path="/expenses" element={<ProtectedRoute><ExpensesPage /></ProtectedRoute>} />
            <Route path="/debts" element={<ProtectedRoute><DebtsPage /></ProtectedRoute>} />
            <Route path="/suppliers" element={<ProtectedRoute><SuppliersPage /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute><CustomersPage /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
            <Route path="/closing" element={<ProtectedRoute><ClosingPage /></ProtectedRoute>} />
            <Route path="/journal" element={<ProtectedRoute><JournalPage /></ProtectedRoute>} />
            <Route path="/exchange" element={<ProtectedRoute><ExchangePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Suspense>
      </main>
      
      {!isFullPage && (
        <>
          <NavigationDock />
          <DesktopDock />
        </>
      )}
      {isAiOpen && <AiAssistant />}
      <NotificationsCenter isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </div>
  );
};

const NavLink: React.FC<{ to: string; label: string }> = React.memo(({ to, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link 
      to={to} 
      className={`px-4 py-3 md:px-6 md:py-5 text-sm md:text-xl font-black transition-all border-b-2 whitespace-nowrap 
        ${isActive 
          ? 'text-emerald-700 dark:text-emerald-400 border-emerald-700 dark:border-emerald-400' 
          : 'text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white'}`}
      aria-current={isActive ? "page" : undefined}
      aria-label={label.replace(/[^ء-ي\s]/g, '')}
    >
      {label}
    </Link>
  );
});

const RootRedirect: React.FC = () => {
  const { user, isLoading } = useAgency();
  if (isLoading) return <GlobalLoader />;
  if (user) return <Navigate to="/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <NotificationProvider>
        <ErrorBoundary>
          <AgencyProvider>
            <AppLayout />
          </AgencyProvider>
        </ErrorBoundary>
      </NotificationProvider>
    </HashRouter>
  );
};

export default App;