/**
 * Renders a JSON-LD <script> for structured data. Next.js allows this in the
 * component tree; the JSON is serialized once on the server.
 */
export default function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // JSON.stringify output is safe here (no user-controlled </script> break-out
      // because JSON escapes forward slashes are not required; values are quoted).
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
