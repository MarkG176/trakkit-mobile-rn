const fs = require("fs");
const path = require("path");

const root = process.cwd();
const componentsDir = path.join(root, "components");
const appDir = path.join(root, "app");

function walk(dir, exts = [".tsx", ".ts", ".jsx", ".js"]) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      out.push(...walk(full, exts));
    } else if (exts.some((e) => entry.name.endsWith(e)) && !entry.name.endsWith(".d.ts")) {
      out.push(full);
    }
  }
  return out;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function rel(p) {
  return toPosix(path.relative(root, p));
}

function moduleKey(fileRel) {
  return fileRel
    .replace(/\.(tsx|ts|jsx|js)$/, "")
    .replace(/\.web$/, "")
    .replace(/\\/g, "/");
}

const componentFiles = walk(componentsDir);
const appFiles = walk(appDir);

const componentKeys = new Map();
for (const f of componentFiles) {
  const r = rel(f);
  const key = moduleKey(r);
  if (!componentKeys.has(key)) componentKeys.set(key, r.replace(/\\/g, "/"));
}

function resolveFile(fromFile, importPath) {
  if (
    !importPath.startsWith("@/") &&
    !importPath.startsWith(".") &&
    !importPath.startsWith("components/")
  ) {
    return null;
  }
  let resolved;
  if (importPath.startsWith("@/")) {
    resolved = path.join(root, importPath.slice(2));
  } else if (importPath.startsWith("components/")) {
    resolved = path.join(root, importPath);
  } else {
    resolved = path.resolve(path.dirname(fromFile), importPath);
  }
  const candidates = [
    resolved,
    resolved + ".tsx",
    resolved + ".ts",
    resolved + ".jsx",
    resolved + ".js",
    path.join(resolved, "index.tsx"),
    path.join(resolved, "index.ts"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) {
      const r = rel(c);
      if (r.startsWith("components/")) return c;
    }
  }
  return null;
}

function parseBarrelExports(fileAbs) {
  const content = fs.readFileSync(fileAbs, "utf8");
  const map = new Map();
  const re = /export\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"]/g;
  let m;
  while ((m = re.exec(content))) {
    const names = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const targetFile = resolveFile(fileAbs, m[2]);
    if (!targetFile) continue;
    const targetKey = moduleKey(rel(targetFile));
    for (const part of names) {
      const [exported, alias] = part.split(/\s+as\s+/).map((s) => s.trim());
      map.set(alias || exported, targetKey);
    }
  }
  return map;
}

const barrelCache = new Map();
function getBarrelMap(fileAbs) {
  if (!barrelCache.has(fileAbs)) barrelCache.set(fileAbs, parseBarrelExports(fileAbs));
  return barrelCache.get(fileAbs);
}

const namedImportRe =
  /import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g;
const defaultImportRe =
  /import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s+from\s+['"]([^'"]+)['"]/g;
const starImportRe =
  /import\s+(?:type\s+)?\*\s+as\s+[A-Za-z_$][\w$]*\s+from\s+['"]([^'"]+)['"]/g;

const usage = new Map();
for (const key of componentKeys.keys()) usage.set(key, new Set());

function markUsed(componentKey, pageRel) {
  if (!usage.has(componentKey)) return;
  usage.get(componentKey).add(pageRel);
}

function addImportUsage(fromFile, importPath, namedExports) {
  const targetFile = resolveFile(fromFile, importPath);
  if (!targetFile) return;
  const pageRel = rel(fromFile).replace(/\\/g, "/");
  const key = moduleKey(rel(targetFile));
  const base = path.basename(targetFile);

  if ((base === "index.ts" || base === "index.tsx") && namedExports && namedExports.length) {
    const barrel = getBarrelMap(targetFile);
    for (const name of namedExports) {
      const target = barrel.get(name);
      if (target) markUsed(target, pageRel);
    }
    // Don't attribute the barrel index itself — attribute concrete modules only
    return;
  }

  markUsed(key, pageRel);
}

function scanAppFile(fromFile) {
  const content = fs.readFileSync(fromFile, "utf8");
  let m;

  namedImportRe.lastIndex = 0;
  while ((m = namedImportRe.exec(content))) {
    const cleaned = m[1]
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^type\s+/, "").split(/\s+as\s+/)[0].trim())
      .filter(Boolean);
    addImportUsage(fromFile, m[2], cleaned);
  }

  defaultImportRe.lastIndex = 0;
  while ((m = defaultImportRe.exec(content))) {
    addImportUsage(fromFile, m[2], null);
  }

  starImportRe.lastIndex = 0;
  while ((m = starImportRe.exec(content))) {
    addImportUsage(fromFile, m[1], null);
  }
}

for (const f of appFiles) {
  scanAppFile(f);
}

function esc(s) {
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

const rows = [["component", "component_path", "pages", "page_count"]];
const sorted = [...componentKeys.entries()].sort((a, b) => a[0].localeCompare(b[0]));

for (const [key, displayPath] of sorted) {
  // Skip barrel index and platform stubs as "components"
  if (key.endsWith("/index")) continue;
  if (/\.web$/.test(displayPath)) continue;

  const pages = [...(usage.get(key) || [])]
    .filter((p) => p.startsWith("app/"))
    .map((p) => p.replace(/\\/g, "/"))
    .sort();
  const uniq = [...new Set(pages)];
  rows.push([
    path.basename(key),
    displayPath,
    uniq.join("; ") || "(not imported by any page)",
    String(uniq.length),
  ]);
}

const csv = rows.map((r) => r.map(esc).join(",")).join("\n") + "\n";
const outPath = path.join(root, "components-pages.csv");
fs.writeFileSync(outPath, csv, "utf8");

console.log("Wrote", outPath);
console.log("Rows:", rows.length - 1);
