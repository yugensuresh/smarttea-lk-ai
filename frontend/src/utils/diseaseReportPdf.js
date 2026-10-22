import { jsPDF } from "jspdf";
import { MODEL_META } from "../data/diseaseModel";
import { diseaseReportFilename } from "./diseaseExport";

const MARGIN = 16;
const PAGE_W = 210;
const CONTENT_W = PAGE_W - MARGIN * 2;

function writeLines(doc, text, x, y, maxWidth, lineHeight = 5) {
  if (!text) return y;
  const lines = doc.splitTextToSize(String(text), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensureSpace(doc, y, needed) {
  if (y + needed > 280) {
    doc.addPage();
    return MARGIN + 8;
  }
  return y;
}

/**
 * @param {object} params
 * @returns {Promise<{ blob: Blob, filename: string }>}
 */
export async function buildDiseaseReportPdf({
  specimen,
  diagnosis,
  modelMeta,
  inferenceEngine,
  verified,
  severitySnapshot,
  imageDataUrl,
  generatedAt = new Date(),
}) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SmartTea-LK — Disease Detection Report", MARGIN, y);
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 100, 95);
  y = writeLines(
    doc,
    `Generated: ${generatedAt.toLocaleString()} · Model: ${modelMeta?.name ?? MODEL_META.name} · Engine: ${inferenceEngine ?? "—"}${verified ? " (verified)" : ""}`,
    MARGIN,
    y,
    CONTENT_W,
    4,
  );
  y += 4;
  doc.setTextColor(0, 0, 0);

  doc.setDrawColor(230, 236, 233);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Specimen", MARGIN, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  y = writeLines(doc, `File: ${specimen.fullName ?? specimen.name ?? "—"}`, MARGIN, y, CONTENT_W);
  y = writeLines(doc, `Size: ${specimen.sizeLabel ?? "—"} · ${specimen.dimensions ?? "—"} · ${specimen.format ?? "—"}`, MARGIN, y, CONTENT_W);
  y += 4;

  if (imageDataUrl && imageDataUrl.startsWith("data:image/")) {
    y = ensureSpace(doc, y, 55);
    try {
      const format = imageDataUrl.includes("image/png") ? "PNG" : "JPEG";
      doc.addImage(imageDataUrl, format, MARGIN, y, 48, 36, undefined, "FAST");
      y += 40;
    } catch {
      y = writeLines(doc, "(Specimen image could not be embedded in this PDF.)", MARGIN, y, CONTENT_W);
    }
  }

  y = ensureSpace(doc, y, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Diagnostic result", MARGIN, y);
  y += 6;
  doc.setFontSize(13);
  y = writeLines(doc, diagnosis.pathology?.label ?? diagnosis.classId ?? "—", MARGIN, y, CONTENT_W, 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (diagnosis.pathology?.scientific) {
    y = writeLines(doc, diagnosis.pathology.scientific, MARGIN, y, CONTENT_W);
  }
  if (diagnosis.pathology?.code) {
    y = writeLines(doc, `Code: ${diagnosis.pathology.code}`, MARGIN, y, CONTENT_W);
  }
  y += 2;
  y = writeLines(
    doc,
    `Model-reported confidence: ${diagnosis.probability ?? "—"}% (this specimen — not held-out test accuracy of ${modelMeta?.benchmarkAcc ?? MODEL_META.benchmarkAcc}%).`,
    MARGIN,
    y,
    CONTENT_W,
  );
  y += 6;

  const probs = diagnosis.probabilities ?? [];
  if (probs.length > 0) {
    y = ensureSpace(doc, y, 8 + probs.length * 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Four-class probability (server output)", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    for (const row of probs) {
      doc.text(`${row.label}: ${Number(row.pct).toFixed(1)}%`, MARGIN + 2, y);
      y += 4.5;
    }
    y += 2;
  }

  if (diagnosis.summary) {
    y = ensureSpace(doc, y, 20);
    doc.setFont("helvetica", "bold");
    doc.text("Result summary", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    y = writeLines(doc, diagnosis.summary, MARGIN, y, CONTENT_W);
    y += 4;
  }

  if (diagnosis.nextSteps?.length) {
    y = ensureSpace(doc, y, 12 + diagnosis.nextSteps.length * 5);
    doc.setFont("helvetica", "bold");
    doc.text("Suggested next steps", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    diagnosis.nextSteps.forEach((step, i) => {
      y = writeLines(doc, `${i + 1}. ${step}`, MARGIN, y, CONTENT_W);
    });
    y += 4;
  }

  if (severitySnapshot) {
    y = ensureSpace(doc, y, 24);
    doc.setFont("helvetica", "bold");
    doc.text("Severity assessment", MARGIN, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    if (severitySnapshot.experimental) {
      y = writeLines(
        doc,
        "Experimental heuristic estimate — not model-based severity detection.",
        MARGIN,
        y,
        CONTENT_W,
      );
    } else {
      y = writeLines(doc, "Trained severity model result.", MARGIN, y, CONTENT_W);
    }
    if (severitySnapshot.displayLevel) {
      y = writeLines(doc, `Level: ${severitySnapshot.displayLevel}`, MARGIN, y, CONTENT_W);
    }
    if (severitySnapshot.affectedPct != null) {
      y = writeLines(doc, `Heuristic affected area: ${severitySnapshot.affectedPct}%`, MARGIN, y, CONTENT_W);
    }
    if (severitySnapshot.explanation) {
      y = writeLines(doc, severitySnapshot.explanation, MARGIN, y, CONTENT_W);
    }
    y += 4;
  }

  y = ensureSpace(doc, y, 16);
  doc.setFontSize(8);
  doc.setTextColor(100, 110, 105);
  y = writeLines(
    doc,
    "Disclaimer: Model-reported confidence reflects this inference only. Held-out test accuracy is a separate training metric and is not a guarantee for field specimens. Follow local agronomic guidance before treatment decisions.",
    MARGIN,
    y,
    CONTENT_W,
    3.5,
  );

  const blob = doc.output("blob");
  return { blob, filename: diseaseReportFilename(generatedAt) };
}

export async function downloadDiseaseReportPdf(params) {
  const { blob, filename } = await buildDiseaseReportPdf(params);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return filename;
}
