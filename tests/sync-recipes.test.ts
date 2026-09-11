import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { syncRecipes } from '../scripts/sync-recipes.mjs';

const roots: string[] = [];
const recipe = (extra = '') => `---\ntitel: Testrecept\nbron: https://example.com/test\nporties: 2\nbereidingstijd_minuten: 20\nkeuken: Test\ntags: [snel]\ntoegevoegd_op: 2026-09-11\nprivé: geheim\n---\n\n# Testrecept\n\n## Ingrediënten\n\n- één ding\n\n## Bereiding\n\n1. Maak het.\n${extra}`;

async function workspace() {
  const root = await mkdtemp(join(tmpdir(), 'receptenarchief-'));
  roots.push(root);
  const source = join(root, 'source');
  const destination = join(root, 'destination');
  await mkdir(source);
  return { root, source, destination };
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

describe('syncRecipes', () => {
  it('copies valid recipes deterministically, strips unknown metadata, and ignores index.md', async () => {
    const { source, destination } = await workspace();
    await writeFile(join(source, 'z-recept.md'), recipe());
    await writeFile(join(source, 'index.md'), '# Index');

    const result = await syncRecipes({ source, destination });
    expect(result.count).toBe(1);
    expect(await readdir(destination)).toEqual(['z-recept.md']);
    const output = await readFile(join(destination, 'z-recept.md'), 'utf8');
    expect(output).toContain('titel: Testrecept');
    expect(output).not.toContain('privé:');
  });

  it('normalizes empty numeric metadata to zero', async () => {
    const { source, destination } = await workspace();
    await writeFile(join(source, 'test.md'), recipe().replace('porties: 2', 'porties: ""'));
    await syncRecipes({ source, destination });
    const output = await readFile(join(destination, 'test.md'), 'utf8');
    expect(output).toContain('porties: 0');
  });

  it('rejects recipes without required sections before replacing output', async () => {
    const { source, destination } = await workspace();
    await mkdir(destination);
    await writeFile(join(destination, 'existing.md'), 'keep me');
    await writeFile(join(source, 'broken.md'), recipe().replace('## Bereiding', '## Anders'));

    await expect(syncRecipes({ source, destination })).rejects.toThrow('Bereiding');
    expect(await readFile(join(destination, 'existing.md'), 'utf8')).toBe('keep me');
  });

  it('rejects symlinks in the source directory', async () => {
    const { root, source, destination } = await workspace();
    const outside = join(root, 'outside.md');
    await writeFile(outside, recipe());
    await symlink(outside, join(source, 'linked.md'));
    await expect(syncRecipes({ source, destination })).rejects.toThrow(/symbolische link/i);
  });

  it('rejects executable HTML in recipe bodies', async () => {
    const { source, destination } = await workspace();
    await writeFile(join(source, 'onveilig.md'), `---\ntitel: Onveilig\nbron: https://example.com\nporties: 1\nbereidingstijd_minuten: 5\nkeuken: Test\ntags: []\ntoegevoegd_op: 2026-09-11\n---\n## Ingrediënten\n\n<script>alert('xss')</script>\n\n## Bereiding\n\n1. Niet uitvoeren.\n`);
    await expect(syncRecipes({ source, destination })).rejects.toThrow(/onveilige html/i);
  });

  it('check mode detects drift without writing', async () => {
    const { source, destination } = await workspace();
    await writeFile(join(source, 'test.md'), recipe());
    await mkdir(destination);
    await writeFile(join(destination, 'test.md'), 'stale');

    await expect(syncRecipes({ source, destination, check: true })).rejects.toThrow('niet gelijk');
    expect(await readFile(join(destination, 'test.md'), 'utf8')).toBe('stale');
  });
});
