import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { build as bundle } from 'esbuild';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = join(root, 'src');
export const dist = join(root, 'dist');

const assets = [
  'assets/manrope.woff2', 'assets/manrope-LICENSE.txt',
  'assets/smoke.webp', 'assets/mark.svg',
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
  ['work', 'Work'], ['about', 'About'], ['expertise', 'Expertise'], ['experience', 'Experience'],
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

function header(prefix) {
  const links = nav.map(([id, label]) => `<a href="${prefix}#${id}">${label}</a>`).join('\n');

  return `<header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="${prefix}#home">
        <span class="brand-mark" aria-hidden="true">MM<span>.</span></span>
        <span class="brand-name">Markie Mojica</span>
      </a>
      <nav class="desktop-nav" aria-label="Main navigation">${links}</nav>
      <a class="header-contact" href="${prefix}#contact">Contact <span aria-hidden="true">↗</span></a>
      <details class="mobile-menu">
        <summary>Menu</summary>
        <nav class="mobile-nav" aria-label="Main navigation">${links}<a href="${prefix}#contact">Contact</a></nav>
      </details>
    </div>
  </header>`;
}

function footer(github, replay = false) {
  return `<footer class="site-footer">
    <div class="container footer-inner">
      <p>© ${new Date().getUTCFullYear()} Markie Angelo S. Mojica</p>
      <div class="footer-controls">
        ${replay ? '<button class="footer-replay" id="replay-opening" type="button" hidden>Replay intro <span aria-hidden="true">↺</span></button>' : ''}
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
  const repository = `<a class="text-link" href="${external(project.repository)}">Repository <span aria-hidden="true">↗</span></a>`;
  const demo = project.demo
    ? `<a class="text-link" href="${external(project.demo)}">Live site <span aria-hidden="true">↗</span></a>`
    : '';
  return `${repository}\n${demo}`;
}

function projectMedia(project, prefix = '', decorate = false) {
  if (!project.screenshot) return '';
  const { file, alt } = project.screenshot;
  return `<figure class="project-visual" ${decorate ? 'data-bat-reveal' : ''}>
    <img src="${prefix}assets/${html(file)}" alt="${html(alt)}" width="1200" height="750" loading="${decorate ? 'lazy' : 'eager'}" decoding="async">
    ${decorate ? '<div data-react-bits aria-hidden="true"></div>' : ''}
  </figure>`;
}

function projectCard(project, index) {
  const number = String(index + 1).padStart(2, '0');
  const slug = project.slug;
  return `<article class="project" aria-labelledby="project-${slug}">
    <div class="project-meta"><span>${number} / ${html(project.category)}</span><span>Live project</span></div>
    ${projectMedia(project, '', true)}
    <div class="project-copy">
      <h3 id="project-${slug}">${html(project.title)}</h3>
      <p>${html(project.summary)}</p>
      ${tags(project)}
      <div class="project-links">
        <a class="button button--outline" href="cases/${slug}/" data-case-link aria-label="Read the ${html(project.title)} case study">Case study <span aria-hidden="true">↗</span></a>
        ${projectLinks(project)}
      </div>
    </div>
  </article>`;
}

function caseStudy(project, index) {
  const number = String(index + 1).padStart(2, '0');
  const sections = project.sections.map((section, sectionIndex) => `<section class="case-entry" aria-labelledby="evidence-${sectionIndex}">
    <h2 id="evidence-${sectionIndex}">${html(section.heading)}</h2>
    <p>${html(section.body)}</p>
  </section>`).join('\n');

  return `<section class="section case-hero" data-bat-section="Case File ${number}" aria-labelledby="case-title">
    <div class="container">
      <a class="text-link case-back" href="../../#work"><span aria-hidden="true">←</span> Selected work</a>
      <div class="case-grid">
        <div>
          <p class="project-meta">${number} / ${html(project.category)}</p>
          <h1 id="case-title">${html(project.title)}</h1>
          <p class="case-summary">${html(project.summary)}</p>
          ${tags(project)}
        </div>
        ${projectMedia(project, '../../')}
      </div>
    </div>
  </section>
  <div class="container case-body">
    <section class="case-entry" aria-labelledby="contribution">
      <h2 id="contribution">My contribution</h2>
      <div>
        <p>${html(project.contribution)}</p>
        <div class="case-links">${projectLinks(project)}</div>
      </div>
    </section>
    <div class="case-evidence">${sections}</div>
  </div>`;
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
  const [index, caseTemplate, profile, data] = await Promise.all([
    load('index.html'), load('case.html'), load('profile.html'), load('projects.json'),
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

  const pages = [['index.html', fill(index, {
    HEADER: header(''),
    FOOTER: footer(github, true),
    PROJECTS: projects.map(projectCard).join('\n'),
    PROFILE: profile,
    GITHUB: external(github),
  })]];

  for (const [index, project] of projects.entries()) {
    pages.push([`cases/${project.slug}/index.html`, fill(caseTemplate, {
      HEADER: header('../../'),
      FOOTER: footer(github),
      SUMMARY: html(project.summary),
      TITLE: html(project.title),
      CASE: caseStudy(project, index),
    })]);
  }

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
  await Promise.all([...files, ...scripts, ...notices, ...pages].map(async ([file, contents]) => {
    const output = join(dist, file);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, contents);
  }));
  console.log(`Built ${pages.length} pages in dist.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}

