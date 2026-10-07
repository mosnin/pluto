// Installs and builds only the e2e package and what it depends on. pnpm 12 is
// pinned by the repo's packageManager field; npx fetches it.
module.exports = {
  run: [
    {
      method: 'shell.run',
      params: {
        path: '..',
        message: [
          { _: ['npx', '--yes', 'pnpm@12.3.4', 'install', '--frozen-lockfile', '--filter', 'e2e...'] },
          { _: ['npx', '--yes', 'pnpm@12.3.4', '--filter', 'e2e', 'run', 'build'] },
        ],
      },
    },
  ],
};
