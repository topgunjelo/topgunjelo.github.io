import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build as bundle } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = join(root, 'src');
export const dist = join(root, 'dist');

const assets = [
  'assets/manrope.woff2', 'assets/manrope-LICENSE.txt',
  'assets/barlow-800.woff2', 'assets/barlow-LICENSE.txt',
  'assets/ink-smoke.webp', 'assets/mark.svg',
];

const licenses = [
  ['react-bits', 'src/components/LICENSE.react-bits.md'],
  ['react', 'node_modules/react/LICENSE'],
  ['react-dom', 'node_modules/react-dom/LICENSE'],
  ['scheduler', 'node_modules/scheduler/LICENSE'],
  ['lenis', 'node_modules/lenis/LICENSE'],
];

async function browserFiles() {
  const { outputFiles } = await bundle({
    absWorkingDir: root,
    entryPoints: ['src/main.js'],
    outdir: dist,
    chunkNames: 'chunks/[name]-[hash]',
    bundle: true,
    splitting: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    jsx: 'automatic',
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: true,
    legalComments: 'eof',
    write: false,
  });

  return outputFiles.map(file => [relative(dist, file.path), file.contents]);
}

const nav = [
  ['about', 'About'], ['expertise', 'Expertise'], ['work', 'Work'], ['experience', 'Experience'],
];

function html(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function external(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error(`Expected a public HTTPS link for ${url.hostname}`);
  }
  return html(url.href);
}

function fill(template, values) {
  return template.replace(/<!-- ([A-Z]+) -->/g, (marker, key) => (
    Object.hasOwn(values, key) ? values[key] : marker
  ));
}

function header() {
  const links = nav.map(([id, label]) => `<a href="#${id}">${label}</a>`).join('\n');

  return `<header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="#home">
        <span class="brand-mark" aria-hidden="true">MM<span>.</span></span>
        <span class="brand-name">Markie Mojica</span>
      </a>
      <nav class="desktop-nav" aria-label="Main navigation">${links}</nav>
      <a class="header-contact" href="#contact">Contact <span aria-hidden="true">↗</span></a>
      <details class="mobile-menu">
        <summary>Menu</summary>
        <nav class="mobile-nav" aria-label="Main navigation">${links}<a href="#contact">Contact</a></nav>
      </details>
    </div>
  </header>`;
}

function footer(github) {
  return `<footer class="site-footer">
    <div class="container footer-inner">
      <p>© ${new Date().getUTCFullYear()} Markie Angelo S. Mojica</p>
      <div class="footer-controls">
        <button class="footer-replay" id="replay-opening" type="button" hidden>Replay intro <span aria-hidden="true">↺</span></button>
        <a href="${external(github)}">GitHub <span aria-hidden="true">↗</span></a>
        <a href="#top">Back to top <span aria-hidden="true">↑</span></a>
      </div>
    </div>
  </footer>`;
}

function tags(project) {
  return `<ul class="skill-tags" aria-label="Technologies">${project.technologies.map(tag => `<li>${html(tag)}</li>`).join('')}</ul>`;
}

function projectLinks(project) {
  const repository = project.repository
    ? `<a class="text-link" href="${external(project.repository)}">Repository <span aria-hidden="true">↗</span></a>`
    : '';
  const demo = project.demo
    ? `<a class="text-link" href="${external(project.demo)}">Live site <span aria-hidden="true">↗</span></a>`
    : '';
  return `${repository}\n${demo}`;
}

function projectMedia(project, number) {
  const screenshot = project.screenshot;
  const visual = screenshot
    ? `<img src="assets/${html(screenshot.file)}" alt="${html(screenshot.alt)}" width="1200" height="750" loading="lazy" decoding="async">`
    : `<div class="project-title-card" aria-hidden="true"><span>${html(project.title)}</span></div>`;
  return `<figure class="project-frame">
    <div class="project-visual" data-bat-reveal>
      ${visual}
      <div data-react-bits aria-hidden="true"></div>
    </div>
    <figcaption><span>${number} / ${html(project.category)}</span><span>${screenshot ? html(screenshot.caption || 'Project preview') : 'Title card'}</span></figcaption>
  </figure>`;
}

function projectScene(project, index) {
  const number = String(index + 1).padStart(2, '0');
  const slug = project.slug;
  const links = projectLinks(project).trim();
  const notes = project.sections.map(({ heading, body }) => `<div class="project-note" data-motion="panel">
    <h4>${html(heading)}</h4><p>${html(body)}</p>
  </div>`).join('\n');
  return `<article class="project project-scene" id="project-${slug}" data-project-scene data-bat-section="${html(project.title)}" aria-labelledby="title-${slug}">
    ${projectMedia(project, number)}
    <div class="project-copy">
      <div class="project-introduction" data-motion="panel">
        <p class="project-meta">${number} / ${project.visibility === 'private' ? 'Private collaboration' : html(project.category)}</p>
        <h3 id="title-${slug}">${html(project.title)}</h3>
        <p class="project-summary">${html(project.summary)}</p>
        ${tags(project)}
        ${links ? `<div class="project-links">${links}</div>` : ''}
      </div>
      <div class="project-note" data-motion="panel"><h4>My role</h4><p>${html(project.contribution)}</p></div>
      ${notes}
    </div>
  </article>`;
}

async function cleanOutput() {
  try {
    const info = await lstat(dist);
    if (info.isSymbolicLink() || relative(await realpath(root), await realpath(dist)) !== 'dist') {
      throw new Error(`Expected the project output directory at ${dist}`);
    }
    await rm(dist, { recursive: true });
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await mkdir(dist, { recursive: true });
}

export async function build() {
  const load = file => readFile(join(src, file), 'utf8');
  const [index, expertise, profile, data] = await Promise.all([
    load('index.html'), load('expertise.html'), load('profile.html'), load('projects.json'),
  ]);
  const { github, projects } = JSON.parse(data);
  const slugs = new Set();
  const screenshots = new Set();
  for (const { slug, screenshot } of projects) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug)) {
      throw new Error(`Invalid or duplicate project slug: ${slug}`);
    }
    slugs.add(slug);
    if (screenshot) {
      if (!/^[a-z0-9][a-z0-9-]*\.webp$/.test(screenshot.file) || !screenshot.alt?.trim()) {
        throw new Error(`Expected a WebP screenshot with alternative text for ${slug}`);
      }
      screenshots.add(`assets/${screenshot.file}`);
    }
  }

  const page = ['index.html', fill(index, {
    HEADER: header(),
    FOOTER: footer(github),
    EXPERTISE: expertise,
    PROJECTS: projects.map(projectScene).join('\n'),
    PROFILE: profile,
    GITHUB: external(github),
  })];

  const [files, scripts, notices, lenisStyles, portfolioStyles] = await Promise.all([
    Promise.all([...assets, ...screenshots].map(async file => [file, await readFile(join(src, file))])),
    browserFiles(),
    Promise.all(licenses.map(async ([name, file]) => [
      `assets/licenses/${name}.txt`, await readFile(join(root, file)),
    ])),
    readFile(join(root, 'node_modules/lenis/dist/lenis.css'), 'utf8'),
    load('styles.css'),
  ]);
  files.push(['styles.css', `${lenisStyles}\n${portfolioStyles}`]);
  await cleanOutput();
  await Promise.all([...files, ...scripts, ...notices, page].map(async ([file, contents]) => {
    const output = join(dist, file);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, contents);
  }));
  console.log('Built the one-page portfolio in dist.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}

