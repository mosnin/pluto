// Tartarus launcher (https://github.com/mosnin/pluto). Install builds the `e2e`
// CLI from this checkout; the menu runs it against a project folder you pick.
// Tartarus loads these CommonJS scripts itself; nothing in the repo imports them.
const PROJECT_SCRIPTS = ['init.js', 'run.js', 'explore.js', 'explore-ux.js', 'login.js'];

module.exports = {
  version: '3.6',
  title: 'E2E Testing OS',
  description: 'Agentic end-to-end testing for web and mobile apps.',
  icon: 'icon.svg',
  menu: async (kernel, info) => {
    const busy = ['install.js', 'update.js', 'reset.js'].find((script) => info.running(script));
    if (busy) {
      const text = { 'install.js': 'Installing', 'update.js': 'Updating', 'reset.js': 'Resetting' }[busy];
      return [{ default: true, icon: 'fa-solid fa-terminal', text, href: busy }];
    }
    // Installed means the CLI was built, so a failed install or update reads as not installed.
    const installed = await kernel.exists(__dirname, '../packages/e2e/dist/cli/bin.js');
    if (!installed) {
      return [{ default: true, icon: 'fa-solid fa-download', text: 'Install', href: 'install.js' }];
    }
    const running = PROJECT_SCRIPTS.filter((script) => info.running(script)).map((script) => ({
      icon: 'fa-solid fa-terminal',
      text: `Terminal: ${script.replace(/\.js$/, '')}`,
      href: script,
    }));
    return [
      ...running,
      { default: running.length === 0, icon: 'fa-solid fa-wand-magic-sparkles', text: 'Set up tests in a project', href: 'init.js' },
      { icon: 'fa-solid fa-play', text: "Run a project's tests", href: 'run.js' },
      { icon: 'fa-solid fa-magnifying-glass', text: 'Explore an app for bugs', href: 'explore.js' },
      { icon: 'fa-solid fa-eye', text: "Review an app's UX", href: 'explore-ux.js' },
      { icon: 'fa-solid fa-right-to-bracket', text: 'Sign in to a model provider', href: 'login.js' },
      { icon: 'fa-solid fa-book-open', text: 'Docs', href: 'https://e2e.tester.army/docs' },
      { icon: 'fa-solid fa-arrows-rotate', text: 'Update', href: 'update.js' },
      { icon: 'fa-solid fa-broom', text: 'Reset', href: 'reset.js' },
    ];
  },
};
