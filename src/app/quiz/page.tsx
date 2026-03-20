'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Question {
  id: string;
  text: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  order: number;
}

interface Answer {
  questionId: string;
  selected: string;
  isCorrect: boolean;
}

export default function QuizPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [userId, setUserId] = useState('');
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [blocked, setBlocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<'quiz' | 'review'>('quiz');
  const hasCheated = useRef(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const reportCheat = useCallback(async (reason: string) => {
    if (hasCheated.current) return;
    hasCheated.current = true;
    try {
      await fetch('/api/cheat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
    } catch { /* best effort */ }
    setBlocked(true);
  }, []);

  useEffect(() => {
    const handleVisibility = () => { if (document.hidden) reportCheat('tab_switch'); };
    const handleBlur = () => { reportCheat('window_blur'); };
    const handleBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); reportCheat('page_exit'); };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [reportCheat]);

  const shuffleWithSeed = (arr: Question[], seed: string) => {
    const shuffled = [...arr];
    let h = 0;
    for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0;
    for (let i = shuffled.length - 1; i > 0; i--) {
      h = (h * 16807 + 0) % 2147483647;
      const j = Math.abs(h) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const meRes = await fetch('/api/auth/me');
        const meData = await meRes.json();
        if (!meData.user) { router.push('/'); return; }
        if (meData.user.blocked) { setBlocked(true); return; }
        if (meData.user.role === 'admin') { router.push('/admin'); return; }
        setUserId(meData.user.id);
        const quizRes = await fetch('/api/quiz');
        const quizData = await quizRes.json();
        if (!quizData.quizState?.isActive) { router.push('/waiting'); return; }
        const shuffled = shuffleWithSeed(quizData.questions || [], meData.user.id);
        setQuestions(shuffled);
        setAnswers(quizData.answers || []);
        const answeredIds = new Set((quizData.answers || []).map((a: Answer) => a.questionId));
        const firstUnanswered = shuffled.findIndex((q: Question) => !answeredIds.has(q.id));
        if (firstUnanswered === -1 && shuffled.length > 0) {
          setPhase('review');
        } else {
          setCurrentIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
        }
        setLoading(false);
      } catch { router.push('/'); }
    };
    load();
  }, [router]);

  // Poll global timer — auto-submit when admin stops quiz
  useEffect(() => {
    if (blocked) return;
    const poll = setInterval(async () => {
      try {
        const res = await fetch('/api/quiz');
        const data = await res.json();
        if (!data.quizState?.isActive) {
          clearInterval(poll);
          if (timerRef.current) clearInterval(timerRef.current);
          try { await fetch('/api/quiz/submit', { method: 'POST' }); } catch {}
          router.push('/result');
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [blocked, router]);

  useEffect(() => {
    if (!showOptions || blocked || phase === 'review') return;
    setTimeLeft(10);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          moveToNext();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showOptions, currentIndex, blocked, phase]);

  const handleSelectOption = (option: string) => {
    if (submitting || blocked) return;
    setSelectedOption(option);
    const question = questions[currentIndex];
    fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId: question.id, selected: option }),
    }).catch(() => {});
  };

  const handleReviewChange = (questionId: string, option: string) => {
    setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, selected: option } : a));
    fetch('/api/quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionId, selected: option }),
    }).catch(() => {});
  };

  const moveToNext = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    const question = questions[currentIndex];
    if (!selectedOption) {
      fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, selected: 'TIMEOUT' }),
      }).catch(() => {});
    }
    const newAnswer: Answer = {
      questionId: question.id,
      selected: selectedOption || 'TIMEOUT',
      isCorrect: false,
    };
    setAnswers(prev => [...prev.filter(a => a.questionId !== question.id), newAnswer]);
    setSelectedOption(null);
    setShowOptions(false);
    if (currentIndex + 1 >= questions.length) {
      setPhase('review');
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleFinishQuiz = async () => {
    setSubmitting(true);
    try { await fetch('/api/quiz/submit', { method: 'POST' }); } catch {}
    router.push('/result');
  };

  if (blocked) {
    return (
      <div className="blocked-overlay">
        <div className="blocked-content">
          <div className="blocked-icon">🚫</div>
          <h2>Quiz Blocked</h2>
          <p>Suspicious activity was detected. You switched tabs, opened another app, or attempted to leave the page. Your account has been flagged and the admin has been notified.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center' }}>
          <img src="/feedex-logo.jpeg" alt="FEEDEX" style={{ width: 80, height: 80, borderRadius: 20, margin: '0 auto 1.5rem', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading quiz...</p>
        </div>
      </div>
    );
  }

  // ===== REVIEW PHASE =====
  if (phase === 'review') {
    return (
      <div style={{ minHeight: '100vh', padding: '1.5rem', maxWidth: 700, margin: '0 auto' }}>
        <div className="glass-card" style={{ textAlign: 'center', marginBottom: '1.5rem', padding: '1.5rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>Review Your Answers</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            You can change any answer below before submitting.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {questions.map((q, i) => {
            const answer = answers.find(a => a.questionId === q.id);
            const selected = answer?.selected || '';
            return (
              <div key={q.id} className="glass-card" style={{ padding: '1.25rem' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <span style={{ color: 'var(--accent-light)', fontWeight: 700, fontSize: '0.85rem' }}>Q{i + 1}.</span>{' '}
                  <span style={{ fontWeight: 600 }}>{q.text}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {([
                    { key: 'A', text: q.optionA },
                    { key: 'B', text: q.optionB },
                    { key: 'C', text: q.optionC },
                    { key: 'D', text: q.optionD },
                  ]).map(opt => (
                    <button
                      key={opt.key}
                      onClick={() => handleReviewChange(q.id, opt.key)}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '10px',
                        border: `2px solid ${selected === opt.key ? 'var(--accent-light)' : 'var(--border)'}`,
                        background: selected === opt.key ? 'rgba(21,182,214,0.15)' : 'rgba(10,10,20,0.5)',
                        color: selected === opt.key ? 'var(--accent-light)' : 'var(--text-secondary)',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif',
                        fontSize: '0.85rem',
                        textAlign: 'left',
                        transition: 'all 0.2s',
                        fontWeight: selected === opt.key ? 600 : 400,
                      }}
                    >
                      <strong>{opt.key}.</strong> {opt.text}
                    </button>
                  ))}
                </div>
                {selected === 'TIMEOUT' && (
                  <p style={{ color: 'var(--warning)', fontSize: '0.8rem', marginTop: '0.5rem' }}>⚠️ Timed out — select an answer!</p>
                )}
              </div>
            );
          })}
        </div>

        <button className="btn-primary" style={{ width: '100%', fontSize: '1.1rem', padding: '1rem' }} onClick={handleFinishQuiz} disabled={submitting}>
          {submitting ? 'Submitting...' : '🏆 Submit Final Answers & View Results'}
        </button>
      </div>
    );
  }

  // ===== QUIZ PHASE =====
  const question = questions[currentIndex];
  const dashOffset = showOptions ? (283 * (1 - timeLeft / 10)) : 0;

  return (
    <div className="page-container">
      <div style={{ maxWidth: 650, width: '100%' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Question {currentIndex + 1} of {questions.length}</span>
            <span style={{ color: 'var(--accent-light)', fontSize: '0.85rem', fontWeight: 600 }}>{answers.length} answered</span>
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}></div>
          </div>
        </div>

        <div className="glass-card" key={currentIndex}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.5, flex: 1, paddingRight: '1rem' }}>{question.text}</h2>
            {showOptions && (
              <div className="timer-circle" style={{ flexShrink: 0 }}>
                <svg width="80" height="80" viewBox="0 0 100 100">
                  <circle className="timer-bg" cx="50" cy="50" r="45" />
                  <circle className="timer-fill" cx="50" cy="50" r="45"
                    style={{ strokeDashoffset: dashOffset, stroke: timeLeft <= 3 ? 'var(--danger)' : 'var(--accent-light)' }} />
                </svg>
                <div className="timer-text" style={{
                  color: timeLeft <= 3 ? 'var(--danger)' : 'var(--accent-light)',
                  animation: timeLeft <= 3 ? 'countdownPulse 0.5s ease infinite' : 'none'
                }}>{timeLeft}</div>
              </div>
            )}
          </div>

          {!showOptions ? (
            <button className="btn-primary" style={{ width: '100%', fontSize: '1.05rem', padding: '1rem' }} onClick={() => setShowOptions(true)}>
              👁️ Show Options & Start Timer (10s)
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                { key: 'A', text: question.optionA },
                { key: 'B', text: question.optionB },
                { key: 'C', text: question.optionC },
                { key: 'D', text: question.optionD },
              ].map(opt => (
                <button
                  key={opt.key}
                  className={`option-btn ${selectedOption === opt.key ? 'selected' : ''}`}
                  onClick={() => handleSelectOption(opt.key)}
                  disabled={submitting}
                >
                  <span className="option-label">{opt.key}</span>
                  <span>{opt.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
