import { babel } from "@rollup/plugin-babel";
import commonjs from "@rollup/plugin-commonjs";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import { mkdir, rm, copyFile, writeFile } from "node:fs/promises";
import { rollup } from "rollup";

const distDir = new URL("../dist/", import.meta.url);
const assetsDir = new URL("../dist/assets/", import.meta.url);

function ignoreCss() {
  return {
    name: "ignore-css-imports",
    resolveId(source) {
      if (source.endsWith(".css")) {
        return `\0css:${source}`;
      }
      return null;
    },
    load(id) {
      if (id.startsWith("\0css:")) {
        return "export default {};";
      }
      return null;
    },
  };
}

await rm(distDir, { recursive: true, force: true });
await mkdir(assetsDir, { recursive: true });

const bundle = await rollup({
  input: "src/main.jsx",
  plugins: [
    ignoreCss(),
    nodeResolve({
      browser: true,
      extensions: [".mjs", ".js", ".jsx", ".json"],
    }),
    commonjs(),
    babel({
      babelHelpers: "bundled",
      extensions: [".js", ".jsx"],
      plugins: [["@babel/plugin-transform-react-jsx", { runtime: "automatic" }]],
      exclude: "node_modules/**",
    }),
  ],
});

await bundle.write({
  file: "dist/assets/main.js",
  format: "iife",
  name: "RedBelowCompanion",
  sourcemap: false,
});
await bundle.close();

await copyFile("src/styles.css", "dist/assets/styles.css");
await writeFile(
  "dist/index.html",
  `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="The Red Below DM Companion voor Dungeons & Dragons 5e." />
    <title>The Red Below - DM Companion</title>
    <link rel="stylesheet" href="./assets/styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script src="./assets/main.js"></script>
  </body>
</html>
`,
  "utf8"
);

console.log("Built dist/index.html");
