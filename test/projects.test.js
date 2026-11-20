import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import test from 'node:test';

const src = new URL('../src/', import.meta.url);
const { projects } = JSON.parse(await readFile(new URL('content/projects.json', src), 'utf8'));

test('excluded repositories never reach the page, its data, or its assets', async () => {
  const all = await readdir(src, { recursive: true });
  const files = all.filter(file => /\.(html|json|tsx?|css)$/.test(file));
  for (const name of all) assert.doesNotMatch(name, /mandy-grad|4mandy/i);
  for (const file of files) {
    assert.doesNotMatch(await readFile(new URL(file.replaceAll('\\', '/'), src), 'utf8'), /mandy-grad|4mandy/i, file);
  }
});

test('private projects publish no links or screenshots', () => {
  for (const project of projects.filter(project => project.visibility === 'private')) {
    assert.equal(project.repository, undefined, project.slug);
    assert.equal(project.demo, undefined, project.slug);
    assert.equal(project.screenshot, undefined, project.slug);
  }
});

test('every previewed chart or screenshot says what it is and exists', async () => {
  const shots = await readdir(new URL('assets/projects/', src));
  for (const { slug, screenshot } of projects.filter(project => project.screenshot)) {
    assert.match(screenshot.caption ?? '', /screenshot|chart/i, slug);
    assert.ok(screenshot.alt?.trim(), `${slug} needs alt text`);
    assert.ok(shots.includes(screenshot.file), `${slug}: ${screenshot.file} is missing`);
  }
});

test('public links are HTTPS without credentials', () => {
  for (const project of projects) {
    for (const link of [project.repository, project.demo].filter(Boolean)) {
      const url = new URL(link);
      assert.equal(url.protocol, 'https:', `${project.slug}: ${link}`);
      assert.equal(url.username + url.password, '', project.slug);
    }
  }
});

test('slugs are unique and URL-safe', () => {
  const slugs = projects.map(project => project.slug);
  assert.equal(new Set(slugs).size, slugs.length);
  for (const slug of slugs) assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
});
