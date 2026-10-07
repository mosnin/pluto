// Scaffolds e2e in the folder you pick with this checkout's CLI; it offers to install the project's dependencies.
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
        message: { _: ['node', '{{cwd}}/../packages/e2e/dist/cli/bin.js', 'init'] },
        on: [
          { event: '/error:/i', break: false },
          { event: '/errno /i', break: false },
        ],
      },
    },
  ],
};
