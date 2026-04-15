import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="text-xl font-bold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Quiz App
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  대시보드
                </Link>

                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    관리자
                  </Link>
                )}

                <span className="text-sm text-gray-500">
                  {user?.name || user?.email || "사용자"}
                </span>

                <button
                  onClick={handleLogout}
                  className="text-sm px-3 py-1.5 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  로그인
                </Link>
                <Link
                  to="/signup"
                  className="text-sm px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
