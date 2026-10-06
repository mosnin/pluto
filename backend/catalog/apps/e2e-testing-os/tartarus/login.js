// Signs in to a ChatGPT, GitHub Copilot or SuperGrok subscription for agent steps.
module.exports = {
  run: [
    {
      method: 'shell.run',
      params: { path: '..', message: 'node packages/e2e/dist/cli/bin.js login' },
    },
  ],
};
