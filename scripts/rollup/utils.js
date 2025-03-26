import path from 'path';
import fs from 'fs';
import ts from 'rollup-plugin-typescript2';
import cjs from '@rollup/plugin-commonjs';

const packagePath = path.resolve(process.cwd(), 'packages');
const distPath = path.resolve(process.cwd(), 'dist/node_modules');

export function resolvePackagePath(name, isDist) {
  if (isDist) {
    return `${distPath}/${name}`;
  }
  return `${packagePath}/${name}`;
}

export function getPackageJson(name) {
  const path = `${resolvePackagePath(name)}/package.json`;
  const str = fs.readFileSync(path, { encoding: 'utf-8' });
  return JSON.parse(str);
}

export function getBaseRollupPlugins({ typescript = {} } = {}) {
  return [cjs(), ts(typescript)];
}
