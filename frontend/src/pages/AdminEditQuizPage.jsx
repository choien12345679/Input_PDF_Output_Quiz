import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import QuestionEditor from "../components/QuestionEditor";
import PDFUploader from "../components/PDFUploader";
import { quizAPI } from "../api/quiz";

export default function AdminEditQuizPage() {
  const { id: quizSetId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddEditor, setShowAddEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchQuestions() {
    try {
      const res = await quizAPI.getQuestions(quizSetId);
      setQuestions(res.data?.questions ?? res.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuestions();
  }, [quizSetId]);

  function handleSaved(saved) {
    if (editingQuestion) {
      setQuestions((prev) =>
        prev.map((q) => (q.questionId === saved?.questionId ? saved : q)),
      );
      setEditingQuestion(null);
    } else {
      setQuestions((prev) => [...prev, saved]);
      setShowAddEditor(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await quizAPI.deleteQuestion(quizSetId, deleteTarget.questionId);
      setQuestions((prev) =>
        prev.filter((q) => q.questionId !== deleteTarget.questionId),
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/admin")}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="뒤로가기"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-gray-900">퀴즈 세트 편집</h1>
          <span className="text-xs text-gray-400 font-mono">{quizSetId}</span>
        </div>

        {/* PDF 업로더 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-800 mb-3">
            PDF로 문제 자동 생성
          </h2>
          <PDFUploader quizSetId={quizSetId} onComplete={fetchQuestions} />
        </div>

        {/* 문제 목록 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">
              문제 목록{" "}
              <span className="text-gray-400 font-normal text-sm">
                ({questions.length}개)
              </span>
            </h2>
            {!showAddEditor && (
              <Button
                size="sm"
                onClick={() => {
                  setShowAddEditor(true);
                  setEditingQuestion(null);
                }}
              >
                + 문제 추가
              </Button>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {showAddEditor && (
                <QuestionEditor
                  quizSetId={quizSetId}
                  onSave={handleSaved}
                  onCancel={() => setShowAddEditor(false)}
                />
              )}

              {questions.length === 0 && !showAddEditor ? (
                <p className="text-gray-500 text-sm text-center py-6">
                  문제가 없습니다. 문제를 추가해주세요.
                </p>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.questionId}>
                    {editingQuestion?.questionId === q.questionId ? (
                      <QuestionEditor
                        quizSetId={quizSetId}
                        question={q}
                        onSave={handleSaved}
                        onCancel={() => setEditingQuestion(null)}
                      />
                    ) : (
                      <div className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900">
                            <span className="text-gray-400 mr-1">
                              {idx + 1}.
                            </span>
                            {q.questionText}
                          </p>
                          <div className="flex gap-1.5 shrink-0">
                            <button
                              onClick={() => {
                                setEditingQuestion(q);
                                setShowAddEditor(false);
                              }}
                              className="text-xs px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => setDeleteTarget(q)}
                              className="text-xs px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                        {q.options && (
                          <ul className="mt-2 flex flex-col gap-1">
                            {q.options.map((opt) => (
                              <li
                                key={opt.optionId}
                                className={`text-xs px-2 py-1 rounded ${opt.optionId === q.correctOptionId ? "bg-green-50 text-green-700 font-medium" : "text-gray-600"}`}
                              >
                                {opt.optionId === q.correctOptionId
                                  ? "✓ "
                                  : "• "}
                                {opt.optionText}
                              </li>
                            ))}
                          </ul>
                        )}
                        {q.explanation && (
                          <p className="mt-2 text-xs text-blue-600 bg-blue-50 rounded px-2 py-1">
                            해설: {q.explanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="문제 삭제"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleting}>
              삭제
            </Button>
          </>
        }
      >
        <p className="text-gray-700">이 문제를 삭제하시겠습니까?</p>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
          {deleteTarget?.questionText}
        </p>
      </Modal>
    </div>
  );
}
