export function normalizeText(text?: string | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>?/gm, '').trim();
}

export function stemWord(word: string): string {
  let w = word.toLowerCase();
  if (w.endsWith('tional') && w.length > 7) {
    return w.slice(0, -6) + 't'; // rotational -> rotat
  }
  if (w.endsWith('tion') && w.length > 5) {
    return w.slice(0, -4) + 't'; // rotation -> rotat
  }
  if (w.endsWith('ies') && w.length > 4) {
    return w.slice(0, -3) + 'y';
  }
  if (w.endsWith('es') && w.length > 4 && !w.endsWith('ces') && !w.endsWith('ses')) {
    return w.slice(0, -2);
  }
  if (w.endsWith('s') && !w.endsWith('ss') && w.length > 3) {
    return w.slice(0, -1);
  }
  if (w.endsWith('ing') && w.length > 5) {
    return w.slice(0, -3);
  }
  if (w.endsWith('ed') && w.length > 4) {
    return w.slice(0, -2);
  }
  return w;
}

export function tokenize(text: string): Set<string> {
  const normalized = normalizeText(text);
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from',
    'has', 'he', 'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the',
    'to', 'was', 'were', 'will', 'with', 'video', 'tutorial', 'learn',
    'complete', 'full', 'course', 'guide', 'best', 'online'
  ]);
  
  const tokens = normalized
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));

  const tokenSet = new Set<string>();
  for (const t of tokens) {
    const stemmed = stemWord(t);
    tokenSet.add(stemmed.length > 2 ? stemmed : t);
  }
  return tokenSet;
}


/**
 * Calculates Jaccard similarity between two strings (0.0 to 1.0)
 */
export function calculateTitleSimilarity(titleA: string, titleB: string): number {
  const tokensA = tokenize(titleA);
  const tokensB = tokenize(titleB);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) {
      intersection++;
    }
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Truncates text cleanly to max length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sanitizes unescaped backslashes in JSON strings (common in LaTeX math formulas)
 */
export function sanitizeLatexInJson(jsonStr: string): string {
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];

    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && char === '\\') {
      const nextChar = jsonStr[i + 1];
      // Standard valid JSON escape characters: " \ / b f n r t u
      const isValidEscape = nextChar && /["\\/bfnrtu]/.test(nextChar);
      if (isValidEscape) {
        result += char;
        escapeNext = true;
      } else {
        // Unescaped LaTeX backslash like \alpha, \frac, \times, etc. -> escape it
        result += '\\\\';
      }
      continue;
    }

    result += char;
  }

  return result;
}

/**
 * Attempts to repair truncated JSON (unclosed arrays, objects, or strings)
 */
export function attemptRepairTruncatedJson(jsonStr: string): string {
  let clean = jsonStr.trim();
  // Remove trailing unquoted comma or colon
  clean = clean.replace(/,\s*$/, '').replace(/:\s*$/, '');

  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < clean.length; i++) {
    const char = clean[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (char === '{') stack.push('}');
      else if (char === '[') stack.push(']');
      else if (char === '}' || char === ']') {
        if (stack.length > 0 && stack[stack.length - 1] === char) {
          stack.pop();
        }
      }
    }
  }

  // If ended inside a string, close the string
  if (inString) {
    clean += '"';
  }

  // Close remaining open brackets and braces in reverse order
  while (stack.length > 0) {
    clean += stack.pop();
  }

  return clean;
}

/**
 * Bulletproof JSON extraction from LLM responses
 */
export function extractJsonFromText<T>(rawText: string): T | null {
  if (!rawText || !rawText.trim()) return null;

  try {
    let clean = rawText.trim();
    // 1. Look for ```json ... ``` or ``` ... ``` anywhere in text
    const firstFence = clean.indexOf('```');
    if (firstFence !== -1) {
      const fenceNewline = clean.indexOf('\n', firstFence);
      const lastFence = clean.lastIndexOf('```');
      if (fenceNewline !== -1 && lastFence > fenceNewline) {
        clean = clean.substring(fenceNewline + 1, lastFence).trim();
      }
    } else {
      // 2. Or extract the substring between first '{' or '[' and last '}' or ']'
      const firstCurly = clean.indexOf('{');
      const firstBracket = clean.indexOf('[');
      let startIdx = -1;
      let endChar = '';

      if (firstCurly !== -1 && (firstBracket === -1 || firstCurly < firstBracket)) {
        startIdx = firstCurly;
        endChar = '}';
      } else if (firstBracket !== -1) {
        startIdx = firstBracket;
        endChar = ']';
      }

      if (startIdx !== -1) {
        const lastIdx = clean.lastIndexOf(endChar);
        if (lastIdx > startIdx) {
          clean = clean.substring(startIdx, lastIdx + 1).trim();
        } else {
          // Truncated response that started with '{' or '['
          clean = clean.substring(startIdx).trim();
        }
      }
    }

    // First try standard parse
    try {
      return JSON.parse(clean) as T;
    } catch {
      // Try LaTeX backslash sanitization
      const sanitized = sanitizeLatexInJson(clean);
      try {
        return JSON.parse(sanitized) as T;
      } catch {
        // Try repairing truncated JSON with sanitized backslashes
        const repaired = attemptRepairTruncatedJson(sanitized);
        return JSON.parse(repaired) as T;
      }
    }
  } catch {
    return null;
  }
}

