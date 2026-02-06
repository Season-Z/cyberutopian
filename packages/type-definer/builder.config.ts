import path from 'path';

export default {
  entry: './src/index.ts',
  formats: ['cjs'],
  libName: 'type-definer',
  fileName: 'index',
  vite: {
    resolve: {
      alias: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
    },
  },
};
