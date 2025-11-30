export const FAVOURITE_TYPES = [
  { id: 1, name: 'article' },
  { id: 2, name: 'story' },
  { id: 3, name: 'conversation' },
  { id: 4, name: 'lyrics' },
  { id: 5, name: 'video' },
  { id: 6, name: 'book' },
  { id: 7, name: 'website' },
] as const;

export const normalizeUrl = (input: string): string => {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';
  const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(trimmed);
  const startsWithWww = /^www\./i.test(trimmed);
  const looksLikeDomain = /^[^\s]+\.[^\s]{2,}$/.test(trimmed);
  const looksLikeIp = /^\d{1,3}(\.\d{1,3}){3}(:\d+)?(\/|$)/.test(trimmed);
  if (!hasScheme && (startsWithWww || looksLikeDomain || looksLikeIp)) {
    return `https://${trimmed}`;
  }
  return hasScheme ? trimmed : '';
};