import React from "react";

export default function Home() {
  const [username, setUsername] = React.useState("");
  const [workout, setWorkout] = React.useState("");
  const [duration, setDuration] = React.useState("");
  const [result, setResult] = React.useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [history, setHistory] = React.useState<Record<string, unknown>[]>([]);
  const [ollamaPrompt, setOllamaPrompt] = React.useState("");
  const [ollamaResponse, setOllamaResponse] = React.useState<string | null>(null);
  const [ollamaLoading, setOllamaLoading] = React.useState(false);
  
  const [aiProvider, setAiProvider] = React.useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ai-provider') || 'ollama';
    }
    return 'ollama';
  });
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ai-provider', aiProvider);
    }
  }, [aiProvider]);

  const fetchHistory = async (username: string) => {
    if (!username) return;
    try {
      const res = await fetch(`/api/workout-history?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const data = await res.json();
        setHistory(data.history || []);
      }
    } catch {}
  };

  React.useEffect(() => {
    if (username) fetchHistory(username);
  }, [username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/calculate-calories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-provider": aiProvider
        },
        body: JSON.stringify({ username, workout, duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      setResult(data);
      // Refresh history after logging
      if (username) fetchHistory(username);
    } catch (err: unknown) {
     if (err instanceof Error) {
       setError(err.message);
     } else {
       setError('An unknown error occurred');
     }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-start", background: "#f7fafc", paddingTop: 48 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
        <label htmlFor="ai-provider" style={{ fontWeight: 600, color: '#222', fontSize: 16 }}>AI Provider:</label>
        <select
          id="ai-provider"
          value={aiProvider}
          onChange={e => setAiProvider(e.target.value)}
          style={{ padding: '8px 16px', borderRadius: 6, border: '1.5px solid #bbb', fontSize: 16, background: '#fff', color: '#222', outline: 'none' }}
        >
          <option value="ollama">Ollama (local)</option>
          <option value="huggingface">Hugging Face (cloud)</option>
        </select>
      </div>
      <h1 style={{ marginBottom: 32, fontSize: 36, color: "#222", fontWeight: 700, letterSpacing: 1 }}>Fitness AI Tracker</h1>
      <form onSubmit={handleSubmit} style={{ background: "#fff", padding: 40, borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)", minWidth: 340, maxWidth: 400, width: "100%", marginBottom: 32 }}>
        <div style={{ marginBottom: 22 }}>
          <label htmlFor="username" style={{ display: "block", marginBottom: 10, fontWeight: 600, color: "#222", fontSize: 16 }}>Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            placeholder="e.g. alice123"
            style={{ width: "100%", padding: "12px 10px", borderRadius: 6, border: "1.5px solid #bbb", background: "#fff", color: "#222", fontSize: 16, outline: "none", marginBottom: 0, boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: 22 }}>
          <label htmlFor="workout" style={{ display: "block", marginBottom: 10, fontWeight: 600, color: "#222", fontSize: 16 }}>Workout Name</label>
          <input
            id="workout"
            type="text"
            value={workout}
            onChange={e => setWorkout(e.target.value)}
            required
            placeholder="e.g. Running"
            style={{ width: "100%", padding: "12px 10px", borderRadius: 6, border: "1.5px solid #bbb", background: "#fff", color: "#222", fontSize: 16, outline: "none", marginBottom: 0, boxSizing: "border-box" }}
          />
        </div>
        <div style={{ marginBottom: 28 }}>
          <label htmlFor="duration" style={{ display: "block", marginBottom: 10, fontWeight: 600, color: "#222", fontSize: 16 }}>Duration (minutes)</label>
          <input
            id="duration"
            type="number"
            min="1"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            required
            placeholder="e.g. 30"
            style={{ width: "100%", padding: "12px 10px", borderRadius: 6, border: "1.5px solid #bbb", background: "#fff", color: "#222", fontSize: 16, outline: "none", marginBottom: 0, boxSizing: "border-box" }}
          />
        </div>
        <button type="submit" style={{ background: "#0070f3", color: "#fff", border: "none", padding: "13px 0", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 18, width: "100%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }} disabled={loading}>
          {loading ? "Logging..." : "Log Workout"}
        </button>
      </form>
      {error && <div style={{ color: "#d00", marginTop: 16 }}>{error}</div>}
      {result && (
        <div style={{
          marginTop: 32,
          background: "#fff",
          padding: 28,
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          maxWidth: 400,
          width: "100%",
          fontSize: 16,
          color: "#222",
          marginBottom: 24,
        }}>
          <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 18, color: "#0070f3" }}>API Response</div>
          <pre style={{ margin: 0, background: "#f7fafc", borderRadius: 8, padding: 14, fontSize: 15, color: "#222", overflowX: "auto" }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
      {username && history.length > 0 && (
        <div style={{
          marginTop: 40,
          width: "100%",
          maxWidth: 600,
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
          padding: 32,
        }}>
          <h2 style={{ marginBottom: 20, fontWeight: 700, color: "#222", fontSize: 22 }}>Workout History for <span style={{ color: '#0070f3' }}>{username}</span></h2>
           <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 16,
              background: '#fff',
              border: '1.5px solid #e5e7eb',
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              minWidth: 480,
              tableLayout: 'fixed'
            }}>
              <thead>
                <tr style={{
                  background: '#f7fafc',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1
                }}>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, color: '#222', borderBottom: '1.5px solid #e5e7eb', borderRight: '1.5px solid #e5e7eb' }}>Workout</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, color: '#222', borderBottom: '1.5px solid #e5e7eb', borderRight: '1.5px solid #e5e7eb' }}>Duration</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, color: '#222', borderBottom: '1.5px solid #e5e7eb', borderRight: '1.5px solid #e5e7eb' }}>Calories</th>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontWeight: 700, color: '#222', borderBottom: '1.5px solid #e5e7eb' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item: Record<string, unknown>, idx: number) => (
                  <tr key={idx} style={{
                    borderBottom: '1px solid #eee',
                    background: idx % 2 === 0 ? '#fff' : '#f7fafc',
                    color: '#222'
                  }}>
                    <td style={{ padding: '12px 10px', borderRight: '1.5px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', wordBreak: 'break-word' }}>{typeof item.workout === "string" || typeof item.workout === "number" ? item.workout : JSON.stringify(item.workout)}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1.5px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', wordBreak: 'break-word' }}>{typeof item.duration === "string" || typeof item.duration === "number" ? item.duration : JSON.stringify(item.duration)}</td>
                    <td style={{ padding: '12px 10px', borderRight: '1.5px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', wordBreak: 'break-word' }}>{typeof item.calories === "string" || typeof item.calories === "number" ? item.calories : JSON.stringify(item.calories)}</td>
                    <td style={{ padding: '12px 10px', borderBottom: '1px solid #e5e7eb', wordBreak: 'break-word' }}>{typeof item.timestamp === "number" || typeof item.timestamp === "string" ? new Date(item.timestamp).toLocaleString() : JSON.stringify(item.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Ollama AI Section */}
      <div style={{
        marginTop: 48,
        width: "100%",
        maxWidth: 500,
        background: "#fff",
        borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: 32,
      }}>
        <h2 style={{ marginBottom: 20, fontWeight: 700, color: "#222", fontSize: 22 }}>Ask Fitness AI</h2>
        <form
          onSubmit={async e => {
            e.preventDefault();
            setOllamaLoading(true);
            setOllamaResponse(null);
            try {
              const res = await fetch("/api/ask-ai", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-ai-provider": aiProvider
                },
                body: JSON.stringify({ prompt: ollamaPrompt }),
              });
              const data = await res.json();
              setOllamaResponse(data.response);
            } catch (err: unknown) {
              if (err instanceof Error) {
                setOllamaResponse("Error: " + err.message);
              } else {
                setOllamaResponse("Error: " + String(err));
              }
            } finally {
              setOllamaLoading(false);
            }
          }}
          style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 0 }}
        >
          <input
            type="text"
            value={ollamaPrompt}
            onChange={e => setOllamaPrompt(e.target.value)}
            placeholder="Ask anything about fitness, workouts, nutrition..."
            style={{ flex: 1, padding: "12px 10px", borderRadius: 6, border: "1.5px solid #bbb", background: "#fff", color: "#222", fontSize: 16, outline: "none" }}
            disabled={ollamaLoading}
          />
          <button
            type="submit"
            style={{ background: "#0070f3", color: "#fff", border: "none", padding: "13px 24px", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 16, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            disabled={ollamaLoading || !ollamaPrompt.trim()}
          >
            {ollamaLoading ? "Asking..." : "Ask AI"}
          </button>
        </form>
        {ollamaResponse && (
          <div style={{ marginTop: 22, background: "#f7fafc", padding: 18, borderRadius: 10, color: "#222", fontSize: 16, minHeight: 32, boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
            {ollamaResponse}
          </div>
        )}
      </div>
    </div>
  );
}

