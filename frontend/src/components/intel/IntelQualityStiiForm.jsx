import { Cpu, Loader2, SlidersHorizontal } from "lucide-react";
import {
  SUSTAINABILITY_FIELDS,
  TEA_QUALITY_FIELDS,
  validateIntelForm,
} from "../../data/intelModelFeatures";

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[#5f6f66]">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#e8ece9] bg-[#fafbfa] px-3 py-2.5 text-sm text-[#1c2b24] outline-none focus:border-[#153d2e]/35 focus:ring-2 focus:ring-[#153d2e]/10";

export default function IntelQualityStiiForm({ form, onChange, onSubmit, running, validationError }) {
  return (
    <section className="rounded-2xl border border-[#e8ece9] bg-white p-5 shadow-sm">
      <h2 className="inline-flex items-center gap-2 text-sm font-bold text-[#153d2e]">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Combined inputs
      </h2>
      <p className="mt-1 text-xs text-[#7e8c84]">Both feature sets are required for STII.</p>
      {validationError && (
        <p className="mt-3 text-sm text-[#991b1b]" role="alert">
          {validationError}
        </p>
      )}
      <p className="mt-4 text-xs font-semibold tracking-wide text-[#8d9992]">Tea Quality — Model 01</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {TEA_QUALITY_FIELDS.map((field) => (
          <Field key={field.key} label={`${field.label} (${field.unit})`}>
            <input
              type="number"
              step="any"
              value={form[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              className={inputClass}
            />
          </Field>
        ))}
      </div>
      <p className="mt-5 text-xs font-semibold tracking-wide text-[#8d9992]">Sustainability — Model 02</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {SUSTAINABILITY_FIELDS.map((field) => (
          <Field key={field.key} label={`${field.label} (${field.unit})`}>
            <input
              type="number"
              step="any"
              value={form[field.key]}
              onChange={(e) => onChange(field.key, e.target.value)}
              className={inputClass}
            />
          </Field>
        ))}
      </div>
      <button
        type="button"
        disabled={running}
        onClick={onSubmit}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#153d2e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#10241c] disabled:opacity-70 sm:w-auto"
      >
        {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cpu className="h-4 w-4" />}
        {running ? "Running models…" : "Calculate STII"}
      </button>
    </section>
  );
}
