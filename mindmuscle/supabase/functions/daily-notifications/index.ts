/**
 * Daily Notifications Edge Function
 * Schedule: every hour via Supabase cron
 * SELECT cron.schedule('daily-notifications', '0 * * * *', 'SELECT net.http_post(...)');
 */
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2?target=deno'

const MESSAGES: Record<string, string[]> = {
  enforcer: [
    "You said you'd do this. The clock doesn't care about your mood. Move.",
    'No one is coming to save you. That\'s not a threat — it\'s your advantage.',
    'Comfort is the enemy of the person you\'re trying to become. Get uncomfortable.',
    'Every excuse you make today is debt you\'ll pay tomorrow with interest.',
    "Hard doesn't mean impossible. It means most people won't. You're not most people.",
  ],
  igniter: [
    "LET'S GO. Today is YOURS. Attack it like you mean it.",
    'The energy is HERE. The time is NOW. You were BUILT for this moment.',
    'Champions don\'t wait for the perfect moment. They CREATE it. GO.',
    "They're sleeping. You're here. That's the difference. That's YOUR edge.",
    'Bring EVERYTHING you have today. Leave nothing on the table. NOTHING.',
  ],
  visionary: [
    "Every rep is a vote for who you're becoming. Cast it with intention.",
    "You don't have to be extreme. You have to be consistent. That's rarer.",
    'The work you do in private is the foundation of everything you\'ll become in public.',
    'Your future self already knows who they are. They\'re waiting for you to catch up.',
    'Small disciplines, compounded daily, become the extraordinary life you\'ve imagined.',
  ],
}

serve(async (req) => {
  // Verify this is a cron invocation (simple shared secret)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${Deno.env.get('CRON_SECRET')}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const now = new Date()
  const currentHour = now.getUTCHours()

  // Find users whose preferred_time matches the current UTC hour
  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, primary_motivator, goal_text, preferred_time, first_name')
    .not('primary_motivator', 'is', null)

  if (error) {
    console.error('daily-notifications: fetch users error:', error)
    return new Response('error', { status: 500 })
  }

  const eligible = (users ?? []).filter((u) => {
    if (!u.preferred_time) return false
    const [h] = u.preferred_time.split(':').map(Number)
    return h === currentHour
  })

  for (const user of eligible) {
    const profile = user.primary_motivator as string
    const bank = MESSAGES[profile] ?? MESSAGES.visionary
    const dayOfYear = Math.floor(
      (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
    )
    const content = bank[dayOfYear % bank.length]

    await supabase.from('messages').insert({
      user_id: user.id,
      content,
      motivator_ref: profile,
      delivered_at: now.toISOString(),
      read: false,
    })
  }

  return new Response(
    JSON.stringify({ sent: eligible.length }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
