const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.82;

/** Resolve preview URL from a workflow specimen object. */
export function resolveSpecimenPreviewSrc(specimen) {
  if (!specimen || typeof specimen !== "object") return null;
  const src = specimen.previewDataUrl ?? specimen.previewUrl;
  return src && String(src).length > 0 ? String(src) : null;
}

/** Downscale large photos so sessionStorage handoff stays under quota. */
export async function fileToPreviewDataUrl(file) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not prepare image preview.");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Could not encode image preview.");
  }
  return dataUrl;
}

export function formatSpecimenMetaFromFile(file, dimensions = {}) {
  const { width, height } = dimensions;
  const formatLabel = file.type === "image/png" ? "PNG" : "JPEG";
  const sizeLabel =
    file.size < 1024
      ? `${file.size} B`
      : file.size < 1024 * 1024
        ? `${(file.size / 1024).toFixed(1)} KB`
        : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
  const dimLabel =
    width && height ? `${width.toLocaleString()} × ${height.toLocaleString()} px` : "Dimensions unavailable";
  return {
    name: file.name,
    fullName: file.name,
    sizeLabel,
    dimensions: dimLabel,
    format: formatLabel,
  };
}
