/** Shared Disease Detection → Risk → PDVI → Severity session handoff. */
export const LEAF_WORKFLOW_STORAGE_KEY = "smarttea-lk.member01.leafWorkflow";

export function readLeafWorkflow() {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LEAF_WORKFLOW_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.specimen) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function persistLeafWorkflow(workflow, options = {}) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(LEAF_WORKFLOW_STORAGE_KEY, JSON.stringify(workflow));
    if (!options.silent) {
      window.dispatchEvent(new CustomEvent("smarttea-lk:leaf-workflow-updated"));
    } else if (options.notifyPipeline) {
      window.dispatchEvent(
        new CustomEvent("smarttea-lk:leaf-workflow-updated", { detail: { pipelineOnly: true } }),
      );
    }
  } catch {
    /* quota or private mode — ignore */
  }
}

/** Merge partial updates into the existing workflow (preserves specimen + model01). */
export function mergeLeafWorkflow(partial, options = {}) {
  const current = readLeafWorkflow();
  if (!current && !partial?.specimen) return;
  const has = (key) => Object.prototype.hasOwnProperty.call(partial ?? {}, key);
  const upstreamInputsChanged = has("model01") || has("model02");

  let pdvi = current?.pdvi;
  if (has("pdvi")) {
    pdvi = partial.pdvi;
  } else if (upstreamInputsChanged) {
    pdvi = null;
  }

  const next = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
    specimen: partial?.specimen ?? current?.specimen,
    model01: has("model01") ? partial.model01 : current?.model01,
    model02: has("model02") ? partial.model02 : current?.model02,
    pdvi,
  };
  persistLeafWorkflow(next, options);
  return next;
}

/** Normalize Model 01 confidence to 0–1 for PDVI POST. */
export function confidenceAsFraction(value) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return 0;
  return n > 1 ? n / 100 : n;
}

export function workflowPipelineStatus(workflow) {
  if (!workflow?.specimen) {
    return { model01: false, model02: false, pdvi: false };
  }
  return {
    model01: Boolean(workflow.model01?.classId),
    model02: Boolean(workflow.model02?.severityProbabilitiesForPdvi),
    pdvi: workflow.pdvi?.score != null,
  };
}
