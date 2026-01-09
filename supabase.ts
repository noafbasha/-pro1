
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// تأمين الوصول لمتغيرات البيئة
const getEnv = (key: string, fallback: string) => {
  try {
    return (process.env && process.env[key]) || fallback;
  } catch {
    return fallback;
  }
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'https://xaolczjmsrksqqihnlus.supabase.co');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhhb2xjemptc3Jrc3FxaWhubHVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2ODQwNTMsImV4cCI6MjA4MzI2MDA1M30.ougfFYFORr4XNsnGvzxbq9KygpllLxGzv2e6n5OdpIo');

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isConfigured = true;

export const getSafeErrorMessage = (err: any): string => {
  console.error("Supabase API Error:", err); // Log the full error for debugging

  if (typeof err === 'string') {
    return err;
  }

  // Common Supabase error codes and user-friendly messages
  if (err?.code) {
    switch (err.code) {
      case '23503': return 'خطأ في الربط: البيانات المرتبطة غير موجودة أو تم حذفها (مثلاً: محاولة حذف عميل لديه مبيعات مرتبطة).';
      case '23505': return 'هذا السجل موجود مسبقاً (مثلاً: محاولة إضافة عميل بنفس الاسم أو رقم الهاتف).';
      case '401': return 'غير مصرح لك بالوصول: يرجى تسجيل الدخول أو التحقق من الصلاحيات.';
      case '400': return 'طلب غير صالح: يرجى التحقق من البيانات المدخلة.';
      case '404': return 'المورد غير موجود: لم يتم العثور على البيانات المطلوبة.';
      case 'PGRST116': return 'خطأ في الاستعلام: تحقق من صيغة الطلب.';
      default: return `حدث خطأ في قاعدة البيانات (${err.code}): ${err.message || 'يرجى المحاولة مرة أخرى.'}`;
    }
  }

  // General network or client-side errors
  if (err?.message) {
    if (err.message.includes('Failed to fetch')) {
      return 'فشل الاتصال بالخادم. يرجى التحقق من اتصال الإنترنت.';
    }
    if (err.message.includes('Network request failed')) {
      return 'طلب الشبكة فشل. قد تكون غير متصل بالإنترنت.';
    }
    return err.message;
  }

  // Fallback for unknown errors
  return err?.error_description || 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.';
};

/**
 * دالة مساعدة لرفع الملفات إلى Supabase Storage
 */
export const uploadReceipt = async (userId: string, file: File, folder: string) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
    const filePath = `${userId}/${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Storage Error:", error);
    return null;
  }
};