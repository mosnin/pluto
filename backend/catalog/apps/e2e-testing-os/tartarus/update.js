module.exports = {
  run: [
    {
      method: 'shell.run',
      params: {
        path: '..',
        message: [
          'git pull --ff-only',
          'npx --yes pnpm@12.3.4 install --frozen-lockfile',
          'npx --yes pnpm@12.3.4 run build',
        ],
      },
    },
  ],
};
