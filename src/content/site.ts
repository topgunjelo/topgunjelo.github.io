export const site = {
  fullName: 'Markie Angelo S. Mojica',
  name: 'Markie Mojica',
  displayName: 'MARKIE MOJICA',
  roles: ['Developer.', 'Creator.', 'Digital Forensics Enthusiast.'],
  headline: ['I build what you see.', 'I study what’s hidden.'],
  intro:
    'Frontend developer and Computer Science student specializing in Digital Forensics at National University Manila. I design and build interfaces people enjoy using, and I’m learning how digital evidence is found, preserved and explained.',
  availability: 'Open to internships, freelance development, and collaboration.',
  email: 'markiemojica0@gmail.com',
  phone: '+63 906 315 3609',
  phoneHref: 'tel:+639063153609',
  location: 'Mariveles, Bataan, Philippines',
  github: 'https://github.com/topgunjelo',
  githubHandle: 'topgunjelo',
} as const;

export const sections = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'work', label: 'Projects' },
  { id: 'journey', label: 'Experience' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof sections)[number]['id'];

export const about = {
  statement:
    'I’m a Computer Science student at National University Manila, specializing in Digital Forensics. I enjoy combining technical problem-solving with visual design to build practical, engaging digital experiences.',
  interests: [
    {
      title: 'Frontend development',
      body: 'My strongest focus. Responsive, accessible interfaces in HTML, CSS, JavaScript and React, built from design to deployment.',
      tone: 'blue',
    },
    {
      title: 'Software engineering',
      body: 'Team projects with real workflows: shared repositories, APIs, tests, code review and deployments.',
      tone: 'cyan',
    },
    {
      title: 'Cybersecurity & digital investigation',
      body: 'My specialization. Digital forensics, cybercrime investigation, ethical hacking and digital evidence analysis.',
      tone: 'lavender',
    },
    {
      title: 'Multimedia creativity',
      body: 'Video editing, photo editing, visual design and social media content, alongside the code.',
      tone: 'silver',
    },
  ],
  facts: [
    { label: 'Based in', value: 'Mariveles, Bataan' },
    { label: 'Studying', value: 'BS Computer Science, Digital Forensics' },
    { label: 'Recognition', value: 'Dean’s First Honors List' },
  ],
} as const;
