export default function Textarea({
  label,
  name,
  value,
  onChange,
  error,
  placeholder,
  rows = 4,
  required = false,
  disabled = false,
}) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={name} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        disabled={disabled}
        className={`
          w-full rounded-md border px-3 py-2 text-sm resize-y
          focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? "border-red-500" : "border-gray-300"}
          ${disabled ? "bg-gray-100 cursor-not-allowed text-gray-500" : "bg-white"}
        `.trim()}
      />
      {error && <p className="text-red-500 text-xs mt-0.5">{error}</p>}
    </div>
  );
}
