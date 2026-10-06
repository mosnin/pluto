// Tartarus launcher for Bident (https://github.com/mosnin/Bident).
// Bident's own setup scripts keep their state in its pinokio/ folder
// (pinokio/.installed, pinokio/ENVIRONMENT), so this launcher reads that.
module.exports = {
  version: '3.6',
  title: 'Bident',
  description: 'A live 3D intelligence console for planet Earth.',
  icon: 'icon.png',
  menu: async (kernel, info) => {
    const installed = await kernel.exists(__dirname, '../pinokio/.installed');
    const installing = info.running('install.js');
    const starting = info.running('start.js');
    const updating = info.running('update.js');
    const resetting = info.running('reset.js');

    if (installing || updating || resetting) {
      const href = installing ? 'install.js' : updating ? 'update.js' : 'reset.js';
      const text = installing ? 'Installing' : updating ? 'Updating' : 'Repairing';
      return [{ default: true, icon: 'fa-solid fa-terminal', text, href }];
    }

    if (!installed) {
      return [{ default: true, icon: 'fa-solid fa-download', text: 'Install', href: 'install.js' }];
    }

    if (starting) {
      const local = info.local('start.js');
      if (local?.url) {
        return [
          { default: true, icon: 'fa-solid fa-earth-americas', text: 'Open Bident', href: local.url },
          { icon: 'fa-solid fa-terminal', text: 'Server', href: 'start.js' },
        ];
      }
      return [{ default: true, icon: 'fa-solid fa-terminal', text: 'Starting', href: 'start.js' }];
    }

    return [
      { default: true, icon: 'fa-solid fa-power-off', text: 'Start', href: 'start.js' },
      { icon: 'fa-solid fa-arrows-rotate', text: 'Update', href: 'update.js' },
      { icon: 'fa-solid fa-broom', text: 'Repair installation', href: 'reset.js' },
    ];
  },
};
