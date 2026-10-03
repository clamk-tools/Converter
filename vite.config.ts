import react from "@vitejs/plugin-react";
import type { Plugin } from "vite";
import { defineConfig } from "vitest/config";

// What the built page may load, and from where: its own files only (no CDN, no analytics). GitHub Pages sets no
// header, so the policy is a <meta> tag written at build time. No inline script: the theme script is a file
// (public/theme.js). The dev server runs without the policy, because its hot reload needs an inline script.
const POLICY = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "font-src 'self'",
  "img-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join("; ");

function contentSecurityPolicy(): Plugin {
  return {
    name: "content-security-policy",
    apply: "build",
    transformIndexHtml: () => [{ tag: "meta", attrs: { "http-equiv": "Content-Security-Policy", content: POLICY }, injectTo: "head-prepend" }],
  };
}

export default defineConfig({
  base: "./", // relative asset paths: the site works under any repository name on GitHub Pages
  appType: "mpa", // one static page, no routes
  plugins: [react(), contentSecurityPolicy()],
  server: { port: 5184, strictPort: true }, // its own port, beside the other Clamk tools' dev servers
  test: { include: ["src/**/*.test.ts"] },
});
