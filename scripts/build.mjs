import { lstat, mkdir, readFile, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const src = join(root, 'src');
export const dist = join(root, 'dist');

const assets = [
  'styles.css', 'main.js', 'opening.js', 'bats.js',
  'assets/barlow-800.woff2', 'assets/barlow-LICENSE.txt',
  'assets/manrope.woff2', 'assets/manrope-LICENSE.txt',
  'assets/smoke.webp', 'assets/mark.svg', 'assets/flock.svg',
];

const nav = [
  ['home', 'Home'], ['about', 'About'], ['work', 'Work'],
  ['expertise', 'Expertise'], ['experience', 'Experience'], ['contact', 'Contact'],
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
      <a class="brand" href="${prefix}#home" aria-label="Markie Mojica, home">
        <span class="brand-mark"><img src="${prefix}assets/mark.svg" alt="" width="34" height="34"></span>
        <span class="brand-name">Markie <strong>Mojica</strong></span>
      </a>
      <nav class="desktop-nav" aria-label="Main navigation">${links}</nav>
      <a class="header-contact" href="${prefix}#contact">Get in touch <span aria-hidden="true">↗</span></a>
      <details class="mobile-menu">
        <summary>Menu</summary>
        <nav class="mobile-nav" aria-label="Main navigation">${links}</nav>
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

function projectCard(project, index) {
  const number = String(index + 1).padStart(2, '0');
  const slug = project.slug;
  return `<article class="project" ${index > 0 ? 'data-bat-section="Project reveal"' : ''} aria-labelledby="project-${slug}">
    <div class="project-visual" data-bat-reveal aria-hidden="true">
      <span class="project-number">${number}</span>
      <span class="project-visual-label">Case file ${number}</span>
      <span class="project-caption">${html(project.category)}</span>
    </div>
    <div class="project-copy">
      <p class="project-category">${html(project.category)}</p>
      <h3 id="project-${slug}">${html(project.title)}</h3>
      <p>${html(project.summary)}</p>
      ${tags(project)}
      <div class="project-links">
        <a class="button button--primary" href="cases/${slug}/" data-case-link aria-label="Read the ${html(project.title)} case study">Case study <span aria-hidden="true">↗</span></a>
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
      <p class="section-kicker"><span>${number}</span><span class="kicker-line"></span> ${html(project.category)}</p>
      <h1 id="case-title">${html(project.title)}</h1>
      <p class="case-summary">${html(project.summary)}</p>
      ${tags(project)}
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
  for (const { slug } of projects) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug)) {
      throw new Error(`Invalid or duplicate project slug: ${slug}`);
    }
    slugs.add(slug);
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

  const files = await Promise.all(assets.map(async file => [file, await readFile(join(src, file))]));
  await cleanOutput();
  await Promise.all([...files, ...pages].map(async ([file, contents]) => {
    const output = join(dist, file);
    await mkdir(dirname(output), { recursive: true });
    await writeFile(output, contents);
  }));
  console.log(`Built ${pages.length} pages in dist.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await build();
}

