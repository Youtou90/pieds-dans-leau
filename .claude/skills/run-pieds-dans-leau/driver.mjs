#!/usr/bin/env node
// Headless driver for this static site. Serves the repo root on a local port,
// opens Chromium via Playwright, then runs one command per line from stdin.
//   node .claude/skills/run-pieds-dans-leau/driver.mjs [--mobile] [--offline] < script.txt
// Commands: nav <path> | click <sel> | fill <sel> <text> | press <key>
//           wait <sel> | text <sel> | eval <js> | shot [name] | view [name] | shotel <sel> [name]
//           errors | sleep <ms>
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const require = createRequire(import.meta.url);
let playwright;
try { playwright = require("playwright"); }
catch { playwright = require(path.join(execSync("npm root -g").toString().trim(), "playwright")); }

const args = process.argv.slice(2);
const mobile = args.includes("--mobile");
const offline = args.includes("--offline"); // block Supabase so contenu.js fallback is used
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../..");
const shots = process.env.SHOTS || "/tmp/shots";
fs.mkdirSync(shots, { recursive: true });

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".svg": "image/svg+xml", ".mp4": "video/mp4", ".ico": "image/x-icon" };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split("?")[0]);
  if (p.endsWith("/")) p += "index.html";
  let f = path.join(root, p);
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  // Vercel-style clean URLs: /admin -> admin.html
  if (!fs.existsSync(f) && fs.existsSync(f + ".html")) f += ".html";
  fs.readFile(f, (err, data) => {
    if (err) { res.writeHead(404); return res.end("404"); }
    res.writeHead(200, { "content-type": types[path.extname(f)] || "application/octet-stream" });
    res.end(data);
  });
});
await new Promise(r => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await playwright.chromium.launch({ args: ["--no-sandbox"] });
const ctx = await browser.newContext(mobile
  ? { ...playwright.devices["iPhone 13"], reducedMotion: "reduce" }
  : { viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
// reducedMotion: .revele blocks otherwise stay opacity:0 until scrolled into view, leaving blank bands in full-page shots
const page = await ctx.newPage();
page.setDefaultTimeout(8000);
const errors = [];
page.on("console", m => { if (m.type() === "error" || m.type() === "warning") errors.push(`${m.type()}: ${m.text()}`); });
page.on("pageerror", e => errors.push(`pageerror: ${e.message}`));
// popups (target=_blank / window.open) start at about:blank; log once they have navigated
page.on("popup", p => p.waitForLoadState("domcontentloaded").catch(() => {}).then(() => console.log(`popup: ${p.url()}`)));
if (offline) await ctx.route(/supabase\.co/, r => r.abort());
// admin.html loads supabase-js from jsdelivr; serve a local npm copy if present (see SKILL.md)
const sbUmd = process.env.SUPABASE_UMD || "/tmp/supabase-js/package/dist/umd/supabase.js";
if (fs.existsSync(sbUmd)) await ctx.route(/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js/,
  r => r.fulfill({ contentType: "text/javascript", body: fs.readFileSync(sbUmd) }));
// Never really reach WhatsApp: answer with a stub so the popup keeps its real URL (the order text)
await ctx.route(/(wa\.me|whatsapp\.com)/, r => r.fulfill({ contentType: "text/html", body: "whatsapp stub" }));

let n = 0;
async function run(line) {
  const [cmd, ...rest] = line.trim().split(/\s+/);
  const arg = line.trim().slice(cmd.length).trim();
  switch (cmd) {
    case "nav": await page.goto(base + (arg || "/"), { waitUntil: "networkidle" }); return `at ${page.url()}`;
    case "click": await page.click(arg); return "ok";
    case "fill": await page.fill(rest[0], rest.slice(1).join(" ")); return "ok";
    case "press": await page.keyboard.press(arg); return "ok";
    case "wait": await page.waitForSelector(arg, { timeout: 10000 }); return "ok";
    case "text": return (await page.locator(arg).first().innerText()).trim();
    case "eval": return JSON.stringify(await page.evaluate(arg));
    case "sleep": await page.waitForTimeout(+arg); return "ok";
    case "shot": { const f = path.join(shots, `${arg || String(++n).padStart(2, "0")}.png`); await page.screenshot({ path: f, fullPage: true }); return f; }
    case "view": { const f = path.join(shots, `${arg || String(++n).padStart(2, "0")}.png`); await page.screenshot({ path: f }); return f; }
    case "shotel": { const f = path.join(shots, `${rest[1] || "el-" + ++n}.png`); await page.locator(rest[0]).first().screenshot({ path: f }); return f; }
    case "errors": { const out = errors.length ? errors.join("\n") : "(none)"; errors.length = 0; return out; }
    default: return `unknown command: ${cmd}`;
  }
}

console.log(`serving ${root} at ${base}${mobile ? " (mobile)" : ""}${offline ? " (offline)" : ""}`);
const rl = readline.createInterface({ input: process.stdin, terminal: false });
for await (const line of rl) {
  if (!line.trim() || line.trim().startsWith("#")) continue;
  try { console.log(`> ${line.trim()}\n${await run(line)}`); }
  catch (e) { console.log(`> ${line.trim()}\nERROR ${e.message.split("\n")[0]}`); }
}
await browser.close();
server.close();
