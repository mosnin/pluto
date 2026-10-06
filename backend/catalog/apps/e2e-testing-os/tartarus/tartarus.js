// Tartarus launcher for E2E Testing OS (https://github.com/mosnin/e2e-testing-os),
// the agentic end-to-end testing framework. Install builds the `e2e` CLI from
// this checkout; the menu runs it against a project folder you pick.
module.exports = {
  version: '3.6',
  title: 'E2E Testing OS',
  description: 'Agentic end-to-end testing for web and mobile apps.',
  icon: 'icon.svg',
  menu: async (kernel, info) => {
    const installed = await kernel.exists(__dirname, '.installed');
    const busy = ['install.js', 'update.js', 'reset.js'].find((script) => info.running(script));
    if (busy) {
      const text = busy === 'install.js' ? 'Installing' : busy === 'update.js' ? 'Updating' : 'Resetting';
      return [{ default: true, icon: 'fa-solid fa-terminal', text, href: busy }];
    }
    if (!installed) {
      return [{ default: true, icon: 'fa-solid fa-download', text: 'Install', href: 'install.js' }];
    }
    const running = ['init.js', 'run.js', 'explore.js', 'login.js'].find((script) => info.running(script));
    if (running) {
      return [{ default: true, icon: 'fa-solid fa-terminal', text: 'Open terminal', href: running }];
    }
    return [
      { default: true, icon: 'fa-solid fa-wand-magic-sparkles', text: 'Set up tests in a project', href: 'init.js' },
      { icon: 'fa-solid fa-play', text: 'Run a project\'s tests', href: 'run.js' },
      { icon: 'fa-solid fa-magnifying-glass', text: 'Explore an app', href: 'explore.js' },
      { icon: 'fa-solid fa-right-to-bracket', text: 'Sign in to a model provider', href: 'login.js' },
      { icon: 'fa-solid fa-book-open', text: 'Docs', href: 'https://e2e.tester.army/docs' },
      { icon: 'fa-solid fa-arrows-rotate', text: 'Update', href: 'update.js' },
      { icon: 'fa-solid fa-broom', text: 'Reset', href: 'reset.js' },
    ];
  },
};
