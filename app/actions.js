"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canCreate, canManage, clearSession, getSession, setSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function cleanText(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.slice(0, maxLength);
}

function optionalText(value, maxLength) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function optionalDate(value) {
  const text = cleanText(value, 32);
  if (!text) return null;

  const date = new Date(`${text}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function login(formData) {
  const role = cleanText(formData.get("role"), 24);
  const password = String(formData.get("password") || "");

  const derickPassword = process.env.DERICK_PASSWORD || "derick";
  const parentPassword =
    process.env.PARENT_PASSWORD || process.env.GROWNUP_PASSWORD || "grownup";

  if (role === "derick" && password === derickPassword) {
    await setSession("derick");
    redirect("/");
  }

  if (role === "grownup" && password === parentPassword) {
    await setSession("grownup");
    redirect("/");
  }

  redirect("/?login=failed");
}

export async function logout() {
  await clearSession();
  redirect("/");
}

export async function createWish(formData) {
  if (process.env.VERCEL !== "1" && process.env.SCREENSHOT_MODE === "true") return;
  const session = await getSession();
  if (!canCreate(session)) return;
  if (!process.env.DATABASE_URL) return;

  const title = cleanText(formData.get("title"), 80);
  if (!title) return;

  await prisma.wish.create({
    data: {
      title,
      note: optionalText(formData.get("note"), 240),
      category: cleanText(formData.get("category"), 24) || "FUN",
    },
  });

  revalidatePath("/");
}

export async function updateWish(formData) {
  if (process.env.VERCEL !== "1" && process.env.SCREENSHOT_MODE === "true") return;
  const session = await getSession();
  if (!canManage(session)) return;
  if (!process.env.DATABASE_URL) return;

  const id = cleanText(formData.get("id"), 64);
  if (!id) return;
  const status = cleanText(formData.get("status"), 32) || "UNDER_CONSIDERATION";

  await prisma.wish.update({
    where: { id },
    data: {
      status,
      adultReply: optionalText(formData.get("adultReply"), 320),
      condition: optionalText(formData.get("condition"), 180),
      targetDate:
        status === "GRANTED" ? optionalDate(formData.get("targetDate")) : null,
    },
  });

  revalidatePath("/");
}

export async function deleteWish(formData) {
  if (process.env.VERCEL !== "1" && process.env.SCREENSHOT_MODE === "true") return;
  const session = await getSession();
  if (!canManage(session)) return;
  if (!process.env.DATABASE_URL) return;

  const id = cleanText(formData.get("id"), 64);
  if (!id) return;

  await prisma.wish.delete({ where: { id } });
  revalidatePath("/");
}
