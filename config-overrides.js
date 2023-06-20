const path = require('path');
const { useBabelRc, override, addWebpackAlias } = require('customize-cra');

module.exports = override(
  addWebpackAlias({
    ['/']: path.resolve(__dirname, 'src/'),
    ['injections']: path.resolve(__dirname, 'src/_libs/injections/src/'),
  }),
  useBabelRc()
);
