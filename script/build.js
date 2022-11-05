const childProcess = require("child_process");

const fileName = "index";
const outDir = "dist";
const common = {
  entryPoints: [`src/index.ts`],
  bundle: true,
};

require("esbuild").buildSync({
  ...common,
  outfile: `${outDir}/cjs/${fileName}.js`,
  format: "cjs",
});

require("esbuild").buildSync({
  ...common,
  outfile: `${outDir}/esm/${fileName}.js`,
  format: "esm",
});
