// Lets an agent explore the project's app and report the bugs it finds.
module.exports = {
  run: [
    {
      method: 'filepicker.open',
      params: { title: 'Pick the project to explore', type: 'folder' },
    },
    {
      when: '{{input.paths && input.paths.length > 0}}',
      method: 'shell.run',
      params: {
        path: '{{input.paths[0]}}',
        message: { _: ['npx', '--no', 'e2e', 'explore'] },
        on: [
          { event: '/error:/i', break: false },
          { event: '/errno /i', break: false },
        ],
      },
    },
  ],
};
