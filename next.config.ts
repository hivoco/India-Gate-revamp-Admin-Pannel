import type { NextConfig } from "next";

// blog images live wherever storage.ts put them. in development that is this
// app's own /uploads, which is same origin and needs no pattern. in production
// it is the cloudfront distribution, and next/image refuses a remote host it
// has not been told about.
//
// derived from the same env var the uploader uses rather than hardcoding a
// domain, so changing the distribution only means changing .env
const cloudFrontUrl = process.env.CLOUD_FRONT_URL;

const remotePatterns = (() => {
  if (!cloudFrontUrl) return [];

  try {
    const { protocol, hostname, port } = new URL(cloudFrontUrl);

    return [
      {
        protocol: protocol.replace(":", "") as "http" | "https",
        hostname,
        port: port || undefined,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
})();

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    remotePatterns,
  },
};

export default nextConfig;
