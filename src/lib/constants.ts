export interface Backlink {
  id: string | number;
  name: string;
  url: string;
  description: string;
  category: string;
  emoji: string;
  submitted_by: string;
  submitted_email?: string;
  created_at: string;
  approved?: boolean;
  priority?: number;
}

export const CATEGORIES = [
  'Software & SaaS',
  'Tech & Gadgets',
  'Marketing & SEO',
  'Design & Creative',
  'Business & Startups',
  'Education & Learning',
  'Other'
] as const;

export const DEFAULT_FAVICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='24' height='24' fill='none' stroke='%236b7a99' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cline x1='2' y1='12' x2='22' y2='12'/%3E%3Cpath d='M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z'/%3E%3C/svg%3E";

export const DEFAULT_SITES: Backlink[] = [
  {
    id: 1,
    name: 'TechCrunch',
    url: 'https://techcrunch.com',
    description: 'The latest technology news, startup coverage, and Silicon Valley stories. A go-to resource for tech enthusiasts.',
    category: 'Tech & Gadgets',
    emoji: '🚀',
    submitted_by: 'System',
    created_at: '2025-01-10'
  },
  {
    id: 2,
    name: 'Smashing Magazine',
    url: 'https://smashingmagazine.com',
    description: 'Web design and development articles, tutorials, and resources for designers and front-end developers.',
    category: 'Design & Creative',
    emoji: '🎨',
    submitted_by: 'System',
    created_at: '2025-01-12'
  },
  {
    id: 3,
    name: 'Product Hunt',
    url: 'https://producthunt.com',
    description: 'Discover the best new products in tech every day. A community of makers sharing their latest launches.',
    category: 'Business & Startups',
    emoji: '🦁',
    submitted_by: 'System',
    created_at: '2025-01-15'
  },
  {
    id: 4,
    name: 'Dev.to',
    url: 'https://dev.to',
    description: 'A community of software developers sharing ideas, tutorials, and discussing the latest in web development.',
    category: 'Software & SaaS',
    emoji: '💻',
    submitted_by: 'System',
    created_at: '2025-01-18'
  },
  {
    id: 5,
    name: 'Hacker News',
    url: 'https://news.ycombinator.com',
    description: 'Social news for tech entrepreneurs and startup enthusiasts. Aggregates the best stories in tech and startups.',
    category: 'Tech & Gadgets',
    emoji: '🔥',
    submitted_by: 'System',
    created_at: '2025-01-20'
  },
  {
    id: 6,
    name: 'CSS-Tricks',
    url: 'https://css-tricks.com',
    description: 'Daily articles about CSS, HTML, JavaScript, and all things related to web design and development.',
    category: 'Software & SaaS',
    emoji: '✨',
    submitted_by: 'System',
    created_at: '2025-01-22'
  },
  {
    id: 7,
    name: 'A List Apart',
    url: 'https://alistapart.com',
    description: 'Articles for people who make websites. Explores the design, development, and meaning of web content.',
    category: 'Design & Creative',
    emoji: '📖',
    submitted_by: 'System',
    created_at: '2025-01-25'
  },
  {
    id: 8,
    name: 'SitePoint',
    url: 'https://sitepoint.com',
    description: 'Resources, courses, and articles for web developers on HTML, CSS, JavaScript, PHP, and more.',
    category: 'Software & SaaS',
    emoji: '📌',
    submitted_by: 'System',
    created_at: '2025-01-28'
  },
  {
    id: 9,
    name: 'Awwwards',
    url: 'https://awwwards.com',
    description: 'Website awards and recognition for the best in web design, creativity, and innovation around the world.',
    category: 'Design & Creative',
    emoji: '🏆',
    submitted_by: 'System',
    created_at: '2025-02-01'
  },
  {
    id: 10,
    name: 'GitHub',
    url: 'https://github.com',
    description: "The world's largest platform for software development and version control, used by millions of developers.",
    category: 'Software & SaaS',
    emoji: '🐙',
    submitted_by: 'System',
    created_at: '2025-02-03'
  },
  {
    id: 11,
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    description: 'Resources for developers by developers. The ultimate reference for HTML, CSS, and JavaScript documentation.',
    category: 'Education & Learning',
    emoji: '🦊',
    submitted_by: 'System',
    created_at: '2025-02-05'
  },
  {
    id: 12,
    name: 'Dribbble',
    url: 'https://dribbble.com',
    description: 'Where designers share work, find inspiration, and get hired. A creative community for UI and UX designers.',
    category: 'Design & Creative',
    emoji: '🎯',
    submitted_by: 'System',
    created_at: '2025-02-07'
  },
  {
    id: 13,
    name: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    description: 'Q&A community for programmers. Find solutions to coding problems or help others in the developer community.',
    category: 'Software & SaaS',
    emoji: '💬',
    submitted_by: 'System',
    created_at: '2025-02-09'
  },
  {
    id: 14,
    name: 'Behance',
    url: 'https://behance.net',
    description: "Adobe's platform to showcase and discover creative work across design, photography, illustration, and motion.",
    category: 'Design & Creative',
    emoji: '🖼️',
    submitted_by: 'System',
    created_at: '2025-02-11'
  },
  {
    id: 15,
    name: 'Indie Hackers',
    url: 'https://indiehackers.com',
    description: 'Community for founders building profitable businesses and side projects. Share revenue, strategies, and stories.',
    category: 'Business & Startups',
    emoji: '⚡',
    submitted_by: 'System',
    created_at: '2025-02-13'
  }
];

export function getEmoji(name: string): string {
  const emojis = ['🌐','⚡','🎯','🔗','💡','📡','🛠️','🚀','🌟','💎','🎪','🔮','🧩','🎋','📦'];
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (h << 5) - h + name.charCodeAt(i);
  }
  return emojis[Math.abs(h) % emojis.length];
}

export function cleanUrl(url: string): string {
  return url.replace(/^https?:\/\//, '').replace(/\/$/, '');
}
