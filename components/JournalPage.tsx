

import React, { useState, useMemo } from 'react';
import { useAgency } from '../context/AgencyContext';
import { Currency, VoucherType, Sale, Purchase, Voucher, Expense, JournalEntryDisplay } from '../types'; // Import types
import ConfirmModal from './ConfirmModal';

const JournalPage: React.FC = React.memo(() => {
  const { sales, purchases, vouchers, expenses, rates, deleteSale, deletePurchase, deleteVoucher, deleteExpense } = useAgency();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<{ id: string, origin: string } | null>(null);

  const getYerAmount = (amount: number, currency: string) => {
    const rate = currency === Currency.SAR ? rates.SAR : currency === Currency.OMR ? rates.OMR : 1;
    return (amount || 0) * rate;
  };

  const allEntries = useMemo(() => {
    const entries: JournalEntryDisplay[] = [
      ...sales.map((s: Sale) => ({ 
        id: s.id,
        origin: 'sale', 
        type: 'بيع', 
        status: s.isReturn ? 'عليه' : 'له',
        statusColor: s.isReturn ? 'text-rose-600' : 'text-emerald-600',
        yerAmount: getYerAmount(s.total, s.currency), 
        desc: `${s.customerName} - صنف: ${s.qatType}`, 
        timestamp: s.date, 
        receipt: s.receiptUrl,
        currency: s.currency,
        amount: s.total,
      })),
      ...purchases.map((p: Purchase) => ({ 
        id: p.id,
        origin: 'purchase', 
        type: 'شراء', 
        status: p.isReturn ? 'له' : 'عليه',
        statusColor: p.isReturn ? 'text-emerald-600' : 'text-rose-600',
        yerAmount: getYerAmount(p.totalCost, p.currency), 
        desc: `${p.supplierName} - صنف: ${p.qatType}`, 
        timestamp: p.date, 
        receipt: p.receiptUrl,
        currency: p.currency,
        amount: p.totalCost,
      })),
      ...vouchers.map((v: Voucher) => ({ 
        id: v.id,
        origin: 'voucher', 
        type: v.type, 
        status: v.type === VoucherType.Receipt ? 'له' : 'عليه',
        statusColor: v.type === VoucherType.Receipt ? 'text-emerald-600' : 'text-rose-600',
        yerAmount: getYerAmount(v.amount, v.currency), 
        desc: v.notes || `${v.entityName} (${v.entityType === 'customer' ? 'عميل' : 'مورد'})`, 
        timestamp: v.date, 
        receipt: v.receiptUrl,
        currency: v.currency,
        amount: v.amount,
      })),
      ...expenses.map((e: Expense) => ({ 
        id: e.id,
        origin: 'expense', 
        type: 'مصروف', 
        status: 'عليه',
        statusColor: 'text-rose-600',
        yerAmount: getYerAmount(e.amount, e.currency), 
        desc: e.description, 
        timestamp: e.date, 
        receipt: e.receiptUrl,
        currency: e.currency,
        amount: e.amount,
      }))
    ];
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [sales, purchases, vouchers, expenses, rates]);

  const filteredEntries = useMemo(() => {
    return allEntries.filter((entry: JournalEntryDisplay) => { // Explicitly type 'entry' as 'JournalEntryDisplay'
      const matchesSearch = entry.desc.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            entry.type.includes(searchTerm);
      const matchesType = filterType === 'all' || entry.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [allEntries, searchTerm, filterType]);

  const handleDelete = () => {
    if (!deleteConfig) return;
    const { id, origin } = deleteConfig;
    if (origin === 'sale') deleteSale(id);
    else if (origin === 'purchase') deletePurchase(id);
    else if (origin === 'voucher') deleteVoucher(id);
    else if (origin === 'expense') deleteExpense(id);
    setDeleteConfig(null);
  };

  const typeStyles: Record<string, string> = {
    'بيع': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'شراء': 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    [VoucherType.Receipt]: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    [VoucherType.Payment]: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
    'مصروف': 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
  };

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-24 max-w-7xl mx-auto px-2 md:px-0">
      <ConfirmModal 
        isOpen={!!deleteConfig} 
        onClose={() => setDeleteConfig(null)} 
        onConfirm={handleDelete} 
        title="حذف عملية من اليومية"
        message="هل أنت متأكد من حذف هذه العملية؟ سيتم إزالتها نهائياً من السجلات."
      />
      
      {/* Premium Header */}
      <div className="bg-slate-900 p-6 md:p-12 rounded-[2rem] md:rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 p-16 opacity-5 pointer-events-none text-[8rem] md:text-[10rem] animate-float hidden md:block" aria-hidden="true">📑</div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-right">
             <h2 className="text-3xl md:text-6xl font-black mb-2">اليومية العامة</h2>
             <p className="text-sm md:text-xl opacity-70 font-bold">سجل العمليات المترابط والمدقق مالياً</p>
          </div>
          <button onClick={() => window.print()} className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-2xl shadow-xl transition-all flex items-center justify-center gap-2" aria-label="طباعة اليومية">🖨️ طباعة اليومية</button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[3rem] shadow-lg border border-slate-100 dark:border-slate-800">
        <div className="relative flex-grow group">
          <input 
            type="text" 
            placeholder="بحث بالوصف أو النوع..." 
            className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-[2rem] outline-none font-bold dark:text-white border-2 border-transparent focus:border-emerald-500 transition-all text-right text-base"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            aria-label="البحث في اليومية"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40" aria-hidden="true">🔍</span>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border dark:border-slate-700" role="group" aria-label="تصفية العمليات حسب النوع">
           <button onClick={() => setFilterType('all')} className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-md' : 'text-slate-400'}`}>الكل</button>
           <button onClick={() => setFilterType('بيع')} className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${filterType === 'بيع' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-md' : 'text-slate-400'}`}>مبيعات</button>
           <button onClick={() => setFilterType('شراء')} className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${filterType === 'شراء' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-md' : 'text-slate-400'}`}>مشتريات</button>
           <button onClick={() => setFilterType(VoucherType.Receipt)} className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${filterType === VoucherType.Receipt ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-md' : 'text-slate-400'}`}>قبض</button>
           <button onClick={() => setFilterType(VoucherType.Payment)} className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${filterType === VoucherType.Payment ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-md' : 'text-slate-400'}`}>دفع</button>
           <button onClick={() => setFilterType('مصروف')} className={`px-4 py-2 rounded-lg font-black text-xs transition-all ${filterType === 'مصروف' ? 'bg-white dark:bg-slate-700 text-emerald-700 shadow-md' : 'text-slate-400'}`}>مصاريف</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border-2 border-slate-300 dark:border-slate-800 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto p-4 md:p-8">
           <table className="excel-table w-full text-right" role="table" aria-label="سجل اليومية العامة">
             <thead>
               <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                 <th scope="col" className="p-4 border-l dark:border-slate-700">التاريخ والوقت</th>
                 <th scope="col" className="p-4 border-l dark:border-slate-700">البيان والتفاصيل</th>
                 <th scope="col" className="p-4 border-l dark:border-slate-700 text-center">مدين (+)</th>
                 <th scope="col" className="p-4 border-l dark:border-slate-700 text-center">دائن (-)</th>
                 <th scope="col" className="p-4 border-l dark:border-slate-700 text-left">الرصيد (يمني)</th>
                 <th scope="col" className="p-4 text-center print:hidden">إجراءات</th>
               </tr>
             </thead>
             <tbody>
               {filteredEntries.map((entry: JournalEntryDisplay, idx: number) => (
                 <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                   <td className="p-4 border-l dark:border-slate-700">
                     <div className="font-bold text-slate-500 text-xs">{new Date(entry.timestamp).toLocaleString('ar-YE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                     <span className={`px-2 py-0.5 rounded-md text-[9px] font-black mt-1 inline-block ${typeStyles[entry.type] || 'bg-slate-100 text-slate-500'}`}>{entry.type}</span>
                   </td>
                   <td className="p-4 border-l dark:border-slate-700">
                     <div className="font-black text-slate-900 dark:text-white text-base">{entry.desc}</div>
                     {entry.currency && entry.currency !== Currency.YER && (
                       <div className="text-[9px] text-slate-400 font-bold mt-1">
                         {entry.amount?.toLocaleString()} {entry.currency} (@{getYerAmount(1, entry.currency).toLocaleString()} ر.ي)
                       </div>
                     )}
                   </td>
                   <td className={`p-4 border-l dark:border-slate-700 text-center font-black text-rose-600`}>
                     {(entry.status === 'عليه' || entry.type === VoucherType.Payment || entry.type === 'مصروف') && entry.yerAmount > 0 ? entry.yerAmount.toLocaleString() : '-'}
                   </td>
                   <td className={`p-4 border-l dark:border-slate-700 text-center font-black text-emerald-600`}>
                     {(entry.status === 'له' || entry.type === VoucherType.Receipt) && entry.yerAmount > 0 ? entry.yerAmount.toLocaleString() : '-'}
                   </td>
                   <td className={`p-4 border-l dark:border-slate-700 text-left font-black ${entry.yerAmount >= 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                     {Math.abs(entry.yerAmount).toLocaleString()} <span className="text-xs font-normal opacity-50">ر.ي</span>
                   </td>
                   <td className="p-4 text-center print:hidden">
                     <div className="flex justify-center gap-2">
                       {entry.receipt && (
                         <a href={entry.receipt} target="_blank" rel="noopener noreferrer" className="p-3 bg-blue-50 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition" title="عرض الإيصال">📄</a>
                       )}
                       <button onClick={() => setDeleteConfig({ id: entry.id, origin: entry.origin })} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition" title="حذف العملية">🗑️</button>
                     </div>
                   </td>
                 </tr>
               ))}
               {filteredEntries.length === 0 && (
                 <tr>
                   <td colSpan={6} className="p-10 text-center text-slate-400 italic">لا توجد عمليات مطابقة في اليومية.</td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y dark:divide-slate-800" role="list">
          {filteredEntries.map((entry: JournalEntryDisplay, idx: number) => (
            <div key={entry.id} className="p-4 space-y-2" role="listitem">
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${typeStyles[entry.type] || 'bg-slate-100 text-slate-500'}`}>{entry.type}</span>
                  <div className="font-black text-slate-900 dark:text-white text-base">{entry.desc}</div>
                </div>
                <div className="font-bold text-slate-500 text-[10px]">{new Date(entry.timestamp).toLocaleDateString('ar-YE', { day: 'numeric', month: 'short' })}</div>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex gap-4 items-center">
                  <span className={`font-black text-base ${entry.status === 'عليه' || entry.type === VoucherType.Payment || entry.type === 'مصروف' ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {entry.yerAmount.toLocaleString()} <span className="text-[10px]">{Currency.YER}</span>
                  </span>
                </div>
                <div className="flex gap-2">
                  {entry.receipt && (
                    <a href={entry.receipt} target="_blank" rel="noopener noreferrer" className="p-2 bg-blue-50 text-blue-500 rounded-lg" title="عرض الإيصال">📄</a>
                  )}
                  <button onClick={() => setDeleteConfig({ id: entry.id, origin: entry.origin })} className="p-2 bg-red-50 text-red-500 rounded-lg" title="حذف العملية">🗑️</button>
                </div>
              </div>
            </div>
          ))}
          {filteredEntries.length === 0 && (
            <div className="p-10 text-center text-slate-400 italic">لا توجد عمليات مطابقة في اليومية.</div>
          )}
        </div>
      </div>
    </div>
  );
});

export default JournalPage;