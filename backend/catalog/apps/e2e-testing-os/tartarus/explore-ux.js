// Lets an agent review the project's app as a first-time user and score its UX.
module.exports = {
  run: [
    {
      method: 'filepicker.open',
      params: { title: 'Pick the project to review', type: 'folder' },
    },
    {
      when: '{{input.paths && input.paths.length > 0}}',
      method: 'shell.run',
      params: {
        path: '{{input.paths[0]}}',
        message: { _: ['npx', '--no', 'e2e', 'explore', '--lens', 'ux'] },
        on: [
          { event: '/error:/i', break: false },
          { event: '/errno /i', break: false },
        ],
      },
    },
  ],
};
