// node scripts/generate.mjs <papirus-theme-dir> <out-dir>
//
// Emits one react-native-svg module per entry of icons.json. Papirus carries its
// paint in `style="fill:#5294e2"` and its symbolic colour in a `<style>` block,
// neither of which react-native-svg reads, so both are flattened into props here.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";

const [theme, out] = process.argv.slice(2);

if (!theme || !out) {
  console.error("usage: generate.mjs <papirus-theme-dir> <out-dir>");
  process.exit(1);
}

const TAGS = {
  path: "Path",
  rect: "Rect",
  circle: "Circle",
  ellipse: "Ellipse",
  line: "Line",
  polygon: "Polygon",
  polyline: "Polyline",
  g: "G",
  defs: "Defs",
  linearGradient: "LinearGradient",
  radialGradient: "RadialGradient",
  stop: "Stop",
  clipPath: "ClipPath",
  mask: "Mask",
  pattern: "Pattern",
  symbol: "Symbol",
  use: "Use",
};

/** Carry no paint, or carry it in a form react-native-svg cannot use. */
const DROP_TAGS = new Set(["style", "metadata", "title", "desc", "namedview", "script", "switch", "foreignObject"]);

/** Meaningless once emptied — `<defs>` usually held nothing but the `<style>`. */
const CONTAINER_TAGS = new Set(["Defs", "G", "ClipPath", "Mask", "Pattern", "Symbol"]);

const DROP_ATTRS = new Set(["class", "version", "style", "requiredFeatures", "systemLanguage"]);

const camel = (name) => name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());

/** Splits `<tag a="1" b="2"/>` respecting quotes, which `d` and `style` need. */
const parse = (xml) => {
  const root = { tag: "#root", attrs: {}, children: [] };
  const stack = [root];
  let i = 0;

  while (i < xml.length) {
    const lt = xml.indexOf("<", i);

    if (lt === -1) {
      break;
    }

    if (xml.startsWith("<!--", lt)) {
      i = xml.indexOf("-->", lt) + 3;
      continue;
    }

    if (xml.startsWith("<?", lt) || xml.startsWith("<!", lt)) {
      i = xml.indexOf(">", lt) + 1;
      continue;
    }

    let gt = lt + 1;
    let quote = null;

    while (gt < xml.length) {
      const c = xml[gt];

      if (quote) {
        if (c === quote) {
          quote = null;
        }
      } else if (c === '"' || c === "'") {
        quote = c;
      } else if (c === ">") {
        break;
      }

      gt++;
    }

    const raw = xml.slice(lt + 1, gt);
    i = gt + 1;

    if (raw.startsWith("/")) {
      stack.pop();
      continue;
    }

    const selfClosing = raw.endsWith("/");
    const body = selfClosing ? raw.slice(0, -1) : raw;
    const tag = body.match(/^[^\s]+/)[0];
    const attrs = {};

    for (const [, name, dq, sq] of body.slice(tag.length).matchAll(/([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) {
      attrs[name] = dq ?? sq;
    }

    const node = { tag, attrs, children: [] };

    stack.at(-1).children.push(node);

    if (!selfClosing) {
      stack.push(node);
    }
  }

  return root;
};

const props = (attrs) => {
  const result = {};

  for (const [name, value] of Object.entries(attrs)) {
    if (DROP_ATTRS.has(name) || name === "xmlns" || name.includes(":")) {
      continue;
    }

    result[camel(name)] = value;
  }

  // Inline `style` last so it wins over a same-named attribute, as CSS does.
  for (const decl of (attrs.style ?? "").split(";")) {
    const [name, ...rest] = decl.split(":");

    if (rest.length === 0) {
      continue;
    }

    result[camel(name.trim())] = rest.join(":").trim();
  }

  return result;
};

const convert = (node) =>
  node.children.flatMap((child) => {
    if (DROP_TAGS.has(child.tag) || child.tag.includes(":")) {
      return [];
    }

    const tag = TAGS[child.tag];

    if (!tag) {
      console.warn(`  unsupported <${child.tag}>, dropped`);

      return [];
    }

    const children = convert(child);

    if (children.length === 0 && CONTAINER_TAGS.has(tag)) {
      return [];
    }

    return [children.length > 0 ? [tag, props(child.attrs), children] : [tag, props(child.attrs)]];
  });

const size = (attrs) => {
  const [w, h] = attrs.viewBox ? attrs.viewBox.trim().split(/[\s,]+/).slice(2) : [attrs.width, attrs.height];

  if (w !== h) {
    throw new Error(`not square (${w}x${h})`);
  }

  return Number(w);
};

const manifest = JSON.parse(readFileSync(join(import.meta.dirname, "..", "icons.json"), "utf8"));
const names = new Map();

mkdirSync(out, { recursive: true });

for (const entry of manifest) {
  const name = basename(entry, ".svg");

  if (names.has(name)) {
    throw new Error(`${entry} and ${names.get(name)} both export '${name}'`);
  }

  names.set(name, entry);

  const svg = parse(readFileSync(join(theme, entry), "utf8")).children.find((node) => node.tag === "svg");

  if (!svg) {
    throw new Error(`${entry}: no <svg> root`);
  }

  const nodes = convert(svg);
  const body = nodes.map((node) => `  ${JSON.stringify(node)},`).join("\n");

  writeFileSync(
    join(out, `${name}.ts`),
    `// Generated from Papirus ${entry} — do not edit.\n`
      + `import { createPapirusIcon } from "../createPapirusIcon";\n\n`
      + `export default createPapirusIcon(${JSON.stringify(name)}, ${size(svg.attrs)}, [\n${body}\n]);\n`,
  );
}

// A listing, not a barrel: importing it would defeat the per-icon modules on
// Metro, which does not tree-shake.
writeFileSync(
  join(out, "..", "icon-names.ts"),
  `// Generated — do not edit.\n`
    + `export type PapirusIconName =\n`
    + [...names.keys()].sort().map((name) => `  | ${JSON.stringify(name)}`).join("\n")
    + `;\n`,
);

console.log(`wrote ${names.size} icons to ${out}`);

// Guard against a stale manifest leaving orphans behind in a dirty out dir.
for (const file of readdirSync(out)) {
  if (!names.has(basename(file, ".ts"))) {
    console.warn(`  stale ${join(out, file)}`);
  }
}
