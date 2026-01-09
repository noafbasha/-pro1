
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { Currency, PaymentStatus, Sale, PAYMENT_TYPE_MARKER } from '../types';
import TransactionSuccessModal from './TransactionSuccessModal';
import ConfirmModal from './ConfirmModal';
import SearchableSelect from './SearchableSelect';

const SalesPage: React.FC = React.memo(() => {
  const { customers, sales, addSale, deleteSale, qatTypes, appSettings } = useAgency();
  const { notify } = useNotify();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: '',
    qatType: '',
    quantity: 0,
    unitPrice: 0,
    currency: Currency.YER,
    status: PaymentStatus.Cash,
    notes: '',
    isReturn: false
  });

  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; transaction: any } | null>(null);
  const [printingSale, setPrintingSale] = useState<Sale | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (qatTypes.length > 0 && !formData.qatType) {
      setFormData(prev => ({ ...prev, qatType: qatTypes[0] }));
    }
  }, [qatTypes, formData.qatType]);

  useEffect(() => {
    if (location.state && location.state.status) {
      const newStatus = location.state.status;
      setFormData(prev => ({ 
        ...prev, 
        status: newStatus,
        currency: appSettings.sales.defaultCurrency || Currency.YER,
        customerId: newStatus === PaymentStatus.Cash ? 'general' : prev.customerId 
      }));
    } else {
      setFormData(prev => ({ ...prev, customerId: 'general', currency: appSettings.sales.defaultCurrency || Currency.YER }));
    }
  }, [location.state, appSettings.sales.defaultCurrency]);

  const handleStatusChange = (newStatus: PaymentStatus) => {
    setFormData(prev => ({
      ...prev,
      status: newStatus,
      customerId: newStatus === PaymentStatus.Cash ? 'general' : (prev.customerId === 'general' ? '' : prev.customerId)
    }));
  };

  const triggerThermalPrint = (sale: Sale) => {
    setPrintingSale(sale);
    setTimeout(() => {
      window.print();
      setPrintingSale(null);
    }, 500);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const customer = customers.find(c => c.id === formData.customerId);
    
    if (!customer) return notify('يرجى اختيار عميل أولاً', 'error');
    if (!formData.qatType) return notify('يرجى اختيار نوع القات', 'error');
    if (formData.quantity <= 0 || formData.unitPrice <= 0) return notify('بيانات غير صحيحة', 'error');

    setIsSubmitting(true);
    const total = formData.quantity * formData.unitPrice;
    const isCredit = formData.status === PaymentStatus.Credit;

    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString(),
      customerId: customer.id,
      customerName: customer.name,
      qatType: formData.qatType,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      total,
      currency: formData.currency,
      status: formData.status,
      notes: formData.notes,
      isReturn: formData.isReturn
    };

    try {
      await addSale(newSale);
      if (appSettings.sales.autoThermalPrint) triggerThermalPrint(newSale);
      setSuccessModal({
        isOpen: true,
        transaction: {
          type: 'sale', mood: formData.isReturn ? 'concern' : (isCredit ? 'joy' : 'joy'),
          data: { ...newSale, phone: customer.phone },
          title: formData.isReturn ? 'إيصال مرتجع مبيعات' : (isCredit ? 'مبيعات آجلة (دين)' : 'مبيعات نقدية (كاش)'),
          amount: total, currency: formData.currency as Currency, entityName: customer.name
        }
      });
      notify(`تم حفظ ${formData.isReturn ? 'المرتجع' : 'العملية'} للعميل ${customer.name}`, 'success');
      setFormData({ ...formData, quantity: 0, unitPrice: 0, notes: '', isReturn: false });
    } catch (error: any) {
      notify(error.message || 'فشل تسجيل العملية', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSales = React.useMemo(() => sales.filter(s => 
    s.qatType !== PAYMENT_TYPE_MARKER && (
      s.customerName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.qatType.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [sales, searchTerm]);

  return (
    <div className="space-y-6 md:space-y-12 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto px-2 md:px-0">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteSale(deleteId)} 
      />
      
      {printingSale && (
        <div className="hidden print:block thermal-receipt">
          <div className="text-center border-b-2 border-dashed border-black pb-4 mb-4">
            <h2 className="text-xl font-black uppercase">{appSettings.agency.name}</h2>
            <p className="text-[9pt]">فاتورة مبيعات {printingSale.status === 'آجل' ? 'آجلة' : 'نقدية'}</p>
            <p className="text-[8pt] mt-1">{appSettings.agency.address || 'صنعاء - سوق علي محسن'}</p>
            <p className="text-[8pt]">تلفون: {appSettings.agency.phone}</p>
          </div>
          <div className="text-center mb-4">
            <p className="text-[11pt] font-black underline">{printingSale.isReturn ? 'إيصال مرتجع' : 'تفاصيل المبيع'}</p>
            <p className="text-[7pt] opacity-70">رقم: {printingSale.id.substring(0, 6)} | التاريخ: {new Date(printingSale.date).toLocaleString('ar-YE')}</p>
          </div>
          <div className="space-y-2 text-[10pt] border-b-2 border-dashed border-black pb-4 mb-4">
            <div className="flex justify-between"><span>العميل:</span> <span className="font-black">{printingSale.customerName}</span></div>
            <div className="flex justify-between"><span>الصنف:</span> <span className="font-bold">{printingSale.qatType}</span></div>
            <div className="flex justify-between"><span>الكمية:</span> <span className="font-bold">{printingSale.quantity} حزمة</span></div>
            <div className="flex justify-between"><span>سعر الوحدة:</span> <span>{printingSale.unitPrice.toLocaleString()} {printingSale.currency}</span></div>
          </div>
          <div className="flex justify-between items-center py-2 font-black">
            <span className="text-[11pt]">الإجمالي المستحق:</span>
            <span className="text-[14pt]">{printingSale.total.toLocaleString()} {printingSale.currency}</span>
          </div>
          {printingSale.status === 'آجل' && (
             <div className="mt-4 p-2 bg-slate-100 border border-black text-center text-[8pt]">
                * تم قيد هذه الفاتورة كدين على حساب العميل *
             </div>
          )}
          <div className="text-center mt-6 pt-4 border-t border-black opacity-50">
             <p className="text-[7pt]">شكراً لتعاملكم مع {appSettings.agency.name} ✨</p>
             <p className="text-[6pt] mt-1">توليد: نظام الشويع الذكي v3.1</p>
          </div>
        </div>
      )}

      <TransactionSuccessModal isOpen={successModal?.isOpen || false} onClose={() => setSuccessModal(null)} transaction={successModal?.transaction || null} />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6 md:gap-12 print:hidden">
        <div className="xl:col-span-2">
          <div className={`bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-2xl p-6 md:p-10 border-t-[8px] md:border-t-[12px] transition-all duration-500 sticky top-[72px] md:top-32 z-30 ${formData.isReturn ? 'border-rose-500' : 'border-emerald-600'}`}>
            <div className="flex justify-between items-center mb-6 md:mb-10">
                <h2 className="text-xl md:text-3xl font-black text-slate-800 dark:text-white flex items-center gap-2 md:gap-4">
                  <span className={`p-3 md:p-4 rounded-2xl md:rounded-3xl text-xl md:text-3xl shadow-inner ${formData.isReturn ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'}`}>
                    {formData.isReturn ? '🚨' : '💰'}
                  </span> 
                  {formData.isReturn ? 'تسجيل مرتجع' : 'تسجيل مبيع'}
                </h2>
                
                <button 
                  onClick={() => setFormData({...formData, isReturn: !formData.isReturn})}
                  className={`px-4 md:px-6 py-2 rounded-full font-black text-[10px] md:text-xs transition-all ${formData.isReturn ? 'bg-rose-600 text-white shadow-lg shadow-rose-200' : 'bg-slate-100 text-slate-500'}`}
                  aria-label={formData.isReturn ? 'إلغاء المرتجع' : 'هل هو مرتجع؟'}
                >
                  {formData.isReturn ? 'إلغاء المرتجع' : 'مرتجع؟'}
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-8">
              <SearchableSelect 
                label="العميل"
                placeholder="-- اختر العميل --"
                options={customers}
                value={formData.customerId}
                onChange={(val) => setFormData({...formData, customerId: val})}
                aria-required="true"
              />

              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div className="space-y-1">
                  <label htmlFor="qatType" className="text-[10px] font-black text-slate-400 px-2">نوع القات</label>
                  <select id="qatType" className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border-2 md:border-4 border-transparent focus:border-brandGreen rounded-2xl md:rounded-3xl outline-none font-bold dark:text-white shadow-inner text-lg md:text-xl" value={formData.qatType} onChange={e => setFormData({...formData, qatType: e.target.value})} required aria-required="true">
                    {qatTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label htmlFor="status" className="text-[10px] font-black text-slate-400 px-2">الحالة</label>
                  <select id="status" className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border-2 md:border-4 border-transparent focus:border-brandGreen rounded-2xl md:rounded-3xl outline-none font-bold dark:text-white shadow-inner text-lg md:text-xl" value={formData.status} onChange={e => handleStatusChange(e.target.value as PaymentStatus)} aria-required="true">
                    <option value={PaymentStatus.Cash}>نقداً</option>
                    <option value={PaymentStatus.Credit}>آجل</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:gap-6">
                <div className="space-y-1">
                  <label htmlFor="quantity" className="text-[10px] font-black text-slate-400 px-2 text-center block">الكمية</label>
                  <input id="quantity" type="number" required className="w-full p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border-2 md:border-4 border-transparent focus:border-brandGreen rounded-2xl md:rounded-3xl outline-none font-black text-2xl md:text-3xl text-center dark:text-white shadow-inner" value={formData.quantity || ''} onChange={e => setFormData({...formData, quantity: parseFloat(e.target.value) || 0})} aria-required="true" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="unitPrice" className="text-[10px] font-black text-slate-400 px-2 text-center block">سعر الحزمة</label>
                  <input id="unitPrice" type="number" required className="w-full p-4 md:p-6 bg-slate-50 dark:bg-slate-800 border-2 md:border-4 border-transparent focus:border-brandGreen rounded-2xl md:rounded-3xl outline-none font-black text-2xl md:text-3xl text-center dark:text-white shadow-inner" value={formData.unitPrice || ''} onChange={e => setFormData({...formData, unitPrice: parseFloat(e.target.value) || 0})} aria-required="true" />
                </div>
              </div>

              <div className={`p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl text-center border-b-[8px] md:border-b-[12px] transition-all ${formData.isReturn ? 'bg-rose-900 border-rose-500 text-white' : 'bg-slate-900 border-emerald-600 text-white'}`}>
                 <span className="text-[9px] md:text-[10px] font-black opacity-60 uppercase tracking-widest mb-1 block">{formData.isReturn ? 'قيمة المرتجع' : 'إجمالي الفاتورة'}</span>
                 <div className="text-3xl md:text-5xl font-black">{(formData.quantity * formData.unitPrice).toLocaleString()} <span className="text-xs md:text-base font-normal opacity-40">{formData.currency}</span></div>
              </div>

              <button type="submit" disabled={qatTypes.length === 0 || isSubmitting} className={`w-full py-5 md:py-7 rounded-[1.5rem] md:rounded-[2.5rem] font-black text-lg md:text-2xl text-white shadow-2xl transition-all active:scale-95 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : (formData.isReturn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-700 hover:bg-emerald-800')}`}
                aria-label={isSubmitting ? 'جاري الحفظ...' : (formData.isReturn ? 'اعتماد المرتجع' : 'اعتماد المبيع')}>
                {isSubmitting ? 'جاري الحفظ...' : (formData.isReturn ? '🚨 اعتماد المرتجع' : '✅ اعتماد المبيع')}
              </button>
            </form>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4 md:space-y-8">
          <div className="glass-panel p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm flex gap-4 md:gap-6 items-center border-white/40">
            <span className="text-2xl md:text-3xl opacity-40">🔍</span>
            <input type="text" placeholder="البحث في الوردية..." className="flex-grow bg-transparent outline-none font-black text-lg md:text-2xl dark:text-white placeholder:opacity-30" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} aria-label="البحث في المبيعات" />
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[3rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 md:p-8 border-b dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
               <h3 className="text-lg md:text-xl font-black">📑 أرشيف الوردية</h3>
            </div>
            
            <div className="hidden md:block overflow-x-auto p-4">
              <table className="excel-table w-full" role="table" aria-label="أرشيف المبيعات">
                <thead>
                  <tr className="text-slate-600 dark:text-slate-300">
                    <th scope="col" className="text-right border-l dark:border-slate-800 p-4">العملية والوقت</th>
                    <th scope="col" className="text-right border-l dark:border-slate-800 p-4">التفاصيل</th>
                    <th scope="col" className="text-right border-l dark:border-slate-800 p-4">القيمة</th>
                    <th scope="col" className="text-center p-4">إجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.map(sale => (
                    <tr key={sale.id} className={`${sale.isReturn ? 'bg-rose-50/30 dark:bg-rose-900/10' : 'hover:bg-green-50/30'} group transition-colors`}>
                      <td className="p-6 border-l dark:border-slate-800">
                         <div className="flex items-center gap-3">
                            <span className="text-xl" aria-hidden="true">{sale.isReturn ? '🚨' : '💰'}</span>
                            <div>
                                <div className="font-black text-slate-900 dark:text-white text-lg">{sale.customerName} {sale.isReturn && <span className="text-rose-600 text-xs font-black">(مرتجع)</span>}</div>
                                <div className="text-[10px] text-slate-400 font-bold mt-1 tracking-wider uppercase">{new Date(sale.date).toLocaleTimeString('ar-YE', {hour: '2-digit', minute: '2-digit'})}</div>
                            </div>
                         </div>
                      </td>
                      <td className="p-6 border-l dark:border-slate-800">
                         <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${sale.isReturn ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>{sale.qatType}</span>
                         <span className="text-slate-400 font-black text-sm mr-3">× {sale.quantity} حزمة</span>
                      </td>
                      <td className="p-6 border-l dark:border-slate-800">
                         <div className={`font-black text-xl ${sale.isReturn ? 'text-rose-600' : (sale.status === PaymentStatus.Credit ? 'text-amber-600' : 'text-emerald-600')}`}>
                            {sale.isReturn ? '-' : ''}{sale.total.toLocaleString()} <span className="text-xs font-normal">{sale.currency}</span>
                         </div>
                      </td>
                      <td className="p-6 text-center">
                        <div className="flex justify-center gap-3">
                          <button onClick={() => triggerThermalPrint(sale)} className="p-3.5 bg-indigo-50 text-indigo-500 rounded-2xl hover:bg-indigo-500 hover:text-white transition-all shadow-sm" aria-label={`طباعة فاتورة المبيع لـ ${sale.customerName}`}>🖨️</button>
                          <button onClick={() => setDeleteId(sale.id)} className="p-3.5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm" aria-label={`حذف فاتورة المبيع لـ ${sale.customerName}`}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y dark:divide-slate-800" role="list">
               {filteredSales.map(sale => (
                 <div key={sale.id} className={`p-4 ${sale.isReturn ? 'bg-rose-50/30 dark:bg-rose-900/10' : ''}`} role="listitem">
                    <div className="flex justify-between items-start mb-2">
                       <div className="flex items-center gap-2">
                          <span className="text-xl" aria-hidden="true">{sale.isReturn ? '🚨' : '💰'}</span>
                          <div>
                             <div className="font-black text-slate-900 dark:text-white text-base">{sale.customerName}</div>
                             <div className="text-[9px] text-slate-400 font-bold uppercase">{new Date(sale.date).toLocaleTimeString('ar-YE', {hour: '2-digit', minute: '2-digit'})}</div>
                          </div>
                       </div>
                       <div className={`font-black text-lg ${sale.isReturn ? 'text-rose-600' : (sale.status === PaymentStatus.Credit ? 'text-amber-600' : 'text-emerald-600')}`}>
                          {sale.isReturn ? '-' : ''}{sale.total.toLocaleString()} <span className="text-[10px]">{sale.currency}</span>
                       </div>
                    </div>
                    <div className="flex justify-between items-center">
                       <div className="flex gap-2 items-center">
                          <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black">{sale.qatType}</span>
                          <span className="text-slate-400 text-[10px] font-black">{sale.quantity} حزمة</span>
                       </div>
                       <div className="flex gap-2">
                          <button onClick={() => triggerThermalPrint(sale)} className="p-2 bg-indigo-50 text-indigo-500 rounded-lg" aria-label={`طباعة فاتورة المبيع لـ ${sale.customerName}`}>🖨️</button>
                          <button onClick={() => setDeleteId(sale.id)} className="p-2 bg-red-50 text-red-500 rounded-lg" aria-label={`حذف فاتورة المبيع لـ ${sale.customerName}`}>🗑️</button>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SalesPage;