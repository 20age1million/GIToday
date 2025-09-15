export function formatList(items: string[], title?: string): string {
  const numbered = items.map((item, idx) => {
    const num = String(idx + 1).padStart(2, " ");
    return `${num}. ${item}`;
  });

  return [
    ...(title ? [title] : []),
    "```txt",
    ...numbered,
    "```"
  ].join("\n");
}
