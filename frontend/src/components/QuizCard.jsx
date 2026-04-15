import { useNavigate } from "react-router-dom";
import Badge from "./Badge";
import Button from "./Button";

export default function QuizCard({ quizSet }) {
  const { quizSetId, title, description, category, questionCount, isPublic } =
    quizSet;
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
          {title}
        </h3>
        {category && <Badge variant="info">{category}</Badge>}
      </div>

      <p className="text-sm text-gray-500 line-clamp-2 flex-1">
        {description || "설명이 없습니다."}
      </p>

      <p className="text-xs text-gray-400">{questionCount}개 문제</p>

      <div className="flex gap-2 mt-1">
        <Button
          size="sm"
          variant="primary"
          className="flex-1"
          onClick={() => navigate(`/quiz/${quizSetId}`)}
        >
          시험 모드
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="flex-1"
          onClick={() => navigate(`/practice/${quizSetId}`)}
        >
          연습 모드
        </Button>
      </div>
    </div>
  );
}
