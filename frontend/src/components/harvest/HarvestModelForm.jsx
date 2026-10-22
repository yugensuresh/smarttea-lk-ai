import { Loader2 } from "lucide-react";

/**
 * Compact feature form for harvest intelligence inputs.
 */
export default function HarvestModelForm({
  title,
  fields,
  values,
  onChange,
  onSubmit,
  running,
  submitLabel = "Run model",
}) {
  return (
    <section className="mb-5 rounded-2xl border border-[#dce5df] bg-[#fafbfa] p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-[#1b2a22]">{title}</h2>
      <p className="mt-1 text-xs text-[#8b9790]">Edit values and run — results update without reloading the page.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {fields.map((field) => (
          <label key={field.key} className="block text-sm">
            <span className="font-medium text-[#24352c]">
              {field.label}
              {field.unit ? ` (${field.unit})` : ""}
            </span>
            {field.type === "select" ? (
              <select
                value={values[field.key]}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#e3ebe6] px-3 py-2 text-[#1c2b24]"
              >
                {(field.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === "text" ? "text" : "number"}
                step={field.step ?? "any"}
                value={values[field.key]}
                onChange={(e) => onChange(field.key, e.target.value)}
                className="mt-1 w-full rounded-xl border border-[#e3ebe6] px-3 py-2 text-[#1c2b24]"
              />
            )}
          </label>
        ))}
      </div>
      <button
        type="button"
        disabled={running}
        onClick={onSubmit}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#10241c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#173628] disabled:opacity-60"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {running ? "Running…" : submitLabel}
      </button>
    </section>
  );
}
