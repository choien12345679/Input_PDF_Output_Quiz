import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import useAuthStore from "./store/authStore";
import ProtectedRoute from "./components/ProtectedRoute";

import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import QuizPage from "./pages/QuizPage";
import PracticePage from "./pages/PracticePage";
import ResultPage from "./pages/ResultPage";
import DashboardPage from "./pages/DashboardPage";
import AdminPage from "./pages/AdminPage";
import AdminNewQuizPage from "./pages/AdminNewQuizPage";
import AdminEditQuizPage from "./pages/AdminEditQuizPage";

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/quiz/:id" element={<QuizPage />} />
        <Route path="/practice/:id" element={<PracticePage />} />
        <Route path="/result/:resultId" element={<ResultPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quiz/new"
          element={
            <ProtectedRoute>
              <AdminNewQuizPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/quiz/:id/edit"
          element={
            <ProtectedRoute>
              <AdminEditQuizPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </>
  );
}

export default App;
