// Writes an e2e config and an example test into the folder you pick.
module.exports = {
  run: [
    {
      method: 'filepicker.open',
      params: { title: 'Pick the project to add end-to-end tests to', type: 'folder' },
    },
    {
      when: '{{input.paths && input.paths.length > 0}}',
      method: 'shell.run',
      params: {
        path: '{{input.paths[0]}}',
        message: 'node "{{cwd}}/../packages/e2e/dist/cli/bin.js" init',
      },
    },
  ],
};
