/**
 * Client-side image compression using Canvas API.
 * Resizes to max 1500px on the longest edge and re-encodes as JPEG/PNG.
 * Target size: < 5MB (backend limit).
 */

const MAX_DIMENSION = 1500;
const MAX_SIZE_BYTES = 4.5 * 1024 * 1024; // Stay safely under 5MB backend limit

export async function compressImage(file: File): Promise<File> {
  // Only compress images that are over the limit or need resizing
  if (file.size <= MAX_SIZE_BYTES) {
    // Still check dimensions
    const needsResize = await imageDimensionsExceedMax(file);
    if (!needsResize) return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const { width, height } = calculateDimensions(img.width, img.height);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        // White background for JPEGs
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Try quality 0.85 first, then reduce if still too large
        tryCompress(canvas, file, 0.85, resolve, reject);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

function calculateDimensions(
  origWidth: number,
  origHeight: number
): { width: number; height: number } {
  if (origWidth <= MAX_DIMENSION && origHeight <= MAX_DIMENSION) {
    return { width: origWidth, height: origHeight };
  }

  const ratio = origWidth / origHeight;
  if (origWidth > origHeight) {
    return { width: MAX_DIMENSION, height: Math.round(MAX_DIMENSION / ratio) };
  } else {
    return { width: Math.round(MAX_DIMENSION * ratio), height: MAX_DIMENSION };
  }
}

async function imageDimensionsExceedMax(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img.width > MAX_DIMENSION || img.height > MAX_DIMENSION);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(false);
    };
    img.src = url;
  });
}

function tryCompress(
  canvas: HTMLCanvasElement,
  originalFile: File,
  quality: number,
  resolve: (file: File) => void,
  reject: (err: Error) => void
): void {
  // Use JPEG for most images (better compression), PNG only for PNG with transparency
  const outputType = originalFile.type === "image/png" ? "image/png" : "image/jpeg";

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        reject(new Error("Canvas compression failed"));
        return;
      }

      if (blob.size > MAX_SIZE_BYTES && quality > 0.3) {
        // Try lower quality
        tryCompress(canvas, originalFile, quality - 0.15, resolve, reject);
        return;
      }

      const ext = outputType === "image/png" ? "png" : "jpg";
      const name = originalFile.name.replace(/\.[^.]+$/, `.${ext}`);
      const compressedFile = new File([blob], name, {
        type: outputType,
        lastModified: Date.now(),
      });

      resolve(compressedFile);
    },
    outputType,
    quality
  );
}
