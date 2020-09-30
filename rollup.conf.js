const { getRollupPlugins, getRollupExternal, defaultOptions, rollupMinify } = require('@gera2ld/plaid');
const pkg = require('./package.json');

const DIST = defaultOptions.distDir;
const FILENAME = 'index';
const BANNER = `/*! ${pkg.name} v${pkg.version} | ${pkg.license} License */`;

const external = getRollupExternal([
  '@gera2ld/format-json',
  'coc.nvim',
  'json5',
  'vscode-languageserver-types',
]);
const bundleOptions = {
  extend: true,
  esModule: false,
};
const rollupConfig = [
  {
    input: {
      input: 'src/index.ts',
      plugins: getRollupPlugins({
        extensions: defaultOptions.extensions,
      }),
      external,
    },
    output: {
      format: 'cjs',
      file: `${DIST}/${FILENAME}.common.js`,
    },
  },
];

rollupConfig.forEach((item) => {
  item.output = {
    indent: false,
    // If set to false, circular dependencies and live bindings for external imports won't work
    externalLiveBindings: false,
    ...item.output,
    ...BANNER && {
      banner: BANNER,
    },
  };
});

module.exports = rollupConfig.map(({ input, output }) => ({
  ...input,
  output,
}));
