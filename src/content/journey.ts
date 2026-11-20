export type JourneyKind = 'Education' | 'Experience' | 'Next';

export type JourneyEntry = {
  year: string;
  kind: JourneyKind;
  title: string;
  org: string;
  meta: string;
  body?: string;
  highlights?: string[];
};

/** Chronological, so the story ends on what's next. */
export const journey: JourneyEntry[] = [
  {
    year: '2022',
    kind: 'Education',
    title: 'ICT Technical-Vocational Track',
    org: 'LMI Integrated Formation and Education, Inc.',
    meta: '2022 – 2024',
    highlights: ['Graduated with Highest Honors', 'General Weighted Average 95.69'],
  },
  {
    year: '2024',
    kind: 'Experience',
    title: 'Video Editing & Technical Support',
    org: 'Municipality of Mariveles',
    meta: 'March – April 2024 · 80-hour work immersion',
    body: 'Edited municipal videos with staff, set up multimedia equipment, and provided technical assistance.',
  },
  {
    year: '2024',
    kind: 'Education',
    title: 'BS Computer Science, Digital Forensics',
    org: 'National University — Manila',
    meta: '2024 – 2028 (expected) · Third-year student',
    highlights: ['Dean’s First Honors List'],
  },
  {
    year: '2025',
    kind: 'Experience',
    title: 'Freelance Website Developer',
    org: 'Commissioned work',
    meta: '2025',
    body: 'Built a responsive client website with contact forms, galleries, and basic SEO. Optimized it for mobile and handled content updates.',
  },
  {
    year: '2028',
    kind: 'Next',
    title: 'Graduation, expected',
    org: 'National University — Manila',
    meta: 'BS Computer Science, Digital Forensics',
  },
];

export const credentials = [
  {
    group: 'Honors',
    items: [
      { title: 'Dean’s First Honors List', detail: 'National University — Manila' },
      { title: 'Graduated with Highest Honors', detail: 'LMI Integrated Formation and Education, Inc. · GWA 95.69' },
    ],
  },
  {
    group: 'Microsoft Learn',
    items: [
      {
        title: 'Describe cloud computing',
        detail: 'Training module',
        href: 'https://learn.microsoft.com/en-us/training/modules/describe-cloud-compute/',
      },
      {
        title: 'Describe cloud service types',
        detail: 'Training module',
        href: 'https://learn.microsoft.com/en-us/training/modules/describe-cloud-service-types/',
      },
    ],
  },
  {
    group: 'Academic activities',
    items: [
      { title: 'Integrating Science, Technology, and Mathematics for a Sustainable Planet', detail: 'Activity' },
      { title: 'Transforming Education with Microsoft Opportunities Orientation', detail: 'Orientation' },
      { title: 'Science & Math Lecture Series', detail: 'Lecture series' },
    ],
  },
] as const;
