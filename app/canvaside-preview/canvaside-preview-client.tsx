"use client";

import { useEffect } from "react";
import PostingSignalApp from "@/components/posting-signal-app";

const canvasideOrigins = new Set(["http://localhost:4173", "http://127.0.0.1:4173"]);

const matchingStyleRules = (element: HTMLElement) => {
  const matches: Array<{ selector: string; media: string; declarations: Record<string, string> }> = [];
  const visit = (rules: CSSRuleList, media = "base") => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule && element.matches(rule.selectorText)) {
        matches.push({
          selector: rule.selectorText,
          media,
          declarations: Object.fromEntries(Array.from(rule.style).map((property) => [property, rule.style.getPropertyValue(property).trim()])),
        });
      } else if (rule instanceof CSSMediaRule && window.matchMedia(rule.conditionText).matches) {
        visit(rule.cssRules, rule.conditionText);
      }
    }
  };

  for (const sheet of Array.from(document.styleSheets)) {
    try { visit(sheet.cssRules); } catch { /* Cross-origin stylesheets are intentionally ignored. */ }
  }
  return matches;
};

const elementPath = (element: HTMLElement) => {
  const parts: string[] = [];
  let current: HTMLElement | null = element;

  while (current && current !== document.body) {
    const parentElement: HTMLElement | null = current.parentElement;
    const siblings: HTMLElement[] = parentElement
      ? Array.from(parentElement.children).filter((item): item is HTMLElement => item instanceof HTMLElement && item.tagName === current?.tagName)
      : [];
    const suffix = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(current) + 1})` : "";
    parts.unshift(`${current.tagName.toLowerCase()}${suffix}`);
    current = parentElement;
  }

  return parts.join(" > ");
};

export default function CanvasidePreviewClient() {
  useEffect(() => {
    const parentOrigin = document.referrer ? new URL(document.referrer).origin : "";
    if (!canvasideOrigins.has(parentOrigin)) return;

    let selected: HTMLElement | null = null;
    const selectElement = (event: MouseEvent) => {
      const target = event.target instanceof HTMLElement ? event.target : null;
      if (!target) return;

      event.preventDefault();
      event.stopPropagation();
      selected?.classList.remove("canvaside-selected-element");
      selected = target;
      selected.classList.add("canvaside-selected-element");
      const computed = getComputedStyle(target);

      window.parent.postMessage({
        type: "canvaside:element-selected",
        element: {
          tagName: target.tagName.toLowerCase(),
          text: target.innerText?.trim().slice(0, 240) || target.getAttribute("aria-label") || "",
          role: target.getAttribute("role"),
          className: target.className,
          domPath: elementPath(target),
          sourceFile: "components/posting-signal-app.jsx",
          attributes: {
            src: target.getAttribute("src"),
            alt: target.getAttribute("alt"),
            href: target.getAttribute("href"),
          },
          computedStyles: {
            display: computed.display,
            width: computed.width,
            maxWidth: computed.maxWidth,
            height: computed.height,
            fontFamily: computed.fontFamily,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            lineHeight: computed.lineHeight,
            letterSpacing: computed.letterSpacing,
            marginTop: computed.marginTop,
            marginRight: computed.marginRight,
            marginBottom: computed.marginBottom,
            marginLeft: computed.marginLeft,
            paddingTop: computed.paddingTop,
            paddingRight: computed.paddingRight,
            paddingBottom: computed.paddingBottom,
            paddingLeft: computed.paddingLeft,
          },
          styleRules: matchingStyleRules(target),
        },
      }, parentOrigin);
    };

    document.addEventListener("click", selectElement, true);
    return () => document.removeEventListener("click", selectElement, true);
  }, []);

  return <PostingSignalApp previewMode />;
}
