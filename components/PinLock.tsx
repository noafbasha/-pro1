
import React, { useState, useEffect } from 'react';
import { useAgency } from '../context/AgencyContext';

const PinLock: React.FC = React.memo(() => {
  const { unlockApp, profile, logout } = useAgency();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const handleKeypad = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError(false);
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      const success = unlockApp(pin);
      if (!success) {
        setError(true);
        setPin('');
        // اهتزاز بسيط في الموبايل عند الخطأ
        if ('vibrate' in navigator) navigator.vibrate(200);
      }
    }
  }, [pin, unlockApp]);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 flex flex-col items-center justify-center p-6 text-white font-['Tajawal']">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in duration-500">
        <div className="w-24 h-24 bg-emerald-600 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto shadow-2xl animate-float" aria-hidden="true">🌿</div>
        
        <div className="space-y-2">
           <h2 className="text-3xl font-black">مرحباً، {profile?.full_name?.split(' ')[0]}</h2>
           <p className="text-slate-400 font-bold">يرجى إدخال رمز الحماية للوصول</p>
        </div>

        <div className="flex justify-center gap-6 py-6">
          {[...Array(4)].map((_, i) => (
            <div 
              key={i} 
              className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
                i < pin.length 
                  ? 'bg-emerald-500 border-emerald-500 scale-125 shadow-[0_0_15px_rgba(16,185,129,0.5)]' 
                  : error ? 'border-red-500 animate-shake' : 'border-slate-700'
              }`}
              aria-label={i < pin.length ? `النقطة ${i + 1} مملوءة` : `النقطة ${i + 1} فارغة`}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6 max-w-[300px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
            <button 
              key={num}
              onClick={() => handleKeypad(num)}
              className="w-16 h-16 md:w-20 md:h-20 bg-slate-900/50 hover:bg-slate-800 rounded-full flex items-center justify-center text-3xl font-black transition-all active:scale-90 border border-slate-800/50"
              aria-label={`الرقم ${num}`}
            >
              {num}
            </button>
          ))}
          <button onClick={logout} className="text-rose-500 font-black text-sm hover:underline" aria-label="تسجيل الخروج">خروج</button>
          <button 
            onClick={() => handleKeypad('0')}
            className="w-16 h-16 md:w-20 md:h-20 bg-slate-900/50 hover:bg-slate-800 rounded-full flex items-center justify-center text-3xl font-black transition-all active:scale-90 border border-slate-800/50"
            aria-label="الرقم صفر"
          >
            0
          </button>
          <button 
            onClick={() => setPin(pin.slice(0, -1))}
            className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center text-2xl opacity-60 hover:opacity-100"
            aria-label="حذف آخر رقم"
          >
            ⌫
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}</style>
    </div>
  );
});

export default PinLock;