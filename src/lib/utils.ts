import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string) {
  return input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Truncates on a word boundary — used for generated meta descriptions. */
export function truncate(input: string, max: number) {
  const text = input.replace(/\s+/g, " ").trim();
  if (text.length <= max) return text;
  const clipped = text.slice(0, max - 1);
  const lastSpace = clipped.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? clipped.slice(0, lastSpace) : clipped).trimEnd()}…`;
}

export function formatDate(value: Date | string, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string, locale = "en-GB") {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatNumber(value: number, locale = "en-GB") {
  return new Intl.NumberFormat(locale).format(value);
}

export function unique<T>(values: readonly T[]): T[] {
  return Array.from(new Set(values));
}

export function groupBy<T, K extends string>(items: readonly T[], key: (item: T) => K) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const group = key(item);
    (acc[group] ??= []).push(item);
    return acc;
  }, {});
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

/** Stable pseudo-random pick so server and client render the same value. */
export function pickDeterministic<T>(items: readonly T[], seed: string): T | undefined {
  if (items.length === 0) return undefined;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return items[Math.abs(hash) % items.length];
}
