import fs from "fs";
import path from "path";
import { deleteFromS3, s3KeyFor, uploadToS3, usingS3 } from "./storage";

export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
}

export async function saveImage(
  file: File,
  // one level of subfolder, so blog art lands in public/uploads/blogs rather
  // than all uploads sharing one flat directory
  folder = "",
): Promise<string> {
  const ext = path.extname(file.name).toLowerCase();
  const allowed = [".jpg", ".jpeg", ".png", ".webp"];

  if (!allowed.includes(ext)) {
    throw new Error("Only JPEG, PNG, and WebP images are allowed.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5MB or smaller.");
  }

  // a caller passes a fixed literal, but never build a path out of user input
  // without this
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");

  const targetDir = safeFolder
    ? path.join(UPLOAD_DIR, safeFolder)
    : UPLOAD_DIR;

  if (!usingS3 && !fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  // in production the same file goes to the bucket instead, and what comes
  // back is an absolute cloudfront url. the database stores whatever this
  // returns, so a row written in production keeps working no matter where the
  // panel is later run from
  if (usingS3) {
    return uploadToS3(s3KeyFor(safeFolder, filename), buffer, ext);
  }

  fs.writeFileSync(path.join(targetDir, filename), buffer);

  return safeFolder ? `/uploads/${safeFolder}/${filename}` : `/uploads/${filename}`;
}

export function deleteImageFile(imageUrl: string | null | undefined) {
  if (!imageUrl) return;

  // a stored url that is absolute came from the bucket, wherever the panel is
  // running now. best effort, a failed cleanup must not fail the request
  if (imageUrl.startsWith("http")) {
    void deleteFromS3(imageUrl).catch((error) => {
      console.error("Failed to remove object from S3:", error);
    });

    return;
  }

  const relative = imageUrl.split("/uploads/")[1];

  // one folder deep at most, and never anything that could climb out of the
  // uploads directory
  if (!relative || relative.includes("..")) return;
  if (relative.split("/").length > 2) return;

  const target = path.join(UPLOAD_DIR, relative);

  if (!target.startsWith(UPLOAD_DIR)) return;

  fs.unlink(target, () => {});
}