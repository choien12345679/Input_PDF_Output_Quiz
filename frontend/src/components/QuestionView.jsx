const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuestionView({
  question,
  selectedOption,
  onSelect,
  showAnswer = false,
  mode = "exam",
}) {
  if (!question) return null;

  const getOptionStyle = (optionId) => {
    const isSelected = selectedOption === optionId;
    const isCorrect = optionId === question.correctOptionId;

    if (mode === "practice" && showAnswer) {
      if (isCorrect) return "border-green-500 bg-green-50 text-green-800";
      if (isSelected && !isCorrect)
        return "border-red-500 bg-red-50 text-red-800";
      return "border-gray-200 bg-white text-gray-700";
    }

    if (isSelected) return "border-blue-500 bg-blue-50 text-blue-800";
    return "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50";
  };

  return (
    <div className="w-full">
      <p className="text-sm text-gray-500 mb-2">
        문제 {question.order ?? ""} / {question.totalCount ?? ""}
      </p>
      <p className="text-lg font-medium text-gray-900 mb-6">
        {question.questionText}
      </p>

      <div className="space-y-3">
        {question.options?.map((option, idx) => {
          const label = OPTION_LABELS[idx] ?? idx + 1;
          const isSelected = selectedOption === option.optionId;
          const isCorrect = option.optionId === question.correctOptionId;
          const showCorrectIcon =
            mode === "practice" && showAnswer && isCorrect;
          const showWrongIcon =
            mode === "practice" && showAnswer && isSelected && !isCorrect;

          return (
            <button
              key={option.optionId}
              type="button"
              onClick={() => !showAnswer && onSelect(option.optionId)}
              disabled={mode === "practice" && showAnswer}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border-2 text-left transition-colors duration-150 ${getOptionStyle(option.optionId)}`}
            >
              <span className="font-bold w-6 shrink-0">{label}</span>
              <span className="flex-1">{option.optionText}</span>
              {showCorrectIcon && (
                <span className="text-green-600 font-bold">✓</span>
              )}
              {showWrongIcon && (
                <span className="text-red-600 font-bold">✗</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
