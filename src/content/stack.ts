export type StackCategory = 'development' | 'design' | 'tools';

export type Tech = {
  id: string;
  name: string;
  category: StackCategory;
  /** Brand color, used only for the hover glow. */
  color: string;
  note: string;
  /** Depth in the constellation, 0.3 (far) – 1 (near). */
  depth: number;
};

export const categories: { id: 'all' | StackCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'development', label: 'Development' },
  { id: 'design', label: 'Design' },
  { id: 'tools', label: 'Tools' },
];

export const categoryLabel: Record<StackCategory, string> = {
  development: 'Development',
  design: 'Design & creative',
  tools: 'Tools & productivity',
};

export const stack: Tech[] = [
  { id: 'html5', name: 'HTML5', category: 'development', color: '#E34F26', depth: 0.9, note: 'Semantic, accessible structure for every page I build.' },
  { id: 'css3', name: 'CSS3', category: 'development', color: '#1572B6', depth: 0.6, note: 'Layout, responsive systems and motion.' },
  { id: 'javascript', name: 'JavaScript', category: 'development', color: '#F0DB4F', depth: 1, note: 'My everyday language for interactivity in the browser.' },
  { id: 'react', name: 'React', category: 'development', color: '#61DAFB', depth: 0.7, note: 'Component interfaces for my client site and team projects.' },
  { id: 'tailwindcss', name: 'Tailwind CSS', category: 'development', color: '#38BDF8', depth: 0.45, note: 'Utility-first styling in team builds.' },
  { id: 'python', name: 'Python', category: 'development', color: '#3776AB', depth: 0.85, note: 'Coursework, scripting and the inference bridge in Network Guardian.' },
  { id: 'java', name: 'Java', category: 'development', color: '#E76F00', depth: 0.5, note: 'Object-oriented programming coursework.' },
  { id: 'c', name: 'C', category: 'development', color: '#3949AB', depth: 0.65, note: 'Programming fundamentals from coursework.' },
  { id: 'cplusplus', name: 'C++', category: 'development', color: '#00599C', depth: 0.4, note: 'Coursework in procedural and object-oriented programming.' },
  { id: 'csharp', name: 'C#', category: 'development', color: '#68217A', depth: 0.75, note: 'Coursework projects built in Visual Studio.' },
  { id: 'nodejs', name: 'Node.js', category: 'development', color: '#5FA04E', depth: 0.55, note: 'Backend fundamentals with Express APIs.' },
  { id: 'mongodb', name: 'MongoDB', category: 'development', color: '#47A248', depth: 0.35, note: 'Document data in MERN team projects.' },
  { id: 'supabase', name: 'Supabase', category: 'development', color: '#3ECF8E', depth: 0.6, note: 'Authentication and data in MarineAtlas.' },

  { id: 'figma', name: 'Figma', category: 'design', color: '#A259FF', depth: 0.95, note: 'Interface design, and the designs I build responsive pages from.' },
  { id: 'photoshop', name: 'Adobe Photoshop', category: 'design', color: '#31A8FF', depth: 0.6, note: 'Image editing and visual design.' },
  { id: 'lightroom', name: 'Adobe Lightroom', category: 'design', color: '#31A8FF', depth: 0.4, note: 'Photo editing and color grading.' },
  { id: 'premierepro', name: 'Adobe Premiere Pro', category: 'design', color: '#9999FF', depth: 0.8, note: 'Video editing, including municipal video work in Mariveles.' },
  { id: 'canva', name: 'Canva', category: 'design', color: '#00C4CC', depth: 0.5, note: 'Fast layouts and social media graphics.' },
  { id: 'capcut', name: 'CapCut', category: 'design', color: '#1D1D1F', depth: 0.7, note: 'Short-form video editing for social media.' },

  { id: 'visualstudio', name: 'Visual Studio', category: 'tools', color: '#865FC5', depth: 0.55, note: 'IDE for C, C++ and C# coursework.' },
  { id: 'github', name: 'GitHub', category: 'tools', color: '#1D1D1F', depth: 0.9, note: 'Collaboration, pull requests and GitHub Pages deployments.' },
  { id: 'git', name: 'Git', category: 'tools', color: '#F05032', depth: 0.45, note: 'Version control on every project.' },
  { id: 'latex', name: 'LaTeX', category: 'tools', color: '#008080', depth: 0.75, note: 'Typesetting research papers, including the AEGIS-NTFS manuscript.' },
];

export const capabilities = [
  { icon: 'layout', title: 'UI design', body: 'Interfaces designed in Figma and built to the pixel.' },
  { icon: 'film', title: 'Multimedia editing', body: 'Video and photo editing, from municipal videos to social content.' },
  { icon: 'file', title: 'Research papers', body: 'Manuscripts, technical documentation and LaTeX typesetting.' },
  { icon: 'megaphone', title: 'Social media management', body: 'Graphics and short-form video for social channels.' },
] as const;

export const studying = [
  'Digital forensics',
  'Cybercrime investigation',
  'Ethical hacking',
  'Digital evidence analysis',
  'Security research',
];
