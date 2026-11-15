// Genera src/app/styles/tokens.css a partir de design/tokens.json.
// Uso: npm run tokens
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = new URL("../", import.meta.url);
const tokens = JSON.parse(readFileSync(new URL("design/tokens.json", root), "utf8"));
const out = fileURLToPath(new URL("src/app/styles/tokens.css", root));

// "{brand-cream}" → "var(--brand-cream)"
const resolve = (v) => String(v).replace(/^\{([\w-]+)\}$/, "var(--$1)");
const themed = (t) => typeof t.value === "object" && t.value !== null;

const colorAndShadow = [...tokens.color.tokens, ...tokens.shadow.tokens];
const plain = [...tokens.spacing.tokens, ...tokens.radius.tokens];

const decl = (t, theme, indent) =>
  `${indent}--${t.name}: ${resolve(themed(t) ? t.value[theme] : t.value)};`;

const lightBody = [
  "  color-scheme: light;",
  ...colorAndShadow.map((t) => decl(t, "light", "  ")),
  ...plain.map((t) => decl(t, "light", "  ")),
].join("\n");

const darkLines = (indent) =>
  [`${indent}color-scheme: dark;`, ...colorAndShadow.filter(themed).map((t) => decl(t, "dark", indent))].join("\n");

const css = `/* Ñami — tokens generados desde design/tokens.json. No editar a mano: cambia tokens.json y regenera. */
:root {
${lightBody}
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
${darkLines("    ")}
  }
}

:root[data-theme="dark"] {
${darkLines("  ")}
}
`;

writeFileSync(out, css);
console.log(`tokens.css generado (${colorAndShadow.length + plain.length} tokens)`);
