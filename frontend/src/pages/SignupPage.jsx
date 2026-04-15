import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../api/auth";
import useAuthStore from "../store/authStore";
import Button from "../components/Button";
import Input from "../components/Input";

export default function SignupPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nickname: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    } else if (form.password.length < 8) {
      newErrors.password = "비밀번호는 8자 이상이어야 합니다.";
    }
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "비밀번호 확인을 입력해주세요.";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    }
    if (!form.nickname) {
      newErrors.nickname = "닉네임을 입력해주세요.";
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
      await authAPI.signup({
        email: form.email,
        password: form.password,
        nickname: form.nickname,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "회원가입에 실패했습니다. 다시 시도해주세요.";
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8 text-center">
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            회원가입 완료
          </h2>
          <p className="text-gray-600 mb-4">이메일 인증 후 로그인해주세요.</p>
          <p className="text-sm text-gray-400">
            잠시 후 로그인 페이지로 이동합니다...
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block text-blue-600 hover:underline text-sm"
          >
            지금 로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          회원가입
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
            label="닉네임"
            name="nickname"
            type="text"
            value={form.nickname}
            onChange={handleChange}
            placeholder="닉네임을 입력하세요"
            error={errors.nickname}
            required
            disabled={loading}
          />
          <Input
            label="비밀번호"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="8자 이상 입력하세요"
            error={errors.password}
            required
            disabled={loading}
          />
          <Input
            label="비밀번호 확인"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호를 다시 입력하세요"
            error={errors.confirmPassword}
            required
            disabled={loading}
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            회원가입
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          이미 계정이 있으신가요?{" "}
          <Link
            to="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
