export default function ProgressBar({ current, total, className = "" }) {
  const percent =
    total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between text-sm text-gray-600 mb-1">
        <span>
          {current} / {total}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
