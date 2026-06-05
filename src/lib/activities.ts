export function validateActivityInput(input: { title?: string }) {
  const title = input.title?.trim();
  if (!title) return { ok: false as const, error: "Title required" };
  return { ok: true as const, title };
}
