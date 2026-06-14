import path from 'path';

export function toPublicUploadUrl(filePath) {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, '/');
  const uploadsIndex = normalized.indexOf('/uploads/');
  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }
  const relativeIndex = normalized.indexOf('uploads/');
  if (relativeIndex >= 0) {
    return `/${normalized.slice(relativeIndex)}`;
  }
  return `/uploads/${path.basename(normalized)}`;
}

export function attachDocumentUrls(documents) {
  return documents.map((doc) => ({
    ...doc,
    url: toPublicUploadUrl(doc.filePath),
  }));
}
