import type { AssessmentResult, MotivatorBlend, MotivatorProfile } from './types'

// ─── Answer Option ─────────────────────────────────────────────────────────

export interface AnswerOption {
  text: string
  scores: MotivatorBlend
}

// ─── Question ─────────────────────────────────────────────────────────────

export interface Question {
  id: string
  text: string
  backgroundImage: string
  answers: AnswerOption[]
}

// ─── Image URL Builder ────────────────────────────────────────────────────

function unsplash(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?w=900&auto=format&fit=crop&q=80`
}

// ─── Assessment Questions ─────────────────────────────────────────────────

export const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: 'q1',
    text: 'When you\'re stuck, what gets you moving again?',
    backgroundImage: unsplash('1571019614242-c5c5dee9f50b'),
    answers: [
      { text: 'A challenge to my pride', scores: { enforcer: 7, igniter: 2, visionary: 1 } },
      { text: 'A jolt of energy or hype', scores: { enforcer: 1, igniter: 8, visionary: 1 } },
      { text: 'Remembering why I started', scores: { enforcer: 1, igniter: 2, visionary: 7 } },
      { text: 'Breaking it into a clear next step', scores: { enforcer: 4, igniter: 3, visionary: 3 } },
    ],
  },
  {
    id: 'q2',
    text: 'A coach yells "You\'re better than this." You feel…',
    backgroundImage: unsplash('1474630245878-b1bc5d2cce5a'),
    answers: [
      { text: 'Fired up — exactly what I needed', scores: { enforcer: 8, igniter: 1, visionary: 1 } },
      { text: 'Motivated to prove them right', scores: { enforcer: 5, igniter: 4, visionary: 1 } },
      { text: 'Annoyed — I need encouragement, not pressure', scores: { enforcer: 0, igniter: 4, visionary: 6 } },
      { text: 'Indifferent — I run on my own fuel', scores: { enforcer: 3, igniter: 1, visionary: 6 } },
    ],
  },
  {
    id: 'q3',
    text: 'You hit a goal. What feels best?',
    backgroundImage: unsplash('1549060279-7e168fcee0c2'),
    answers: [
      { text: 'Beating who I was yesterday', scores: { enforcer: 6, igniter: 3, visionary: 1 } },
      { text: 'The rush of the win', scores: { enforcer: 2, igniter: 8, visionary: 0 } },
      { text: 'Knowing it moved me toward something bigger', scores: { enforcer: 1, igniter: 1, visionary: 8 } },
      { text: 'Seeing the numbers improve', scores: { enforcer: 5, igniter: 3, visionary: 2 } },
    ],
  },
  {
    id: 'q4',
    text: 'You skip a day. The voice in your head should…',
    backgroundImage: unsplash('1488190211105-8b0e65b80b4e'),
    answers: [
      { text: 'Call me out, hard', scores: { enforcer: 9, igniter: 0, visionary: 1 } },
      { text: 'Hype me back up', scores: { enforcer: 0, igniter: 9, visionary: 1 } },
      { text: 'Remind me of the bigger picture', scores: { enforcer: 1, igniter: 1, visionary: 8 } },
    ],
  },
  {
    id: 'q5',
    text: 'Be honest — what usually makes you quit?',
    backgroundImage: unsplash('1520813792240-56fc4a3765a7'),
    answers: [
      { text: 'Losing interest or momentum', scores: { enforcer: 2, igniter: 6, visionary: 2 } },
      { text: 'No one holding me accountable', scores: { enforcer: 7, igniter: 2, visionary: 1 } },
      { text: 'Forgetting what the point was', scores: { enforcer: 1, igniter: 1, visionary: 8 } },
      { text: 'Getting overwhelmed', scores: { enforcer: 3, igniter: 4, visionary: 3 } },
    ],
  },
  {
    id: 'q6',
    text: 'Your ideal mornings start with…',
    backgroundImage: unsplash('1499750310-91e6c4e0b9f1'),
    answers: [
      { text: 'A challenge to tackle immediately', scores: { enforcer: 8, igniter: 1, visionary: 1 } },
      { text: 'A spark of energy or hype', scores: { enforcer: 1, igniter: 8, visionary: 1 } },
      { text: 'A reminder of who I\'m becoming', scores: { enforcer: 1, igniter: 2, visionary: 7 } },
      { text: 'Quiet focus and a clear plan', scores: { enforcer: 4, igniter: 2, visionary: 4 } },
    ],
  },
  {
    id: 'q7',
    text: 'Pick the line that hits hardest.',
    backgroundImage: unsplash('1547347298-4074ad3086f0'),
    answers: [
      { text: '"No one is coming. It\'s on you."', scores: { enforcer: 9, igniter: 0, visionary: 1 } },
      { text: '"Today is YOURS — take it."', scores: { enforcer: 0, igniter: 9, visionary: 1 } },
      { text: '"Become the person who never had to be told."', scores: { enforcer: 1, igniter: 1, visionary: 8 } },
    ],
  },
  {
    id: 'q8',
    text: 'What does "winning" actually mean to you?',
    backgroundImage: unsplash('1530822230869-3bde6da43e66'),
    answers: [
      { text: 'Outperforming the old version of me', scores: { enforcer: 6, igniter: 3, visionary: 1 } },
      { text: 'That feeling of momentum and confidence', scores: { enforcer: 1, igniter: 8, visionary: 1 } },
      { text: 'Living as the person I set out to become', scores: { enforcer: 1, igniter: 1, visionary: 8 } },
      { text: 'Achieving measurable milestones', scores: { enforcer: 5, igniter: 3, visionary: 2 } },
    ],
  },
  {
    id: 'q9',
    text: 'How do you respond to missing a deadline you set yourself?',
    backgroundImage: unsplash('1558618666-fcd25c85cd64'),
    answers: [
      { text: 'Self-imposed accountability — I hold myself to it', scores: { enforcer: 8, igniter: 1, visionary: 1 } },
      { text: 'I reset and come back with more energy', scores: { enforcer: 1, igniter: 8, visionary: 1 } },
      { text: 'I reflect on what the miss is teaching me', scores: { enforcer: 1, igniter: 2, visionary: 7 } },
      { text: 'I adjust the plan and keep moving', scores: { enforcer: 3, igniter: 4, visionary: 3 } },
    ],
  },
  {
    id: 'q10',
    text: 'Which reward actually motivates you most?',
    backgroundImage: unsplash('1432462770865-360a0b7e9c1e'),
    answers: [
      { text: 'Proof I\'m stronger than I was', scores: { enforcer: 7, igniter: 2, visionary: 1 } },
      { text: 'The feeling of winning — the rush itself', scores: { enforcer: 2, igniter: 7, visionary: 1 } },
      { text: 'Knowing I\'m building toward something meaningful', scores: { enforcer: 1, igniter: 1, visionary: 8 } },
    ],
  },
  {
    id: 'q11',
    text: 'When you imagine your best self, what do you see?',
    backgroundImage: unsplash('1557804506-669a67965ba0'),
    answers: [
      { text: 'Someone relentlessly disciplined — no exceptions', scores: { enforcer: 8, igniter: 1, visionary: 1 } },
      { text: 'Someone living with electric energy every day', scores: { enforcer: 1, igniter: 8, visionary: 1 } },
      { text: 'Someone who lives with deep purpose and clarity', scores: { enforcer: 1, igniter: 1, visionary: 8 } },
      { text: 'Someone who just shows up — consistently', scores: { enforcer: 4, igniter: 3, visionary: 3 } },
    ],
  },
  {
    id: 'q12',
    text: 'How honest are you with yourself when you fall short?',
    backgroundImage: unsplash('1590283603385-17ffb3a7f29f'),
    answers: [
      { text: 'Brutally — I need to face it head-on', scores: { enforcer: 9, igniter: 0, visionary: 1 } },
      { text: 'I prefer to focus forward and keep my energy positive', scores: { enforcer: 0, igniter: 8, visionary: 2 } },
      { text: 'I try to understand the "why" behind the miss', scores: { enforcer: 2, igniter: 1, visionary: 7 } },
      { text: 'I balance self-compassion with accountability', scores: { enforcer: 3, igniter: 3, visionary: 4 } },
    ],
  },
]

// ─── Result Calculator ────────────────────────────────────────────────────

export function calculateResult(
  answers: Record<string, MotivatorBlend>
): AssessmentResult {
  const totals: MotivatorBlend = { enforcer: 0, igniter: 0, visionary: 0 }

  for (const scores of Object.values(answers)) {
    totals.enforcer += scores.enforcer
    totals.igniter += scores.igniter
    totals.visionary += scores.visionary
  }

  const total = totals.enforcer + totals.igniter + totals.visionary || 1
  const scores: MotivatorBlend = {
    enforcer: Math.round((totals.enforcer / total) * 100),
    igniter: Math.round((totals.igniter / total) * 100),
    visionary: Math.round((totals.visionary / total) * 100),
  }

  // Ensure sum is exactly 100
  const diff = 100 - (scores.enforcer + scores.igniter + scores.visionary)
  scores.enforcer += diff

  const sorted = (
    Object.entries(scores) as [MotivatorProfile, number][]
  ).sort((a, b) => b[1] - a[1])

  const primary = sorted[0][0]
  const secondary = sorted[1][1] >= 30 ? sorted[1][0] : null

  return { scores, primary, secondary }
}
