export type MediaKind = "image" | "video";

const VIDEO_EXTENSION_REGEX = /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i;

export function detectMediaKind(value?: string | null): MediaKind {
  if (!value) {
    return "image";
  }

  if (value.startsWith("data:video/")) {
    return "video";
  }

  if (value.startsWith("data:image/")) {
    return "image";
  }

  return VIDEO_EXTENSION_REGEX.test(value) ? "video" : "image";
}
