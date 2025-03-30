import {
  getPackageJson,
  resolvePackagePath,
  getBaseRollupPlugins,
} from './utils';
import rollupPluginGeneratePackageJson from 'rollup-plugin-generate-package-json';
import alias from '@rollup/plugin-alias';

const { name, module, peerDependencies } = getPackageJson('react-dom');
// react包的路径
const packagePath = resolvePackagePath(name);
// react产物路径
const packageDistPath = resolvePackagePath(name, true);

export default [
  // react
  {
    input: `${packagePath}/${module}`,
    output: [
      {
        file: `${packageDistPath}/index.js`,
        name: 'index.js',
        format: 'umd',
      },
      {
        file: `${packageDistPath}/client.js`,
        name: 'client.js',
        format: 'umd',
      },
    ],
    externals: [...Object.keys(peerDependencies)],
    plugins: [
      ...getBaseRollupPlugins(),
      alias({
        entries: {
          hostConfig: `${packagePath}/src/hostConfig.ts`,
        },
      }),
      rollupPluginGeneratePackageJson({
        inputFolder: packagePath,
        outputFolder: packageDistPath,
        baseContents: ({ name, description, version }) => {
          return {
            name,
            description,
            version,
            peerDependencies: {
              react: version,
            },
            main: 'index.js',
          };
        },
      }),
    ],
  },
];
