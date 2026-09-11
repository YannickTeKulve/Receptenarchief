import { lstat, mkdir, mkdtemp, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { basename, dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const PUBLIC_FIELDS = [
  'titel', 'bron', 'porties', 'bereidingstijd_minuten', 'keuken', 'tags', 'toegevoegd_op', 'afbeelding',
];

function isInside(path, root) {
  return path === root || path.startsWith(`${root}${sep}`);
}

function parseRecipe(raw, filename) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error(`${filename}: geldige YAML-frontmatter ontbreekt`);
  const metadata = parse(match[1]) ?? {};
  const body = match[2].replace(/^\s+/, '').trimEnd();
  if (/<\s*\/?\s*(?:script|iframe|object|embed|style|link|meta|form)\b|\bon[a-z]+\s*=|javascript\s*:/i.test(body)) {
    throw new Error(`${filename}: onveilige HTML in recepttekst`);
  }
  if (!metadata.titel || typeof metadata.titel !== 'string') throw new Error(`${filename}: titel ontbreekt`);
  if (!metadata.bron || typeof metadata.bron !== 'string') throw new Error(`${filename}: bron ontbreekt`);
  let source;
  try { source = new URL(metadata.bron); } catch { throw new Error(`${filename}: bron is geen geldige URL`); }
  if (!['http:', 'https:'].includes(source.protocol)) throw new Error(`${filename}: bron moet HTTP(S) gebruiken`);
  if (!/^##\s+Ingrediënten\s*$/im.test(body)) throw new Error(`${filename}: Ingrediënten-sectie ontbreekt`);
  if (!/^##\s+Bereiding\s*$/im.test(body)) throw new Error(`${filename}: Bereiding-sectie ontbreekt`);

  const publicMetadata = {};
  for (const field of PUBLIC_FIELDS) {
    if (metadata[field] !== undefined && metadata[field] !== null) publicMetadata[field] = metadata[field];
  }
  for (const field of ['porties', 'bereidingstijd_minuten']) {
    const value = publicMetadata[field];
    if (value === undefined || value === null || value === '') {
      publicMetadata[field] = 0;
      continue;
    }
    const numeric = typeof value === 'number' ? value : Number(value);
    if (!Number.isInteger(numeric) || numeric < 0) throw new Error(`${filename}: ${field} moet een niet-negatief geheel getal zijn`);
    publicMetadata[field] = numeric;
  }
  if (publicMetadata.toegevoegd_op instanceof Date) {
    publicMetadata.toegevoegd_op = publicMetadata.toegevoegd_op.toISOString().slice(0, 10);
  }
  const frontmatter = stringify(publicMetadata, { lineWidth: 0 }).trimEnd();
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

async function generatedSnapshot(sourceRoot) {
  const entries = (await readdir(sourceRoot, { withFileTypes: true }))
    .filter((entry) => extname(entry.name).toLowerCase() === '.md' && entry.name !== 'index.md')
    .sort((a, b) => a.name.localeCompare(b.name, 'nl'));
  const files = new Map();
  for (const entry of entries) {
    const path = join(sourceRoot, entry.name);
    const stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error(`${entry.name}: symbolische link is niet toegestaan`);
    if (!stat.isFile()) continue;
    files.set(entry.name, parseRecipe(await readFile(path, 'utf8'), entry.name));
  }
  if (files.size === 0) throw new Error('Geen geldige recepten gevonden; bestaande uitvoer blijft behouden');
  return files;
}

async function currentSnapshot(destinationRoot) {
  const files = new Map();
  try {
    for (const name of (await readdir(destinationRoot)).filter((name) => name.endsWith('.md')).sort()) {
      files.set(name, await readFile(join(destinationRoot, name), 'utf8'));
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return files;
}

function snapshotsEqual(left, right) {
  if (left.size !== right.size) return false;
  return [...left].every(([name, content]) => right.get(name) === content);
}

export async function syncRecipes({ source, destination, check = false }) {
  const sourceRoot = resolve(source);
  const destinationRoot = resolve(destination);
  if (isInside(destinationRoot, sourceRoot) || isInside(sourceRoot, destinationRoot)) {
    throw new Error('Bron en bestemming mogen niet in elkaar liggen');
  }
  const output = await generatedSnapshot(sourceRoot);
  if (check) {
    const current = await currentSnapshot(destinationRoot);
    if (!snapshotsEqual(output, current)) throw new Error('Website-recepten zijn niet gelijk aan de canonieke bron');
    return { count: output.size, changed: false };
  }

  const parent = dirname(destinationRoot);
  await mkdir(parent, { recursive: true });
  const staging = await mkdtemp(join(parent, '.recepten-sync-'));
  for (const [name, content] of output) await writeFile(join(staging, basename(name)), content, 'utf8');

  const backup = `${destinationRoot}.backup-${randomUUID()}`;
  let hadDestination = false;
  try {
    try {
      await rename(destinationRoot, backup);
      hadDestination = true;
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    await rename(staging, destinationRoot);
    if (hadDestination) await rm(backup, { recursive: true, force: true });
  } catch (error) {
    await rm(staging, { recursive: true, force: true });
    if (hadDestination) {
      await rm(destinationRoot, { recursive: true, force: true });
      await rename(backup, destinationRoot);
    }
    throw error;
  }
  return { count: output.size, changed: true };
}

function parseArgs(argv) {
  const options = {
    source: process.env.RECIPE_SOURCE_DIR || resolve(process.cwd(), '../personal-hub/recepten'),
    destination: resolve(process.cwd(), 'src/content/recepten'),
    check: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--check') options.check = true;
    else if (arg === '--source') options.source = argv[++index];
    else if (arg === '--destination') options.destination = argv[++index];
    else throw new Error(`Onbekende optie: ${arg}`);
  }
  if (!options.source || !options.destination) throw new Error('Bron en bestemming zijn verplicht');
  return options;
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath === fileURLToPath(import.meta.url)) {
  try {
    const result = await syncRecipes(parseArgs(process.argv.slice(2)));
    console.log(`${result.count} recepten ${result.changed ? 'gesynchroniseerd' : 'gecontroleerd'}.`);
  } catch (error) {
    console.error(`FOUT: ${error.message}`);
    process.exitCode = 1;
  }
}
