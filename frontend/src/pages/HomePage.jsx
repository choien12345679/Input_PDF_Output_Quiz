import { useState, useEffect, useMemo } from "react";
import Navbar from "../components/Navbar";
import LoadingSpinner from "../components/LoadingSpinner";
import Input from "../components/Input";
import QuizCard from "../components/QuizCard";
import { quizAPI } from "../api/quiz";

export default function HomePage() {
  const [quizSets, setQuizSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("전체");

  useEffect(() => {
    const fetchQuizSets = async () => {
      try {
        setLoading(true);
        const res = await quizAPI.getQuizSets();
        setQuizSets(res.data?.quizSets ?? res.data ?? []);
      } catch (err) {
        setError("퀴즈 목록을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchQuizSets();
  }, []);

  const categories = useMemo(() => {
    const unique = [
      ...new Set(quizSets.map((q) => q.category).filter(Boolean)),
    ];
    return ["전체", ...unique];
  }, [quizSets]);

  const filtered = useMemo(() => {
    return quizSets.filter((q) => {
      const matchCategory =
        activeCategory === "전체" || q.category === activeCategory;
      const matchSearch = q.title?.toLowerCase().includes(search.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [quizSets, activeCategory, search]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">퀴즈 목록</h1>

        {/* Search */}
        <div className="mb-4 max-w-sm">
          <Input
            placeholder="퀴즈 제목 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 ${
                activeCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        ) : error ? (
          <p className="text-center text-red-500 py-20">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-400 py-20">
            퀴즈가 없습니다. 검색어나 카테고리를 변경해보세요.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((quizSet) => (
              <QuizCard key={quizSet.quizSetId} quizSet={quizSet} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
