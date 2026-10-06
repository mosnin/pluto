// Runs the project's e2e tests and prints the report.
module.exports = {
  run: [
    {
      method: 'filepicker.open',
      params: { title: 'Pick the project whose tests to run', type: 'folder' },
    },
    {
      when: '{{input.paths && input.paths.length > 0}}',
      method: 'shell.run',
      params: {
        path: '{{input.paths[0]}}',
        message: 'node "{{cwd}}/../packages/e2e/dist/cli/bin.js" run',
      },
    },
  ],
};
