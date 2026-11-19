import "server-only";

import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MEDIA_PATH_RE } from "@/lib/content/types";

/**
 * Uploaded images (case-study screenshots & logos) live next to the JSON store in
 * DATA_DIR/uploads and are served by /api/media/[file]. Like the store, swap this
 * for object storage (S3, R2, Supabase Storage…) on serverless hosts.
 */
const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export const MEDIA_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
} as const;

type Ext = keyof typeof MEDIA_TYPES;

/** Identify the format from the file's magic bytes — never trust the name or MIME type. */
function sniff(buf: Buffer): Ext | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 4, 8) === "ftyp" && /^avi[fs]$/.test(buf.toString("ascii", 8, 12))) return "avif";
  return null;
}

export class UploadError extends Error {}

/** Saves an uploaded image and returns its public path (/api/media/<file>). */
export async function saveUpload(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Images must be 8 MB or smaller.");
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) throw new UploadError("Upload a PNG, JPG, WebP or AVIF image.");

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomUUID()}.${ext}`;
  await fs.writeFile(path.join(UPLOAD_DIR, name), buf);
  return `/api/media/${name}`;
}

/** Resolves a /api/media path (or bare file name) to a file inside UPLOAD_DIR, or null. */
export function resolveMedia(fileName: string) {
  const name = path.basename(fileName);
  if (!MEDIA_PATH_RE.test(`/api/media/${name}`)) return null;
  const ext = name.split(".").pop() as string;
  const type = MEDIA_TYPES[(ext === "jpeg" ? "jpg" : ext) as Ext];
  return { file: path.join(UPLOAD_DIR, name), type };
}

export async function deleteUpload(publicPath: string) {
  if (!publicPath) return;
  const media = resolveMedia(publicPath);
  if (!media) return;
  await fs.rm(media.file, { force: true });
}
