const path = require('path');
console.log(path.resolve(__dirname, 'libs/injections/src/'));

module.exports = {
  webpack: {
    alias: {
      '/': path.resolve(__dirname, 'src/'),
      injections: path.resolve(__dirname, 'src/_libs/injections/src/'),
    },
    plugins: [
      ['babel-plugin-transform-typescript-metadata'],
      ['@babel/plugin-proposal-class-properties', { legacy: true }],
      ['@babel/plugin-proposal-decorators', { loose: true }],
    ],
  },
};
