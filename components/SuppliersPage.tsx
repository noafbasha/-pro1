
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { Supplier, Currency } from '../types';
import EntityStatementModal from './EntityStatementModal';
import ConfirmModal from './ConfirmModal';
import SearchableSelect from './SearchableSelect';

const SuppliersPage: React.FC = React.memo(() => {
  const { suppliers, supplierDebts, addSupplier, deleteSupplier, recordVoucher, rates } = useAgency();
  const { notify } = useNotify();
  const location = useLocation();
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEntityForStatement, setSelectedEntityForStatement] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [newSupplier, setNewSupplier] = useState({ 
    name: '', 
    phone: '', 
    category: 'تاجر',
    openingBalance: 0,
    openingBalanceDate: new Date().toISOString().split('T')[0]
  });

  // ميزة البحث عن مشابهات عند الإضافة
  const similarExisting = useMemo(() => {
    if (newSupplier.name.length < 2) return [];
    return suppliers.filter(s => s.name.includes(newSupplier.name)).slice(0, 3);
  }, [newSupplier.name, suppliers]);

  const [isVoucherOpen, setIsVoucherOpen] = useState(false);
  const [voucherData, setVoucherData] = useState({ 
    entityId: '', 
    type: 'payment' as 'payment' | 'receipt',
    amount: 0, 
    currency: Currency.YER,
    notes: '' 
  });

  useEffect(() => {
    if (location.state?.openVoucher) {
      setVoucherData(prev => ({ ...prev, type: location.state.type }));
      setIsVoucherOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    if (location.state?.showAdd) {
      setShowAddModal(true);
    }
  }, [location.state]);

  const handleAddSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSupplier.name.length < 3) return notify('يرجى إدخال اسم مورد صحيح', 'error');
    
    setIsSubmitting(true);
    try {
      await addSupplier({
        id: `s-${Date.now()}`,
        ...newSupplier,
        openingBalanceDate: new Date(newSupplier.openingBalanceDate).toISOString()
      });
      setShowAddModal(false);
      setNewSupplier({ name: '', phone: '', category: 'تاجر', openingBalance: 0, openingBalanceDate: new Date().toISOString().split('T')[0] });
      notify('تمت إضافة المورد بنجاح ✅', 'success');
    } catch (err) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoucherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherData.entityId) return notify('يرجى اختيار مورد أولاً', 'error');
    if (voucherData.amount <= 0) return notify('يرجى إدخال مبلغ صحيح', 'error');
    
    try {
      await recordVoucher(voucherData.entityId, 'supplier', voucherData.amount, voucherData.type, voucherData.currency, voucherData.notes);
      notify(`تم تسجيل سند ${voucherData.type === 'payment' ? 'دفع' : 'قبض'} بنجاح ✅`, 'success');
      setIsVoucherOpen(false);
    } catch (err) {
    }
  };

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-700 pb-32 max-w-7xl mx-auto px-2 md:px-0">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteSupplier(deleteId)} 
        title="حذف المورد"
        message="هل أنت متأكد من حذف المورد؟ سيتم مسح كافة الفواتير والديون المرتبطة به."
      />

      {selectedEntityForStatement && (
        <EntityStatementModal 
          entityId={selectedEntityForStatement} 
          entityType="supplier" 
          onClose={() => setSelectedEntityForStatement(null)} 
        />
      )}

      {/* Header */}
      <div className="bg-slate-900 p-6 md:p-16 rounded-[2rem] md:rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="absolute bottom-0 left-0 p-10 opacity-5 pointer-events-none text-[8rem] md:text-[12rem] animate-float rotate-12 hidden md:block" aria-hidden="true">🚜</div>
        <div className="relative z-10 text-center md:text-right">
           <div className="bg-white/10 w-fit px-4 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest border border-white/10 mb-4 mx-auto md:mx-0">Supply Chain</div>
           <h2 className="text-3xl md:text-7xl font-black mb-2 leading-tight">شركاء التوريد</h2>
           <p className="text-sm md:text-2xl opacity-70 font-tajawal max-w-lg leading-relaxed">إدارة حسابات التجار وتتبع الالتزامات المالية.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="w-full md:w-auto bg-white text-indigo-900 px-8 py-4 md:py-6 rounded-2xl md:rounded-3xl font-black text-lg md:text-2xl shadow-xl transition-all active:scale-95" aria-label="إضافة مورد جديد">
          <span>➕</span> مورد جديد
        </button>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-10" role="list">
        {suppliers.map(s => {
          const debt = supplierDebts.find(d => d.supplierId === s.id);
          const balYer = debt ? debt.balances.YER + (debt.balances.SAR * rates.SAR) + (debt.balances.OMR * rates.OMR) : 0;
          return (
            <div key={s.id} className="bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500 transition-all group relative overflow-hidden flex flex-col" role="listitem">
               <div className="flex justify-between items-start mb-6 md:mb-8 text-right">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 dark:bg-slate-800 rounded-2xl md:rounded-3xl flex items-center justify-center text-3xl md:text-4xl shadow-inner cursor-pointer" onClick={() => setSelectedEntityForStatement(s.id)} aria-label={`عرض كشف حساب المورد ${s.name}`} aria-hidden="true">🚜</div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-sm ${balYer > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {balYer > 0 ? 'مستحق له' : 'خالص'}
                  </div>
               </div>
               
               <button onClick={() => setSelectedEntityForStatement(s.id)} className="text-right block w-full group/name mb-2" aria-label={`عرض كشف حساب المورد ${s.name}`}>
                 <h4 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight group-hover/name:text-indigo-600 transition-colors">{s.name}</h4>
               </button>
               <p className="text-sm md:text-xl text-slate-500 font-bold mb-6 md:mb-8 text-right">{s.phone}</p>
               
               <div className={`p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] text-center mb-8 transition-colors cursor-pointer ${balYer > 0 ? 'bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400' : 'bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'}`} onClick={() => setSelectedEntityForStatement(s.id)} aria-label={`صافي الرصيد المستحق للمورد ${s.name} هو ${Math.abs(balYer).toLocaleString()} ر.ي`}>
                  <div className="text-[9px] md:text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest text-center">صافي الرصيد المستحق</div>
                  <div className="text-2xl md:text-4xl font-black tracking-tighter">{Math.abs(balYer).toLocaleString()} <span className="text-[10px] md:text-base font-normal opacity-50">ر.ي</span></div>
               </div>

               <div className="mt-auto grid grid-cols-2 gap-2 md:gap-4">
                  <button onClick={() => { setVoucherData({...voucherData, entityId: s.id, type: 'payment'}); setIsVoucherOpen(true); }} className="bg-rose-600 text-white py-4 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-xs md:text-lg shadow-lg active:scale-95 transition-all" aria-label={`صرف مبلغ للمورد ${s.name}`}>📤 صرف له</button>
                  <button onClick={() => { setVoucherData({...voucherData, entityId: s.id, type: 'receipt'}); setIsVoucherOpen(true); }} className="bg-blue-600 text-white py-4 md:py-5 rounded-xl md:rounded-[1.5rem] font-black text-xs md:text-lg shadow-lg active:scale-95 transition-all" aria-label={`قبض مبلغ من المورد ${s.name}`}>💰 قبض منه</button>
               </div>
               
               <button onClick={() => setDeleteId(s.id)} className="mt-4 text-[10px] font-black text-slate-300 hover:text-red-500 transition-colors text-center" aria-label={`حذف المورد ${s.name}`}>🗑️ حذف المورد</button>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-[150] flex items-center justify-center p-4 animate-in fade-in duration-300 overflow-y-auto" role="dialog" aria-modal="true" aria-labelledby="add-supplier-title">
          <div className="bg-white dark:bg-slate-900 w-full sm:max-w-2xl rounded-[2.5rem] md:rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in my-auto border-4 border-indigo-100 dark:border-indigo-900/20">
             <div className="p-6 md:p-10 bg-indigo-700 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="text-2xl md:text-4xl" aria-hidden="true">🚜</span>
                  <h3 id="add-supplier-title" className="text-xl md:text-3xl font-black">إضافة مورد جديد</h3>
                </div>
                <button onClick={() => setShowAddModal(false)} className="text-3xl" aria-label="إغلاق">✕</button>
             </div>
             <form onSubmit={handleAddSupplier} className="p-6 md:p-10 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2 relative">
                    <label htmlFor="supplier-name" className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-right block">اسم المورد</label>
                    <input 
                      id="supplier-name"
                      type="text" required autoFocus
                      className="w-full p-4 text-base md:text-xl border-4 border-slate-50 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white outline-none focus:border-indigo-500 transition font-bold text-right shadow-inner"
                      value={newSupplier.name}
                      onChange={e => setNewSupplier({...newSupplier, name: e.target.value})}
                      aria-required="true"
                    />

                    {/* عرض الموردين المشابهين */}
                    {similarExisting.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl p-4 shadow-xl animate-in slide-in-from-top-2" role="alert">
                         <p className="text-[10px] font-black text-indigo-600 mb-2 uppercase">⚠️ موردون مسجلون بأسماء مشابهة:</p>
                         <div className="space-y-2">
                            {similarExisting.map(s => (
                              <div key={s.id} className="flex justify-between items-center bg-white dark:bg-slate-800 p-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                 <span className="font-black text-sm dark:text-white">{s.name}</span>
                                 <span className="text-[10px] font-bold text-slate-400">{s.phone}</span>
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="supplier-phone" className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-right block">رقم الهاتف</label>
                    <input 
                      id="supplier-phone"
                      type="tel" required
                      className="w-full p-4 text-base md:text-xl border-4 border-slate-50 dark:border-slate-800 rounded-2xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:bg-white outline-none focus:border-indigo-500 transition font-bold text-right shadow-inner"
                      value={newSupplier.phone}
                      onChange={e => setNewSupplier({...newSupplier, phone: e.target.value})}
                      aria-required="true"
                    />
                  </div>
                </div>

                <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl md:rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900/20 space-y-4">
                  <h4 className="text-sm md:text-lg font-black text-indigo-700 flex items-center gap-2"><span>📂</span> مديونية سابقة</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                        type="number"
                        className="w-full p-4 text-base border-2 border-white dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold text-right shadow-sm"
                        value={newSupplier.openingBalance || ''}
                        onChange={e => setNewSupplier({...newSupplier, openingBalance: parseFloat(e.target.value) || 0})}
                        placeholder="المبلغ المستحق له.."
                        aria-label="المبلغ الافتتاحي للمورد"
                      />
                    <input
                        type="date"
                        className="w-full p-4 text-base border-2 border-white dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white outline-none focus:border-indigo-500 font-bold text-right shadow-sm"
                        value={newSupplier.openingBalanceDate}
                        onChange={e => setNewSupplier({...newSupplier, openingBalanceDate: e.target.value})}
                        placeholder="تاريخ استحقاق المديونية"
                        aria-label="تاريخ المديونية الافتتاحية للمورد"
                    />
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full bg-indigo-700 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl hover:bg-indigo-800 transition shadow-indigo-700/20 active:scale-95" aria-label="حفظ بيانات المورد الجديد">
                  {isSubmitting ? 'جاري الحفظ...' : 'حفظ بيانات المورد ✅'}
                </button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
});

export default SuppliersPage;