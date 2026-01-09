
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LandingPage: React.FC = React.memo(() => { // Wrapped with React.memo
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 font-['Tajawal'] overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center pt-12 md:pt-24 px-6 md:px-12 overflow-hidden">
        {/* Advanced Background Patterns */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/arabesque.png')]"></div>
        </div>
        
        {/* Dynamic Glow Orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-brandGreen/10 rounded-full blur-[100px] animate-float"></div>

        <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-top-10 duration-1000">
          {/* Enhanced Logo Container */}
          <div className="inline-block relative mb-4 group">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
            <div className="relative w-28 h-28 md:w-32 md:h-32 bg-gradient-to-br from-emerald-600 to-green-800 rounded-[2.5rem] flex items-center justify-center text-5xl md:text-6xl shadow-2xl border-4 border-white/30 dark:border-white/10 animate-float">
              🌿
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl md:text-8xl lg:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1]">
              وكالة <span className="text-emerald-600 dark:text-brandGreen">الشويع</span> <br/> 
              <span className="text-3xl md:text-5xl lg:text-6xl opacity-90 font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                المحاسب الذكي للقات
              </span>
            </h1>
            
            <p className="max-w-3xl mx-auto text-lg md:text-2xl text-slate-600 dark:text-slate-400 font-medium leading-relaxed px-4">
              إدارة ذكية، تقارير دقيقة، وتجربة مستخدم فريدة صُممت خصيصاً لتناسب احتياجات سوق القات اليمني العريق.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-5 pt-10">
            <button 
              onClick={() => navigate('/dashboard')}
              className="group relative px-14 py-6 bg-emerald-700 hover:bg-emerald-600 text-white rounded-[2.5rem] font-black text-2xl shadow-[0_20px_50px_rgba(4,120,87,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center gap-4 overflow-hidden"
            >
              <span className="relative z-10">دخول النظام</span>
              <span className="text-3xl group-hover:translate-x-2 transition-transform relative z-10">🚀</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
            </button>
            
            <Link 
              to="/developer"
              className="px-14 py-6 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md text-slate-900 dark:text-white rounded-[2.5rem] font-black text-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center"
            >
              تعرف على المطور
            </Link>
          </div>
        </div>

        {/* Floating Stats or Badges */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-8 opacity-40 grayscale group-hover:grayscale-0 transition-all hidden md:flex">
             <div className="flex flex-col items-center"><span className="text-3xl font-black">100%</span><span className="text-[10px] font-bold uppercase tracking-widest">محلي</span></div>
             <div className="w-px h-10 bg-slate-300 dark:bg-slate-700"></div>
             <div className="flex flex-col items-center"><span className="text-3xl font-black">OFFLINE</span><span className="text-[10px] font-bold uppercase tracking-widest">يعمل بدون نت</span></div>
             <div className="w-px h-10 bg-slate-300 dark:bg-slate-700"></div>
             <div className="flex flex-col items-center"><span className="text-3xl font-black">AI-V3</span><span className="text-[10px] font-bold uppercase tracking-widest">ذكاء اصطناعي</span></div>
        </div>
      </section>

      {/* Modern Features Grid */}
      <section className="py-24 px-6 md:px-12 bg-white dark:bg-slate-900/50 relative">
        <div className="max-w-7xl mx-auto space-y-20">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-6xl font-black dark:text-white tracking-tight">قوة التكنولوجيا في خدمتك</h2>
            <div className="w-32 h-2.5 bg-gradient-to-r from-emerald-600 to-green-400 mx-auto rounded-full shadow-lg shadow-emerald-600/20"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon="🧠" 
              title="ذكاء اصطناعي مُعزز" 
              desc="مساعد ذكي يفهم لهجتك، يسجل المبيعات والديون صوتياً، ويحلل أداءك المالي ليقدم لك نصائح ذهبية."
              color="bg-emerald-500"
            />
            <FeatureCard 
              icon="📡" 
              title="عمليات بدون إنترنت" 
              desc="بياناتك محفوظة في هاتفك دائماً. لا تقلق من انقطاع الإنترنت أو بطء الاتصال، النظام يعمل بكل طاقته."
              color="bg-blue-500"
            />
            <FeatureCard 
              icon="💹" 
              title="إدارة مالية شاملة" 
              desc="تتبع ديون العملاء، التزامات الموردين، وجرد المخزن لحظة بلحظة مع كشوفات حساب احترافية."
              color="bg-amber-500"
            />
          </div>
        </div>
      </section>

      {/* Enhanced Developer Section */}
      <section id="developer" className="py-24 px-6 md:px-12 bg-slate-50 dark:bg-slate-950/50 relative overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white dark:bg-slate-900 p-10 md:p-20 rounded-[4rem] shadow-2xl border border-slate-100 dark:border-slate-800 relative group overflow-hidden">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-600/5 rounded-full group-hover:scale-150 transition-transform duration-1000"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500/20 blur-3xl rounded-full"></div>
                <div className="relative w-40 h-40 md:w-56 md:h-56 bg-slate-100 dark:bg-slate-800 rounded-[3.5rem] flex items-center justify-center text-7xl md:text-8xl shadow-inner border-4 border-white dark:border-slate-700 group-hover:rotate-6 transition-transform">
                  👨‍💻
                </div>
              </div>
              
              <div className="text-center md:text-right space-y-8 flex-grow">
                <div>
                  <span className="text-xs font-black text-emerald-600 dark:text-brandGreen uppercase tracking-[0.4em] mb-3 block">المهندس المطور</span>
                  <h3 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter">عبدالكريم الجعفري</h3>
                </div>
                
                <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                  نحن نطور حلولاً برمجية ذكية تجعل إدارة الأعمال أكثر سهولة وفعالية، مع التركيز على الخصوصية والسرعة في بيئات العمل اليمنية.
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-4">
                  <ContactLink icon="📞" label="779816860" href="tel:779816860" />
                  <ContactLink icon="📧" label="alkarime0@gmail.com" href="mailto:alkarime0@gmail.com" />
                  <ContactLink icon="💬" label="واتساب مباشر" href="https://wa.me/967779816860" color="bg-emerald-600 text-white" />
                </div>
                <div className="pt-6">
                   <Link to="/developer" className="text-emerald-600 font-black text-lg underline underline-offset-8 decoration-2 hover:text-emerald-500 transition-colors">عرض الصفحة الكاملة للمطور ➔</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 text-center border-t border-slate-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center gap-6">
          <div className="text-3xl grayscale opacity-50">🌿</div>
          <p className="font-black text-sm uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">
            &copy; {new Date().getFullYear()} وكالة الشويع - جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
});

const FeatureCard = ({ icon, title, desc, color }: any) => (
  <div className="p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:border-emerald-500 transition-all hover:-translate-y-3 shadow-xl shadow-slate-200/50 dark:shadow-none group overflow-hidden relative">
    <div className={`absolute top-0 right-0 w-2 h-full ${color}`}></div>
    <div className="text-6xl mb-8 group-hover:scale-110 transition-transform inline-block">{icon}</div>
    <h3 className="text-3xl font-black dark:text-white mb-4 tracking-tight">{title}</h3>
    <p className="text-lg text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{desc}</p>
  </div>
);

const ContactLink = ({ icon, label, href, color = "bg-white dark:bg-slate-800 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-700" }: any) => (
  <a 
    href={href} 
    className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all hover:scale-105 active:scale-95 shadow-sm ${color}`}
  >
    <span className="text-xl">{icon}</span> {label}
  </a>
);

export default LandingPage;