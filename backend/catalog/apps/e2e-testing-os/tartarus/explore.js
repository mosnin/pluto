// Lets an agent explore a project's app toward a goal and report what it finds.
module.exports = {
  run: [
    {
      method: 'input',
      params: {
        title: 'Explore an app',
        form: [{
          key: 'goal',
          title: 'Goal',
          description: 'What should the agent try to do? For example: sign up and reach the dashboard.',
          placeholder: 'sign up and reach the dashboard',
          required: true,
        }],
      },
    },
    {
      method: 'local.set',
      params: { goal: '{{input.goal}}' },
    },
    {
      method: 'filepicker.open',
      params: { title: 'Pick the project to explore', type: 'folder' },
    },
    {
      when: '{{input.paths && input.paths.length > 0}}',
      method: 'shell.run',
      params: {
        path: '{{input.paths[0]}}',
        message: 'node "{{cwd}}/../packages/e2e/dist/cli/bin.js" explore {{JSON.stringify(local.goal)}}',
      },
    },
  ],
};
