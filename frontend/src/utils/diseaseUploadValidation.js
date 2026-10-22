export const DISEASE_MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED_MIME = new Set(["image/jpeg", "image/png"]);

export function isAcceptedExtension(name) {
  const lower = String(name ?? "").toLowerCase();
  return lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".png");
}

/** MIME and extension check — decoding is verified separately in the browser. */
export function validateDiseaseUploadBasics(file) {
  if (!file) {
    return { ok: false, error: "No file selected." };
  }
  if (!ACCEPTED_MIME.has(file.type) && !isAcceptedExtension(file.name)) {
    return { ok: false, error: "Accepted formats: JPG, JPEG, and PNG." };
  }
  if (file.size <= 0) {
    return { ok: false, error: "The selected file is empty." };
  }
  if (file.size > DISEASE_MAX_BYTES) {
    return { ok: false, error: "Image must be 5 MB or smaller." };
  }
  return { ok: true };
}

export function loadDecodableImagePreview(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        ok: true,
        width: img.naturalWidth,
        height: img.naturalHeight,
        previewUrl: url,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, error: "Could not decode this image. Choose a valid JPG or PNG file." });
    };
    img.src = url;
  });
}
