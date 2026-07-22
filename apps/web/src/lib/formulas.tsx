import katex from "katex";

/**
 * Server-tauglicher KaTeX-Renderer für die Methodik-Seite.
 *
 * Sicherheitshinweis zu dangerouslySetInnerHTML: KaTeX' `renderToString` liefert
 * statisches, von KaTeX selbst erzeugtes HTML/MathML — es ist keine Übernahme
 * von Nutzereingaben. Alle `tex`-Strings, die dieser Komponente übergeben werden,
 * sind AUSSCHLIESSLICH unsere eigenen, im Quellcode fest verdrahteten Konstanten
 * (siehe apps/web/src/app/methodik/page.tsx) — niemals Formulareingaben,
 * URL-Parameter oder sonstige Nutzerdaten. Unter dieser Voraussetzung ist das
 * Einsetzen von KaTeX-Output via dangerouslySetInnerHTML der von KaTeX selbst
 * empfohlene Weg (kein Client-JS nötig, funktioniert in Server-Komponenten).
 */

export function Formula({ tex, display = false }: { tex: string; display?: boolean }) {
  const html = katex.renderToString(tex, {
    throwOnError: false,
    displayMode: display,
    strict: "warn",
  });

  if (display) {
    return (
      <div
        style={{ margin: "14px 0", overflowX: "auto", textAlign: "center" }}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return (
    <span
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
