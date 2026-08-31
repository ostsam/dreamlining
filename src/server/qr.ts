import "server-only";

import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { parseHttpOrigin } from "../config/neon-url";

export type QrEncoder = (joinUrl: string) => Promise<string> | string;

const JOIN_TOKEN_LENGTH = 43;
const JOIN_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function generateJoinToken(): string {
  return randomBytes(32).toString("base64url");
}

export function validateJoinToken(token: string): string {
  if (!JOIN_TOKEN_PATTERN.test(token)) {
    throw new Error("Join token must be canonical 43-character base64url");
  }
  const decoded = Buffer.from(token, "base64url");
  if (decoded.length !== 32 || decoded.toString("base64url") !== token) {
    throw new Error("Join token must decode to exactly 32 bytes");
  }
  return token;
}

export function normalizeJoinPath(value: string): string {
  if (
    typeof value !== "string" ||
    !value ||
    value.includes("\\") ||
    value.includes("?") ||
    value.includes("#")
  ) {
    throw new Error("Join path must be a canonical path");
  }
  if (/%(?:2f|2e|5c|3f|23)/i.test(value)) {
    throw new Error("Encoded path delimiters are not allowed");
  }
  if (
    !value.startsWith("/join/") ||
    value.endsWith("/") ||
    value.split("/").length !== 3
  ) {
    throw new Error("Join path must contain one token segment");
  }
  const token = value.slice("/join/".length);
  validateJoinToken(token);
  return `/join/${token}`;
}

export function buildJoinUrl(appOrigin: string, joinPath: string): string {
  const origin = parseHttpOrigin(appOrigin);
  const path = normalizeJoinPath(joinPath);
  return `${origin}${path}`;
}

export async function createQrArtifact(
  appOrigin: string,
  joinPath: string,
  encoder: QrEncoder = (joinUrl) => QRCode.toDataURL(joinUrl),
): Promise<{ joinUrl: string; dataUrl: string }> {
  const joinUrl = buildJoinUrl(appOrigin, joinPath);
  const dataUrl = await encoder(joinUrl);
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    throw new Error("QR encoder must return a data URL");
  }
  return { joinUrl, dataUrl };
}

export { JOIN_TOKEN_LENGTH };
