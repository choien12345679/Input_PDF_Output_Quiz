import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import ProgressBar from "../components/ProgressBar";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";
import QuestionView from "../components/QuestionView";
import useQuizStore from "../store/quizStore";
import useAuthStore from "../store/authStore";
import { quizAPI } from "../api/quiz";
import { resultAPI } from "../api/result";

export default function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const {
    currentQuizSet,
    questions,
    currentQuestionIndex,
    answers,
    isSubmitted,
    setQuizSet,
    setAnswer,
    nextQuestion,
    prevQuestion,
    submitQuiz,
    loadSavedAnswers,
  } = useQuizStore();

  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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
        setQuizSet(quizSet, qs, "exam");
        loadSavedAnswers(id);
      } catch (err) {
        setError("퀴즈를 불러오는 데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    submitQuiz();

    // submitQuiz는 동기적으로 store를 업데이트하므로 getState()로 최신 값 읽기
    const freshResult = useQuizStore.getState().result;

    if (isAuthenticated) {
      try {
        const res = await resultAPI.saveResult({
          quizSetId: id,
          score: freshResult?.score ?? 0,
          answers,
        });
        const resultId = res.data?.resultId;
        if (resultId) {
          navigate(`/result/${resultId}`);
          return;
        }
      } catch {
        // 저장 실패 시 로컬 결과 페이지로 이동
      }
    }
    navigate(`/result/local`);
    setSubmitting(false);
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

  if (!isStarted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-md p-10 max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {currentQuizSet?.title}
          </h1>
          <p className="text-gray-500 text-sm">{currentQuizSet?.description}</p>
          <p className="text-blue-600 font-medium">총 {questions.length}문제</p>
          <Button
            size="lg"
            className="w-full mt-4"
            onClick={() => setIsStarted(true)}
          >
            시험 시작
          </Button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLast = currentQuestionIndex === questions.length - 1;
  const questionWithMeta = currentQuestion
    ? {
        ...currentQuestion,
        order: currentQuestionIndex + 1,
        totalCount: questions.length,
      }
    : null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1 flex flex-col gap-6">
        <ProgressBar
          current={currentQuestionIndex + 1}
          total={questions.length}
        />
        <div className="bg-white rounded-2xl shadow-sm p-6 flex-1">
          <QuestionView
            question={questionWithMeta}
            selectedOption={answers[currentQuestion?.questionId]}
            onSelect={(optionId) =>
              setAnswer(currentQuestion.questionId, optionId)
            }
            showAnswer={false}
            mode="exam"
          />
        </div>
        <div className="flex justify-between gap-3">
          <Button
            variant="secondary"
            onClick={prevQuestion}
            disabled={currentQuestionIndex === 0}
          >
            이전
          </Button>
          {isLast ? (
            <Button onClick={handleSubmit} loading={submitting}>
              제출
            </Button>
          ) : (
            <Button onClick={nextQuestion}>다음</Button>
          )}
        </div>
      </div>
    </div>
  );
}
