// Tartarus app catalog: the portfolio shown on the Explore page.
//
// The catalog lives in backend/catalog/apps.json. Each entry names a git repo
// (and branch) plus, optionally, a Tartarus launcher kept in the catalog
// (catalog/apps/<id>/tartarus). Installing clones the repo into the apps
// folder and, when the repo has no launcher of its own, copies the catalog's
// launcher into <app>/tartarus.

const fs = require("fs")
const path = require("path")

const CATALOG_ROOT = path.resolve(__dirname, "..", "..", "catalog")
const CATALOG_FILE = path.join(CATALOG_ROOT, "apps.json")
const APP_ID_PATTERN = /^[a-z0-9][a-z0-9._-]*$/
// A repo that ships its own Tartarus launcher keeps it. A Pinokio launcher does
// not count: the catalog's Tartarus launcher is installed alongside it and wins.
const LAUNCHER_FILES = ["tartarus.js", "tartarus/tartarus.js"]
const GIT_REF_PATTERN = /^[A-Za-z0-9._\/-]+$/

const exists = (p) => fs.promises.access(p).then(() => true, () => false)

// Same quoting the server uses for git commands: works in bash and cmd.
// Every quoted value is validated against a strict pattern first.
const shellQuote = (value) => JSON.stringify(String(value))

function normalizeApp(entry) {
  if (!entry || typeof entry !== "object") return null
  const id = typeof entry.id === "string" ? entry.id.trim() : ""
  const repo = typeof entry.repo === "string" ? entry.repo.trim() : ""
  if (!APP_ID_PATTERN.test(id) || !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(repo)) return null
  const branch = typeof entry.branch === "string" && GIT_REF_PATTERN.test(entry.branch) ? entry.branch : ""
  const launcher = typeof entry.launcher === "string" ? path.resolve(CATALOG_ROOT, entry.launcher) : ""
  const icon = typeof entry.icon === "string" ? entry.icon : ""
  return {
    id,
    name: typeof entry.name === "string" && entry.name.trim() ? entry.name.trim() : id,
    status: typeof entry.status === "string" ? entry.status : "ready",
    featured: entry.featured === true,
    tagline: typeof entry.tagline === "string" ? entry.tagline : "",
    description: typeof entry.description === "string" ? entry.description : "",
    repo,
    branch,
    private: entry.private === true,
    // Only launchers inside the catalog folder are used.
    launcher: launcher && launcher.startsWith(CATALOG_ROOT + path.sep) ? launcher : "",
    icon: icon && !icon.includes("..") ? `/tartarus/catalog/${icon}` : "",
    category: typeof entry.category === "string" ? entry.category : "",
    tags: Array.isArray(entry.tags) ? entry.tags.filter((tag) => typeof tag === "string") : [],
    platforms: Array.isArray(entry.platforms) ? entry.platforms.filter((p) => typeof p === "string") : [],
    license: typeof entry.license === "string" ? entry.license : "",
  }
}

async function loadCatalog() {
  const raw = JSON.parse(await fs.promises.readFile(CATALOG_FILE, "utf8"))
  const apps = (Array.isArray(raw.apps) ? raw.apps : []).map(normalizeApp).filter(Boolean)
  return {
    name: typeof raw.name === "string" ? raw.name : "Tartarus",
    description: typeof raw.description === "string" ? raw.description : "",
    apps,
  }
}

async function hasOwnTartarusLauncher(appPath) {
  for (const file of LAUNCHER_FILES) {
    if (await exists(path.join(appPath, file))) return true
  }
  return false
}

// The catalog with each app's install state in this Tartarus home.
async function listApps(kernel) {
  const catalog = await loadCatalog()
  const apps = await Promise.all(catalog.apps.map(async (app) => {
    const appPath = kernel.path("api", app.id)
    return { ...app, installed: await exists(appPath) }
  }))
  return { ...catalog, apps }
}

async function installApp(kernel, id, { env = {} } = {}) {
  const catalog = await loadCatalog()
  const app = catalog.apps.find((entry) => entry.id === id)
  if (!app) {
    const error = new Error("That app is not in the Tartarus catalog.")
    error.status = 404
    throw error
  }
  const apiRoot = kernel.path("api")
  const appPath = kernel.path("api", app.id)
  if (await exists(appPath)) {
    const error = new Error(`${app.name} is already installed.`)
    error.status = 409
    throw error
  }
  await fs.promises.mkdir(apiRoot, { recursive: true })
  const branch = app.branch ? ` --branch ${shellQuote(app.branch)}` : ""
  let output = ""
  try {
    await kernel.exec({
      message: [`git clone --depth 1 --single-branch${branch} ${shellQuote(app.repo + ".git")} ${shellQuote(appPath)}`],
      path: apiRoot,
      env,
    }, (stream) => {
      if (stream && typeof stream.raw === "string") output += stream.raw
    })
  } catch (_) {}
  if (!(await exists(path.join(appPath, ".git")))) {
    await fs.promises.rm(appPath, { recursive: true, force: true }).catch(() => {})
    const error = new Error(app.private
      ? `Could not download ${app.name}. It is a private repository: sign in to GitHub, then try again.`
      : `Could not download ${app.name} from ${app.repo}.`)
    error.status = 502
    error.output = output.slice(-2000)
    throw error
  }
  if (app.launcher && !(await hasOwnTartarusLauncher(appPath))) {
    await fs.promises.cp(app.launcher, path.join(appPath, "tartarus"), { recursive: true })
    // Keep the catalog launcher out of the app's git status so updates stay clean.
    const excludeFile = path.join(appPath, ".git", "info", "exclude")
    await fs.promises.mkdir(path.dirname(excludeFile), { recursive: true })
    await fs.promises.appendFile(excludeFile, "\n# Tartarus launcher\n/tartarus/\n")
  }
  return app
}

module.exports = { CATALOG_ROOT, loadCatalog, listApps, installApp }
