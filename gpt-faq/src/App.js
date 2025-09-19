import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

import QuestionInput from "./components/QuestionInput";
import AnswerDisplay from "./components/AnswerDisplay";
import UsageTracker from "./components/UsageTracker";
import { askQuestion, getUsage, clearSession } from "./services/api";

function App() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usage, setUsage] = useState(null);
  const [error, setError] = useState("");

  const refreshUsage = async () => {
    try {
      const u = await getUsage();
      setUsage(u);
    } catch {
      // ignore initial failures
    }
  };

  useEffect(() => {
    refreshUsage();
  }, []);

  const handleAsk = async (question) => {
    setLoading(true);
    setError("");
    try {
      const res = await askQuestion(question);
      setHistory((h) => [...h, { question, answer: res.answer }]);
      refreshUsage();
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        (e?.response?.status === 429
          ? "Rate limit reached for this session."
          : "Could not get an answer.");
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = async () => {
    try {
      await clearSession();
      setHistory([]);
      refreshUsage();
    } catch {
      setError("Could not clear session.");
    }
  };

  return (
    <div className="container py-4">
      <h3 className="mb-1">ChatGPT-Powered FAQ</h3>
      <div className="text-muted mb-3">Ask questions and get instant AI answers.</div>

      {error && (
        <div className="alert alert-danger py-2">{error}</div>
      )}

      <UsageTracker usage={usage} onClear={handleClear} />
      <QuestionInput onSubmit={handleAsk} loading={loading} />
      <AnswerDisplay history={history} />
    </div>
  );
}

export default App;
