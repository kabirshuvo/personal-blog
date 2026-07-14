export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function generateUniqueSlug(
  base: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const normalized = slugify(base);

  if (!normalized) {
    throw new Error('Unable to generate slug from empty value');
  }

  let candidate = normalized;
  let counter = 1;

  while (await exists(candidate)) {
    candidate = `${normalized}-${counter}`;
    counter += 1;
  }

  return candidate;
}
