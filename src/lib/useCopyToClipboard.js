import { useCallback, useRef, useState } from 'react';

function selectElementText(el) {
  if (!el) return;
  if (typeof el.select === 'function') {
    el.focus();
    el.select();
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(el);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Copies text to the clipboard, falling back to selecting the source
 * element's text (or a prompt() if none is given) when the Clipboard API
 * is unavailable — no secure context — or rejects, as on some older
 * Android WebViews. `copied` only ever turns true after a real,
 * successful write, so callers never show a false "Copied!".
 */
export function useCopyToClipboard(resetDelay = 2000) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef(null);

  const copy = useCallback((text, sourceRef) => {
    clearTimeout(timerRef.current);
    const fail = () => {
      setCopied(false);
      const el = sourceRef && 'current' in sourceRef ? sourceRef.current : sourceRef;
      if (el) selectElementText(el);
      else window.prompt('Copy this link:', text);
    };
    const writeText = navigator.clipboard?.writeText?.(text);
    if (!writeText) { fail(); return; }
    writeText.then(() => {
      setCopied(true);
      timerRef.current = setTimeout(() => setCopied(false), resetDelay);
    }).catch(fail);
  }, [resetDelay]);

  return { copied, copy };
}
