import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Button from "../components/Button";
import Input from "../components/Input";
import { quizAPI } from "../api/quiz";

export default function AdminNewQuizPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    isPublic: false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.title.trim()) errs.title = "제목을 입력해주세요.";
    if (!form.category.trim()) errs.category = "카테고리를 입력해주세요.";
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
      await quizAPI.createQuizSet(form);
      navigate("/admin");
    } catch (err) {
      setErrors({
        submit: err?.response?.data?.message ?? "생성에 실패했습니다.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-lg mx-auto w-full px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">
            새 퀴즈 세트 만들기
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="제목"
              name="title"
              value={form.title}
              onChange={handleChange}
              error={errors.title}
              placeholder="퀴즈 세트 제목"
              required
            />
            <Input
              label="카테고리"
              name="category"
              value={form.category}
              onChange={handleChange}
              error={errors.category}
              placeholder="예: 프로그래밍, 수학, 영어"
              required
            />
            <div className="flex flex-col gap-1">
              <label
                htmlFor="description"
                className="text-sm font-medium text-gray-700"
              >
                설명
              </label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="퀴즈 세트에 대한 설명 (선택)"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isPublic"
                checked={form.isPublic}
                onChange={handleChange}
                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">
                공개 퀴즈 세트로 설정
              </span>
            </label>
            {errors.submit && (
              <p className="text-red-500 text-sm">{errors.submit}</p>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="secondary"
                type="button"
                onClick={() => navigate("/admin")}
                disabled={loading}
              >
                취소
              </Button>
              <Button type="submit" loading={loading}>
                생성하기
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
