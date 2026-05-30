import { useEffect, useState } from 'react';
import { getTodayQuiz, submitQuizResponse } from '../api/quiz';
import type { QuizTemplate } from '../types/api';
import './QuizPrompt.css';

interface QuizPromptProps {
  username: string;
  onComplete: () => void;
}

export function QuizPrompt({ username, onComplete }: QuizPromptProps) {
  const [questions, setQuestions] = useState<QuizTemplate[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await getTodayQuiz();
        if (cancelled) {
          return;
        }
        if (!data.completedToday && data.questions.length > 0) {
          setQuestions(data.questions);
          setVisible(true);
        }
      } catch {
        // Quiz is optional; fail silently on dashboard
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading || !visible) {
    return null;
  }

  const handleSubmit = async () => {
    const missing = questions.some((q) => !answers[String(q.id)]?.trim());
    if (missing) {
      setError('Responde todas las preguntas');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await submitQuizResponse(username, { answers });
      setVisible(false);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo enviar el quiz');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="quiz-prompt-overlay" role="dialog" aria-modal="true" aria-labelledby="quiz-prompt-title">
      <div className="quiz-prompt card card--elevated">
        <h2 id="quiz-prompt-title">Quiz diario</h2>
        <p className="quiz-prompt-intro">Unas preguntas rápidas para conocerte mejor hoy.</p>

        {questions.map((question) => (
          <div key={question.id} className="form-group quiz-prompt-question">
            <p>{question.question}</p>
            {question.type === 'scale' ? (
              <div className="quiz-prompt-scale">
                {question.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    className={`quiz-prompt-option ${answers[String(question.id)] === opt ? 'is-active' : ''}`}
                    onClick={() =>
                      setAnswers((prev) => ({ ...prev, [String(question.id)]: opt }))
                    }
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <div className="quiz-prompt-choices">
                {question.options.map((opt) => (
                  <label key={opt} className="quiz-prompt-choice">
                    <input
                      type="radio"
                      name={`quiz-${question.id}`}
                      value={opt}
                      checked={answers[String(question.id)] === opt}
                      onChange={() =>
                        setAnswers((prev) => ({ ...prev, [String(question.id)]: opt }))
                      }
                    />
                    {opt}
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="quiz-prompt-actions">
          <button
            type="button"
            className="btn-registro-form"
            disabled={busy}
            onClick={() => void handleSubmit()}
          >
            Enviar respuestas
          </button>
          <button
            type="button"
            className="quiz-prompt-skip"
            disabled={busy}
            onClick={() => setVisible(false)}
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );
}
