
import React, { useState, useEffect, useRef } from 'react';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { AppSettings, AiProvider, BackupFrequency, Currency, UserRole, AiDialect } from '../types';

type SettingsSection = 'profile' | 'agency' | 'sales' | 'team' | 'appearance' | 'integrations' | 'ai' | 'automation' | 'templates' | 'backup' | 'integrity' | 'security';

const Toggle = React.memo(({ checked, onChange, 'aria-label': ariaLabel }: { checked: boolean; onChange: (v: boolean) => void; 'aria-label'?: string }) => (
  <button onClick={() => onChange(!checked)} className={`w-24 h-12 rounded-full transition-all relative flex items-center px-2 ${checked ? 'bg-emerald-500 shadow-inner' : 'bg-slate-300 dark:bg-slate-700'}`} role="switch" aria-checked={checked} aria-label={ariaLabel}>
     <div className={`w-8 h-8 bg-white rounded-full shadow-2xl transition-all transform ${checked ? 'translate-x-12' : 'translate-x-0'}`}></div>
  </button>
));

const SettingRow = React.memo(({ label, desc, children }: { label: string; desc: string; children?: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-12 border-b border-slate-100 dark:border-slate-800 last:border-0 last:pb-0 group">
     <div className="max-w-2xl text-right">
        <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">{label}</h4>
        <p className="text-sm md:text-xl text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{desc}</p>
     </div>
     <div className="w-full md:w-auto md:min-w-[350px] flex justify-end">
        {children}
     </div>
  </div>
));

const SettingsPage: React.FC = React.memo(() => {
  const { appSettings, updateAppSettings, exportData, importData, resetSystem, profile, user, auditLogs } = useAgency();
  const { notify } = useNotify();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');
  const [localSettings, setLocalSettings] = useState<AppSettings>(appSettings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(appSettings);
  }, [appSettings]);

  const handleSave = async () => {
    try {
      await updateAppSettings(localSettings);
      notify('تمت مزامنة وحفظ التعديلات سحابياً ✅', 'success');
    } catch (error) {
      notify('فشل حفظ الإعدادات، يرجى المحاولة لاحقاً', 'error');
    }
  };

  const updateNested = (category: keyof AppSettings, field: string, value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as object),
        [field]: value
      }
    }));
  };

  const sections: { id: SettingsSection; label: string; icon: string; color: string }[] = [
    { id: 'profile', label: 'حسابي الشخصي', icon: '👤', color: 'bg-blue-500' },
    { id: 'agency', label: 'بيانات الوكالة', icon: '🏢', color: 'bg-emerald-500' },
    { id: 'sales', label: 'نظام المبيعات', icon: '💰', color: 'bg-amber-500' },
    { id: 'security', label: 'الأمان والقفل', icon: '🔐', color: 'bg-rose-500' },
    { id: 'automation', label: 'قواعد الأتمتة', icon: '⚡', color: 'bg-orange-500' },
    { id: 'templates', label: 'قوالب الطباعة', icon: '🖨️', color: 'bg-rose-500' },
    { id: 'ai', label: 'تخصيص المساعد', icon: '🧠', color: 'bg-indigo-600' },
    { id: 'team', label: 'الفريق والصلاحيات', icon: '👥', color: 'bg-violet-500' },
    { id: 'appearance', label: 'المظهر واللغة', icon: '🎨', color: 'bg-purple-500' },
    { id: 'backup', label: 'الأمان والنسخ', icon: '💾', color: 'bg-slate-700' },
    { id: 'integrity', label: 'سجل الرقابة', icon: '🛡️', color: 'bg-red-500' },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-8 animate-in slide-in-from-left duration-300">
            <div className="flex flex-col items-center p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-700">
               <div className="relative group">
                  <div className="w-32 h-32 md:w-44 md:h-44 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-5xl md:text-7xl text-white shadow-2xl transition-transform group-hover:rotate-6" aria-hidden="true">
                    {profile?.full_name?.[0] || '👤'}
                  </div>
                  <button className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 text-xl hover:scale-110 transition-all" aria-label="تغيير صورة الملف الشخصي">📸</button>
               </div>
               <div className="mt-6 text-center">
                  <h4 className="text-2xl md:text-3xl font-black dark:text-white">{profile?.full_name}</h4>
                  <p className="text-slate-400 font-bold mt-1">{user?.email}</p>
                  <span className="inline-block mt-3 px-4 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-widest">المدير العام</span>
               </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <SettingRow label="البريد الإلكتروني" desc="يستخدم لاستعادة الحساب">
                  <input className="setting-input opacity-50 cursor-not-allowed" value={user?.email} disabled aria-label="البريد الإلكتروني للحساب" />
               </SettingRow>
               <SettingRow label="كلمة المرور" desc="تغيير كلمة المرور الحالية">
                  <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-sm hover:bg-black transition-all" aria-label="تحديث كلمة المرور">تحديث الأمان 🔐</button>
               </SettingRow>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-8 animate-in slide-in-from-left duration-300">
             <SettingRow label="تفعيل قفل التطبيق" desc="طلب رمز PIN عند فتح التطبيق لحماية الخصوصية">
                <Toggle checked={localSettings.security.appLockEnabled} onChange={v => updateNested('security', 'appLockEnabled', v)} aria-label="تفعيل قفل التطبيق" />
             </SettingRow>
             {localSettings.security.appLockEnabled && (
               <>
                <SettingRow label="رمز PIN" desc="أدخل 4 أرقام لرمز القفل">
                  <input 
                    type="password" 
                    maxLength={4}
                    pattern="\d*"
                    className="setting-input max-w-[150px] text-center tracking-[1em]" 
                    value={localSettings.security.appLockPin} 
                    onChange={e => updateNested('security', 'appLockPin', e.target.value.replace(/\D/g, ''))} 
                    aria-label="رمز PIN لقفل التطبيق"
                  />
                </SettingRow>
                <SettingRow label="قفل تلقائي عند الخروج" desc="تفعيل القفل فور إغلاق المتصفح أو التطبيق">
                   <Toggle checked={localSettings.security.autoLockOnExit} onChange={v => updateNested('security', 'autoLockOnExit', v)} aria-label="قفل تلقائي عند الخروج" />
                </SettingRow>
               </>
             )}
          </div>
        );
      case 'agency':
        return (
          <div className="space-y-8 animate-in slide-in-from-left duration-300">
             <SettingRow label="اسم الوكالة" desc="يظهر في واجهة البرنامج والتقارير المطبوعة">
                <input className="setting-input text-lg md:text-xl p-4 md:p-5" value={localSettings.agency.name} onChange={e => updateNested('agency', 'name', e.target.value)} aria-label="اسم الوكالة" />
             </SettingRow>
             <SettingRow label="رقم التواصل" desc="يستخدم في تذييل الفواتير وكشوف الحساب">
                <input className="setting-input text-lg md:text-xl p-4 md:p-5 text-left" dir="ltr" value={localSettings.agency.phone} onChange={e => updateNested('agency', 'phone', e.target.value)} aria-label="رقم التواصل للوكالة" />
             </SettingRow>
             <SettingRow label="العنوان" desc="يظهر في رأس الفاتورة الرسمية">
                <input className="setting-input text-lg md:text-xl p-4 md:p-5" value={localSettings.agency.address} onChange={e => updateNested('agency', 'address', e.target.value)} aria-label="عنوان الوكالة" />
             </SettingRow>
          </div>
        );
      case 'ai':
        return (
          <div className="space-y-8 animate-in slide-in-from-left duration-300">
             <SettingRow label="لهجة المساعد" desc="اختر اللهجة التي سيتحدث بها المساعد عند المطالبات">
                <select className="setting-input text-lg md:text-xl p-4 md:p-5" value={localSettings.ai.dialect} onChange={e => updateNested('ai', 'dialect', e.target.value)} aria-label="لهجة المساعد الذكي">
                   {Object.values(AiDialect).map(d => <option key={d} value={d}>{d}</option>)}
                </select>
             </SettingRow>
             <SettingRow label="الجنس الصوتي" desc="نوع الصوت المولّد آلياً">
                <div className="flex gap-2" role="radiogroup" aria-labelledby="voice-gender-label">
                   {['male', 'female'].map(g => (
                     <button 
                       key={g}
                       onClick={() => updateNested('ai', 'voiceGender', g)}
                       className={`px-6 py-3 rounded-xl font-black text-sm transition-all ${localSettings.ai.voiceGender === g ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 text-slate-400'}`}
                       aria-checked={localSettings.ai.voiceGender === g}
                       role="radio"
                       id={`voice-gender-${g}`}
                     >
                       {g === 'male' ? '👨 رجل' : '👩 امرأة'}
                     </button>
                   ))}
                </div>
             </SettingRow>
             <SettingRow label="التحليل اليومي" desc="السماح للمساعد بتحليل أداء الوردية تلقائياً">
                <Toggle checked={localSettings.ai.autoAnalyzeDaily} onChange={v => updateNested('ai', 'autoAnalyzeDaily', v)} aria-label="تفعيل التحليل اليومي التلقائي" />
             </SettingRow>
          </div>
        );
      case 'automation':
        return (
          <div className="space-y-8 animate-in slide-in-from-left duration-300">
             <div className="p-8 bg-orange-50 dark:bg-orange-900/10 rounded-[2rem] border-2 border-orange-100 dark:border-orange-900/30">
                <h4 className="text-xl font-black text-orange-700 dark:text-orange-400 mb-4">قواعد التنبيه التلقائي</h4>
                <SettingRow label="تفعيل التذكير بالديون" desc="إرسال إشعار للمدير لمتابعة العملاء المتأخرين">
                   <Toggle checked={localSettings.debts.autoReminderEnabled} onChange={v => updateNested('debts', 'autoReminderEnabled', v)} aria-label="تفعيل التذكير التلقائي بالديون" />
                </SettingRow>
                <SettingRow label="حد المديونية للتنبيه" desc="نبهني إذا تجاوز دين أي عميل هذا المبلغ">
                   <input type="number" className="setting-input max-w-[200px] text-lg md:text-xl p-4 md:p-5" value={localSettings.debts.autoReminderThreshold} onChange={e => updateNested('debts', 'autoReminderThreshold', parseInt(e.target.value))} aria-label="حد المديونية للتنبيه" />
                </SettingRow>
             </div>
          </div>
        );
      case 'templates':
        return (
          <div className="space-y-8 animate-in slide-in-from-left duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <h4 className="font-black text-xl">تخصيص نصوص الفاتورة</h4>
                   <SettingRow label="ترويسة الفاتورة" desc="نص يظهر في أعلى الفواتير">
                      <input className="setting-input text-lg md:text-xl p-4 md:p-5" value={localSettings.agency.headerText} onChange={e => updateNested('agency', 'headerText', e.target.value)} aria-label="ترويسة الفاتورة" />
                   </SettingRow>
                   <SettingRow label="تذييل الفاتورة" desc="نص ختامي (مثل: البضاعة لا ترد بعد 24 ساعة)">
                      <input className="setting-input text-lg md:text-xl p-4 md:p-5" value={localSettings.agency.footerText} onChange={e => updateNested('agency', 'footerText', e.target.value)} aria-label="تذييل الفاتورة" />
                   </SettingRow>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 p-8 rounded-[2.5rem] border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center">
                   <div className="w-full max-w-[250px] bg-white dark:bg-slate-900 p-6 rounded-xl shadow-2xl space-y-3">
                      <p className="text-[10px] font-black border-b pb-2">{localSettings.agency.name}</p>
                      <p className="text-[8px] opacity-50 italic">{localSettings.agency.headerText}</p>
                      <div className="h-20 bg-slate-50 dark:bg-slate-800 rounded flex items-center justify-center text-[8px] opacity-20">تفاصيل الفاتورة</div>
                      <p className="text-[8px] border-t pt-2">{localSettings.agency.footerText}</p>
                   </div>
                   <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">معاينة مباشرة لتصميم الفاتورة</p>
                </div>
             </div>
          </div>
        );
      case 'integrity':
        return (
          <div className="space-y-6 animate-in slide-in-from-left duration-300">
             <h4 className="text-2xl font-black mb-4">سجل العمليات الأخير (Audit Log)</h4>
             <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 overflow-hidden shadow-xl">
                <table className="excel-table w-full" role="table" aria-label="سجل الرقابة">
                   <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800 text-[10px] uppercase font-black">
                         <th scope="col" className="p-4 text-right">الوقت</th>
                         <th scope="col" className="p-4 text-right">المسؤول</th>
                         <th scope="col" className="p-4 text-right">الإجراء</th>
                         <th scope="col" className="p-4 text-right">التفاصيل</th>
                      </tr>
                   </thead>
                   <tbody className="text-xs md:text-sm">
                      {auditLogs.map((log, i) => (
                        <tr key={i} className="border-b dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                           <td className="p-4 font-bold text-slate-400">{new Date(log.timestamp).toLocaleTimeString('ar-YE')}</td>
                           <td className="p-4 font-black text-indigo-600">{log.userName}</td>
                           <td className="p-4 font-black">{log.action}</td>
                           <td className="p-4 text-slate-500 font-bold">{log.details}</td>
                        </tr>
                      ))}
                      {auditLogs.length === 0 && <tr><td colSpan={4} className="p-20 text-center opacity-20 font-black italic">لا توجد سجلات حتى الآن</td></tr>}
                   </tbody>
                </table>
             </div>
          </div>
        );
      case 'backup':
        return (
          <div className="space-y-12 animate-in slide-in-from-left duration-300">
             <div className="bg-slate-900 rounded-[3rem] p-8 md:p-12 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                   <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center text-4xl shadow-2xl animate-glow" aria-hidden="true">🛡️</div>
                      <div>
                         <h3 className="text-3xl font-black">تأمين البيانات</h3>
                         <p className="text-slate-400 font-bold">البيانات مشفرة سحابياً ومحمية</p>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button onClick={exportData} className="bg-white/10 hover:bg-white/20 text-white py-5 rounded-2xl font-black text-xl border border-white/10 transition-all active:scale-95" aria-label="تصدير نسخة احتياطية للجهاز">📤 تصدير نسخة للجهاز</button>
                      <button onClick={() => resetSystem()} className="bg-rose-600 hover:bg-rose-700 text-white py-5 rounded-2xl font-black text-xl transition-all shadow-xl active:scale-95" aria-label="تصفير النظام وحذف كافة البيانات">🚨 تصفير النظام</button>
                   </div>
                </div>
             </div>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-40 animate-in fade-in duration-500 px-2 md:px-0">
      <div className="flex flex-col lg:flex-row gap-6 md:gap-12">
        
        <aside className="w-full lg:w-80 shrink-0">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden sticky top-32 z-20 transition-all">
             <div className="p-10 border-b dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-800/30">
                <div className="w-20 h-20 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-4xl text-white shadow-2xl mx-auto mb-4 animate-float" aria-hidden="true">⚙️</div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-white">الإعدادات الذكية</h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Shuway Control v3.2</p>
             </div>
             <nav className="p-4 flex lg:flex-col overflow-x-auto no-scrollbar gap-2" aria-label="أقسام الإعدادات">
                {sections.map(s => (
                  <button 
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className={`whitespace-nowrap flex items-center gap-5 px-6 py-5 rounded-[1.5rem] font-black text-sm md:text-lg transition-all relative group ${activeSection === s.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    aria-current={activeSection === s.id ? "page" : undefined}
                  >
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${activeSection === s.id ? 'bg-white/20' : s.color + ' text-white'}`} aria-hidden="true">{s.icon}</span>
                    <span>{s.label}</span>
                  </button>
                ))}
             </nav>
          </div>
        </aside>

        <main className="flex-grow">
           <div className="bg-white dark:bg-slate-900 rounded-[3rem] md:rounded-[5rem] shadow-2xl border-2 border-slate-100 dark:border-slate-800 overflow-hidden min-h-[800px] flex flex-col transition-all relative">
              
              <div className="p-8 md:p-16 border-b border-slate-50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-8 bg-slate-50/20 dark:bg-slate-800/10">
                 <div className="flex items-center gap-6 md:gap-8">
                    <div className="w-20 h-20 md:w-28 md:h-28 bg-white dark:bg-slate-800 rounded-[2.5rem] md:rounded-[3.5rem] flex items-center justify-center text-4xl md:text-6xl shadow-2xl border-2 border-slate-100 dark:border-slate-700 animate-in zoom-in duration-500" aria-hidden="true">
                      {sections.find(s => s.id === activeSection)?.icon}
                    </div>
                    <div>
                       <h3 className="text-3xl md:text-5xl font-black text-slate-800 dark:text-white leading-tight">
                         {sections.find(s => s.id === activeSection)?.label}
                       </h3>
                       <p className="text-slate-400 font-bold text-sm md:text-xl mt-1">ضبط وتخصيص الخيارات المتقدمة</p>
                    </div>
                 </div>
                 
                 {activeSection !== 'integrity' && activeSection !== 'backup' && (
                    <button onClick={handleSave} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-12 py-5 rounded-[2rem] font-black text-xl md:text-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4" aria-label="حفظ الإعدادات">
                       <span>💾</span> حفظ وحفظ سحابي
                    </button>
                 )}
              </div>

              <div className="p-8 md:p-16 flex-grow overflow-y-auto no-scrollbar max-h-[1400px]">
                 {renderSectionContent()}
              </div>
           </div>
        </main>
      </div>

      <style>{`
        .setting-input {
          @apply w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-950 border-4 border-transparent rounded-[1.5rem] outline-none font-black text-lg md:text-xl text-slate-900 dark:text-white transition-all shadow-inner focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 focus:shadow-2xl;
        }
      `}</style>
    </div>
  );
});

export default SettingsPage;