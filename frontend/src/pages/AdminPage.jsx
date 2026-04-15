import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Modal from "../components/Modal";
import LoadingSpinner from "../components/LoadingSpinner";
import Badge from "../components/Badge";
import { quizAPI } from "../api/quiz";

export default function AdminPage() {
  const navigate = useNavigate();
  const [quizSets, setQuizSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function fetchQuizSets() {
    try {
      const res = await quizAPI.getQuizSets();
      setQuizSets(res.data?.quizSets ?? res.data ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQuizSets();
  }, []);

  async function handleTogglePublic(qs) {
    setTogglingId(qs.quizSetId);
    try {
      await quizAPI.updateQuizSet(qs.quizSetId, { isPublic: !qs.isPublic });
      setQuizSets((prev) =>
        prev.map((q) =>
          q.quizSetId === qs.quizSetId ? { ...q, isPublic: !q.isPublic } : q,
        ),
      );
    } finally {
      setTogglingId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await quizAPI.deleteQuizSet(deleteTarget.quizSetId);
      setQuizSets((prev) =>
        prev.filter((q) => q.quizSetId !== deleteTarget.quizSetId),
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">관리자 페이지</h1>
          <Button onClick={() => navigate("/admin/quiz/new")}>
            + 새 퀴즈 세트 만들기
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            퀴즈 세트 목록
          </h2>
          {loading ? (
            <div className="flex justify-center py-10">
              <LoadingSpinner size="lg" />
            </div>
          ) : quizSets.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              퀴즈 세트가 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 pr-4 font-medium">제목</th>
                    <th className="pb-2 pr-4 font-medium">카테고리</th>
                    <th className="pb-2 pr-4 font-medium">문제 수</th>
                    <th className="pb-2 pr-4 font-medium">공개 여부</th>
                    <th className="pb-2 font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {quizSets.map((qs) => (
                    <tr key={qs.quizSetId} className="hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium text-gray-900">
                        {qs.title}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {qs.category ?? "-"}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">
                        {qs.questionCount ?? "-"}
                      </td>
                      <td className="py-3 pr-4">
                        <button
                          onClick={() => handleTogglePublic(qs)}
                          disabled={togglingId === qs.quizSetId}
                          className="flex items-center gap-2 focus:outline-none"
                          aria-label={
                            qs.isPublic ? "비공개로 전환" : "공개로 전환"
                          }
                        >
                          <div
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${qs.isPublic ? "bg-blue-600" : "bg-gray-300"} ${togglingId === qs.quizSetId ? "opacity-50" : ""}`}
                          >
                            <span
                              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${qs.isPublic ? "translate-x-4" : "translate-x-1"}`}
                            />
                          </div>
                          <Badge variant={qs.isPublic ? "success" : "default"}>
                            {qs.isPublic ? "공개" : "비공개"}
                          </Badge>
                        </button>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/admin/quiz/${qs.quizSetId}/edit`}
                            className="text-xs px-2.5 py-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                          >
                            수정
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(qs)}
                            className="text-xs px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 transition-colors"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="퀴즈 세트 삭제"
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
        <p className="text-gray-700">
          <span className="font-semibold">"{deleteTarget?.title}"</span> 퀴즈
          세트를 삭제하시겠습니까?
        </p>
        <p className="text-sm text-gray-500 mt-1">
          이 작업은 되돌릴 수 없습니다.
        </p>
      </Modal>
    </div>
  );
}
