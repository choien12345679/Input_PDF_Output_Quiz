import { useState } from "react";
import Button from "./Button";
import Input from "./Input";
import { quizAPI } from "../api/quiz";

const EMPTY_OPTION = () => ({ optionId: crypto.randomUUID(), optionText: "" });

function buildInitialState(question) {
  if (question) {
    return {
      questionText: question.questionText ?? "",
      options: question.options?.length
        ? question.options
        : [EMPTY_OPTION(), EMPTY_OPTION()],
      correctOptionId: question.correctOptionId ?? "",
      explanation: question.explanation ?? "",
    };
  }
  return {
    questionText: "",
    options: [EMPTY_OPTION(), EMPTY_OPTION()],
    correctOptionId: "",
    explanation: "",
  };
}

// props: quizSetId, question(수정 시), onSave, onCancel
export default function QuestionEditor({
  quizSetId,
  question,
  onSave,
  onCancel,
}) {
  const [form, setForm] = useState(() => buildInitialState(question));
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleTextChange(e) {
    setForm((prev) => ({ ...prev, questionText: e.target.value }));
    if (errors.questionText) setErrors((p) => ({ ...p, questionText: "" }));
  }

  function handleOptionChange(idx, value) {
    setForm((prev) => {
      const options = prev.options.map((o, i) =>
        i === idx ? { ...o, optionText: value } : o,
      );
      return { ...prev, options };
    });
  }

  function handleAddOption() {
    if (form.options.length >= 5) return;
    setForm((prev) => ({
      ...prev,
      options: [...prev.options, EMPTY_OPTION()],
    }));
  }

  function handleRemoveOption(idx) {
    if (form.options.length <= 2) return;
    setForm((prev) => {
      const options = prev.options.filter((_, i) => i !== idx);
      const correctOptionId =
        prev.correctOptionId === prev.options[idx].optionId
          ? ""
          : prev.correctOptionId;
      return { ...prev, options, correctOptionId };
    });
  }

  function handleCorrectChange(optionId) {
    setForm((prev) => ({ ...prev, correctOptionId: optionId }));
    if (errors.correctOptionId)
      setErrors((p) => ({ ...p, correctOptionId: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.questionText.trim())
      errs.questionText = "문제 내용을 입력해주세요.";
    if (form.options.some((o) => !o.optionText.trim()))
      errs.options = "모든 선택지를 입력해주세요.";
    if (!form.correctOptionId) errs.correctOptionId = "정답을 선택해주세요.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      let saved;
      if (question?.questionId) {
        const res = await quizAPI.updateQuestion(
          quizSetId,
          question.questionId,
          form,
        );
        saved = res.data?.question ?? res.data;
      } else {
        const res = await quizAPI.createQuestion(quizSetId, form);
        saved = res.data?.question ?? res.data;
      }
      onSave?.(saved);
    } catch (err) {
      setErrors({
        submit: err?.response?.data?.message ?? "저장에 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 bg-gray-50 rounded-lg p-4 border border-gray-200"
    >
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">
          문제 내용 <span className="text-red-500">*</span>
        </label>
        <textarea
          value={form.questionText}
          onChange={handleTextChange}
          placeholder="문제를 입력하세요"
          rows={3}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.questionText ? "border-red-500" : "border-gray-300"}`}
        />
        {errors.questionText && (
          <p className="text-red-500 text-xs">{errors.questionText}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            선택지 <span className="text-red-500">*</span>
            <span className="text-gray-400 font-normal ml-1">
              (정답 라디오 선택)
            </span>
          </label>
          {form.options.length < 5 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              + 선택지 추가
            </button>
          )}
        </div>
        {form.options.map((opt, idx) => (
          <div key={opt.optionId} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctOption"
              value={opt.optionId}
              checked={form.correctOptionId === opt.optionId}
              onChange={() => handleCorrectChange(opt.optionId)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500 shrink-0"
              aria-label={`선택지 ${idx + 1} 정답으로 설정`}
            />
            <input
              type="text"
              value={opt.optionText}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              placeholder={`선택지 ${idx + 1}`}
              className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {form.options.length > 2 && (
              <button
                type="button"
                onClick={() => handleRemoveOption(idx)}
                className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                aria-label="선택지 삭제"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
        {errors.options && (
          <p className="text-red-500 text-xs">{errors.options}</p>
        )}
        {errors.correctOptionId && (
          <p className="text-red-500 text-xs">{errors.correctOptionId}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">해설 (선택)</label>
        <textarea
          value={form.explanation}
          onChange={(e) =>
            setForm((p) => ({ ...p, explanation: e.target.value }))
          }
          placeholder="정답에 대한 해설을 입력하세요"
          rows={2}
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>

      {errors.submit && <p className="text-red-500 text-sm">{errors.submit}</p>}

      <div className="flex gap-2 justify-end">
        <Button
          variant="secondary"
          type="button"
          onClick={onCancel}
          disabled={loading}
          size="sm"
        >
          취소
        </Button>
        <Button type="submit" loading={loading} size="sm">
          {question?.questionId ? "수정 저장" : "문제 추가"}
        </Button>
      </div>
    </form>
  );
}
