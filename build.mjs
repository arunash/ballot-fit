// node build.mjs [election]  ->  dist/index.html (one self-contained file, no network calls)
import fs from "node:fs";
const el = process.argv[2] || "ca-2026-11", d = `data/${el}`;
const html = fs.readFileSync("src/template.html", "utf8")
  .replace("/*DATA*/", `const MEASURES=${fs.readFileSync(`${d}/measures.json`, "utf8")};\nconst OFFICES=${fs.readFileSync(`${d}/offices.json`, "utf8")};`)
  .replace("/*RULES*/", fs.readFileSync(`${d}/rules.js`, "utf8"))
  .replace("/*ENGINE*/", fs.readFileSync("src/engine.js", "utf8"));
fs.mkdirSync("dist", { recursive: true });
fs.writeFileSync("dist/index.html", html);
console.log(`built dist/index.html for ${el} (${(html.length / 1024).toFixed(0)} KB)`);
