import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authAPI } from "../api/auth";
import useAuthStore from "../store/authStore";
import Button from "../components/Button";
import Input from "../components/Input";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokens, setUser, isAuthenticated } = useAuthStore();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const validate = () => {
    const newErrors = {};
    if (!form.email) {
      newErrors.email = "이메일을 입력해주세요.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "올바른 이메일 형식이 아닙니다.";
    }
    if (!form.password) {
      newErrors.password = "비밀번호를 입력해주세요.";
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const res = await authAPI.signin({
        email: form.email,
        password: form.password,
      });
      const { accessToken, idToken, refreshToken } = res.data;

      setTokens(accessToken, idToken, refreshToken);

      const payload = JSON.parse(atob(idToken.split(".")[1]));
      setUser({
        userId: payload.sub,
        email: payload.email,
        nickname: payload.nickname || payload.email,
      });

      const from = location.state?.from?.pathname || "/";
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "로그인에 실패했습니다. 다시 시도해주세요.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          로그인
        </h1>

        {serverError && (
          <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-4"
        >
          <Input
            label="이메일"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="example@email.com"
            error={errors.email}
            required
            disabled={loading}
          />
          <Input
            label="비밀번호"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="비밀번호를 입력하세요"
            error={errors.password}
            required
            disabled={loading}
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            로그인
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          계정이 없으신가요?{" "}
          <Link
            to="/signup"
            className="text-blue-600 hover:underline font-medium"
          >
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
