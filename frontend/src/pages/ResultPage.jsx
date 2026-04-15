import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import useQuizStore from "../store/quizStore";
import useAuthStore from "../store/authStore";

const OPTION_LABELS = ["A", "B", "C", "D"];

function getOptionLabel(question, optionId) {
  if (!question?.options || !optionId) return "-";
  const idx = question.options.findIndex((o) => o.optionId === optionId);
  const label = OPTION_LABELS[idx] ?? idx + 1;
  const option = question.options[idx];
  return option ? `${label}. ${option.optionText}` : "-";
}

export default function ResultPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { result, questions, answers, currentQuizSet } = useQuizStore();

  useEffect(() => {
    if (!result) navigate("/");
  }, [result, navigate]);

  if (!result) return null;

  const { score, correctCount, totalQuestions, wrongQuestionIds } = result;
  const wrongQuestions = questions.filter((q) =>
    wrongQuestionIds.includes(q.questionId),
  );

  // SVG circle progress
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      {!isAuthenticated && (
        <div className="bg-blue-50 border-b border-blue-200 text-blue-700 text-sm text-center py-2 px-4">
          로그인하면 결과가 저장됩니다.{" "}
          <a href="/login" className="underline font-medium">
            로그인
          </a>
        </div>
      )}

      <div className="max-w-2xl mx-auto w-full px-4 py-10 flex flex-col gap-8">
        {/* Score summary */}
        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">
            {currentQuizSet?.title ?? "퀴즈"} 결과
          </h1>

          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
            />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={score >= 60 ? "#2563eb" : "#ef4444"}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
            <text
              x="70"
              y="70"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-2xl font-bold"
              fontSize="28"
              fill="#111827"
              fontWeight="bold"
            >
              {Math.round(score)}%
            </text>
          </svg>

          <p className="text-gray-600 text-lg">
            <span className="font-bold text-gray-900">{correctCount}</span> /{" "}
            {totalQuestions} 정답
          </p>
        </div>

        {/* Wrong questions */}
        {wrongQuestions.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-800">
              오답 문제 ({wrongQuestions.length})
            </h2>
            <div className="divide-y divide-gray-100">
              {wrongQuestions.map((q, idx) => (
                <div key={q.questionId} className="py-4 flex flex-col gap-2">
                  <p className="font-medium text-gray-900">
                    {idx + 1}. {q.questionText}
                  </p>
                  <p className="text-sm text-red-600">
                    내 답: {getOptionLabel(q, answers[q.questionId])}
                  </p>
                  <p className="text-sm text-green-700">
                    정답: {getOptionLabel(q, q.correctOptionId)}
                  </p>
                  {q.explanation && (
                    <p className="text-sm text-blue-700 bg-blue-50 rounded-lg px-3 py-2">
                      해설: {q.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => navigate("/")}>
            홈으로
          </Button>
          {currentQuizSet?.quizSetId && (
            <Button
              onClick={() => navigate(`/quiz/${currentQuizSet.quizSetId}`)}
            >
              다시 풀기
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
