module.exports = {
  run: [
    {
      when: "{{!kernel.exists(cwd, 'ENVIRONMENT')}}",
      method: 'fs.copy',
      params: { src: '_ENVIRONMENT', dest: 'ENVIRONMENT' },
    },
    {
      // Bident reads provider keys from its own pinokio/ENVIRONMENT.
      when: "{{!kernel.exists(cwd, '../pinokio/ENVIRONMENT')}}",
      method: 'fs.copy',
      params: { src: '../pinokio/_ENVIRONMENT', dest: '../pinokio/ENVIRONMENT' },
    },
    {
      method: 'shell.run',
      params: { path: '..', message: 'node scripts/pinokio-install.mjs' },
    },
  ],
};
