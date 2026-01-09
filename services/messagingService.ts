
import { Sale, Purchase, Debt, SocialSettings, QatType, Expense, Voucher, Currency } from '../types';
import { tafqit } from './numberUtils';

// توليد فاتورة نصية احترافية
export const formatInvoiceText = (sale: Sale): string => {
  const verbalTotal = tafqit(sale.total, sale.currency === Currency.YER ? "ريال يمني" : sale.currency === Currency.SAR ? "ريال سعودي" : "ريال عماني");
  return `*📄 فاتورة مبيعات - وكالة الشويع*\n` +
         `--------------------------\n` +
         `👤 *العميل:* ${sale.customerName}\n` +
         `📅 *التاريخ:* ${new Date(sale.date).toLocaleString('ar-YE')}\n` +
         `🌿 *الصنف:* ${sale.qatType}\n` +
         `🔢 *الكمية:* ${sale.quantity} حزمة\n` +
         `💵 *السعر:* ${sale.unitPrice.toLocaleString()} ${sale.currency}\n` +
         `--------------------------\n` +
         `💰 *الإجمالي:* ${sale.total.toLocaleString()} ${sale.currency}\n` +
         `📝 *كتابة:* ${verbalTotal}\n` +
         `📌 *الحالة:* ${sale.status}\n` +
         `--------------------------\n` +
         `شكراً لتعاملكم معنا ✨`;
};

export const formatSaleMessage = formatInvoiceText;

// دالة لتنسيق تقرير الإغلاق اليومي
// @fix Added missing export formatDailyClosing used in ClosingPage.tsx
export const formatDailyClosing = (data: any): string => {
  return `*🏁 تقرير إغلاق الوردية - وكالة الشويع*\n` +
         `--------------------------\n` +
         `📅 *التاريخ:* ${data.date}\n` +
         `📥 *إجمالي النقد الداخل:* ${data.cashIn?.toLocaleString()} ر.ي\n` +
         `📤 *إجمالي النقد الخارج:* ${data.cashOut?.toLocaleString()} ر.ي\n` +
         `⚖️ *الرصيد الدفتري:* ${data.expectedCash?.toLocaleString()} ر.ي\n` +
         `--------------------------\n` +
         `💰 *الجرد الفعلي:* ${data.actualCash?.toLocaleString()} ر.ي\n` +
         `⚠️ *الفارق:* ${data.diff?.toLocaleString()} ر.ي\n` +
         `--------------------------\n` +
         `_تم الترحيل بنجاح بواسطة نظام الشويع الذكي_`;
};

// دالة لتنسيق التقرير اليومي العام
// @fix Added missing export formatDailyReport used in AiAssistant.tsx
export const formatDailyReport = (stats: any): string => {
  return `*📊 ملخص أداء الوكالة اليومي*\n` +
         `--------------------------\n` +
         `💰 مبيعات اليوم: ${stats.todaySales?.toLocaleString()} ر.ي\n` +
         `💸 مصروفات اليوم: ${stats.todayExpenses?.toLocaleString()} ر.ي\n` +
         `⚖️ كفاءة السيولة: ${stats.liquidityRatio?.toFixed(1)}%\n` +
         `🌿 الصنف الأكثر طلباً: ${stats.topProduct?.name}\n` +
         `--------------------------\n` +
         `_تم التحليل بواسطة ذكاء الشويع المحاسبي_`;
};

export const formatDetailedStatement = (entityName: string, entityType: string, rows: any[]): string => {
  const dateStr = new Date().toLocaleDateString('ar-YE');
  const currencyLabel = "ر.ي";
  
  // بناء رأس الجدول
  let msg = `*📜 كشف حساب تفصيلي - وكالة الشويع*\n`;
  msg += `👤 *الطرف:* ${entityName}\n`;
  msg += `📅 *بتاريخ:* ${dateStr}\n`;
  msg += `────────────────────\n`;
  
  // رؤوس الأعمدة بتنسيق شبيه بالجدول
  msg += `*التاريخ* | *البيان* | *مدين* | *دائن*\n`;
  msg += `────────────────────\n`;
  
  // محتوى الصفوف (آخر 15 عملية لضمان عدم تجاوز طول رسالة واتساب)
  rows.slice(-15).forEach(row => {
    const date = new Date(row.date).toLocaleDateString('ar-YE', {day: '2-digit', month: '2-digit'});
    const desc = row.desc.length > 15 ? row.desc.substring(0, 13) + '..' : row.desc;
    const debit = row.debitYer > 0 ? row.debitYer.toLocaleString() : '0';
    const credit = row.creditYer > 0 ? row.creditYer.toLocaleString() : '0';
    
    // استخدام ايموجي لتلوين الخلايا (أحمر للمدين، أخضر للدائن)
    const rowIcon = row.debitYer > 0 ? '🔴' : '🟢';
    msg += `${rowIcon} ${date} | ${desc} | ${debit} | ${credit}\n`;
  });

  const finalBal = rows.length > 0 ? rows[rows.length-1].balanceYer : 0;
  const verbalBalance = tafqit(finalBal, "ريال يمني");
  
  msg += `────────────────────\n`;
  msg += `📊 *الرصيد النهائي:* ${Math.abs(finalBal).toLocaleString()} ${currencyLabel}\n`;
  msg += `📌 *الحالة:* ${finalBal >= 0 ? '🔴 عليه (مطلوب منه)' : '🟢 له (مستحق له)'}\n`;
  msg += `✍️ *كتابة:* ${verbalBalance}\n`;
  msg += `────────────────────\n`;
  msg += `_تم التوليد آلياً بواسطة نظام الشويع الذكي_`;
  
  return msg;
};

export const sendToWhatsApp = (phone: string, text: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const url = `https://wa.me/${cleanPhone.startsWith('967') ? cleanPhone : '967' + cleanPhone}?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

export const sendTelegramAlert = async (settings: any, title: string, body: string): Promise<boolean> => {
  if (!settings.telegramEnabled || !settings.telegramBotToken) return false;
  try {
    const url = `https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`;
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: settings.telegramChatId, text: `🔔 *${title}*\n${body}`, parse_mode: 'Markdown' })
    });
    return true;
  } catch (e) { return false; }
};

// @fix Added sendToTelegram alias for sendTelegramAlert used in EntityStatementModal.tsx
export const sendToTelegram = sendTelegramAlert;