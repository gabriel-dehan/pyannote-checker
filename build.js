const { nodeExternalsPlugin } = require('esbuild-node-externals');

require("esbuild")
  .build({
    entryPoints: ["src/main.ts"],
    bundle: true,
    outfile: "dist/index.js",
    platform: "node",
    plugins: [
      nodeExternalsPlugin({
        dependencies: true,
      }),
    ],
    external: ["cors", "kcors"],
  })
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
