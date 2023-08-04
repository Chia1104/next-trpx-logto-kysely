import { env } from "@/env.mjs";

interface Options {
  isServer?: boolean;
}

export const getBaseUrl = (opts?: Options) => {
  opts ??= {};
  const { isServer } = opts;
  if (typeof window !== "undefined" && !isServer) {
    return "";
  }
  if (env.ZEABUR_URL) {
    return `https://${env.ZEABUR_URL}`;
  }

  if (env.VERCEL_URL) {
    return `https://${env.VERCEL_URL}`;
  }

  return `http://localhost:${env.PORT}`;
};
