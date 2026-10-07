// Removes the build and installed dependencies; Install rebuilds them.
module.exports = {
  run: [
    { method: 'fs.rm', params: { path: '../packages/e2e/dist' } },
    { method: 'fs.rm', params: { path: '../packages/e2e/node_modules' } },
    { method: 'fs.rm', params: { path: '../node_modules' } },
  ],
};
