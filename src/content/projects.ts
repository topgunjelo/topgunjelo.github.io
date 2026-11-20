import data from './projects.json';

export type Project = {
  slug: string;
  title: string;
  category: string;
  summary: string;
  technologies: string[];
  contribution: string;
  repository?: string;
  demo?: string;
  badge?: string;
  visibility?: 'private';
  screenshot?: { file: string; alt: string; caption: string };
  sections: { heading: string; body: string }[];
};

export const github: string = data.github;
export const projects = data.projects as Project[];

const images = import.meta.glob<string>('../assets/projects/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
});

export function screenshotUrl(file: string) {
  return images[`../assets/projects/${file}`];
}

export function hostOf(url?: string) {
  if (!url) return undefined;
  return new URL(url).hostname.replace(/^www\./, '');
}

export function bySlug(slug: string) {
  return projects.find(project => project.slug === slug);
}

/** How each public project is staged. The order here is the order on the page. */
export const showcase = [
  { slug: 'angelsam-travel-tours', layout: 'feature' },
  { slug: 'kilosunlad', layout: 'flow' },
  { slug: 'marineatlas', layout: 'pair' },
  { slug: 'network-guardian-ids', layout: 'pair' },
  { slug: 'stockflow-pro', layout: 'split-right' },
] as const;

export const lab = ['noctime', 'aegis-ntfs', 'sponge'] as const;

/** Every project in page order, for the case-study pager and command palette. */
export const pageOrder = [...showcase.map(item => item.slug), ...lab];

/** The KilosUnlad review chain, taken from its summary. */
export const kilosFlow = [
  { step: 'Flag', text: 'A machine learning model and record checks flag households' },
  { step: 'Verify', text: 'A caseworker verifies with a geotagged visit' },
  { step: 'Decide', text: 'A director makes the decision' },
  { step: 'Record', text: 'Each step lands in a tamper-evident audit log' },
];
