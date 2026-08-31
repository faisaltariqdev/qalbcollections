/**
 * Emits JSON-LD.
 *
 * `<` is escaped to its unicode form so a value containing `</script>` cannot
 * break out of the tag — the standard, crawlable way to ship structured data
 * from a React framework.
 */
export function JsonLd({ data, id }: { data: Record<string, unknown> | null; id?: string }) {
  if (!data) return null;

  return (
    <script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function JsonLdGraph({ items }: { items: readonly (Record<string, unknown> | null)[] }) {
  return (
    <>
      {items.filter((item): item is Record<string, unknown> => item !== null).map((item, index) => (
        <JsonLd key={`ld-${index}`} data={item} />
      ))}
    </>
  );
}
