import type { MotivatorProfile } from './types'

// ─── Profile Definition ────────────────────────────────────────────────────

export interface ProfileDefinition {
  id: MotivatorProfile
  name: string
  tagline: string
  voiceDescription: string
  accentColor: string
  heroImage: string
  dailyMessages: string[]
  recoveryMessages: string[]
  /** Index 0 = 7-day, 1 = 30-day, 2 = 100-day */
  streakMessages: string[]
  checkInMessage: string
}

// ─── Image URL Builder ─────────────────────────────────────────────────────

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?w=900&auto=format&fit=crop&q=80`
}

// ─── Profile Definitions ───────────────────────────────────────────────────

const ENFORCER: ProfileDefinition = {
  id: 'enforcer',
  name: 'The Enforcer',
  tagline: 'No excuses. No shortcuts. No one is coming to save you.',
  voiceDescription:
    "Blunt, direct, and merciless with excuses. The Enforcer holds you to the standard you set — even when you don't want to.",
  accentColor: '#C0392B',
  heroImage: unsplash('1534438327273-5c42c6a17ef9'),
  dailyMessages: [
    "You said you'd do this. The clock doesn't care about your mood. Move.",
    "No one is coming to save you. That's not a threat — it's your advantage.",
    "Comfort is the enemy of the person you're trying to become. Get uncomfortable.",
    'Every excuse you make today is debt you\'ll pay tomorrow with interest.',
    "The version of you that quits is always right there. Don't let it win today.",
    "Hard doesn't mean impossible. It means most people won't. You're not most people.",
    "Stop waiting to feel ready. Ready is a lie your brain tells you to stay safe.",
    "Your future self is watching every choice you make right now. Don't embarrass them.",
    'Pain fades. Regret lasts forever. Which one are you choosing today?',
    "The discipline you build on days you don't want to shows up when it matters most.",
    "You don't negotiate with your standards. You meet them. Period.",
    'Weak moments reveal character. Strong moments are built here, now, today.',
  ],
  recoveryMessages: [
    "You missed a day. That's not failure — quitting would be failure. Get back in it. Now.",
    "One step back. Fine. That's allowed once. But tomorrow you take two steps forward. No discussion.",
    "Everyone falls. Champions are the ones who get up faster than they fell down. Your move.",
    "You skipped. I noticed. The question is whether you're going to let one miss become a habit — or prove you're better than that.",
  ],
  streakMessages: [
    "7 days in. You did what most people talk about but never do. This is just the beginning — don't get comfortable.",
    "30 days. You've built something real. Most people quit in week two. You didn't. Now prove it wasn't a fluke.",
    "100 days of showing up. 100 days of not making excuses. You're not the same person who started this. Don't go back.",
  ],
  checkInMessage:
    "Done. You showed up when most people wouldn't. That matters. Log it and get after tomorrow.",
}

const IGNITER: ProfileDefinition = {
  id: 'igniter',
  name: 'The Igniter',
  tagline: 'Feel the fire. Channel it. Burn bright.',
  voiceDescription:
    'Explosive, electric, and relentlessly positive. The Igniter turns your energy into momentum and makes every session feel like game day.',
  accentColor: '#E8A33D',
  heroImage: unsplash('1517649763962-0c623066013b'),
  dailyMessages: [
    "LET'S GO. Today is YOURS. Attack it like you mean it.",
    'The energy is HERE. The time is NOW. You were BUILT for this moment.',
    "You're not just working out — you're becoming unstoppable. FEEL that.",
    "Champions don't wait for the perfect moment. They CREATE it. GO.",
    'The fire in you is REAL. Feed it. TODAY.',
    "You vs. yesterday's version of you. Who wins? Make sure it's you. DOMINATE.",
    "Every rep, every step, every choice — it's all MOMENTUM. Build it NOW.",
    "They're sleeping. You're here. That's the difference. That's YOUR edge.",
    'FEEL IT. The rush, the grind, the burn — this is what ALIVE feels like.',
    "You don't just train your body here — you train your MIND to be unbreakable.",
    'Bring EVERYTHING you have today. Leave nothing on the table. NOTHING.',
    "This is your highlight reel moment. MAKE it one. Let's get after it!",
  ],
  recoveryMessages: [
    "You took a day off — that's okay! The comeback is ALWAYS the best part. Let's IGNITE it today!",
    "Rest days happen. Recovery is part of the grind. But today? Today we come back STRONGER. YOU'VE GOT THIS.",
    "Missing one day doesn't define you — how you come back DOES. Today is your comeback story. Write it BIG.",
    "The best athletes in the world take breaks. The difference? They come back with MORE fire. Time to bring that fire. Let's GO.",
  ],
  streakMessages: [
    "7 DAYS! You're ON FIRE! Most people dream about consistency — you're LIVING it. This is just the warm-up!",
    '30 DAYS. THIRTY. That\'s a STREAK. That\'s a HABIT. That\'s a NEW VERSION OF YOU. CELEBRATE this — then go even harder!',
    '100 DAYS! ONE HUNDRED! You are an absolute MACHINE. What you\'ve built here is LEGENDARY. Keep that fire BURNING!',
  ],
  checkInMessage:
    "YES! You crushed it! That energy you brought today? That's your superpower. Rest up — tomorrow we do it all over again!",
}

const VISIONARY: ProfileDefinition = {
  id: 'visionary',
  name: 'The Visionary',
  tagline: "Every choice is a vote for the person you're becoming.",
  voiceDescription:
    "Calm, deep, and purpose-driven. The Visionary connects your daily actions to the larger story of who you're meant to be.",
  accentColor: '#4A90A4',
  heroImage: unsplash('1506905925346-21bda4d32df4'),
  dailyMessages: [
    "Every rep is a vote for who you're becoming. Cast it with intention.",
    "You don't have to be extreme. You have to be consistent. That's rarer.",
    "The work you do in private is the foundation of everything you'll become in public.",
    "Your future self already knows who they are. They're waiting for you to catch up.",
    "Identity before action. You're not trying to do the thing — you're becoming the person who does it.",
    'Small disciplines, compounded daily, become the extraordinary life you\'ve imagined.',
    'The river carves the canyon not through force, but through persistence. Be the river.',
    'What you do when no one is watching tells you everything about who you truly are.',
    'Patience is not passive. It\'s active faith in the process you\'ve committed to.',
    'You are not the same person who started this. Growth is quiet, but it is real.',
    'The goal is worthy, but the person you become in pursuit of it — that\'s the real prize.',
    'Begin where you are. Use what you have. Do what you can. That is always enough.',
  ],
  recoveryMessages: [
    "Missing a day isn't failure — it's information. What needed rest? What needed attention? Return with new clarity.",
    "Every master has missed days. What separates them is not perfection — it's the quality of their return. Come back grounded.",
    "The tree doesn't apologize for winter. It simply waits, roots growing deeper, and blooms again when it's time. Return when you're ready.",
    'Compassion for yourself is not weakness. Rest, reflect, and reconnect with your why. Then begin again.',
  ],
  streakMessages: [
    "Seven days of choosing yourself. That's not a streak — that's a declaration. The person you're becoming is already here.",
    "Thirty days. The philosophers called it a month of practice. You've done what they wrote about. Feel how different you are.",
    "One hundred days of intentional living. You've crossed a threshold most people only read about. This is who you are now.",
  ],
  checkInMessage:
    'You showed up today, and that act — choosing growth over comfort — is quietly shaping everything. Rest in that.',
}

// ─── Exported Map ──────────────────────────────────────────────────────────

export const MOTIVATOR_PROFILES: Record<MotivatorProfile, ProfileDefinition> = {
  enforcer: ENFORCER,
  igniter: IGNITER,
  visionary: VISIONARY,
}

// ─── Helper ────────────────────────────────────────────────────────────────

export function getProfile(type: MotivatorProfile): ProfileDefinition {
  return MOTIVATOR_PROFILES[type]
}
