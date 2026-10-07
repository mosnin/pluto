const assert = require('node:assert/strict')
const fs = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const test = require('node:test')
const { execFileSync } = require('node:child_process')

const Api = require('../kernel/api')
const Loader = require('../kernel/loader')
const Catalog = require('../server/lib/tartarus_catalog')

const tempHome = async () => fs.mkdtemp(path.join(os.tmpdir(), 'tartarus-apps-'))

const writeFile = async (file, text) => {
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, text)
}

const fakeKernel = (home, { clone = 'ok' } = {}) => {
  const commands = []
  return {
    commands,
    path: (...parts) => path.join(home, ...parts),
    // Stands in for `git clone`: the last quoted argument is the target folder.
    exec: async ({ message }) => {
      commands.push(message[0])
      if (clone !== 'ok') return
      const target = JSON.parse(message[0].match(/("[^"]+")$/)[1])
      await fs.mkdir(path.join(target, '.git', 'info'), { recursive: true })
      await fs.writeFile(path.join(target, 'README.md'), '# app\n')
    },
  }
}

test('the launcher prefers tartarus/tartarus.js over a Pinokio launcher', async () => {
  const home = await tempHome()
  const app = path.join(home, 'api', 'demo')
  await writeFile(path.join(app, 'pinokio', 'pinokio.js'), 'module.exports = { title: "Pinokio" }')
  await writeFile(path.join(app, 'tartarus', 'tartarus.js'), 'module.exports = { title: "Tartarus" }')
  const api = new Api({ path: (...parts) => path.join(home, ...parts), loader: new Loader() })

  const launcher = await api.launcher('demo')
  assert.equal(launcher.script.title, 'Tartarus')
  assert.equal(launcher.launcher_root, 'tartarus')
  assert.equal(await api.launcher_path('demo'), path.join(app, 'tartarus'))
  assert.equal(await api.launcher_file(path.join(app, 'tartarus')), path.join(app, 'tartarus', 'tartarus.js'))
})

test('a root tartarus.js is found, and Pinokio launchers still load', async () => {
  const home = await tempHome()
  await writeFile(path.join(home, 'api', 'root-app', 'tartarus.js'), 'module.exports = { title: "Root" }')
  await writeFile(path.join(home, 'api', 'old-app', 'pinokio.js'), 'module.exports = { title: "Old" }')
  const api = new Api({ path: (...parts) => path.join(home, ...parts), loader: new Loader() })

  const root = await api.launcher('root-app')
  assert.equal(root.script.title, 'Root')
  assert.equal(root.launcher_root, '')
  const old = await api.launcher('old-app')
  assert.equal(old.script.title, 'Old')
  assert.equal((await api.launcher('missing')).script, undefined)
})

test('every catalog app has a valid repo, launcher and icon', async () => {
  const catalog = await Catalog.loadCatalog()
  const raw = JSON.parse(await fs.readFile(path.join(Catalog.CATALOG_ROOT, 'apps.json'), 'utf8'))
  assert.equal(catalog.apps.length, raw.apps.length, 'every entry passes validation')
  assert.deepEqual(catalog.apps.map((app) => app.id), ['bident', 'e2e-testing-os'])
  for (const app of catalog.apps) {
    const launcher = require(path.join(app.launcher, 'tartarus.js'))
    assert.equal(typeof launcher.menu, 'function', `${app.id} launcher has a menu`)
    for (const file of ['install.js', 'update.js', 'reset.js']) {
      assert.ok(require(path.join(app.launcher, file)).run, `${app.id}/${file} has run steps`)
    }
    const icon = path.join(Catalog.CATALOG_ROOT, app.icon.replace('/tartarus/catalog/', ''))
    await fs.access(icon)
  }
  // Bident's main branch is the unmodified upstream project; install its default branch.
  assert.equal(catalog.apps.find((app) => app.id === 'bident').branch, '')
  const e2e = catalog.apps.find((app) => app.id === 'e2e-testing-os')
  assert.equal(e2e.branch, 'agent-coverage-and-ux')
  assert.equal(e2e.private, true)
})

test('installing clones the branch and adds the catalog launcher outside git status', async () => {
  const home = await tempHome()
  const kernel = fakeKernel(home)

  const app = await Catalog.installApp(kernel, 'e2e-testing-os')
  assert.equal(app.id, 'e2e-testing-os')
  assert.match(kernel.commands[0], /^git clone --depth 1 --single-branch --branch "agent-coverage-and-ux" "https:\/\/github\.com\/mosnin\/e2e-testing-os\.git" /)
  const appPath = path.join(home, 'api', 'e2e-testing-os')
  await fs.access(path.join(appPath, 'tartarus', 'tartarus.js'))
  assert.match(await fs.readFile(path.join(appPath, '.git', 'info', 'exclude'), 'utf8'), /^\/tartarus\/$/m)

  const listed = await Catalog.listApps(kernel)
  assert.equal(listed.apps.find((entry) => entry.id === 'e2e-testing-os').installed, true)
  assert.equal(listed.apps.find((entry) => entry.id === 'bident').installed, false)

  await assert.rejects(Catalog.installApp(kernel, 'e2e-testing-os'), { status: 409 })
  await assert.rejects(Catalog.installApp(kernel, 'not-in-catalog'), { status: 404 })
})

test('a repo that ships its own Tartarus launcher keeps it', async () => {
  const home = await tempHome()
  const kernel = fakeKernel(home)
  const exec = kernel.exec
  kernel.exec = async (params) => {
    await exec(params)
    await writeFile(path.join(home, 'api', 'bident', 'tartarus', 'tartarus.js'), 'module.exports = { title: "Own" }')
  }
  await Catalog.installApp(kernel, 'bident')
  const own = await fs.readFile(path.join(home, 'api', 'bident', 'tartarus', 'tartarus.js'), 'utf8')
  assert.match(own, /Own/)
})

test('a failed clone leaves nothing behind and names private repos', async () => {
  const home = await tempHome()
  const kernel = fakeKernel(home, { clone: 'fail' })
  await assert.rejects(Catalog.installApp(kernel, 'e2e-testing-os'), (error) => {
    assert.equal(error.status, 502)
    assert.match(error.message, /private repository/)
    return true
  })
  await assert.rejects(fs.access(path.join(home, 'api', 'e2e-testing-os')))
})

test('launcher menus follow the install state', async () => {
  const info = (running = []) => ({ running: (script) => running.includes(script), local: () => null })
  const kernelWith = (installed) => ({ exists: async () => installed })

  const bident = require(path.join(Catalog.CATALOG_ROOT, 'apps', 'bident', 'tartarus', 'tartarus.js'))
  assert.equal((await bident.menu(kernelWith(false), info()))[0].href, 'install.js')
  assert.equal((await bident.menu(kernelWith(true), info()))[0].href, 'start.js')
  assert.equal((await bident.menu(kernelWith(true), info(['update.js'])))[0].text, 'Updating')

  const e2e = require(path.join(Catalog.CATALOG_ROOT, 'apps', 'e2e-testing-os', 'tartarus', 'tartarus.js'))
  assert.equal((await e2e.menu(kernelWith(false), info()))[0].href, 'install.js')
  const ready = await e2e.menu(kernelWith(true), info())
  assert.deepEqual(ready.map((item) => item.href).slice(0, 5), ['init.js', 'run.js', 'explore.js', 'explore-ux.js', 'login.js'])
  // A running project command adds its terminal link and keeps the rest of the menu.
  const running = await e2e.menu(kernelWith(true), info(['run.js']))
  assert.equal(running[0].href, 'run.js')
  assert.equal(running.filter((item) => item.default).length, 0)
  assert.ok(running.some((item) => item.href === 'update.js'))
})

test('catalog launcher scripts are valid CommonJS', () => {
  for (const id of ['bident', 'e2e-testing-os']) {
    const dir = path.join(Catalog.CATALOG_ROOT, 'apps', id, 'tartarus')
    execFileSync(process.execPath, ['-e', `for (const f of require('fs').readdirSync(${JSON.stringify(dir)}).filter((f) => f.endsWith('.js'))) require(require('path').join(${JSON.stringify(dir)}, f))`])
  }
})
