
import React, { useState } from 'react';
import { supabase, getSafeErrorMessage } from '../supabase';
import { useNotify } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = React.memo(() => { // Wrapped with React.memo
  const { notify } = useNotify();
  const navigate = useNavigate();
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);

    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              agency_name: agencyName,
            }
          }
        });
        if (error) throw error;
        if (data.user) {
          notify('تم إنشاء الحساب بنجاح! يرجى التحقق من بريدك الإلكتروني لتأكيده 🌿', 'success');
          setIsRegistering(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        
        if (data.session) {
          notify('جاري تهيئة سجلات الوكالة... ✅', 'success');
          setTimeout(() => {
            navigate('/dashboard');
          }, 800);
        } else {
          throw new Error('فشل الحصول على جلسة دخول صالحة');
        }
      }
    } catch (err: any) {
      notify(getSafeErrorMessage(err), 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 font-['Tajawal'] relative overflow-hidden">
      {/* الخلفية المزينة بظلال ضوئية متحركة */}
      <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" aria-hidden="true"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-brandGreen/10 rounded-full blur-[100px] animate-float" aria-hidden="true"></div>

      <div className="relative z-10 w-full max-w-xl animate-in fade-in zoom-in duration-700">
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[4rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border-2 border-white dark:border-slate-800 overflow-hidden">
          
          {/* رأس الصفحة الكبير */}
          <div className="p-12 md:p-16 text-center bg-gradient-to-br from-emerald-600 to-green-800 text-white relative">
            <div className="relative z-10">
              <div className="w-28 h-28 bg-white/20 backdrop-blur-md rounded-[2.5rem] flex items-center justify-center text-6xl mx-auto mb-8 shadow-2xl border-2 border-white/30" aria-hidden="true">🌿</div>
              <h2 className="text-5xl font-black mb-3 tracking-tighter">وكالة الشويع</h2>
              <p className="text-xl opacity-80 font-bold tracking-tight">منظومة المحاسبة السحابية الذكية</p>
            </div>
            {/* زخرفة خفيفة في الخلفية */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]" aria-hidden="true"></div>
          </div>

          <form onSubmit={handleAuth} className="p-10 md:p-14 space-y-8">
            {/* محول النمط (دخول / تسجيل) */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-2 rounded-[2rem] w-full border dark:border-slate-700" role="tablist">
              <button 
                type="button" onClick={() => setIsRegistering(false)}
                className={`flex-1 py-4 rounded-[1.5rem] font-black text-lg transition-all ${!isRegistering ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xl scale-[1.05]' : 'text-slate-400'}`}
                aria-pressed={!isRegistering}
                aria-label="التبديل إلى تسجيل الدخول"
              >تسجيل الدخول</button>
              <button 
                type="button" onClick={() => setIsRegistering(true)}
                className={`flex-1 py-4 rounded-[1.5rem] font-black text-lg transition-all ${isRegistering ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-xl scale-[1.05]' : 'text-slate-400'}`}
                aria-pressed={isRegistering}
                aria-label="التبديل إلى فتح حساب جديد"
              >فتح حساب جديد</button>
            </div>

            <div className="space-y-6">
              {isRegistering && (
                <div className="space-y-6 animate-in slide-in-from-top-6 duration-500">
                  <div className="group">
                    <input 
                      type="text" required autoFocus
                      className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-4 border-transparent focus:border-emerald-500 rounded-3xl outline-none font-black text-xl dark:text-white transition-all shadow-inner"
                      placeholder="الاسم الكامل للمدير"
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      aria-label="الاسم الكامل للمدير"
                      aria-required="true"
                    />
                  </div>
                  <div className="group">
                    <input 
                      type="text" required
                      className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-4 border-transparent focus:border-emerald-500 rounded-3xl outline-none font-black text-xl dark:text-white transition-all shadow-inner"
                      placeholder="اسم وكالة القات التجارية"
                      value={agencyName} onChange={e => setAgencyName(e.target.value)}
                      aria-label="اسم وكالة القات التجارية"
                      aria-required="true"
                    />
                  </div>
                </div>
              )}
              
              <div className="group">
                <input 
                  type="email" required
                  className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-4 border-transparent focus:border-emerald-500 rounded-3xl outline-none font-black text-xl dark:text-white transition-all shadow-inner"
                  placeholder="البريد الإلكتروني"
                  value={email} onChange={e => setEmail(e.target.value)}
                  aria-label="البريد الإلكتروني"
                  aria-required="true"
                />
              </div>

              <div className="relative group">
                <input 
                  type={showPassword ? "text" : "password"} required
                  className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-4 border-transparent focus:border-emerald-500 rounded-3xl outline-none font-black text-xl dark:text-white transition-all shadow-inner"
                  placeholder="كلمة المرور السرية"
                  value={password} onChange={e => setPassword(e.target.value)}
                  aria-label="كلمة المرور"
                  aria-required="true"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute left-6 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100 transition-opacity text-2xl"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? '👁️' : '👁️‍ق'}
                </button>
              </div>
            </div>

            <div className="pt-4">
              <button 
                type="submit" disabled={isLoading}
                className={`w-full py-7 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-[2.5rem] font-black text-2xl shadow-[0_20px_50px_rgba(5,150,105,0.4)] transition-all flex items-center justify-center gap-4 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95'}`}
                aria-label={isLoading ? 'جاري التحميل...' : (isRegistering ? 'إنشاء حساب الوكالة' : 'دخول آمن للمنظومة')}
              >
                {isLoading ? (
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                ) : (
                  <>
                    <span>{isRegistering ? 'إنشاء حساب الوكالة' : 'دخول آمن للمنظومة'}</span>
                    <span className="text-3xl" aria-hidden="true">🚀</span>
                  </>
                )}
              </button>
            </div>
            
            <p className="text-center text-slate-400 dark:text-slate-500 text-sm font-bold pt-4">
              {isRegistering ? 'بالتسجيل أنت توافق على شروط الاستخدام المتقدمة' : 'جميع البيانات مشفرة سحابياً ومحمية بالذكاء الاصطناعي'}
            </p>
          </form>
        </div>
      </div>
    </div>
  );
});

export default Login;