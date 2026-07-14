import sanitizeHtml from 'sanitize-html';

const SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: sanitizeHtml.defaults.allowedTags.concat([
    'img',
    'h1',
    'h2',
    'figure',
    'figcaption',
    'video',
    'source',
  ]),
  allowedAttributes: {
    ...sanitizeHtml.defaults.allowedAttributes,
    img: ['src', 'alt', 'title', 'width', 'height'],
    a: ['href', 'name', 'target', 'rel'],
    video: ['src', 'controls', 'width', 'height'],
    source: ['src', 'type'],
  },
  allowedSchemes: ['http', 'https', 'mailto'],
};

export function sanitizeRichText(content: string): string {
  return sanitizeHtml(content, SANITIZE_OPTIONS);
}

export function sanitizePlainText(content: string): string {
  return sanitizeHtml(content, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
}
