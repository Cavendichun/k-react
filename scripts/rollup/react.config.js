import { getPackageJson, resolvePackagePath, getBaseRollupPlugins } from './utils';
import rollupPluginGeneratePackageJson from 'rollup-plugin-generate-package-json';

const { name, module } = getPackageJson('react');
// react包的路径
const packagePath = resolvePackagePath(name);
// react产物路径
const packageDistPath = resolvePackagePath(name, true);

export default [
  // react
  {
    input: `${packagePath}/${module}`,
    output: {
      file: `${packageDistPath}/index.js`,
      name: 'index.js',
      format: 'umd',
    },
    plugins: [
      ...getBaseRollupPlugins(),
      rollupPluginGeneratePackageJson({
        inputFolder: packagePath,
        outputFolder: packageDistPath,
        baseContents: ({ name, description, version }) => {
          return {
            name,
            description,
            version,
            main: 'index.js',
          };
        },
      }),
    ],
  },
  // jsx-runtime
  {
    input: `${packagePath}/src/jsx.ts`,
    output: [
      // jsx-runtime
      {
        file: `${packageDistPath}/jsx-runtime.js`,
        name: 'jsx-runtime.js',
        format: 'umd',
      },
      // jsx-dev-runtime
      {
        file: `${packageDistPath}/jsx-dev-runtime.js`,
        name: 'jsx-dev-runtime.js',
        format: 'umd',
      },
    ],
    plugins: getBaseRollupPlugins(),
  },
];
