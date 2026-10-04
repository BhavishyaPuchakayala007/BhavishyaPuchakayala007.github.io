import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// The router's code splitter writes each route file's full path into generated
// code inside single quotes, so an apostrophe anywhere in the project's path
// (like "Bhavishya's_Portfolio") breaks every page. In a folder like that,
// keep each route in one piece instead; anywhere else, split as usual.
const pathBreaksSplitter = process.cwd().includes("'");

// For hosts that only serve files (GitHub Pages): STATIC_SITE=1 renders every
// page to plain HTML at build time, so no server is needed. BASE_PATH is the
// sub-folder the site lives in when it isn't at the root of its domain
// ("/my-repo" for a GitHub project site; leave unset for a custom domain or a
// username.github.io repo). The Pages workflow sets both.
const staticSite = process.env["STATIC_SITE"] === "1";
const basePath = (process.env["BASE_PATH"] ?? "").replace(/\/+$/, "");

export default defineConfig({
  base: `${basePath}/`,
  // lets the pages know they were built as plain files (no Vercel behind them)
  define: { "import.meta.env.VITE_STATIC_SITE": JSON.stringify(staticSite ? "1" : "") },
  plugins: [
    tsConfigPaths(),
    tailwindcss(),
    // src/server.ts wraps the SSR handler so server errors keep their stack.
    tanstackStart({
      server: { entry: "server" },
      ...(pathBreaksSplitter ? { router: { codeSplittingOptions: { defaultBehavior: [] } } } : {}),
      ...(staticSite ? { prerender: { enabled: true, crawlLinks: true, failOnError: true }, pages: [{ path: "/" }, { path: "/work" }] } : {}),
    }),
    nitro(),
    viteReact(),
  ],
  resolve: { dedupe: ["react", "react-dom", "@tanstack/react-router", "@tanstack/react-start"] },
});
