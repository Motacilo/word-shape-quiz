import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vitest/config";

const env = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env;
const pagesBase = env?.GITHUB_PAGES === "true" ? "/word-shape-quiz/" : "/";

function prefixSiteAssets(base: string): Plugin {
  const prefix = base.endsWith("/") ? base : `${base}/`;
  return {
    name: "prefix-site-assets",
    transform(code, id) {
      if (prefix === "/" || !id.replaceAll("\\", "/").endsWith(".css")) return null;
      const next = code
        .replaceAll('url("/fonts/', `url("${prefix}fonts/`)
        .replaceAll('url("/clouds/', `url("${prefix}clouds/`)
        .replaceAll("url('/fonts/", `url('${prefix}fonts/`)
        .replaceAll("url('/clouds/", `url('${prefix}clouds/`);
      return next === code ? null : next;
    },
  };
}

export default defineConfig({
  base: pagesBase,
  plugins: [react(), prefixSiteAssets(pagesBase)],
  test: {
    environment: "node",
  },
});
