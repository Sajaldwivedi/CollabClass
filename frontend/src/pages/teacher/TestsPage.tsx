import React from "react";
import { TestsApi } from "../../api/tests";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";

type QuestionType = "mcq" | "multiple";

type DraftQuestion = {
  id: string;
  questionText: string;
  type: QuestionType;
  marks: number;
  options: string[];
  correctAnswers: number[];
};

type TestForm = {
  title: string;
  subject: string;
  section: string;
  duration: number | "";
  startTime: string;
  endTime: string;
  totalMarks: number | "";
  negativeMarking: number | "";
  shuffleQuestions: boolean;
  status: "draft" | "active" | "completed";
};

const createDraftQuestion = (): DraftQuestion => ({
  id: crypto.randomUUID(),
  questionText: "",
  type: "mcq",
  marks: 1,
  options: ["", "", "", ""],
  correctAnswers: []
});

const QuestionEditor: React.FC<{
  question: DraftQuestion;
  index: number;
  onChange: (next: DraftQuestion) => void;
  onRemove: () => void;
}> = ({ question, index, onChange, onRemove }) => {
  const update = (patch: Partial<DraftQuestion>) => onChange({ ...question, ...patch });

  const updateOption = (optionIndex: number, value: string) => {
    const options = [...question.options];
    options[optionIndex] = value;
    onChange({ ...question, options });
  };

  const addOption = () => onChange({ ...question, options: [...question.options, ""] });

  const removeOption = (optionIndex: number) => {
    const options = question.options.filter((_, currentIndex) => currentIndex !== optionIndex);
    const correctAnswers = question.correctAnswers
      .filter((answer) => answer !== optionIndex)
      .map((answer) => (answer > optionIndex ? answer - 1 : answer));
    onChange({ ...question, options, correctAnswers });
  };

  const toggleCorrectAnswer = (optionIndex: number) => {
    if (question.type === "mcq") {
      onChange({ ...question, correctAnswers: [optionIndex] });
      return;
    }

    const exists = question.correctAnswers.includes(optionIndex);
    onChange({
      ...question,
      correctAnswers: exists
        ? question.correctAnswers.filter((answer) => answer !== optionIndex)
        : [...question.correctAnswers, optionIndex]
    });
  };

  return (
    <div className="rounded-2xl border border-slate-800/90 bg-slate-950/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
            Question {index + 1}
          </p>
          <h3 className="text-sm font-semibold text-slate-100">
            {question.type === "mcq" ? "Single correct MCQ" : "Multiple correct question"}
          </h3>
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[2fr_1fr_120px]">
        <Input
          placeholder="Enter question text"
          value={question.questionText}
          onChange={(event) => update({ questionText: event.target.value })}
        />
        <select
          value={question.type}
          onChange={(event) =>
            update({
              type: event.target.value as QuestionType,
              correctAnswers: []
            })
          }
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-50 outline-none"
        >
          <option value="mcq">MCQ</option>
          <option value="multiple">Multiple correct</option>
        </select>
        <Input
          type="number"
          min={1}
          placeholder="Marks"
          value={question.marks}
          onChange={(event) => update({ marks: Number(event.target.value) || 1 })}
        />
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Options</p>
          <Button variant="ghost" size="sm" onClick={addOption}>
            Add option
          </Button>
        </div>

        {question.options.map((option, optionIndex) => {
          const checked = question.correctAnswers.includes(optionIndex);
          return (
            <div
              key={`${question.id}-${optionIndex}`}
              className="grid gap-2 md:grid-cols-[28px_1fr_100px] md:items-center"
            >
              <input
                type={question.type === "mcq" ? "radio" : "checkbox"}
                name={question.id}
                checked={checked}
                onChange={() => toggleCorrectAnswer(optionIndex)}
                className="h-4 w-4 accent-emerald-400"
              />
              <Input
                placeholder={`Option ${optionIndex + 1}`}
                value={option}
                onChange={(event) => updateOption(optionIndex, event.target.value)}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeOption(optionIndex)}
                disabled={question.options.length <= 2}
              >
                Delete
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const TeacherTestsPage: React.FC = () => {
  const [tests, setTests] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [selectedTest, setSelectedTest] = React.useState<any | null>(null);
  const [selectedDetails, setSelectedDetails] = React.useState<any | null>(null);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [form, setForm] = React.useState<TestForm>({
    title: "",
    subject: "",
    section: "",
    duration: "",
    startTime: "",
    endTime: "",
    totalMarks: "",
    negativeMarking: "",
    shuffleQuestions: false,
    status: "draft"
  });
  const [questions, setQuestions] = React.useState<DraftQuestion[]>([
    createDraftQuestion()
  ]);

  const refreshTests = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await TestsApi.list();
      setTests(res.data);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refreshTests();
  }, [refreshTests]);

  const loadTestDetails = async (test: any) => {
    setSelectedTest(test);
    setSelectedDetails(null);
    setDetailsLoading(true);
    try {
      const response = await TestsApi.attempts(test._id);
      setSelectedDetails(response.data);
    } catch {
      setSelectedDetails(null);
      alert("Unable to load test results.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const toggleStatus = async (test: any) => {
    const nextStatus = test.status === "active" ? "completed" : "active";
    try {
      await TestsApi.updateStatus(test._id, nextStatus);
      void refreshTests();
      if (selectedTest?._id === test._id) {
        setSelectedTest({ ...test, status: nextStatus });
      }
    } catch {
      alert("Could not update test status.");
    }
  };

  const updateQuestion = (questionId: string, next: DraftQuestion) => {
    setQuestions((current) =>
      current.map((question) => (question.id === questionId ? next : question))
    );
  };

  const removeQuestion = (questionId: string) => {
    setQuestions((current) => current.filter((question) => question.id !== questionId));
  };

  const addQuestion = () => setQuestions((current) => [...current, createDraftQuestion()]);

  const resetForm = () => {
    setForm({
      title: "",
      subject: "",
      section: "",
      duration: "",
      startTime: "",
      endTime: "",
      totalMarks: "",
      negativeMarking: "",
      shuffleQuestions: false,
      status: "draft"
    });
    setQuestions([createDraftQuestion()]);
  };

  const handleCreate = async () => {
    if (!form.title.trim() || !form.subject.trim() || !form.section.trim()) {
      alert("Please fill title, subject, and section.");
      return;
    }

    if (!form.startTime || !form.endTime) {
      alert("Please choose start and end time.");
      return;
    }

    if (form.duration === "" || form.totalMarks === "") {
      alert("Please fill duration and total marks.");
      return;
    }

    if (questions.length === 0) {
      alert("Add at least one question.");
      return;
    }

    for (const question of questions) {
      const hasText = question.questionText.trim();
      const validOptions = question.options.filter((option) => option.trim()).length >= 2;
      const hasCorrectAnswer = question.correctAnswers.length > 0;

      if (!hasText || !validOptions || !hasCorrectAnswer) {
        alert("Each question needs text, at least two options, and a correct answer.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const createdTest = await TestsApi.create({
        ...form,
        duration: Number(form.duration),
        totalMarks: Number(form.totalMarks),
        negativeMarking: Number(form.negativeMarking || 0),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString()
      });

      const testId = createdTest.data._id;
      await TestsApi.addQuestions(
        testId,
        questions.map((question) => ({
          questionText: question.questionText.trim(),
          options: question.options.map((option) => option.trim()).filter(Boolean),
          correctAnswers: question.correctAnswers,
          marks: question.marks,
          type: question.type
        }))
      );

      resetForm();
      setShowForm(false);
      void refreshTests();
    } catch {
      alert("Failed to create test.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">Tests</h2>
          <p className="text-sm text-slate-400">
            Create a test, add questions, and set marks from one screen.
          </p>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          {showForm ? "Close builder" : "Create Test"}
        </Button>
      </div>

      {showForm && (
        <div className="space-y-5 rounded-3xl border border-slate-800/90 bg-slate-950/50 p-5 shadow-soft-xl">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <Input
              placeholder="Test title"
              value={form.title}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            />
            <Input
              placeholder="Subject"
              value={form.subject}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
            />
            <Input
              placeholder="Section"
              value={form.section}
              onChange={(event) => setForm((current) => ({ ...current, section: event.target.value }))}
            />
            <Input
              type="number"
              min={1}
              placeholder="Duration (minutes)"
              value={form.duration}
              onChange={(event) => setForm((current) => ({ ...current, duration: Number(event.target.value) || 1 }))}
            />
            <Input
              type="datetime-local"
              placeholder="Start date and time"
              value={form.startTime}
              onChange={(event) => setForm((current) => ({ ...current, startTime: event.target.value }))}
            />
            <Input
              type="datetime-local"
              placeholder="End date and time"
              value={form.endTime}
              onChange={(event) => setForm((current) => ({ ...current, endTime: event.target.value }))}
            />
            <Input
              type="number"
              min={1}
              placeholder="Total marks"
              value={form.totalMarks}
              onChange={(event) => setForm((current) => ({ ...current, totalMarks: Number(event.target.value) || 1 }))}
            />
            <Input
              type="number"
              min={0}
              step="0.25"
              placeholder="Negative marking"
              value={form.negativeMarking}
              onChange={(event) => setForm((current) => ({ ...current, negativeMarking: Number(event.target.value) || 0 }))}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.shuffleQuestions}
                onChange={(event) => setForm((current) => ({ ...current, shuffleQuestions: event.target.checked }))}
                className="h-4 w-4 accent-emerald-400"
              />
              Shuffle questions
            </label>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TestForm["status"] }))}
              className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-50 outline-none"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-slate-100">Questions</h3>
                <p className="text-xs text-slate-400">
                  Choose MCQ for one answer, or multiple correct for multi-select questions.
                </p>
              </div>
              <Button variant="outline" onClick={addQuestion}>
                Add question
              </Button>
            </div>

            <div className="space-y-4">
              {questions.map((question, index) => (
                <QuestionEditor
                  key={question.id}
                  question={question}
                  index={index}
                  onChange={(next) => updateQuestion(question.id, next)}
                  onRemove={() => removeQuestion(question.id)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void handleCreate()} disabled={submitting}>
              {submitting ? "Saving..." : "Create test"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                resetForm();
                setShowForm(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-slate-400">Loading tests...</div>
        ) : tests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/30 px-4 py-6 text-sm text-slate-400">
            No tests yet.
          </div>
        ) : (
          tests.map((test) => (
            <div
              key={test._id}
              className="cursor-pointer rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 transition hover:border-emerald-500/40 hover:bg-slate-950/60"
              onClick={() => void loadTestDetails(test)}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-base font-semibold text-slate-100">{test.title}</div>
                  <div className="text-xs text-slate-400">
                    {test.subject} · {test.section} · {test.status}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{test.duration} min · {test.totalMarks} marks</span>
                  <Button
                    size="sm"
                    variant={test.status === "active" ? "outline" : "primary"}
                    onClick={(event) => {
                      event.stopPropagation();
                      void toggleStatus(test);
                    }}
                  >
                    {test.status === "active" ? "Close test" : "Open test"}
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {selectedTest && (
        <div className="rounded-3xl border border-slate-800/90 bg-slate-950/60 p-5 shadow-soft-xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-slate-50">{selectedTest.title}</h3>
              <p className="text-sm text-slate-400">
                {selectedTest.subject} · {selectedTest.section}
              </p>
            </div>
            <Button variant="ghost" onClick={() => setSelectedTest(null)}>
              Close details
            </Button>
          </div>

          {detailsLoading ? (
            <div className="mt-4 text-sm text-slate-400">Loading results...</div>
          ) : selectedDetails ? (
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
                  Average: {selectedDetails.analytics.average.toFixed(2)}
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
                  Highest: {selectedDetails.analytics.highest}
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
                  Lowest: {selectedDetails.analytics.lowest}
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 text-sm text-slate-300">
                  Submission rate: {(selectedDetails.analytics.submissionRate * 100).toFixed(0)}%
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Student results</h4>
                {selectedDetails.attempts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 px-4 py-5 text-sm text-slate-400">
                    No attempts yet.
                  </div>
                ) : (
                  selectedDetails.attempts.map((attempt: any) => (
                    <div key={attempt._id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-slate-100">{attempt.studentId?.name}</p>
                          <p className="text-xs text-slate-400">{attempt.studentId?.email}</p>
                        </div>
                        <div className="text-right text-sm text-slate-300">
                          <p>Marks: {attempt.score}</p>
                          <p className="text-xs text-slate-400">
                            {attempt.suspiciousFlag ? "Suspicious" : attempt.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
