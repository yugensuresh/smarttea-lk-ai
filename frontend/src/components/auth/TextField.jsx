import { useId } from "react";

const inputClass =
  "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-[#1c2b24] outline-none transition-shadow placeholder:text-[#b0bab4] focus:ring-2";

export default function TextField({
  label,
  name,
  type = "text",
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  placeholder,
}) {
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#3e4f46]">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`${inputClass} ${error ? "border-[#f5a8a8] focus:border-[#e11d48] focus:ring-[#e11d48]/15" : "border-[#e6ece8] focus:border-[#178a45]/40 focus:ring-[#178a45]/15"}`}
      />
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-[#b42318]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
