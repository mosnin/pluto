// pnpm 12 is pinned by the repo's packageManager field; npx fetches it.
module.exports = {
  run: [
    {
      method: 'shell.run',
      params: {
        path: '..',
        message: [
          'npx --yes pnpm@12.3.4 install --frozen-lockfile',
          'npx --yes pnpm@12.3.4 run build',
        ],
      },
    },
    {
      method: 'fs.write',
      params: { path: '.installed', text: 'installed' },
    },
  ],
};
