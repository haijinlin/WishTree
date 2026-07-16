import crypto from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "wishtree_session";
const roles = new Set(["derick", "grownup"]);

function getSecret() {
  return process.env.AUTH_SECRET || "wishtree-local-dev-secret";
}

function sign(value) {
  return crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
}

export function createSessionValue(role) {
  const value = `${role}.${Date.now()}`;
  return `${value}.${sign(value)}`;
}

export async function getSession() {
  if (process.env.VERCEL !== "1" && process.env.SCREENSHOT_MODE === "true") {
    return { role: "grownup" };
  }
  const cookieStore = await cookies();
  const raw = cookieStore.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const parts = raw.split(".");
  if (parts.length !== 3) return null;

  const [role, createdAt, signature] = parts;
  const value = `${role}.${createdAt}`;
  if (!roles.has(role) || sign(value) !== signature) return null;

  return { role };
}

export async function setSession(role) {
  if (process.env.VERCEL !== "1" && process.env.SCREENSHOT_MODE === "true") return;
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, createSessionValue(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.VERCEL === "1",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
}

export async function clearSession() {
  if (process.env.VERCEL !== "1" && process.env.SCREENSHOT_MODE === "true") return;
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export function canCreate(session) {
  return session?.role === "derick";
}

export function canManage(session) {
  return session?.role === "grownup";
}
