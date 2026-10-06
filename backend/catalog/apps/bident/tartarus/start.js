module.exports = {
  daemon: true,
  run: [
    {
      method: 'shell.run',
      params: {
        path: '..',
        env: {
          HOST: '127.0.0.1',
          PORT: '{{port}}',
          PINOKIO_SHARE_CLOUDFLARE: 'false',
          PINOKIO_SHARE_LOCAL: 'false',
          PINOKIO_SHARE_VAR: '__gev_sharing_disabled__',
        },
        message: 'node scripts/pinokio-start.mjs',
        on: [{
          // Bident prints this line once its local server is up.
          event: '/\\[Pinokio\\] Ready at (http:\\/\\/127\\.0\\.0\\.1:[0-9]+\\/)/',
          done: true,
        }],
      },
    },
    {
      method: 'local.set',
      params: { url: '{{input.event[1]}}' },
    },
  ],
};
