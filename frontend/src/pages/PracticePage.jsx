import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProgressBar from "../components/ProgressBar";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";
import QuestionView from "../components/QuestionView";
import useQuizStore from "../store/quizStore";
import useAuthStore from "../store/authStore";
import { quizAPI } from "../api/quiz";
import { bookmarkAPI } from "../api/bookmark";

export default function PracticePage() {
  const { id } = useParams();
  const { isAuthenticated } = useAuthStore();

  const {
    currentQuizSet,
    questions,
    currentQuestionIndex,
    answers,
    setQuizSet,
    setAnswer,
    nextQuestion,
    prevQuestion,
  } = useQuizStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAnswerMap, setShowAnswerMap] = useState({});
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [practiceQuestions, setPracticeQuestions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [quizSetRes, questionsRes] = await Promise.all([
          quizAPI.getQuizSet(id),
          quizAPI.getQuestions(id),
        ]);
        const quizSet = quizSetRes.data;
        const qs = questionsRes.data ?? [];
        setQuizSet(quizSet, qs, "practice");
        setPracticeQuestions(qs);
      } catch {
        setError("퀴즈를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const currentQuestion = practiceQuestions[currentQuestionIndex];
  const qId = currentQuestion?.questionId;
  const selectedOption = answers[qId];
  const showAnswer = !!showAnswerMap[qId];

  const handleSelect = (optionId) => {
    if (showAnswer) return;
    setAnswer(qId, optionId);
    setShowAnswerMap((prev) => ({ ...prev, [qId]: true }));
  };

  const handleBookmark = async () => {
    if (!isAuthenticated || !qId) return;
    try {
      if (bookmarkedIds.has(qId)) {
        await bookmarkAPI.removeBookmark(qId);
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(qId);
          return next;
        });
      } else {
        await bookmarkAPI.addBookmark(qId);
        setBookmarkedIds((prev) => new Set(prev).add(qId));
      }
    } catch {
      // ignore
    }
  };

  const handleRetryWrong = () => {
    const wrongQuestions = practiceQuestions.filter(
      (q) =>
        answers[q.questionId] && answers[q.questionId] !== q.correctOptionId,
    );
    if (wrongQuestions.length === 0) return;
    setQuizSet(currentQuizSet, wrongQuestions, "practice");
    setPracticeQuestions(wrongQuestions);
    setShowAnswerMap({});
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">
        {error}
      </div>
    );
  }

  const questionWithMeta = currentQuestion
    ? {
        ...currentQuestion,
        order: currentQuestionIndex + 1,
        totalCount: practiceQuestions.length,
      }
    : null;

  const isBookmarked = bookmarkedIds.has(qId);
  const wrongCount = practiceQuestions.filter(
    (q) => answers[q.questionId] && answers[q.questionId] !== q.correctOptionId,
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1 flex flex-col gap-6">
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={practiceQuestions.length}
        />

        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-500">연습 모드</span>
            {isAuthenticated && (
              <button
                onClick={handleBookmark}
                className={`text-xl transition-colors ${isBookmarked ? "text-yellow-400" : "text-gray-300 hover:text-yellow-400"}`}
                title={isBookmarked ? "북마크 해제" : "북마크 추가"}
              >
                ★
              </button>
            )}
          </div>

          <QuestionView
            question={questionWithMeta}
            selectedOption={selectedOption}
            onSelect={handleSelect}
            showAnswer={showAnswer}
            mode="practice"
          />

          {showAnswer && currentQuestion?.explanation && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
              <span className="font-semibold">해설: </span>
              {currentQuestion.explanation}
            </div>
          )}
        </div>

        <div className="flex justify-between gap-3">
          <Button
            variant="secondary"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            이전
          </Button>
          <Button
            variant="secondary"
            onClick={handleRetryWrong}
            disabled={wrongCount === 0}
          >
            틀린 문제만 다시 풀기 {wrongCount > 0 && `(${wrongCount})`}
          </Button>
          <Button
            onClick={nextQuestion}
            disabled={currentQuestionIndex === practiceQuestions.length - 1}
          >
            다음
          </Button>
        </div>
      </div>
    </div>
  );
}
