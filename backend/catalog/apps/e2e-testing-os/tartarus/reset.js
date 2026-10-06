module.exports = {
  run: [
    { method: 'fs.rm', params: { path: '.installed' } },
    { method: 'fs.rm', params: { path: '../node_modules' } },
  ],
};
