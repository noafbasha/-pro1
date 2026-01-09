
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useStats } from '../hooks/useStats';
import { askBusinessAssistant } from '../services/geminiService';
import { Customer, Supplier } from '../types'; // Import Customer and Supplier types

const SalesChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data, 1000);
  const height = 60;
  const width = 300;
  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - (d / max) * height
  }));
  
  const d = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
  const areaD = `${d} L ${width},${height} L 0,${height} Z`;

  return (
    <svg width="100%" height="80" viewBox={`0 0 ${width} ${height}`} className="overflow-visible mt-4" preserveAspectRatio="none" aria-label="مخطط مبيعات الأيام الخمسة عشر الماضية">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#chartGradient)" />
      <path d={d} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#10b981" className="animate-pulse" aria-label={`مبيعات بقيمة ${data[i].toLocaleString()} في اليوم ${i + 1}`} />
      ))}
    </svg>
  );
};

const QuickActionButton = React.memo(({ label, icon, color, onClick }: any) => (
  <button 
    onClick={onClick} 
    className={`${color} text-white p-4 md:p-6 rounded-2xl flex flex-col items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-xl group h-full`}
    aria-label={label}
  >
    <span className="text-3xl md:text-5xl group-hover:rotate-6 transition-transform" aria-hidden="true">{icon}</span>
    <span className="text-[10px] md:text-sm font-black whitespace-nowrap">{label}</span>
  </button>
));

const GlobalSearch: React.FC = () => {
  const { customers, suppliers, qatTypes } = useAgency();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  // @fix: Corrected typo from HTMLDivLement to HTMLDivElement
  const searchRef = useRef<HTMLDivElement>(null);

  const appPages = [
    { name: 'المبيعات والبيع', path: '/sales', icon: '💰' },
    { name: 'الديون والتحصيل', path: '/debts', icon: '👥' },
    { name: 'إدارة العملاء', path: '/customers', icon: '📋' },
    { name: 'سجل اليومية العامة', path: '/journal', icon: '📑' },
    { name: 'المخزن والجرد', path: '/inventory', icon: '🌿' },
  ];

  const results = useMemo(() => {
    if (!query.trim()) return { pages: [], customers: [], suppliers: [], items: [] };
    const q = query.toLowerCase();
    return {
      pages: appPages.filter(p => p.name.includes(q)),
      customers: customers.filter((c: Customer) => c.name.toLowerCase().includes(q)).slice(0, 5),
      suppliers: suppliers.filter((s: Supplier) => s.name.toLowerCase().includes(q)).slice(0, 5),
      items: qatTypes.filter((t: string) => t.toLowerCase().includes(q))
    };
  }, [query, customers, suppliers, qatTypes]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (path: string, state?: any) => {
    navigate(path, { state });
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto z-[60]" ref={searchRef}>
      <div className={`flex items-center gap-2 p-3 md:p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border-2 transition-all ${isOpen ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-100 dark:border-slate-800'}`}>
        <span className="text-xl md:text-2xl mr-2 opacity-40" aria-hidden="true">🔍</span>
        <input 
          type="text"
          placeholder="ابحث عن عميل، مورد، أو صنف..."
          className="flex-grow bg-transparent outline-none font-black text-base md:text-lg dark:text-white placeholder:opacity-30"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          aria-label="البحث العام"
        />
      </div>

      {isOpen && query.trim() && (
        <div 
          className="absolute top-full left-0 right-0 mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in slide-in-from-top-2 z-[70]"
          role="listbox"
          aria-expanded={isOpen}
        >
          <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4">
            {results.pages.length > 0 && (
              <div className="space-y-1" role="group" aria-labelledby="search-pages-heading">
                <h4 id="search-pages-heading" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الصفحات</h4>
                {results.pages.map(p => (
                  <button key={p.path} onClick={() => handleSelect(p.path)} className="flex items-center gap-3 w-full p-3 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-xl transition-all text-right" role="option">
                     <span className="text-xl" aria-hidden="true">{p.icon}</span>
                     <span className="font-black text-slate-700 dark:text-slate-200">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
            {results.customers.length > 0 && (
              <div className="space-y-1" role="group" aria-labelledby="search-customers-heading">
                <h4 id="search-customers-heading" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">العملاء</h4>
                {results.customers.map(c => (
                  <button key={c.id} onClick={() => handleSelect('/customers', { customerId: c.id })} className="w-full flex justify-between items-center p-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-all text-right" role="option">
                     <span className="font-black text-slate-700 dark:text-slate-200">👤 {c.name}</span>
                  </button>
                ))}
              </div>
            )}
            {results.items.length > 0 && (
              <div className="space-y-1" role="group" aria-labelledby="search-items-heading">
                <h4 id="search-items-heading" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الأصناف</h4>
                <div className="flex flex-wrap gap-2 p-2">
                  {results.items.map((t: string) => (
                    <button key={t} onClick={() => handleSelect('/inventory')} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black" role="option">🌿 {t}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Dashboard: React.FC = React.memo(() => { // Wrapped with React.memo
  const { appSettings } = useAgency();
  const stats = useStats();
  const navigate = useNavigate();
  const [marketInsight, setMarketInsight] = useState<string>("أهلاً بك يا مدير! جاري تحليل أداء الوردية 🌿");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const isPrivacy = appSettings.appearance.privacyMode;

  const fetchInsight = useCallback(async () => {
    setIsAnalyzing(true);
    setMarketInsight("جاري تحليل البيانات... 🔎");
    try {
      const prompt = `بصفتك مستشار مالي، حلل: مبيعات ${stats.todaySales} ر.ي، سيولة ${stats.liquidityRatio}%. قدم نصيحة تجارية ذكية قصيرة بلهجة يمنية.`;
      const result = await askBusinessAssistant(prompt, { stats });
      setMarketInsight(result.text);
    } catch (e) {
      setMarketInsight("المعذرة مدير، تعذر الاتصال حالياً.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [stats]);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20">
      <section className="pt-4 text-center space-y-4">
         <h2 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">ماذا تريد أن تنجز اليوم؟</h2>
         <GlobalSearch />
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
         <QuickActionButton label="قبض مالي" icon="📥" color="bg-emerald-600 shadow-emerald-200" onClick={() => navigate('/customers', { state: { openVoucher: true, type: 'receipt' } })} />
         <QuickActionButton label="كشف عميل" icon="📋" color="bg-slate-800" onClick={() => navigate('/customers')} />
         <QuickActionButton label="صرف لمورد" icon="📤" color="bg-blue-600" onClick={() => navigate('/suppliers', { state: { openVoucher: true, type: 'payment' } })} />
         <QuickActionButton label="تسجيل مصروف" icon="🧾" color="bg-rose-600" onClick={() => navigate('/expenses', { state: { showAdd: true } })} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 relative overflow-hidden bg-slate-900 rounded-[2rem] p-6 md:p-10 text-white shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent" aria-hidden="true"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4 flex-1">
              <span className="bg-emerald-500/20 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-emerald-500/30">Sales Live</span>
              <h2 className={`text-4xl md:text-6xl font-black tracking-tighter ${isPrivacy ? 'privacy-blur' : ''}`}
                  title={isPrivacy ? 'وضع الخصوصية مفعل: القيم الحساسة مموهة' : undefined}>
                {stats.todaySales.toLocaleString()} <span className="text-sm font-normal opacity-50">ر.ي</span>
              </h2>
              <p className="text-xs font-bold text-slate-400 uppercase">إجمالي مبيعات اليوم</p>
              <SalesChart data={stats.salesTrend} />
            </div>
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="bg-white/5 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-center w-full min-w-[150px]">
                 <div className="text-[8px] font-black opacity-50 uppercase mb-2">الأكثر طلباً</div>
                 <div className="text-lg font-black text-green-400 truncate">{stats.topProduct.name}</div>
              </div>
              <button onClick={() => navigate('/sales')} className="bg-emerald-600 text-white w-full px-6 py-4 rounded-xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all text-sm" aria-label="سجل مبيع جديد">💰 سجل مبيع</button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
           <div className="relative w-32 h-32 md:w-40 md:h-40">
              <svg className="w-full h-full transform -rotate-90" aria-labelledby="liquidity-ratio-title">
                 <title id="liquidity-ratio-title">مخطط كفاءة التحصيل</title>
                 <circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                 <circle cx="50%" cy="50%" r="40%" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray="251.2%" strokeDashoffset={`${251.2 - (251.2 * stats.liquidityRatio / 100)}%`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-3xl md:text-4xl font-black dark:text-white leading-none">{stats.liquidityRatio.toFixed(0)}%</span>
              </div>
           </div>
           <div>
              <h4 className="text-lg font-black dark:text-white">كفاءة التحصيل</h4>
              <div className="flex justify-between w-full max-w-[200px] mx-auto mt-4 pt-4 border-t dark:border-slate-800">
                <div className="text-right">
                   <div className="text-[8px] font-black text-slate-400 uppercase">ديون عملاء</div>
                   <div className={`text-xs font-black text-rose-600 ${isPrivacy ? 'privacy-blur' : ''}`}
                        title={isPrivacy ? 'وضع الخصوصية مفعل: القيم الحساسة مموهة' : undefined}>
                     {stats.totalCustomerDebt.toLocaleString()}
                   </div>
                </div>
                <div className="text-right">
                   <div className="text-[8px] font-black text-slate-400 uppercase">ديون موردين</div>
                   <div className={`text-xs font-black text-amber-600 ${isPrivacy ? 'privacy-blur' : ''}`}
                        title={isPrivacy ? 'وضع الخصوصية مفعل: القيم الحساسة مموهة' : undefined}>
                     {stats.totalSupplierDebt.toLocaleString()}
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-indigo-700 to-blue-700 p-6 md:p-10 rounded-[2rem] shadow-2xl text-white flex flex-col md:flex-row items-center gap-6 relative overflow-hidden group">
        <div className="w-12 h-12 md:w-20 md:h-20 bg-white/20 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-2xl md:text-5xl shadow-2xl shrink-0 animate-glow" aria-hidden="true">
          {isAnalyzing ? "⌛" : "✨"}
        </div>
        <div className="flex-grow space-y-2 text-center md:text-right relative z-10">
           <span className="bg-white/10 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10">AI Smart Insight</span>
           <p className="text-sm md:text-xl font-black leading-snug">{marketInsight}</p>
           <button onClick={fetchInsight} disabled={isAnalyzing} className="text-[10px] font-black bg-white text-indigo-700 px-4 py-2 rounded-full uppercase tracking-widest hover:scale-105 transition-all shadow-xl disabled:opacity-50" aria-label="تحديث التحليل الذكي">تحديث التحليل ↺</button>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;