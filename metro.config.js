// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prioritaskan CJS untuk menghindari error import.meta dari mjs (khususnya Firebase web),
// tetapi pertahankan 'mjs' di urutan terakhir agar modul yang mengekspos impor ekstensi eksplisit (seperti ./postinstall.mjs) tetap dapat di-resolve.
config.resolver.sourceExts = [
  'cjs',
  ...config.resolver.sourceExts.filter(ext => ext !== 'mjs' && ext !== 'cjs'),
  'mjs'
];

module.exports = config;
