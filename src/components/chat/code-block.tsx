import { useEffect, useState } from "react";

interface CodeBlockProps {
  /** Fenced code language identifier (may be undefined or empty). */
  language: string | undefined;
  /** Raw source code to highlight. */
  code: string;
  /** When true, renders a plain inline <code> tag without shiki. */
  inline?: boolean;
}

/** Normalise the language string coming from react-markdown. */
function normaliseLang(lang: string | undefined): string {
  const trimmed = (lang ?? "").trim().toLowerCase();
  return trimmed === "" ? "text" : trimmed;
}

/** Detect the current colour-scheme theme from the document root. */
function detectTheme(): "github-dark" | "github-light" {
  try {
    return document.documentElement.classList.contains("dark")
      ? "github-dark"
      : "github-light";
  } catch {
    return "github-light";
  }
}

/**
 * CodeBlock renders a fenced code block with shiki syntax highlighting.
 *
 * - Shiki is dynamically imported on first render to avoid bloating the
 *   initial bundle.
 * - A plain `<pre><code>` fallback is displayed while shiki loads or on error.
 * - Inline code is rendered as a plain `<code>` element — shiki is never
 *   invoked for inline spans.
 */
export function CodeBlock({ language, code, inline = false }: CodeBlockProps) {
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  const lang = normaliseLang(language);

  useEffect(() => {
    // Inline code never runs through shiki.
    if (inline) return;

    let cancelled = false;

    async function highlight() {
      try {
        const { codeToHtml } = await import("shiki");
        const html = await codeToHtml(code, {
          lang,
          theme: detectTheme(),
        });
        if (!cancelled) {
          setHighlightedHtml(html);
        }
      } catch {
        // On any error (network, unknown language, etc.) keep the CSS fallback.
        // No state update needed — highlightedHtml stays null.
      }
    }

    highlight();

    return () => {
      cancelled = true;
    };
  }, [code, lang, inline]);

  // Inline code: plain <code> only.
  if (inline) {
    return <code className="inline-code">{code}</code>;
  }

  // Highlighted state: inject the HTML shiki produced.
  if (highlightedHtml !== null) {
    return (
      <div
        className="shiki-wrapper"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is trusted
        dangerouslySetInnerHTML={{ __html: highlightedHtml }}
      />
    );
  }

  // Loading / error fallback: plain pre/code with a language class so a CSS
  // highlighter (e.g. highlight.js theme) can optionally pick it up.
  return (
    <pre>
      <code className={`language-${lang}`}>{code}</code>
    </pre>
  );
}
