const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20MB - iPhone HEIC photos can be very large
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const HEIC_TYPES = ['image/heic', 'image/heif'];
// Use smaller default to stay well under Supabase payload limits
const MAX_DIMENSION = 1280;
const MAX_DIMENSION_AGGRESSIVE = 960;
const JPEG_QUALITY = 0.82;
const JPEG_QUALITY_AGGRESSIVE = 0.65;

export const IMAGE_VALIDATION = {
  maxSizeBytes: MAX_FILE_SIZE_BYTES,
  maxSizeMB: 20,
  allowedTypes: [...ALLOWED_TYPES, ...HEIC_TYPES],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.heif'],
} as const;

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    HEIC_TYPES.includes(type) ||
    /\.(heic|heif)$/i.test(name) ||
    // Some browsers report empty or generic MIME for HEIC
    (type === '' && /\.(heic|heif)$/i.test(name)) ||
    (type === 'application/octet-stream' && /\.(heic|heif)$/i.test(name))
  );
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const acceptedTypes = [...ALLOWED_TYPES, ...HEIC_TYPES];
  const hasValidExtension = /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.name);
  const isHeicFile = isHeic(file);

  if (!acceptedTypes.includes(file.type) && !isHeicFile && !hasValidExtension) {
    return {
      valid: false,
      error: `Invalid file type (${file.type || 'unknown'}). Please use JPEG, PNG, WebP, GIF, or HEIC (iPhone photos).`,
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `Image must be under ${IMAGE_VALIDATION.maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`,
    };
  }
  return { valid: true };
}

/**
 * Convert HEIC/HEIF to JPEG using heic2any library.
 * This is a pure JS decoder that works in all browsers (Chrome, Safari, Firefox).
 */
async function convertHeicWithLibrary(file: File): Promise<File> {
  const heic2any = (await import('heic2any')).default;
  const blob = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.92,
  });
  const resultBlob = Array.isArray(blob) ? blob[0] : blob;
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg') || 'photo.jpg';
  return new File([resultBlob], newName, { type: 'image/jpeg' });
}

/**
 * Convert HEIC using browser's native decoder (works in Safari, newer Chrome on macOS).
 * Falls back to createImageBitmap → Canvas → JPEG.
 */
async function convertHeicWithCanvas(file: File): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();
  const jpegBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Canvas toBlob failed'))),
      'image/jpeg',
      0.92
    );
  });
  const newName = file.name.replace(/\.(heic|heif)$/i, '.jpg') || 'photo.jpg';
  return new File([jpegBlob], newName, { type: 'image/jpeg' });
}

/**
 * Convert HEIC to JPEG — tries multiple methods in order:
 * 1. heic2any JS library (works in all browsers)
 * 2. Native browser decode via canvas (Safari, newer Chrome)
 */
async function convertHeicToJpeg(file: File): Promise<File> {
  // Method 1: heic2any library
  try {
    return await convertHeicWithLibrary(file);
  } catch {
    // heic2any failed, try canvas fallback
  }

  // Method 2: Native browser decode (Safari / macOS Chrome)
  try {
    return await convertHeicWithCanvas(file);
  } catch {
    // Canvas fallback also failed
  }

  throw new Error(
    'Could not convert iPhone photo (HEIC). Try one of these:\n' +
    '1. Open the photo in Photos → Share → Copy, then paste in browser\n' +
    '2. Screenshot the photo and upload the screenshot\n' +
    '3. On iPhone: Settings → Camera → Formats → Most Compatible'
  );
}

// Keep base64 payload under a reasonable size for API requests
const MAX_PAYLOAD_BASE64_BYTES = 3.5 * 1024 * 1024;

/**
 * Prepares an image for analysis: converts HEIC→JPEG if needed, then returns base64.
 * Handles iPhone camera roll photos (HEIC) and applies compression.
 */
export async function prepareImageForAnalysis(
  file: File,
  options?: { aggressive?: boolean }
): Promise<string> {
  let workFile = file;

  if (isHeic(file)) {
    workFile = await convertHeicToJpeg(file);
  }

  let result = await compressImage(workFile, options?.aggressive);
  const sizeBytes = Math.ceil((result.split(',')[1]?.length ?? 0) * 0.75);
  if (sizeBytes > MAX_PAYLOAD_BASE64_BYTES) {
    result = await compressImage(workFile, true);
  }
  return result;
}

/** Compress image client-side using Canvas, returns base64 data URL */
export async function compressImage(file: File, aggressive = false): Promise<string> {
  const maxDim = aggressive ? MAX_DIMENSION_AGGRESSIVE : MAX_DIMENSION;
  const jpegQuality = aggressive ? JPEG_QUALITY_AGGRESSIVE : JPEG_QUALITY;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      const quality = file.type === 'image/png' ? 0.9 : jpegQuality;

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        mimeType,
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Shrink an existing base64 image for retry - useful when the original request failed (e.g. payload too large) */
export async function shrinkBase64Image(base64: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION_AGGRESSIVE || height > MAX_DIMENSION_AGGRESSIVE) {
        if (width > height) {
          height = Math.round((height * MAX_DIMENSION_AGGRESSIVE) / width);
          width = MAX_DIMENSION_AGGRESSIVE;
        } else {
          width = Math.round((width * MAX_DIMENSION_AGGRESSIVE) / height);
          height = MAX_DIMENSION_AGGRESSIVE;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas not supported'));
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to shrink image'));
            return;
          }
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        JPEG_QUALITY_AGGRESSIVE
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64;
  });
}
