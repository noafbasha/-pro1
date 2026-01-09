

import React, { useMemo, useState, useRef } from 'react';
import { useAgency } from '../context/AgencyContext';
import { Currency, VoucherType, Sale, Purchase, Voucher, Customer, Supplier, StatementTransaction, DetailedStatementRow } from '../types'; // Import necessary types
import { formatDetailedStatement, sendToWhatsApp } from '../services/messagingService';
import { tafqit } from '../services/numberUtils';
import { useNotify } from '../context/NotificationContext';

declare const html2pdf: any;

interface Props {
  entityId: string;
  entityType: 'customer' | 'supplier';
  onClose: () => void;
}

const EntityStatementModal: React.FC<Props> = ({ entityId, entityType, onClose }) => {
  const { sales, purchases, vouchers, rates, rateHistory, customers, suppliers, appSettings } = useAgency();
  const { notify } = useNotify();
  const [viewMode, setViewMode] = useState<'YER' | 'ORIGINAL'>('YER');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  const entity = useMemo(() => {
    return entityType === 'customer' 
      ? customers.find((c: Customer) => c.id === entityId)
      : suppliers.find((s: Supplier) => s.id === entityId);
  }, [entityId, entityType, customers, suppliers]);

  const getRateAtDate = (date: string, currency: string) => {
    if (currency === Currency.YER) return 1;
    const txDate = new Date(date).toLocaleDateString('en-CA');
    const historical = rateHistory.find(h => {
      const hDate = new Date(h.date).toLocaleDateString('en-CA');
      return hDate === txDate;
    });
    return historical ? (historical[currency as 'SAR' | 'OMR'] || rates[currency as 'SAR' | 'OMR']) : rates[currency as 'SAR' | 'OMR'];
  };

  const transactions = useMemo(() => {
    let list: StatementTransaction[] = [];
    if (entity && entity.openingBalance) {
      list.push({
        date: entity.openingBalanceDate || new Date(0).toISOString(),
        desc: entity.openingBalanceNotes || 'رصيد افتتاح (مديونية سابقة)',
        debit: entity.openingBalance > 0 ? entity.openingBalance : 0,
        credit: entity.openingBalance < 0 ? Math.abs(entity.openingBalance) : 0,
        currency: entity.openingBalanceCurrency || Currency.YER,
        ref: 'افتتاحي'
      });
    }

    if (entityType === 'customer') {
      const customerSales = sales.filter((s: Sale) => s.customerId === entityId);
      const customerVouchers = vouchers.filter((v: Voucher) => v.entityId === entityId && v.entityType === 'customer');
      list = [...list, 
        ...customerSales.map((s: Sale) => ({ date: s.date, desc: `${s.isReturn ? 'مرتجع: ' : ''}${s.qatType} (${s.quantity})`, debit: s.isReturn ? 0 : s.total, credit: s.isReturn ? s.total : 0, currency: s.currency, ref: 'فاتورة' })),
        ...customerVouchers.map((v: Voucher) => ({ date: v.date, desc: v.notes || (v.type === VoucherType.Receipt ? 'دفعة نقدية' : 'صرف نقدي'), debit: v.type === VoucherType.Payment ? v.amount : 0, credit: v.type === VoucherType.Receipt ? v.amount : 0, currency: v.currency, ref: v.type }))
      ];
    } else {
      const supplierPurchases = purchases.filter((p: Purchase) => p.supplierId === entityId);
      const supplierVouchers = vouchers.filter((v: Voucher) => v.entityId === entityId && v.entityType === 'supplier');
      list = [...list,
        ...supplierPurchases.map((p: Purchase) => ({ date: p.date, desc: `${p.isReturn ? 'مرتجع: ' : ''}${p.qatType} (${p.quantity})`, debit: p.isReturn ? p.totalCost : 0, credit: p.isReturn ? 0 : p.totalCost, currency: p.currency, ref: 'توريد' })),
        ...supplierVouchers.map((v: Voucher) => ({ date: v.date, desc: v.notes || (v.type === VoucherType.Payment ? 'تسديد دفعة' : 'استلام مبلغ'), debit: v.type === VoucherType.Payment ? v.amount : 0, credit: v.type === VoucherType.Receipt ? v.amount : 0, currency: v.currency, ref: v.type }))
      ];
    }
    return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [entityId, entityType, sales, purchases, vouchers, entity]);

  const statementRows = useMemo(() => {
    let runningBalanceYer = 0;
    return transactions.map((t: StatementTransaction) => { // Explicitly type 't' as 'StatementTransaction'
      const rateUsed = getRateAtDate(t.date, t.currency);
      const debitYer = t.debit * rateUsed;
      const creditYer = t.credit * rateUsed;
      runningBalanceYer += (debitYer - creditYer);
      return { ...t, debitYer, creditYer, balanceYer: runningBalanceYer, rateAtTime: rateUsed };
    });
  }, [transactions, rates, rateHistory]);

  const finalBalance = statementRows.length > 0 ? statementRows[statementRows.length - 1].balanceYer : 0;
  const summary = finalBalance >= 0 ? 
    { label: 'عليه (مدين)', color: 'text-rose-600', icon: '🔺' } : 
    { label: 'له (دائن)', color: 'text-emerald-600', icon: '🔹' };

  const verbalBalance = useMemo(() => tafqit(Math.abs(finalBalance)), [finalBalance]);

  const handleSendPdfToWhatsapp = async () => {
    if (!pdfRef.current) return;
    setIsGeneratingPdf(true);
    notify('جاري تجهيز كشف الحساب للإرسال... 📄', 'info');

    const element = pdfRef.current;
    const cleanFilename = `Statement_${entity?.name?.replace(/\s+/g, '_') || 'unknown'}_${Date.now()}.pdf`;
    
    // خيارات متقدمة لضمان التقاط الألوان بشكل صحيح وتجاوز الوضع الليلي
    const opt = {
      margin: 10,
      filename: cleanFilename,
      image: { type: 'jpeg', quality: 1 },
      html2canvas: { 
        scale: 3, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff', // فرض خلفية بيضاء
        onclone: (clonedDoc: Document) => {
          const content = clonedDoc.getElementById('statement-capture-area');
          if (content) {
            // فرض اللون الأسود للنصوص والبيضاء للخلفية لضمان عدم ظهور شاشة بيضاء
            clonedDoc.documentElement.classList.remove('dark'); // إزالة الوضع الداكن من الـ HTML
            clonedDoc.body.style.backgroundColor = '#ffffff';
            clonedDoc.body.style.color = '#000000';
            
            // تنظيف أي عناصر مظللة أو مغبشة
            const allElements = content.querySelectorAll('*');
            allElements.forEach((el: HTMLElement) => { // Explicitly type 'el' as HTMLElement
              el.style.filter = 'none';
              el.style.backdropFilter = 'none';
              el.style.color = 'inherit'; // استعادة لون النص الافتراضي
              if (el.classList.contains('privacy-blur')) {
                el.classList.remove('privacy-blur');
              }
              // التأكد من أن الجداول لها حدود واضحة في الـ PDF
              if (el.tagName === 'TABLE' || el.tagName === 'TD' || el.tagName === 'TH') {
                el.style.borderColor = '#cccccc';
                el.style.color = '#000000';
              }
            });
            
            // فرض ألوان خاصة للمبالغ المالية لتكون واضحة
            content.querySelectorAll('.text-rose-600').forEach((el: HTMLElement) => el.style.color = '#dc2626');
            content.querySelectorAll('.text-emerald-600').forEach((el: HTMLElement) => el.style.color = '#059669');
            // تغيير لون text-slate-400 إلى الأزرق
            content.querySelectorAll('.text-slate-400').forEach((el: HTMLElement) => el.style.color = '#0000FF'); 
            // تغيير لون dark:text-white إلى الأسود
            content.querySelectorAll('.dark:text-white').forEach((el: HTMLElement) => el.style.color = '#000000'); 
            content.querySelectorAll('.dark:bg-slate-900').forEach((el: HTMLElement) => el.style.backgroundColor = '#ffffff'); // الخلفيات الداكنة تصبح بيضاء
            content.querySelectorAll('.dark:border-slate-800').forEach((el: HTMLElement) => el.style.borderColor = '#e2e8f0'); // حدود داكنة تصبح فاتحة
          }
        }
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
    };

    try {
      const pdfBlob = await html2pdf().from(element).set(opt).output('blob');
      const file = new File([pdfBlob], cleanFilename, { type: 'application/pdf' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `كشف حساب - ${entity?.name}`,
            text: `مرفق لكم كشف الحساب التفصيلي من وكالة الشويع للقات.`
          });
          notify('تم إرسال الملف بنجاح ✅', 'success');
        } catch (shareError: any) {
          if (shareError.name !== 'AbortError') throw shareError;
        }
      } else {
        await html2pdf().from(element).set(opt).save();
        notify('تم تحميل كشف الحساب، يرجى إرساله يدوياً عبر واتساب 📥', 'info');
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      notify('فشل في توليد ملف PDF. يرجى المحاولة مرة أخرى.', 'error');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 md:p-8 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" onClick={onClose}></div>
      
      <div className="relative w-full sm:max-w-7xl bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl flex flex-col h-[95vh] md:h-[90vh] overflow-hidden border border-white/10">
        
        {/* Header Controls */}
        <div className="p-4 md:p-8 bg-slate-100 dark:bg-slate-800 flex flex-col md:flex-row justify-between items-center border-b dark:border-slate-700 gap-4 no-print">
          <div className="flex items-center gap-4">
            <button onClick={onClose} className="md:hidden w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xl">✕</button>
            <div>
              <h3 className="text-xl md:text-3xl font-black dark:text-white leading-tight">كشف حساب تفصيلي</h3>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-wider">{entity?.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center">
             <button onClick={() => setViewMode(viewMode === 'YER' ? 'ORIGINAL' : 'YER')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-black text-xs md:text-sm">
                💱 {viewMode === 'YER' ? 'العملة الأصلية' : 'عرض باليمني'}
             </button>
             <button 
                onClick={handleSendPdfToWhatsapp} 
                disabled={isGeneratingPdf}
                className={`bg-green-600 text-white px-4 py-2 rounded-xl font-black text-xs md:text-sm shadow-md flex items-center gap-2 transition-all ${isGeneratingPdf ? 'opacity-50' : 'hover:scale-105'}`}
              >
                {isGeneratingPdf ? '⏳ جاري التجهيز...' : '🟢 إرسال PDF واتساب'}
             </button>
             <button onClick={() => sendToWhatsApp(entity?.phone || '', formatDetailedStatement(entity?.name || '', entityType, statementRows))} className="bg-slate-700 text-white px-4 py-2 rounded-xl font-black text-xs md:text-sm shadow-md">💬 نص واتساب</button>
             <button onClick={() => window.print()} className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs md:text-sm shadow-md">🖨️ طباعة</button>
          </div>
        </div>

        {/* PDF Content Area */}
        <div 
          ref={pdfRef}
          id="statement-capture-area"
          className="flex-grow overflow-y-auto no-scrollbar p-6 md:p-12 bg-white dark:bg-slate-900 text-slate-900 dark:text-white print:p-0"
        >
          {/* Header for PDF */}
          <div className="hidden print:block mb-10 border-b-4 border-slate-900 pb-6 text-right">
             <div className="flex justify-between items-start">
                <div className="text-left text-black">
                   <h2 className="text-3xl font-black uppercase">وكالة الشويع للقات</h2>
                   <p className="text-sm font-bold text-slate-500">إدارة التوريد والمبيعات الذكية</p>
                   <p className="text-xs text-slate-400 mt-1">تلفون: {appSettings.agency.phone || '777000000'}</p>
                </div>
                <div className="text-4xl">🌿</div>
             </div>
             <div className="mt-8 bg-slate-100 p-4 rounded-xl flex justify-between items-center text-black">
                <div className="text-right">
                   <span className="text-[10px] font-black text-slate-400 block uppercase">اسم العميل/المورد</span>
                   <span className="text-2xl font-black">{entity?.name}</span>
                </div>
                <div className="text-left">
                   <span className="text-[10px] font-black text-slate-400 block uppercase">تاريخ التصدير</span>
                   <span className="font-bold">{new Date().toLocaleDateString('ar-YE')}</span>
                </div>
             </div>
          </div>

          <div className="mb-8 flex justify-between items-end border-b dark:border-slate-800 pb-6">
              <div className="text-right">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">الرصيد الختامي المستحق</span>
                 <div className={`text-4xl md:text-7xl font-black tracking-tighter ${summary.color} ${appSettings.appearance.privacyMode ? 'privacy-blur' : ''}`}>
                   {Math.abs(finalBalance).toLocaleString()} <span className="text-xs md:text-xl font-normal opacity-50">ر.ي</span>
                 </div>
                 <div className="mt-2 text-xs md:text-lg font-bold text-slate-500 italic">
                   {verbalBalance}
                 </div>
              </div>
              <div className={`px-4 py-2 rounded-2xl font-black text-sm md:text-2xl border-2 shadow-sm ${summary.color.replace('text', 'border')} ${summary.color}`}>
                 {summary.icon} {summary.label}
              </div>
          </div>

          <div className="overflow-x-auto"> {/* Added overflow-x-auto for horizontal scrolling */}
            <table className="w-full text-sm md:text-lg border-collapse min-w-[700px]"> {/* Added min-w to force scroll on small screens */}
              <thead>
                <tr className="bg-slate-900 text-white text-right">
                  <th className="p-4 border border-slate-700">التاريخ</th>
                  <th className="p-4 border border-slate-700">البيان والتفاصيل</th>
                  <th className="p-4 text-center border border-slate-700">مدين (+)</th>
                  <th className="p-4 text-center border border-slate-700">دائن (-)</th>
                  <th className="p-4 text-left border border-slate-700">الرصيد</th>
                </tr>
              </thead>
              <tbody>
                {statementRows.map((row: DetailedStatementRow, idx: number) => (
                  <tr key={idx} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-slate-500 text-[10px] md:text-sm">{new Date(row.date).toLocaleDateString('ar-YE')}</td>
                    <td className="p-4 text-right">
                       <div className="font-black text-slate-800 dark:text-white leading-tight">{row.desc}</div>
                       {row.currency !== 'YER' && <div className="text-[9px] md:text-xs text-indigo-500 font-bold mt-1">صرف: {row.rateAtTime.toLocaleString()} ({row.currency})</div>}
                    </td>
                    <td className={`p-4 text-center text-rose-600 font-black ${appSettings.appearance.privacyMode ? 'privacy-blur' : ''}`}>
                      {row.debit > 0 ? (viewMode === 'YER' ? row.debitYer.toLocaleString() : `${row.debit.toLocaleString()} ${row.currency}`) : '-'}
                    </td>
                    <td className={`p-4 text-center text-emerald-600 font-black ${appSettings.appearance.privacyMode ? 'privacy-blur' : ''}`}>
                      {row.credit > 0 ? (viewMode === 'YER' ? row.creditYer.toLocaleString() : `${row.credit.toLocaleString()} ${row.currency}`) : '-'}
                    </td>
                    <td className={`p-4 text-left font-black ${row.balanceYer >= 0 ? 'text-rose-600' : 'text-emerald-600'} ${appSettings.appearance.privacyMode ? 'privacy-blur' : ''}`}>
                      {Math.abs(row.balanceYer).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="hidden print:grid grid-cols-2 gap-10 mt-16 pt-10 border-t-2 border-dashed border-slate-300 text-black">
             <div className="text-center space-y-4">
                <p className="font-black text-slate-400 uppercase text-xs tracking-widest">توقيع المحاسب</p>
                <div className="h-20 w-48 mx-auto border-2 border-slate-100 rounded-2xl flex items-center justify-center italic text-slate-300 font-bold">ختم الوكالة المعتمد</div>
             </div>
             <div className="text-center space-y-4">
                <p className="font-black text-slate-400 uppercase text-xs tracking-widest">توقيع المستلم</p>
                <div className="h-20 w-48 mx-auto border-2 border-slate-100 rounded-2xl"></div>
             </div>
             <div className="col-span-2 text-center pt-10 opacity-30">
                <p className="text-[10px] font-black uppercase tracking-[0.5em]">Powered by Shuway Smart Accounting System v3.1</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EntityStatementModal;