import { Eye, EyeOff } from "lucide-react";
import { useId, useState } from "react";

const inputClass =
  "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-[#1c2b24] outline-none transition-shadow placeholder:text-[#b0bab4] focus:ring-2";

export default function PasswordField({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  autoComplete,
  placeholder = "Enter your password",
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-[#3e4f46]">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`${inputClass} pr-11 ${error ? "border-[#f5a8a8] focus:border-[#e11d48] focus:ring-[#e11d48]/15" : "border-[#e6ece8] focus:border-[#178a45]/40 focus:ring-[#178a45]/15"}`}
        />
        <button
          type="button"
          className="absolute top-1/2 right-2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[#7e8c84] hover:bg-[#f4f6f4] hover:text-[#3e4f46]"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-[#b42318]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
