/**
 * Finds the last paragraph of a turn's text, where paragraphs are
 * separated by one or more blank lines. Returns the character offsets
 * of that paragraph within the full text, so an annotation can point
 * AI training focus at just the final part of a turn rather than the
 * whole thing.
 */
export function getLastParagraphRange(text) {
  if (!text) {
    return { start: 0, end: 0 };
  }

  const paragraphBreak = /\n\s*\n/g;
  let lastBreakEnd = 0;
  let match;

  while ((match = paragraphBreak.exec(text)) !== null) {
    lastBreakEnd = match.index + match[0].length;
  }

  // Trim leading whitespace/newlines so the offset starts at real content.
  let start = lastBreakEnd;
  while (start < text.length && /\s/.test(text[start])) {
    start += 1;
  }

  // Trim trailing whitespace so the offset ends at real content.
  let end = text.length;
  while (end > start && /\s/.test(text[end - 1])) {
    end -= 1;
  }

  if (start >= end) {
    return { start: 0, end: text.length };
  }

  return { start, end };
}
