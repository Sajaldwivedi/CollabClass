import React from "react";
import { useNavigate } from "react-router-dom";
import { TestsApi, type AvailableTest } from "../../api/tests";
import { Button } from "../../components/ui/button";
import { ROUTES } from "../../routes/paths";

export const StudentTestsPage: React.FC = () => {
  const [tests, setTests] = React.useState<AvailableTest[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [startingId, setStartingId] = React.useState<string | null>(null);

  const loadTests = React.useCallback(async () => {
    setLoading(true);
    try {
      const response = await TestsApi.available();
      setTests(response.data);
    } catch {
      setTests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadTests();
  }, [loadTests]);

  const navigate = useNavigate();

  const openAttemptWindow = (testId: string) => {
    const url = `${window.location.origin}${ROUTES.studentTestAttempt}/${testId}`;
    const popup = window.open(url, "_blank", "noopener,noreferrer");
    if (!popup) {
      // Popup blocked — fallback to same-tab attempt route to avoid blocking the student
      navigate(`${ROUTES.studentTestAttempt}/${testId}`);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-slate-50">Tests</h2>
        <p className="text-sm text-slate-400">
          Open a test in a new window. Already attempted tests will be marked as attempted.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-slate-400">Loading tests...</div>
      ) : tests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 px-4 py-6 text-sm text-slate-400">
          No active tests are available for your section right now.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {tests.map((test) => {
            const attempted = test.attemptStatus === "submitted" || test.attemptStatus === "suspicious";
            const inProgress = test.attemptStatus === "in-progress";
            return (
              <div key={test._id} className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 shadow-soft-xl">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-100">{test.title}</h3>
                    <p className="text-xs text-slate-400">{test.subject}</p>
                  </div>
                  <span className="rounded-full border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-300">
                    {attempted ? "Attempted" : inProgress ? "In progress" : test.status}
                  </span>
                </div>

                <div className="mt-4 space-y-2 text-sm text-slate-300">
                  <p>Section: {test.section}</p>
                  <p>Duration: {test.duration} minutes</p>
                  <p>Total Marks: {test.totalMarks}</p>
                  <p>Start: {new Date(test.startTime).toLocaleString()}</p>
                  <p>End: {new Date(test.endTime).toLocaleString()}</p>
                  {attempted && (
                    <p className="text-emerald-300">
                      Submitted: {test.attemptScore ?? 0} marks
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setStartingId(test._id);
                      openAttemptWindow(test._id);
                      setStartingId(null);
                    }}
                    disabled={attempted || startingId === test._id}
                  >
                    {attempted ? "Test attempted" : inProgress ? "Resume test" : startingId === test._id ? "Opening..." : "Open test"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
