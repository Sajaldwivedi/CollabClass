import React from "react";
import { useParams } from "react-router-dom";
import { TestsApi } from "../../api/tests";
import { Button } from "../../components/ui/button";

type TestQuestion = {
  questionId: string;
  questionText: string;
  options: string[];
};

type AttemptData = {
  attemptId: string;
  duration: number;
  questions: TestQuestion[];
  resumed?: boolean;
  remainingSeconds?: number;
};

export const StudentTestAttemptPage: React.FC = () => {
  const { testId } = useParams();
  const [attempt, setAttempt] = React.useState<AttemptData | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [violationMessage, setViolationMessage] = React.useState("");
  const [tabSwitchCount, setTabSwitchCount] = React.useState(0);
  const [windowBlurCount, setWindowBlurCount] = React.useState(0);
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!testId) return;

    let mounted = true;
    setLoading(true);
    TestsApi.start(testId)
      .then((response) => {
        if (!mounted) return;
        const payload = response.data;
        setAttempt(payload);
        if (payload.resumed && typeof payload.remainingSeconds === "number") {
          setSecondsLeft(payload.remainingSeconds);
        } else {
          setSecondsLeft(payload.duration * 60);
        }
      })
      .catch((error: any) => {
        if (!mounted) return;
        setViolationMessage(error?.response?.data?.message || "Unable to start this test.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [testId]);

  React.useEffect(() => {
    if (secondsLeft === null) return;
    if (secondsLeft <= 0) {
      void handleSubmit(true);
      return;
    }

    const timer = window.setTimeout(() => setSecondsLeft((current) => (current === null ? current : current - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  React.useEffect(() => {
    const handleBlur = () => {
      setWindowBlurCount((current) => current + 1);
      setViolationMessage("Window blurred. Please keep the test window in focus.");
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((current) => current + 1);
        setViolationMessage("Tab switch detected. Return to the test window immediately.");
      }
    };

    window.addEventListener("blur", handleBlur);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const handleSubmit = async (autoSubmit = false) => {
    if (!attempt || submitting || !testId) return;

    setSubmitting(true);
    try {
      await TestsApi.submit(testId, {
        answers: attempt.questions.map((question) => ({
          questionId: question.questionId,
          selectedOptions: answers[question.questionId] !== undefined ? [answers[question.questionId]] : []
        })),
        tabSwitchCount,
        windowBlurCount,
        fullscreenExitCount: 0,
        autoSubmit
      });
      window.close();
    } catch {
      setViolationMessage("Failed to submit the test. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-slate-300">Starting test...</div>;
  }

  if (!attempt) {
    return (
      <div className="space-y-4 p-6">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-200">
          {violationMessage || "Test could not be loaded."}
        </div>
        <Button onClick={() => window.close()}>Close window</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-4 text-slate-100">
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-5 shadow-soft-xl">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">Test in progress</h1>
              <p className="text-sm text-slate-400">
                Timer: {Math.floor((secondsLeft || 0) / 60)}:{String((secondsLeft || 0) % 60).padStart(2, "0")}
              </p>
            </div>
            <div className="text-right text-xs text-slate-400">
              <p>Tab switches: {tabSwitchCount}</p>
              <p>Window blurs: {windowBlurCount}</p>
            </div>
          </div>

          {violationMessage && (
            <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
              {violationMessage}
            </div>
          )}
        </div>

        <div className="space-y-4">
          {attempt.questions.map((question, index) => (
            <div key={question.questionId} className="rounded-3xl border border-slate-800 bg-slate-900/55 p-5">
              <p className="text-sm font-medium text-slate-100">
                {index + 1}. {question.questionText}
              </p>
              <div className="mt-4 space-y-2">
                {question.options.map((option, optionIndex) => (
                  <label
                    key={`${question.questionId}-${optionIndex}`}
                    className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/40 px-3 py-2 text-sm text-slate-300"
                  >
                    <input
                      type="radio"
                      name={question.questionId}
                      checked={answers[question.questionId] === optionIndex}
                      onChange={() => setAnswers((current) => ({ ...current, [question.questionId]: optionIndex }))}
                      className="h-4 w-4 accent-emerald-400"
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pb-4">
          <Button onClick={() => void handleSubmit(false)} disabled={submitting}>
            {submitting ? "Submitting..." : "Submit test"}
          </Button>
        </div>
      </div>
    </div>
  );
};
