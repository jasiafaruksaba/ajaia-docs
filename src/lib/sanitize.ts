import sanitizeHtml from "sanitize-html";

export function sanitizeContent(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "strong",
      "em",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "code",
      "pre",
      "hr",
      "a",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
    },
    allowedSchemes: ["http", "https", "mailto"],
     transformTags: {
      h4: "h3",
      h5: "h3",
      h6: "h3",
    },
  });
}