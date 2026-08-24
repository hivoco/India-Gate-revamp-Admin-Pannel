// Where uploaded files are written.
//
//   APP_ENV=development  -> public/uploads on this machine, as before
//   APP_ENV=production   -> the same s3 bucket the site's /public folder was
//                           uploaded to, served back through cloudfront
//
// Keys are written under "public/" because that is the prefix the whole public
// folder went up with, so a blog image sits beside the rest of the site's
// files and one cloudfront distribution covers both.

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_BUCKET_NAME;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

export const cloudFrontUrl = process.env.CLOUD_FRONT_URL?.replace(/\/+$/, "");

// Where each kind of upload lands in the bucket.
//
// Blog art gets its own top level folder rather than sitting under the site's
// public/ tree, so the two are easy to tell apart: public/ is the site's own
// files, uploaded as a folder, and these are written by the panel.
const S3_FOLDERS: Record<string, string> = {
  blogs: "blogs_images",
  hero: "hero_images",
};

/** The object key for an upload, eg blogs_images/1787-123.webp */
export function s3KeyFor(folder: string, filename: string): string {
  const dir = S3_FOLDERS[folder] ?? (folder ? `uploads/${folder}` : "uploads");

  return `${dir}/${filename}`;
}

export const isS3Configured = Boolean(
  region && bucket && accessKeyId && secretAccessKey && cloudFrontUrl,
);

export const usingS3 =
  process.env.APP_ENV === "production" && isS3Configured;

let client: S3Client | null = null;

function getClient(): S3Client {
  client ??= new S3Client({
    region: region as string,
    credentials: {
      accessKeyId: accessKeyId as string,
      secretAccessKey: secretAccessKey as string,
    },
  });

  return client;
}

const contentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export function contentTypeFor(ext: string): string {
  return contentTypes[ext] ?? "application/octet-stream";
}

/**
 * Puts a file in the bucket and hands back the url it will be read from.
 *
 * The returned url is the cloudfront one, not the s3 one, so nothing stored in
 * the database ever points at the bucket directly.
 */
export async function uploadToS3(
  key: string,
  body: Buffer,
  ext: string,
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket as string,
      Key: key,
      Body: body,
      ContentType: contentTypeFor(ext),
      // these are public site assets served through the cdn, and they never
      // change once written since every filename carries a timestamp
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  return `${cloudFrontUrl}/${key}`;
}

/** Removes an object, given the cloudfront url that was stored for it. */
export async function deleteFromS3(url: string): Promise<void> {
  if (!cloudFrontUrl || !url.startsWith(cloudFrontUrl)) return;

  const key = url.slice(cloudFrontUrl.length + 1);

  if (!key || key.includes("..")) return;

  await getClient().send(
    new DeleteObjectCommand({ Bucket: bucket as string, Key: key }),
  );
}
