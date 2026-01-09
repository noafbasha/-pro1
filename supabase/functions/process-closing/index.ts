
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { closingData, settings } = await req.json()

    // 1. تسجيل الإغلاق في قاعدة البيانات
    const { data: closing, error: dbError } = await supabaseClient
      .from('daily_closings')
      .insert([{
        user_id: user.id,
        ...closingData,
        is_finalized: true
      }])
      .select()
      .single()

    if (dbError) throw dbError

    // 2. إرسال تقرير تليجرام إذا كان مفعلاً (آمن جداً لأنه يتم من السيرفر)
    if (settings.telegramEnabled && settings.telegramBotToken && settings.telegramChatId) {
      const message = `🏁 *تقرير إغلاق وردية جديد*\n` +
                      `📅 التاريخ: ${closingData.date}\n` +
                      `💰 المتوقع: ${closingData.expectedCash.toLocaleString()} ر.ي\n` +
                      `💵 الفعلي: ${closingData.actualCash.toLocaleString()} ر.ي\n` +
                      `⚠️ الفارق: ${closingData.difference.toLocaleString()} ر.ي\n` +
                      `👤 المسؤول: ${user.user_metadata.full_name || user.email}`;

      await fetch(`https://api.telegram.org/bot${settings.telegramBotToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: settings.telegramChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: "تم الإغلاق والترحيل بنجاح ✅", id: closing.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})