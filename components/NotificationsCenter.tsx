
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAgency } from '../context/AgencyContext';
import { NotificationPriority, AppNotification, Debt } from '../types';
import { sendToWhatsApp } from '../services/messagingService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationsCenter: React.FC<Props> = React.memo(({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, removeNotification, clearNotifications, debts } = useAgency();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const priorityIcons: Record<NotificationPriority, string> = {
    [NotificationPriority.High]: '🔴',
    [NotificationPriority.Medium]: '🟠',
    [NotificationPriority.Low]: '🔵'
  };

  const typeIcons: Record<string, string> = {
    stock: '🌿',
    debt: '💰',
    rate: '💱',
    system: '⚙️',
    reminder: '📩'
  };

  const handleAction = (n: AppNotification) => {
    if (n.type === 'reminder' || n.type === 'debt') {
        const debt = debts.find(d => d.customerId === n.metadata?.customerId);
        if (debt && n.metadata?.phone) {
            const balanceText = Object.entries(debt.balances)
              .filter(([_, val]) => (val as number) !== 0)
              .map(([cur, val]) => `${(val as number).toLocaleString()} ${cur}`)
              .join(' | ') || 'خالص';

            const msg = `*🌿 تذكير من وكالة الشويع للقات*\nعزيزنا العميل ${debt.customerName}، نود تذكيركم بأن رصيدكم الحالي هو ${balanceText}. يرجى المراجعة والتسديد في أقرب وقت. شاكرين لكم تعاونكم.`;
            sendToWhatsApp(n.metadata.phone, msg);
        }
    } else if (n.type === 'stock') {
        navigate('/purchases', { state: { qatType: n.metadata?.itemType } });
        onClose();
    }
    markNotificationAsRead(n.id);
  };

  const handleIndividualDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeNotification(id);
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
        aria-label="إغلاق مركز التنبيهات"
      ></div>

      {/* Drawer */}
      <div className="relative w-full max-w-full md:max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col animate-in slide-in-from-left duration-500 rtl:slide-in-from-right transition-colors">
        
        {/* Header */}
        <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
             <span className="text-3xl" aria-hidden="true">🔔</span>
             <h2 className="text-2xl font-black text-slate-800 dark:text-white" id="notifications-center-title">التنبيهات الذكية</h2>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center justify-center text-xl" aria-label="إغلاق">✕</button>
        </div>

        <div className="px-8 py-4 bg-slate-100 dark:bg-slate-800 flex justify-between items-center border-b dark:border-slate-700">
           <span className="text-sm font-bold text-slate-500">{notifications.length} تنبيهات</span>
           {notifications.length > 0 && (
             <button 
                onClick={(e) => {
                    e.preventDefault();
                    clearNotifications();
                }} 
                className="text-xs font-black text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1 rounded-lg transition-colors border border-red-100 dark:border-red-900/30"
                aria-label="مسح جميع التنبيهات"
             >
                مسح الكل
             </button>
           )}
        </div>

        {/* List */}
        <div className="flex-grow overflow-y-auto no-scrollbar p-6 space-y-4" role="list" aria-labelledby="notifications-center-title">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <div 
                key={n.id}
                className={`p-6 rounded-[2rem] border-2 transition-all group relative animate-in slide-in-from-top-4 duration-300 ${n.isRead ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60' : 'bg-green-50/30 dark:bg-green-900/10 border-green-200 dark:border-green-800 shadow-sm'}`}
                role="listitem"
              >
                {!n.isRead && <div className="absolute top-4 left-4 w-3 h-3 bg-green-500 rounded-full animate-pulse" aria-hidden="true"></div>}
                
                <button 
                  onClick={(e) => handleIndividualDelete(e, n.id)}
                  className="absolute top-4 left-4 text-slate-400 hover:text-red-500 transition-colors p-1 bg-white/50 dark:bg-slate-800/50 rounded-full opacity-0 group-hover:opacity-100 shadow-sm z-10"
                  title="حذف التنبيه"
                  aria-label={`حذف التنبيه: ${n.title}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-sm shrink-0 border dark:border-slate-700" aria-hidden="true">
                    {typeIcons[n.type] || '🔔'}
                  </div>
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px]" aria-hidden="true">{priorityIcons[n.priority]}</span>
                      <h4 className="font-black text-slate-800 dark:text-white text-lg leading-tight">{n.title}</h4>
                    </div>
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed">{n.message}</p>
                    
                    <div className="flex gap-2 pt-2">
                        {!n.isRead && (
                            <button 
                                onClick={() => markNotificationAsRead(n.id)}
                                className="bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-lg text-[10px] font-black hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                aria-label="تجاهل التنبيه"
                            >
                                تجاهل
                            </button>
                        )}
                        {(n.type === 'reminder' || n.type === 'debt') && (
                            <button 
                                onClick={() => handleAction(n)}
                                className="bg-green-600 text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 hover:bg-green-700 transition-all shadow-sm"
                                aria-label="إرسال تذكير عبر واتساب"
                            >
                                🟢 إرسال تذكير
                            </button>
                        )}
                        {n.type === 'stock' && (
                             <button 
                                onClick={() => handleAction(n)}
                                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black hover:bg-blue-700 shadow-sm transition-all"
                                aria-label="طلب توريد لهذا الصنف"
                            >
                                📦 طلب توريد
                            </button>
                        )}
                    </div>

                    <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 pt-2 flex items-center gap-2">
                       <span aria-hidden="true">🕒</span>
                       {new Date(n.timestamp).toLocaleString('ar-YE', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4 opacity-30">
               <span className="text-8xl" aria-hidden="true">🔕</span>
               <p className="text-xl font-black">لا توجد تنبيهات</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
           <button onClick={onClose} className="w-full py-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-all" aria-label="إغلاق القائمة">إغلاق القائمة</button>
        </div>
      </div>
    </div>
  );
});

export default NotificationsCenter;