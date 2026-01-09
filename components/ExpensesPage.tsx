
import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { useNotify } from '../context/NotificationContext';
import { Currency, Expense, RecurrenceFrequency } from '../types';
import ConfirmModal from './ConfirmModal';

const CATEGORY_ICONS: Record<string, string> = {
  'نقل وتوريد': '🚚',
  'إيجار': '🏠',
  'أجور وعمالة': '👥',
  'ضرائب وزكاة': '🏛️',
  'توالف وهالك': '🗑️',
  'أخرى': '📝',
};

const ExpensesPage: React.FC = React.memo(() => { // Wrapped with React.memo
  const { expenses, addExpense, deleteExpense, expenseCategories, addExpenseCategory, deleteExpenseCategory } = useAgency();
  const { notify } = useNotify();
  const location = useLocation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCatManagerOpen, setIsCatManagerOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecurringOnly, setShowRecurringOnly] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteCatName, setDeleteCatName] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    category: '',
    amount: 0,
    currency: Currency.YER,
    description: '',
    isRecurring: false,
    frequency: RecurrenceFrequency.None
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (expenseCategories.length > 0 && (!formData.category || !expenseCategories.includes(formData.category))) {
      setFormData(prev => ({ ...prev, category: expenseCategories[0] }));
    }
  }, [expenseCategories, isModalOpen]);

  useEffect(() => {
    if (location.state?.showAdd) {
      setIsModalOpen(true);
    }
  }, [location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) return notify('يرجى إدخال مبلغ صحيح', 'error');
    if (!formData.category) return notify('يرجى اختيار فئة أولاً', 'error');

    setIsSubmitting(true);
    try {
      await addExpense({ id: `exp-${Date.now()}`, date: new Date().toISOString(), ...formData });
      notify(`تم تسجيل المصروف بنجاح ✅`, 'success');
      setFormData(prev => ({ ...prev, amount: 0, description: '', isRecurring: false, frequency: RecurrenceFrequency.None }));
      setIsModalOpen(false);
    } catch (err) {} finally { setIsSubmitting(false); }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return notify('الرجاء إدخال اسم الفئة', 'error');
    if (expenseCategories.includes(newCatName.trim())) return notify('هذه الفئة موجودة مسبقاً', 'warning');
    await addExpenseCategory(newCatName.trim());
    notify(`تمت إضافة الفئة "${newCatName}"`, 'success');
    setNewCatName('');
  };

  const handleDeleteCategory = async () => {
    if (deleteCatName) {
      await deleteExpenseCategory(deleteCatName);
      notify(`تم حذف الفئة "${deleteCatName}"`, 'success');
      setDeleteCatName(null);
    }
  };


  const filteredExpenses = useMemo(() => {
    let list = expenses.filter(e => 
      (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.category || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    if (showRecurringOnly) list = list.filter(e => e.isRecurring);
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, searchTerm, showRecurringOnly]);

  const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-32 px-2 md:px-0">
      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteExpense(deleteId)} 
        title="حذف المصروف"
        message="هل أنت متأكد من حذف هذا المصروف؟"
      />
      <ConfirmModal 
        isOpen={!!deleteCatName} 
        onClose={() => setDeleteCatName(null)} 
        onConfirm={handleDeleteCategory} 
        title="حذف فئة مصروف"
        message={`هل أنت متأكد من حذف الفئة "${deleteCatName}"؟ هذا لا يحذف المصروفات المسجلة تحتها.`}
      />

      {/* Header - Responsive */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 p-6 md:p-10 rounded-[2rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 dark:border-slate-800 gap-6">
        <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto">
          <div className="bg-rose-100 dark:bg-rose-900/40 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] text-3xl md:text-5xl shadow-inner animate-float shrink-0" aria-hidden="true">💸</div>
          <div>
            <h2 className="text-xl md:text-4xl font-black text-slate-900 dark:text-white leading-tight">دفتر المصروفات</h2>
            <p className="text-[10px] md:text-xl text-slate-500 font-bold">تتبع النفقات اليومية للوكالة</p>
          </div>
        </div>
        <div className="bg-rose-600 text-white px-8 py-4 md:px-12 md:py-6 rounded-2xl md:rounded-[2.5rem] shadow-xl text-center w-full md:w-auto">
           <div className="text-[9px] font-black opacity-80 uppercase mb-1">إجمالي المنصرفات</div>
           <div className="text-2xl md:text-4xl font-black">{totalExpenses.toLocaleString()} <span className="text-xs font-normal">ر.ي</span></div>
        </div>
      </div>

      {/* Control Bar - Responsive */}
      <div className="flex flex-col md:flex-row gap-3 bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[3rem] shadow-lg border border-slate-100 dark:border-slate-800">
         <div className="relative flex-grow group">
           <input 
             type="text" 
             placeholder="بحث في المصاريف..." 
             className="w-full p-4 pr-12 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-[2rem] outline-none font-bold dark:text-white border-2 border-transparent focus:border-rose-500 transition-all text-right text-base"
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             aria-label="البحث في المصروفات"
           />
           <span className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40" aria-hidden="true">🔍</span>
         </div>
         <div className="flex gap-2">
            <button onClick={() => setIsCatManagerOpen(true)} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-black text-sm" title="إدارة الأسماء" aria-label="إدارة فئات المصروفات">🏷️</button>
            <button onClick={() => setIsModalOpen(true)} className="flex-grow md:flex-none bg-rose-600 text-white px-6 md:px-10 rounded-xl md:rounded-[1.5rem] font-black text-sm md:text-xl shadow-lg active:scale-95 transition-all" aria-label="إضافة مصروف جديد">➕ إضافة</button>
         </div>
      </div>

      {/* Grid View - Column for Mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8" role="list">
         {filteredExpenses.map(exp => (
            <div key={exp.id} className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[1.5rem] md:rounded-[3rem] shadow-xl border-r-8 border-rose-500 flex justify-between items-center group active:scale-95 transition-all text-right" role="listitem">
               <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-rose-50 dark:bg-rose-900/30 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl shadow-inner shrink-0" aria-hidden="true">
                     {CATEGORY_ICONS[exp.category] || '📝'}
                  </div>
                  <div>
                     <div className="flex items-center gap-2 mb-0.5 justify-end">
                        <span className="text-[8px] font-black bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full uppercase">{exp.category}</span>
                     </div>
                     <h4 className="text-base md:text-2xl font-black text-slate-900 dark:text-white truncate max-w-[150px] md:max-w-xs">{exp.description}</h4>
                     <p className="text-[9px] text-slate-400 font-bold">{new Date(exp.date).toLocaleDateString('ar-YE')}</p>
                  </div>
               </div>
               <div className="text-left">
                  <div className="text-xl md:text-3xl font-black text-rose-600">{exp.amount.toLocaleString()}</div>
                  <button onClick={() => setDeleteId(exp.id)} className="text-[9px] font-black text-slate-300 hover:text-red-500 uppercase mt-1" aria-label={`حذف مصروف ${exp.description}`}>🗑️ حذف</button>
               </div>
            </div>
         ))}
      </div>
      {filteredExpenses.length === 0 && <div className="p-10 text-center opacity-30 italic">لا توجد مصاريف..</div>}

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
           <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} aria-label="إغلاق"></div>
           <div className="relative w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] border-rose-600 my-auto animate-in zoom-in">
              <h3 id="add-expense-title" className="text-2xl md:text-3xl font-black mb-8 text-center dark:text-white">إضافة مصروف جديد</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2 text-right">
                    <label htmlFor="expense-category" className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest">فئة المصروف</label>
                    <select id="expense-category" className="w-full p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none font-black text-lg text-right dark:text-white" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required aria-required="true">
                        {expenseCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label htmlFor="expense-amount" className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-center block">المبلغ المنصرف</label>
                    <input id="expense-amount" type="number" required autoFocus className="w-full p-6 md:p-8 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none text-4xl font-black text-center dark:text-white" placeholder="0" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})} aria-required="true" />
                 </div>
                 <div className="space-y-2 text-right">
                    <label htmlFor="expense-description" className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest">بيان المصروف (الوصف)</label>
                    <textarea id="expense-description" className="w-full p-4 md:p-5 bg-slate-500/5 dark:bg-slate-800 border-2 rounded-2xl outline-none font-bold text-right dark:text-white text-base" placeholder="اكتب تفاصيل المصروف هنا.." rows={3} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required aria-required="true" />
                 </div>
                 <button type="submit" className="w-full bg-rose-600 text-white py-5 md:py-6 rounded-2xl font-black text-xl md:text-2xl shadow-xl transition-all active:scale-95" aria-label="حفظ المصروف">💾 حفظ المصروف</button>
              </form>
           </div>
        </div>
      )}

      {isCatManagerOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 animate-in fade-in" role="dialog" aria-modal="true" aria-labelledby="cat-manager-title">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setIsCatManagerOpen(false)} aria-label="إغلاق"></div>
          <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border-t-[10px] border-indigo-600 my-auto animate-in zoom-in">
             <h3 id="cat-manager-title" className="text-2xl md:text-3xl font-black mb-8 text-center dark:text-white">إدارة فئات المصروفات</h3>
             <form onSubmit={handleAddCategory} className="space-y-4 mb-8">
                <label htmlFor="new-category-name" className="text-xs font-black text-slate-500 px-2 uppercase tracking-widest text-right block">اسم الفئة الجديدة</label>
                <div className="flex gap-2">
                   <input 
                      id="new-category-name"
                      type="text"
                      className="flex-grow p-4 md:p-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl outline-none font-black text-lg text-right dark:text-white shadow-inner" 
                      placeholder="مثال: رواتب الموظفين"
                      value={newCatName}
                      onChange={e => setNewCatName(e.target.value)}
                      required
                   />
                   <button type="submit" className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 transition-all">➕</button>
                </div>
             </form>

             <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-700 dark:text-white mb-4">الفئات الحالية:</h4>
                <div className="max-h-48 overflow-y-auto no-scrollbar space-y-2">
                   {expenseCategories.length > 0 ? (
                      expenseCategories.map(cat => (
                         <div key={cat} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700">
                            <span className="font-bold dark:text-white">{cat}</span>
                            <button 
                               onClick={() => setDeleteCatName(cat)} 
                               className="p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-600 hover:text-white transition"
                               aria-label={`حذف فئة ${cat}`}
                            >
                               🗑️
                            </button>
                         </div>
                      ))
                   ) : (
                      <p className="text-center text-slate-400 italic">لا توجد فئات مصروفات معرفة بعد.</p>
                   )}
                </div>
             </div>
             <button onClick={() => setIsCatManagerOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xl shadow-xl hover:bg-black transition-all mt-8">إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
});

export default ExpensesPage;