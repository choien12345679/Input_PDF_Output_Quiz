import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import { resultAPI } from "../api/result";
import { bookmarkAPI } from "../api/bookmark";

function formatDate(dateStr) {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ScoreBar({ label, score }) {
  const pct = Math.round(score);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm text-gray-600">
        <span className="truncate max-w-[180px]">{label}</span>
        <span className="font-medium">{pct}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-blue-500" : "bg-red-400"}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [results, setResults] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [resResults, resBookmarks] = await Promise.allSettled([
          resultAPI.getMyResults(),
          bookmarkAPI.getMyBookmarks(),
        ]);
        if (resResults.status === "fulfilled") {
          setResults(
            resResults.value.data?.results ?? resResults.value.data ?? [],
          );
        }
        if (resBookmarks.status === "fulfilled") {
          setBookmarks(
            resBookmarks.value.data?.bookmarks ?? resBookmarks.value.data ?? [],
          );
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // quizSetId별 평균 점수 계산
  const scoreByQuizSet = results.reduce((acc, r) => {
    const key = r.quizSetId ?? r.quizSetTitle ?? "기타";
    if (!acc[key]) acc[key] = { total: 0, count: 0 };
    acc[key].total += r.score ?? 0;
    acc[key].count += 1;
    return acc;
  }, {});

  const avgScores = Object.entries(scoreByQuizSet).map(([key, val]) => ({
    label: key,
    score: val.total / val.count,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-5xl mx-auto w-full px-4 py-8 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

        {/* 최근 퀴즈 이력 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            최근 퀴즈 이력
          </h2>
          {results.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              아직 퀴즈 이력이 없습니다.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-gray-500">
                    <th className="pb-2 pr-4 font-medium">퀴즈 세트 ID</th>
                    <th className="pb-2 pr-4 font-medium">점수(%)</th>
                    <th className="pb-2 pr-4 font-medium">정답/전체</th>
                    <th className="pb-2 pr-4 font-medium">모드</th>
                    <th className="pb-2 font-medium">완료 일시</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {results.map((r, i) => (
                    <tr key={r.resultId ?? i} className="hover:bg-gray-50">
                      <td className="py-2 pr-4 text-gray-700 font-mono text-xs">
                        {r.quizSetId ?? "-"}
                      </td>
                      <td className="py-2 pr-4">
                        <span
                          className={`font-semibold ${(r.score ?? 0) >= 60 ? "text-green-600" : "text-red-500"}`}
                        >
                          {Math.round(r.score ?? 0)}%
                        </span>
                      </td>
                      <td className="py-2 pr-4 text-gray-700">
                        {r.correctCount ?? "-"} / {r.totalQuestions ?? "-"}
                      </td>
                      <td className="py-2 pr-4 text-gray-600">
                        {r.mode ?? "-"}
                      </td>
                      <td className="py-2 text-gray-500">
                        {formatDate(r.completedAt ?? r.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 카테고리별 정답률 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            퀴즈 세트별 평균 점수
          </h2>
          {avgScores.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">
              데이터가 없습니다.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {avgScores.map((item) => (
                <ScoreBar
                  key={item.label}
                  label={item.label}
                  score={item.score}
                />
              ))}
            </div>
          )}
        </div>

        {/* 북마크된 문제 바로가기 */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              북마크된 문제
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              총{" "}
              <span className="font-bold text-blue-600">
                {bookmarks.length}
              </span>
              개의 문제가 북마크되어 있습니다.
            </p>
          </div>
          <Link
            to="/practice"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors"
          >
            연습 모드로 이동
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
