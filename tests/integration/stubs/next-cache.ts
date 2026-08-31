/**
 * `next/cache` outside a request. Revalidation is Next's concern, not the
 * behaviour under test, so the calls are recorded and otherwise ignored.
 */

export const revalidated: string[] = [];

export function revalidatePath(path: string) {
  revalidated.push(path);
}

export function revalidateTag(tag: string) {
  revalidated.push(`tag:${tag}`);
}

export function unstable_noStore() {}
