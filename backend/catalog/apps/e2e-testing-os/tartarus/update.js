module.exports = {
  run: [
    {
      method: 'shell.run',
      params: {
        path: '..',
        message: [
          'git pull --ff-only',
          { _: ['npx', '--yes', 'pnpm@12.3.4', 'install', '--frozen-lockfile', '--filter', 'e2e...'] },
          { _: ['npx', '--yes', 'pnpm@12.3.4', '--filter', 'e2e', 'run', 'build'] },
        ],
      },
    },
  ],
};
