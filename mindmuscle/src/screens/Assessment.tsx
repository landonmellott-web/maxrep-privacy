import { useState, useCallback, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { ASSESSMENT_QUESTIONS, calculateResult } from '../lib/questions'
import type { MotivatorBlend } from '../lib/types'
import { useApp } from '../context/AppContext'

// ─── Transition style injection ────────────────────────────────────────────────

const STYLE_ID = 'assessment-transitions'

function injectStyles() {
  if (typeof document === 'undefined') return
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    @keyframes assessKenBurns {
      from { transform: scale(1) translateZ(0); }
      to   { transform: scale(1.08) translateZ(0); }
    }
    @keyframes slideInRight {
      from { opacity: 0; transform: translateX(48px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutLeft {
      from { opacity: 1; transform: translateX(0); }
      to   { opacity: 0; transform: translateX(-48px); }
    }
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-48px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes slideOutRight {
      from { opacity: 1; transform: translateX(0); }
      to   { opacity: 0; transform: translateX(48px); }
    }
    .assess-ken-burns {
      animation: assessKenBurns 14s ease-out forwards;
    }
    .assess-slide-in-right  { animation: slideInRight  0.35s ease-out both; }
    .assess-slide-in-left   { animation: slideInLeft   0.35s ease-out both; }
    .assess-slide-out-left  { animation: slideOutLeft  0.25s ease-in  both; }
    .assess-slide-out-right { animation: slideOutRight 0.25s ease-in  both; }

    @media (prefers-reduced-motion: reduce) {
      .assess-ken-burns,
      .assess-slide-in-right,
      .assess-slide-in-left,
      .assess-slide-out-left,
      .assess-slide-out-right {
        animation: none !important;
      }
    }
  `
  document.head.appendChild(style)
}

injectStyles()

// ─── Types ─────────────────────────────────────────────────────────────────────

type TransitionDirection = 'forward' | 'backward'

// ─── Component ─────────────────────────────────────────────────────────────────

export default function Assessment() {
  const navigate = useNavigate()
  const { setAssessmentResult, setPendingAssessment } = useApp()

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, MotivatorBlend>>({})
  const [transitioning, setTransitioning] = useState(false)
  const [direction, setDirection] = useState<TransitionDirection>('forward')
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [animKey, setAnimKey] = useState(0)
  const pendingIndexRef = useRef<number | null>(null)

  const total = ASSESSMENT_QUESTIONS.length
  const question = ASSESSMENT_QUESTIONS[currentIndex]
  const progressPct = (currentIndex / total) * 100

  // Apply pending index change after transition completes
  useEffect(() => {
    if (!transitioning && pendingIndexRef.current !== null) {
      const next = pendingIndexRef.current
      pendingIndexRef.current = null
      setCurrentIndex(next)
      setSelectedAnswer(null)
      setAnimKey((k) => k + 1)
    }
  }, [transitioning])

  const handleAnswer = useCallback(
    (answerIndex: number) => {
      if (transitioning) return
      const answer = question.answers[answerIndex]
      if (!answer) return

      const newAnswers = { ...answers, [question.id]: answer.scores }
      setAnswers(newAnswers)
      setSelectedAnswer(answerIndex)

      if (currentIndex === total - 1) {
        // Last question — compute result and navigate
        setTransitioning(true)
        setTimeout(() => {
          const result = calculateResult(newAnswers)
          setAssessmentResult(result)
          setPendingAssessment(result)
          navigate('/analyzing')
        }, 500)
        return
      }

      // Transition to next question
      setDirection('forward')
      setTransitioning(true)
      setTimeout(() => {
        pendingIndexRef.current = currentIndex + 1
        setTransitioning(false)
      }, 280)
    },
    [
      transitioning,
      question,
      answers,
      currentIndex,
      total,
      setAssessmentResult,
      setPendingAssessment,
      navigate,
    ]
  )

  const handleBack = useCallback(() => {
    if (transitioning) return
    if (currentIndex === 0) {
      navigate('/welcome')
      return
    }
    setDirection('backward')
    setTransitioning(true)
    setTimeout(() => {
      pendingIndexRef.current = currentIndex - 1
      setTransitioning(false)
    }, 280)
  }, [transitioning, currentIndex, navigate])

  // Pick slide animation classes
  const contentClass = transitioning
    ? direction === 'forward'
      ? 'assess-slide-out-left'
      : 'assess-slide-out-right'
    : direction === 'forward'
      ? 'assess-slide-in-right'
      : 'assess-slide-in-left'

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: '100dvh', backgroundColor: '#0A0A0B' }}
    >
      {/* ── Background image with Ken Burns ── */}
      <img
        key={`bg-${currentIndex}`}
        src={question.backgroundImage}
        alt=""
        aria-hidden="true"
        className="assess-ken-burns absolute inset-0 h-full w-full object-cover"
        style={{ willChange: 'transform' }}
        loading="eager"
        decoding="async"
      />

      {/* ── Dark overlay ── */}
      <div
        className="absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(to bottom, rgba(10,10,11,0.6) 0%, rgba(10,10,11,0.65) 40%, rgba(10,10,11,0.97) 80%)',
        }}
      />

      {/* ── Progress bar ── */}
      <div
        className="absolute top-0 left-0 right-0 z-30"
        style={{ height: '3px', backgroundColor: 'rgba(42,42,46,0.8)' }}
      >
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{
            width: `${progressPct}%`,
            background: 'linear-gradient(90deg, #E8A33D, #C8872A)',
          }}
        />
      </div>

      {/* ── Top bar: back + counter ── */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-6 pb-2">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back"
          className="flex items-center justify-center rounded-full p-2 transition-opacity duration-150 active:opacity-60"
          style={{
            background: 'rgba(26,26,29,0.7)',
            border: '1px solid rgba(42,42,46,0.6)',
            color: '#F4F2EE',
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <span
          style={{
            fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
            fontSize: '0.8125rem',
            color: 'rgba(139,139,146,1)',
            letterSpacing: '0.05em',
          }}
        >
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* ── Main content (question + answers) ── */}
      <div
        key={`q-${animKey}`}
        className={`absolute inset-0 z-10 flex flex-col items-center justify-end pb-10 px-5 ${contentClass}`}
        style={{ pointerEvents: transitioning ? 'none' : 'auto' }}
      >
        {/* Question text */}
        <div className="mb-6 w-full max-w-sm text-center">
          <p
            className="uppercase leading-tight text-white"
            style={{
              fontFamily: '"Anton", ui-sans-serif, system-ui, sans-serif',
              fontSize: 'clamp(1.5rem, 5vw, 2rem)',
              textShadow: '0 2px 16px rgba(0,0,0,0.6)',
            }}
          >
            {question.text}
          </p>
        </div>

        {/* Answer cards */}
        <div className="w-full max-w-sm flex flex-col gap-3">
          {question.answers.map((answer, i) => {
            const isSelected = selectedAnswer === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => handleAnswer(i)}
                disabled={transitioning}
                className="rounded-xl px-4 py-4 text-left transition-all duration-150 active:scale-[0.98]"
                style={{
                  background: isSelected
                    ? 'rgba(232,163,61,0.15)'
                    : 'rgba(26,26,29,0.88)',
                  border: isSelected
                    ? '1px solid #E8A33D'
                    : '1px solid rgba(42,42,46,0.9)',
                  color: '#F4F2EE',
                  fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
                  fontSize: '0.9375rem',
                  lineHeight: '1.4',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  cursor: transitioning ? 'default' : 'pointer',
                  boxShadow: isSelected ? '0 0 0 1px rgba(232,163,61,0.3)' : 'none',
                }}
              >
                {answer.text}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
