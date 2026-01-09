
import React, { useState, useMemo, useEffect } from 'react';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { PaymentStatus, QatType, Currency, DailyClosing, PAYMENT_TYPE_MARKER, VoucherType } from '../types';
import { formatDailyClosing, sendToWhatsApp } from '../services/messagingService';
import { supabase } from '../supabase';

const ClosingPage: React.FC = React.memo(() => { // Wrapped with React.memo
  const { sales, purchases, expenses, appSettings, vouchers, rates } = useAgency();
  const { notify } = useNotify();
  const [actualCash, setActualCash] = useState<number>(0);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.date.startsWith(today));
    const todayPurchases = purchases.filter((p) => p.date.startsWith(today));
    const todayExpenses = expenses.filter((e) => e.date.startsWith(today));
    const todayVouchers = vouchers.filter((v) => v.date.startsWith(today));

    const convertToYer = (val: number, curr: string) => {
      if (curr === Currency.SAR) return val * rates.SAR;
      if (curr === Currency.OMR) return val * rates.OMR;
      return val;
    };

    const cashInSales = todaySales.filter((s) => s.status === PaymentStatus.Cash).reduce((sum, s) => sum + convertToYer(Math.abs(s.total), s.currency), 0);
    const cashInReceipts = todayVouchers.filter((v) => v.type === VoucherType.Receipt).reduce((sum, v) => sum + convertToYer(Math.abs(v.amount), v.currency), 0);
    const cashIn = cashInSales + cashInReceipts;

    const cashOutPurchases = todayPurchases.filter((p) => p.status === PaymentStatus.Cash).reduce((sum, p) => sum + convertToYer(Math.abs(p.totalCost), p.currency), 0);
    const cashOutExpenses = todayExpenses.reduce((sum, e) => sum + convertToYer(e.amount, e.currency), 0);
    const cashOutPayments = todayVouchers.filter((v) => v.type === VoucherType.Payment).reduce((sum, v) => sum + convertToYer(Math.abs(v.amount), v.currency), 0);
    const cashOut = cashOutPurchases + cashOutExpenses + cashOutPayments;

    const expectedCash = cashIn - cashOut;
    const creditSales = todaySales.filter((s) => s.status === PaymentStatus.Credit && s.qatType !== PAYMENT_TYPE_MARKER).reduce((sum, s) => sum + convertToYer(s.total, s.currency), 0);

    return { 
      cashIn, cashOut, expectedCash, creditSales, 
      details: { 
        salesCount: todaySales.length,
        purchasesCount: todayPurchases.length,
        expensesCount: todayExpenses.length,
        vouchersCount: todayVouchers.length
      } 
    };
  }, [sales, purchases, expenses, vouchers, rates]);

  const diff = actualCash - stats.expectedCash;

  const handleFinalizeCloud = async () => {
    setIsFinalizing(true);
    try {
      const closingData = {
        date: new Date().toISOString().split('T')[0],
        expected_cash: stats.expectedCash,
        actual_cash: actualCash,
        difference: diff,
        total_sales: stats.cashIn + stats.creditSales,
        total_expenses: stats.cashOut
      };
      await supabase.functions.invoke('process-closing', { body: { closingData, settings: appSettings.integrations } });
      setIsFinalized(true);
      notify('تم ترحيل إغلاق الوردية سحابياً ✅', 'success');
    } catch (error: any) {
      notify(`خطأ في الإغلاق: ${error.message}`, 'error');
    } finally { setIsFinalizing(false); }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-12 animate-in fade-in duration-700 pb-32 px-2 md:px-4">
      
      {/* Header */}
      <div className="bg-slate-900 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-right relative z-10">
           <h2 className="text-3xl md:text-6xl font-black mb-2">تصفية الوردية اليومية</h2>
           <p className="text-sm md:text-xl opacity-70 font-bold">مطابقة النقد الفعلي مع السجلات الرقمية</p>
        </div>
        <div className="flex gap-2 w-full md:w-auto relative z-10">
           <button onClick={() => setShowPreview(true)} className="flex-1 md:flex-none bg-white/10 hover:bg-white/20 text-white px-6 py-4 rounded-2xl font-black text-sm md:text-lg border border-white/10 transition-all" aria-label="معاينة بيان الإغلاق">📑 معاينة البيان</button>
           <button onClick={() => sendToWhatsApp(appSettings.agency.phone || '777000000', formatDailyClosing({...stats, date: new Date().toLocaleDateString(), actualCash, diff}))} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-4 rounded-2xl font-black text-sm md:text-lg shadow-lg flex items-center justify-center gap-2" aria-label="إرسال التقرير عبر واتساب">🟢 واتساب</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-10">
        {/* Left Column: Cash Entry */}
        <div className="lg:col-span-1 space-y-6">
           <div className={`p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border-4 md:border-8 transition-all relative overflow-hidden ${
              diff === 0 ? 'bg-emerald-600 border-emerald-400' : diff < 0 ? 'bg-rose-600 border-rose-400' : 'bg-indigo-600 border-indigo-400'
           } text-white text-center`}>
              <h3 className="text-xl md:text-2xl font-black mb-10">💵 جرد الصندوق الفعلي</h3>
              <input 
                type="number"
                className="w-full p-6 md:p-10 bg-white/10 rounded-[2rem] border-2 border-white/20 outline-none text-4xl md:text-7xl font-black text-center focus:bg-white/20 transition-all placeholder:text-white/20"
                placeholder="0"
                value={actualCash || ''}
                onChange={e => setActualCash(parseFloat(e.target.value) || 0)}
                aria-label="مبلغ الجرد الفعلي للصندوق"
              />
              <div className="mt-8 p-6 bg-black/20 rounded-[2rem] border border-white/10">
                 <div className="text-3xl md:text-5xl font-black tracking-tighter">
                   {diff === 0 ? '✔️ مطابق' : (diff > 0 ? '+' : '') + diff.toLocaleString()}
                 </div>
                 <span className="text-[10px] font-bold opacity-60 uppercase mt-2 block">فارق الصندوق (ر.ي)</span>
              </div>
           </div>

           <button 
              onClick={handleFinalizeCloud}
              disabled={isFinalized || isFinalizing}
              className={`w-full py-6 md:py-8 rounded-[2rem] md:rounded-[3rem] font-black text-xl md:text-2xl shadow-xl transition-all active:scale-95 flex flex-col items-center justify-center gap-2
                ${isFinalized ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-slate-900 dark:bg-emerald-700 text-white shadow-emerald-500/20'}`}
              aria-label={isFinalizing ? 'جاري ترحيل البيانات...' : isFinalized ? 'تم الترحيل سحابياً' : 'اعتماد وترحيل الوردية'}
           >
              {isFinalizing ? 'جاري ترحيل البيانات...' : isFinalized ? '✅ تم الترحيل سحابياً' : 'اعتماد وترحيل الوردية 🚀'}
           </button>
        </div>

        {/* Right Column: Summaries */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4 md:gap-8">
            <SummaryTile title="نقد الداخل" value={stats.cashIn} color="text-emerald-600" bg="bg-emerald-50 dark:bg-emerald-950/20" icon="📥" sub={`${stats.details.salesCount} بيع | ${stats.details.vouchersCount} قبض`} />
            <SummaryTile title="نقد الخارج" value={stats.cashOut} color="text-rose-600" bg="bg-rose-50 dark:bg-rose-950/20" icon="📤" sub={`${stats.details.expensesCount} مصرف | ${stats.details.purchasesCount} توريد`} />
            <SummaryTile title="الرصيد الدفتري" value={stats.expectedCash} color="text-indigo-600" bg="bg-indigo-50 dark:bg-indigo-950/20" icon="⚖️" sub="الصافي المطلوب توفره في الصندوق" />
            <SummaryTile title="مبيعات آجلة" value={stats.creditSales} color="text-amber-600" bg="bg-amber-50 dark:bg-amber-950/20" icon="📝" sub="إجمالي المبيعات التي قيدت كديون" />
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="closing-preview-title">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowPreview(false)} aria-label="إغلاق معاينة البيان"></div>
           <div className="relative w-full sm:max-w-2xl bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in border-4 border-slate-100 dark:border-slate-800 my-auto max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="p-8 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b dark:border-slate-700 text-right">
                 <h3 id="closing-preview-title" className="text-xl md:text-3xl font-black">📄 بيان تصفية وردية</h3>
                 <button onClick={() => setShowPreview(false)} className="w-12 h-12 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-2xl shadow-sm" aria-label="إغلاق">✕</button>
              </div>
              <div className="p-8 md:p-12 space-y-6 text-right font-tajawal max-h-[60vh] overflow-y-auto no-scrollbar">
                 <div className="border-b-2 border-dashed border-slate-200 dark:border-slate-700 pb-4 text-center">
                    <h4 className="text-2xl font-black uppercase text-indigo-600">{appSettings.agency.name}</h4>
                    <p className="text-sm font-bold text-slate-400 mt-1">تقرير جرد وإغلاق الصندوق</p>
                    <p className="text-xs text-slate-400 mt-2">التاريخ: {new Date().toLocaleString('ar-YE')}</p>
                 </div>
                 <div className="space-y-4 text-lg md:text-xl">
                    <div className="flex justify-between"><span>إجمالي المتحصلات النقدية:</span> <span className="font-black text-emerald-600">{stats.cashIn.toLocaleString()}</span></div>
                    <div className="flex justify-between"><span>إجمالي المنصرفات النقدية:</span> <span className="font-black text-rose-600">{stats.cashOut.toLocaleString()}</span></div>
                    <div className="flex justify-between border-t-2 border-slate-50 dark:border-slate-800 pt-4">
                       <span className="font-black">الصافي الدفتري (المتوقع):</span> 
                       <span className="font-black text-indigo-600">{stats.expectedCash.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between"><span>الجرد الفعلي:</span> <span className="font-black">{actualCash.toLocaleString()}</span></div>
                    <div className="flex justify-between font-black text-2xl border-t-2 border-slate-100 dark:border-slate-800 pt-4">
                       <span>فارق الوردية:</span> 
                       <span className={diff === 0 ? 'text-emerald-600' : 'text-rose-600'}>{diff.toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="pt-8 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 font-bold italic">
                    * يعتبر هذا البيان تقريراً داخلياً للمطابقة اللحظية *
                 </div>
              </div>
              <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                 <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl active:scale-95" aria-label="طباعة البيان">🖨️ طباعة البيان</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
});

const SummaryTile = ({ title, value, color, bg, icon, sub }: {title: string, value: number, color: string, bg: string, icon: string, sub: string}) => (
  <div className={`p-6 md:p-10 rounded-[2.5rem] ${bg} border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition-all flex flex-col justify-between group`}>
     <div className="flex justify-between items-start mb-6">
        <span className="text-2xl md:text-5xl group-hover:scale-110 transition-transform" aria-hidden="true">{icon}</span>
        <div className="text-right">
           <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest block">{title}</span>
           <p className="text-[8px] md:text-[10px] text-slate-400 font-bold mt-1 opacity-60 leading-tight">{sub}</p>
        </div>
     </div>
     <div className={`text-2xl md:text-4xl font-black ${color} tracking-tighter truncate text-left`}>
        {(value as number).toLocaleString()} <span className="text-[10px] md:text-base font-normal opacity-50">ر.ي</span>
     </div>
  </div>
);

export default ClosingPage;