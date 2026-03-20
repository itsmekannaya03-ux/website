'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
interface DashboardData {
  stats: { totalStudents: number; passed: number; failed: number; pending: number };
  toppers: { name: string; email: string; score: number; total: number }[];
  cheatFlags: { id: string; name: string; email: string; reason: string; time: string }[];
  blockedUsers: { id: string; name: string; email: string }[];
  quizState: { isActive: boolean; startTime: string | null; duration: number } | null;
  questions: { id: string; text: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: string; order: number }[];
}

const COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

export default function AdminPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'dashboard' | 'questions' | 'cheats'>('dashboard');
  const [globalTimer, setGlobalTimer] = useState('');
  const [duration, setDuration] = useState(30);

  // New question form
  const [newQ, setNewQ] = useState({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/dashboard');
      if (res.status === 403) { router.push('/'); return; }
      const d = await res.json();
      setData(d);
      if (d.quizState?.duration) setDuration(d.quizState.duration);
    } catch { /* ignore */ }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const checkAuth = async () => {
      const meRes = await fetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user || meData.user.role !== 'admin') {
        router.push('/');
        return;
      }
      fetchData();
    };
    checkAuth();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [router, fetchData]);

  // Global timer countdown
  useEffect(() => {
    if (!data?.quizState?.isActive || !data.quizState.startTime) {
      setGlobalTimer('');
      return;
    }
    const tick = () => {
      const start = new Date(data.quizState!.startTime!).getTime();
      const end = start + data.quizState!.duration * 60 * 1000;
      const now = Date.now();
      const remaining = Math.max(0, end - now);
      if (remaining <= 0) {
        setGlobalTimer('TIME UP');
        return;
      }
      const mins = Math.floor(remaining / 60000);
      const secs = Math.floor((remaining % 60000) / 1000);
      setGlobalTimer(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [data?.quizState]);

  const toggleQuiz = async () => {
    const isActive = !data?.quizState?.isActive;
    await fetch('/api/admin/quiz-state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive, duration }),
    });
    fetchData();
  };

  const addQuestion = async () => {
    if (!newQ.text || !newQ.optionA || !newQ.optionB || !newQ.optionC || !newQ.optionD) return;
    setSaving(true);
    await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newQ),
    });
    setNewQ({ text: '', optionA: '', optionB: '', optionC: '', optionD: '', correctOption: 'A' });
    setSaving(false);
    fetchData();
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    await fetch('/api/admin/questions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchData();
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ textAlign: 'center' }}>
          <img src="/feedex-logo.jpeg" alt="FEEDEX" style={{ width: 50, height: 50, borderRadius: 14, margin: '0 auto 1.5rem', display: 'block' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const pieData = [
    { name: 'Passed', value: data.stats.passed },
    { name: 'Failed', value: data.stats.failed },
    { name: 'Pending', value: data.stats.pending },
  ].filter(d => d.value > 0);

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div style={{ minHeight: '100vh', padding: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <img src="/feedex-logo.jpeg" alt="FEEDEX" style={{ width: 50, height: 50, borderRadius: 14, objectFit: 'cover' }} />
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Quiz Platform Control Center</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          {data.quizState?.isActive && globalTimer && (
            <div style={{
              background: globalTimer === 'TIME UP' ? 'rgba(239,68,68,0.15)' : 'rgba(108,99,255,0.15)',
              padding: '0.6rem 1.25rem',
              borderRadius: '12px',
              fontSize: '1.3rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              color: globalTimer === 'TIME UP' ? 'var(--danger)' : 'var(--accent)',
              border: `1px solid ${globalTimer === 'TIME UP' ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
            }}>
              ⏱️ {globalTimer}
            </div>
          )}
          <button className="btn-danger" onClick={handleLogout} style={{ padding: '0.6rem 1rem', fontSize: '0.85rem' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['dashboard', 'questions', 'cheats'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.65rem 1.5rem',
              borderRadius: '12px',
              border: 'none',
              background: tab === t ? 'var(--accent)' : 'rgba(25,25,60,0.6)',
              color: tab === t ? 'white' : 'var(--text-secondary)',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              fontSize: '0.9rem',
              transition: 'all 0.3s',
              textTransform: 'capitalize',
            }}
          >
            {t === 'dashboard' ? '📊 Dashboard' : t === 'questions' ? '❓ Questions' : '🚨 Cheats'}
          </button>
        ))}
      </div>

      {/* Dashboard Tab */}
      {tab === 'dashboard' && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {/* Stats cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-value">{data.stats.totalStudents}</div>
              <div className="stat-label">Total Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #22c55e, #06b6d4)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{data.stats.passed}</div>
              <div className="stat-label">Passed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #ef4444, #f59e0b)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{data.stats.failed}</div>
              <div className="stat-label">Failed</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ background: 'linear-gradient(135deg, #f59e0b, #06b6d4)', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>{data.stats.pending}</div>
              <div className="stat-label">Pending</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            {/* Pie Chart */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Results Distribution</h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${value}`}>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--text-primary)' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
                  No results yet
                </div>
              )}
            </div>

            {/* Quiz Control + QR */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>🎮 Quiz Control</h3>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  min={1}
                  max={120}
                  disabled={data.quizState?.isActive}
                />
              </div>
              <button
                className={data.quizState?.isActive ? 'btn-danger' : 'btn-success'}
                style={{ width: '100%', marginBottom: '1.5rem' }}
                onClick={toggleQuiz}
              >
                {data.quizState?.isActive ? '⏹️ Stop Quiz' : '▶️ Start Quiz'}
              </button>
            </div>
          </div>

          {/* Toppers */}
          {data.toppers.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>🏆 Top Students</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Score</th>
                  </tr>
                </thead>
                <tbody>
                  {data.toppers.map((t, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: i === 0 ? '#f59e0b' : 'var(--text-primary)' }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                      </td>
                      <td>{t.name || 'N/A'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{t.email}</td>
                      <td><span className="badge badge-success">{t.score}/{t.total}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Questions Tab */}
      {tab === 'questions' && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          {/* Add question form */}
          <div className="glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>➕ Add New Question</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <textarea
                className="input-field"
                placeholder="Question text..."
                value={newQ.text}
                onChange={e => setNewQ({ ...newQ, text: e.target.value })}
                rows={2}
                style={{ resize: 'vertical' }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input className="input-field" placeholder="Option A" value={newQ.optionA} onChange={e => setNewQ({ ...newQ, optionA: e.target.value })} />
                <input className="input-field" placeholder="Option B" value={newQ.optionB} onChange={e => setNewQ({ ...newQ, optionB: e.target.value })} />
                <input className="input-field" placeholder="Option C" value={newQ.optionC} onChange={e => setNewQ({ ...newQ, optionC: e.target.value })} />
                <input className="input-field" placeholder="Option D" value={newQ.optionD} onChange={e => setNewQ({ ...newQ, optionD: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', flexShrink: 0 }}>Correct Answer:</label>
                <select className="input-field" style={{ width: 'auto' }} value={newQ.correctOption} onChange={e => setNewQ({ ...newQ, correctOption: e.target.value })}>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
                <button className="btn-success" onClick={addQuestion} disabled={saving} style={{ marginLeft: 'auto' }}>
                  {saving ? 'Adding...' : '+ Add Question'}
                </button>
              </div>
            </div>
          </div>

          {/* Existing questions list */}
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              📝 Questions ({data.questions.length})
            </h3>
            {data.questions.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No questions yet. Add some above!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {data.questions.map((q, i) => (
                  <div key={q.id} style={{
                    background: 'rgba(15,15,40,0.5)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    padding: '1rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div style={{ flex: 1 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '0.85rem' }}>Q{i + 1}.</span>{' '}
                        <span style={{ fontWeight: 600 }}>{q.text}</span>
                      </div>
                      <button
                        onClick={() => deleteQuestion(q.id)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: 'var(--danger)',
                          borderRadius: '8px',
                          padding: '0.3rem 0.6rem',
                          cursor: 'pointer',
                          fontSize: '0.8rem',
                          fontFamily: 'Inter, sans-serif',
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.85rem' }}>
                      {['A', 'B', 'C', 'D'].map(opt => (
                        <div key={opt} style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          background: q.correctOption === opt ? 'rgba(34,197,94,0.15)' : 'rgba(25,25,60,0.5)',
                          border: `1px solid ${q.correctOption === opt ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                          color: q.correctOption === opt ? 'var(--success)' : 'var(--text-secondary)',
                        }}>
                          <strong>{opt}:</strong> {q[`option${opt}` as keyof typeof q]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cheats Tab */}
      {tab === 'cheats' && (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div className="glass-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
              🚨 Cheat Reports ({data.cheatFlags.length})
            </h3>
            {data.cheatFlags.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                No cheating attempts detected. 🎉
              </p>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Email</th>
                    <th>Reason</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.cheatFlags.map(c => (
                    <tr key={c.id}>
                      <td>{c.name || 'N/A'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{c.email}</td>
                      <td>
                        <span className="badge badge-danger">
                          {c.reason === 'tab_switch' ? '🔄 Tab Switch' : c.reason === 'window_blur' ? '🪟 Window Blur' : '🚪 Page Exit'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        {new Date(c.time).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {data.blockedUsers.length > 0 && (
            <div className="glass-card" style={{ padding: '1.5rem', marginTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
                🚫 Blocked Users ({data.blockedUsers.length})
              </h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                  </tr>
                </thead>
                <tbody>
                  {data.blockedUsers.map(u => (
                    <tr key={u.id}>
                      <td>{u.name || 'N/A'}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{u.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
