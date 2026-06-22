// seed.mjs — inserts 100 realistic backlink records into Supabase
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://iniaiexzpfzgnlcybjyk.supabase.co';
const SUPABASE_KEY = 'sb_publishable_SK4Wi1opWKlS2CC1DFYQ0g_pVvLBIg9';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const CATEGORIES = [
  'Technology', 'Business', 'Marketing', 'Design', 'Development',
  'SEO', 'Finance', 'Health', 'Education', 'Entertainment',
  'Travel', 'Food', 'Lifestyle', 'News', 'Other'
];

const records = [
  // Technology
  { name: 'DevDocs', url: 'https://devdocs.io', description: 'All-in-one API documentation browser for developers. Fast, offline, and free.', category: 'Technology' },
  { name: 'Stack Overflow', url: 'https://stackoverflow.com', description: 'The world\'s largest developer community to learn, share, and build your career.', category: 'Technology' },
  { name: 'GitHub', url: 'https://github.com', description: 'The complete developer platform to build, scale, and deliver secure software.', category: 'Technology' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', description: 'Social news website focusing on computer science and entrepreneurship.', category: 'Technology' },
  { name: 'Product Hunt', url: 'https://www.producthunt.com', description: 'Discover the best new products in tech every day.', category: 'Technology' },
  { name: 'TechCrunch', url: 'https://techcrunch.com', description: 'Startup and technology news covering the world\'s most innovative companies.', category: 'Technology' },
  { name: 'The Verge', url: 'https://www.theverge.com', description: 'Technology, science, art, and culture from the perspective of the future.', category: 'Technology' },
  { name: 'Smashing Magazine', url: 'https://www.smashingmagazine.com', description: 'Professional resources for web designers and developers.', category: 'Technology' },

  // Development
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', description: 'Resources for developers, by developers. HTML, CSS, and JavaScript reference.', category: 'Development' },
  { name: 'CSS-Tricks', url: 'https://css-tricks.com', description: 'Daily articles about CSS, HTML, JavaScript, and all things related to web design.', category: 'Development' },
  { name: 'freeCodeCamp', url: 'https://www.freecodecamp.org', description: 'Learn to code for free with millions of people around the world.', category: 'Development' },
  { name: 'CodePen', url: 'https://codepen.io', description: 'A social development environment for front-end designers and developers.', category: 'Development' },
  { name: 'Replit', url: 'https://replit.com', description: 'Collaborative browser-based IDE that supports 50+ languages.', category: 'Development' },
  { name: 'Vercel', url: 'https://vercel.com', description: 'The platform for frontend developers, providing speed and reliability.', category: 'Development' },
  { name: 'Netlify', url: 'https://www.netlify.com', description: 'Build, deploy, and scale modern web projects with Netlify.', category: 'Development' },
  { name: 'Railway', url: 'https://railway.app', description: 'Instant deployment with zero config. Bring your code, we handle the rest.', category: 'Development' },
  { name: 'Supabase', url: 'https://supabase.com', description: 'Open source Firebase alternative. Build in a weekend, scale to millions.', category: 'Development' },
  { name: 'PlanetScale', url: 'https://planetscale.com', description: 'The MySQL-compatible serverless database platform for developers.', category: 'Development' },

  // Design
  { name: 'Dribbble', url: 'https://dribbble.com', description: 'The world\'s leading community for creatives to share, grow, and get hired.', category: 'Design' },
  { name: 'Behance', url: 'https://www.behance.net', description: 'Showcase and discover the latest work from top online portfolios.', category: 'Design' },
  { name: 'Figma', url: 'https://www.figma.com', description: 'Collaborative interface design tool for teams. Design, prototype, and gather feedback.', category: 'Design' },
  { name: 'Coolors', url: 'https://coolors.co', description: 'The super fast color palette generator. Create, save, and share beautiful palettes.', category: 'Design' },
  { name: 'Unsplash', url: 'https://unsplash.com', description: 'Beautiful, free images and photos. Over 2 million free high-resolution images.', category: 'Design' },
  { name: 'Pexels', url: 'https://www.pexels.com', description: 'Free stock photos and videos shared by talented photographers.', category: 'Design' },
  { name: 'Awwwards', url: 'https://www.awwwards.com', description: 'The awards that recognize and promote the talent and effort of the best web designers.', category: 'Design' },
  { name: 'Mobbin', url: 'https://mobbin.com', description: 'The world\'s largest mobile and web design reference library.', category: 'Design' },

  // SEO
  { name: 'Ahrefs', url: 'https://ahrefs.com', description: 'SEO tools and resources to grow your search traffic. Backlink checker, keyword research and more.', category: 'SEO' },
  { name: 'SEMrush', url: 'https://www.semrush.com', description: 'Online visibility management platform with SEO, PPC, content, social media, and competitive research tools.', category: 'SEO' },
  { name: 'Moz', url: 'https://moz.com', description: 'SEO software, tools, and resources for smarter marketing.', category: 'SEO' },
  { name: 'Search Engine Journal', url: 'https://www.searchenginejournal.com', description: 'SEO, search marketing, and social media marketing news.', category: 'SEO' },
  { name: 'Search Engine Land', url: 'https://searchengineland.com', description: 'News and information about search engine marketing, SEO and paid search.', category: 'SEO' },
  { name: 'Screaming Frog', url: 'https://www.screamingfrog.co.uk', description: 'Website crawling software for SEO professionals. Identify broken links, errors, and more.', category: 'SEO' },

  // Marketing
  { name: 'HubSpot Blog', url: 'https://blog.hubspot.com', description: 'Marketing, sales, and customer service content to help your business grow.', category: 'Marketing' },
  { name: 'Neil Patel', url: 'https://neilpatel.com', description: 'Digital marketing advice and consulting to help businesses grow their online presence.', category: 'Marketing' },
  { name: 'Mailchimp', url: 'https://mailchimp.com', description: 'Email marketing and automation platform for growing businesses.', category: 'Marketing' },
  { name: 'Buffer', url: 'https://buffer.com', description: 'A suite of products for social media management for small businesses and teams.', category: 'Marketing' },
  { name: 'Hootsuite', url: 'https://www.hootsuite.com', description: 'Social media management platform trusted by over 18 million users worldwide.', category: 'Marketing' },
  { name: 'Later', url: 'https://later.com', description: 'Plan, schedule, and publish your social media posts with Later.', category: 'Marketing' },
  { name: 'Sprout Social', url: 'https://sproutsocial.com', description: 'Comprehensive social media management software for businesses of all sizes.', category: 'Marketing' },
  { name: 'ConvertKit', url: 'https://convertkit.com', description: 'Email marketing software for online creators. Grow your audience, automate your business.', category: 'Marketing' },

  // Business
  { name: 'Notion', url: 'https://www.notion.so', description: 'All-in-one workspace for notes, tasks, wikis, and databases. Replace multiple tools.', category: 'Business' },
  { name: 'Slack', url: 'https://slack.com', description: 'Business communication platform that replaces email and brings teams together.', category: 'Business' },
  { name: 'Asana', url: 'https://asana.com', description: 'Work management platform that helps teams orchestrate their work, from tasks to goals.', category: 'Business' },
  { name: 'Linear', url: 'https://linear.app', description: 'The issue tracking tool built for high-performance teams. Fast, focused, and efficient.', category: 'Business' },
  { name: 'Zapier', url: 'https://zapier.com', description: 'Automation tool that connects your apps and automates workflows without coding.', category: 'Business' },
  { name: 'Calendly', url: 'https://calendly.com', description: 'Scheduling automation platform for professionals. Eliminate back-and-forth emails.', category: 'Business' },
  { name: 'Loom', url: 'https://www.loom.com', description: 'Video messaging for work. Communicate more effectively across your organization.', category: 'Business' },
  { name: 'Monday.com', url: 'https://monday.com', description: 'Work OS platform that powers teams to run projects and workflows with confidence.', category: 'Business' },
  { name: 'ClickUp', url: 'https://clickup.com', description: 'The everything app for work. Tasks, Docs, Chat, and more—all in one place.', category: 'Business' },

  // Finance
  { name: 'Investopedia', url: 'https://www.investopedia.com', description: 'The world\'s leading source of financial content, from terms to trading strategies.', category: 'Finance' },
  { name: 'NerdWallet', url: 'https://www.nerdwallet.com', description: 'Financial tools and expert advice to help you make smart financial decisions.', category: 'Finance' },
  { name: 'The Motley Fool', url: 'https://www.fool.com', description: 'Stock advice and financial news to help investors make better decisions.', category: 'Finance' },
  { name: 'Personal Finance Club', url: 'https://www.personalfinanceclub.com', description: 'Simple and honest personal finance advice. Build wealth the right way.', category: 'Finance' },
  { name: 'Wallet Hacks', url: 'https://wallethacks.com', description: 'Personal finance blog covering banking, credit cards, investing, and taxes.', category: 'Finance' },
  { name: 'CoinGecko', url: 'https://www.coingecko.com', description: 'Comprehensive cryptocurrency data platform tracking over 10,000 coins.', category: 'Finance' },

  // Health
  { name: 'Healthline', url: 'https://www.healthline.com', description: 'Medical information and health news. Trusted health guidance for over 85 million readers.', category: 'Health' },
  { name: 'WebMD', url: 'https://www.webmd.com', description: 'Trusted health information and news for patients and health professionals.', category: 'Health' },
  { name: 'MedlinePlus', url: 'https://medlineplus.gov', description: 'Health information from the National Library of Medicine. Reliable and up-to-date.', category: 'Health' },
  { name: 'Examine.com', url: 'https://examine.com', description: 'Independent nutrition and supplement research. 100% unbiased, evidence-based.', category: 'Health' },
  { name: 'Precision Nutrition', url: 'https://www.precisionnutrition.com', description: 'Research-based health and fitness coaching. Nutrition, habits, and sustainable results.', category: 'Health' },
  { name: 'Cronometer', url: 'https://cronometer.com', description: 'Track your nutrition, exercise, and health data to hit your goals.', category: 'Health' },

  // Education
  { name: 'Khan Academy', url: 'https://www.khanacademy.org', description: 'Free, world-class education for anyone, anywhere. Learn math, science, history and more.', category: 'Education' },
  { name: 'Coursera', url: 'https://www.coursera.org', description: 'Online courses from top universities and companies. Earn certificates and degrees.', category: 'Education' },
  { name: 'edX', url: 'https://www.edx.org', description: 'High-quality courses and credentials from the world\'s best universities and companies.', category: 'Education' },
  { name: 'Udemy', url: 'https://www.udemy.com', description: 'Online learning and teaching marketplace with over 210,000 courses.', category: 'Education' },
  { name: 'Brilliant', url: 'https://brilliant.org', description: 'Learn math, science, and computer science through interactive problem solving.', category: 'Education' },
  { name: 'Duolingo', url: 'https://www.duolingo.com', description: 'Learn a new language for free with the world\'s most popular language learning app.', category: 'Education' },
  { name: 'Wolfram Alpha', url: 'https://www.wolframalpha.com', description: 'Computational intelligence. Answers about math, science, nutrition, history, and more.', category: 'Education' },

  // Travel
  { name: 'Nomad List', url: 'https://nomadlist.com', description: 'Best cities to live and work remotely. Cost of living, internet speed, and quality of life data.', category: 'Travel' },
  { name: 'Lonely Planet', url: 'https://www.lonelyplanet.com', description: 'The world\'s leading travel guide brand. Expert travel tips, itineraries, and destination info.', category: 'Travel' },
  { name: 'Atlas Obscura', url: 'https://www.atlasobscura.com', description: 'The definitive guide to the world\'s wondrous and curious places.', category: 'Travel' },
  { name: 'Skyscanner', url: 'https://www.skyscanner.com', description: 'Search and compare cheap flights, hotels, and car rentals worldwide.', category: 'Travel' },
  { name: 'Google Flights', url: 'https://flights.google.com', description: 'Search and compare flight prices. Find cheap flights with Google\'s flight search tool.', category: 'Travel' },
  { name: 'Rome2rio', url: 'https://www.rome2rio.com', description: 'Discover how to get anywhere by plane, train, bus, ferry, and car.', category: 'Travel' },

  // Food
  { name: 'Serious Eats', url: 'https://www.seriouseats.com', description: 'Recipes, techniques, and science-backed cooking advice from culinary experts.', category: 'Food' },
  { name: 'Allrecipes', url: 'https://www.allrecipes.com', description: 'The largest recipe website with millions of home-cooked meals and cooking tips.', category: 'Food' },
  { name: 'Food52', url: 'https://food52.com', description: 'Recipes, cooking tips, kitchen essentials, and food culture for everyday cooks.', category: 'Food' },
  { name: 'Bon Appétit', url: 'https://www.bonappetit.com', description: 'Recipes, cooking videos, entertaining ideas, and restaurant reviews from BA.', category: 'Food' },
  { name: 'Minimalist Baker', url: 'https://minimalistbaker.com', description: 'Simple, plant-based recipes requiring 10 ingredients or less. Delicious and approachable.', category: 'Food' },
  { name: 'Budget Bytes', url: 'https://www.budgetbytes.com', description: 'Delicious recipes made on a budget. Spend less, eat better.', category: 'Food' },

  // Lifestyle
  { name: 'The Cut', url: 'https://www.thecut.com', description: 'Women\'s fashion, beauty, politics, and personal essays from New York Magazine.', category: 'Lifestyle' },
  { name: 'Apartment Therapy', url: 'https://www.apartmenttherapy.com', description: 'Home design, decor, and organization inspiration for real people.', category: 'Lifestyle' },
  { name: 'No Sidebar', url: 'https://nosidebar.com', description: 'Intentional living and minimalism. Articles on simplifying your life and finding clarity.', category: 'Lifestyle' },
  { name: 'Zen Habits', url: 'https://zenhabits.net', description: 'Practical tips on life and productivity. Focus, simplify, and cultivate positive habits.', category: 'Lifestyle' },
  { name: 'The Good Trade', url: 'https://www.thegoodtrade.com', description: 'Sustainable living, ethical fashion, slow travel, and conscious culture.', category: 'Lifestyle' },
  { name: 'Becoming Minimalist', url: 'https://www.becomingminimalist.com', description: 'A practical guide to owning fewer possessions and living more.', category: 'Lifestyle' },

  // News
  { name: 'The Atlantic', url: 'https://www.theatlantic.com', description: 'Ideas, politics, culture, technology, and more. Influential journalism since 1857.', category: 'News' },
  { name: 'Ars Technica', url: 'https://arstechnica.com', description: 'In-depth technology news, analysis, and reviews for tech enthusiasts.', category: 'News' },
  { name: 'Wired', url: 'https://www.wired.com', description: 'How technology is changing every aspect of our lives. In-depth reporting.', category: 'News' },
  { name: 'MIT Technology Review', url: 'https://www.technologyreview.com', description: 'Authoritative, insightful journalism about the technology industry and its impact.', category: 'News' },
  { name: 'The Information', url: 'https://www.theinformation.com', description: 'Exclusive business and technology news from Silicon Valley and beyond.', category: 'News' },
  { name: 'Axios', url: 'https://www.axios.com', description: 'Breaking news, deep dives, and smart brevity on business, technology, and politics.', category: 'News' },

  // Entertainment
  { name: 'Letterboxd', url: 'https://letterboxd.com', description: 'Social film discovery platform. Review, rate, and discover films with friends.', category: 'Entertainment' },
  { name: 'Goodreads', url: 'https://www.goodreads.com', description: 'The largest site for readers and book recommendations. Find your next great read.', category: 'Entertainment' },
  { name: 'IMDB', url: 'https://www.imdb.com', description: 'The world\'s most popular and authoritative source for movie, TV, and celebrity info.', category: 'Entertainment' },
  { name: 'Spotify', url: 'https://open.spotify.com', description: 'Digital music, podcast, and video service that gives you access to millions of songs.', category: 'Entertainment' },
  { name: 'Bandcamp', url: 'https://bandcamp.com', description: 'Support independent artists. Stream and buy music directly from the people who make it.', category: 'Entertainment' },

  // Other
  { name: 'Archive.org', url: 'https://archive.org', description: 'Internet archive providing free access to millions of books, movies, music, and websites.', category: 'Other' },
  { name: 'Wikipedia', url: 'https://www.wikipedia.org', description: 'Free online encyclopedia that anyone can edit. The world\'s largest reference website.', category: 'Other' },
  { name: 'Perplexity', url: 'https://www.perplexity.ai', description: 'AI-powered answer engine that provides accurate, trusted, and real-time information.', category: 'Other' },
  { name: 'Wolfram MathWorld', url: 'https://mathworld.wolfram.com', description: 'The web\'s most extensive mathematics resource. Free and comprehensive.', category: 'Other' },
  { name: 'Open Library', url: 'https://openlibrary.org', description: 'One web page for every book ever published. Access millions of free ebooks.', category: 'Other' },
];

const submitters = [
  { name: 'Alex Johnson', email: 'alex.johnson@example.com' },
  { name: 'Maria Garcia', email: 'maria.garcia@example.com' },
  { name: 'James Wilson', email: 'james.wilson@example.com' },
  { name: 'Sophie Chen', email: 'sophie.chen@example.com' },
  { name: 'Raj Patel', email: 'raj.patel@example.com' },
  { name: 'Emma Brown', email: 'emma.brown@example.com' },
  { name: 'Luca Rossi', email: 'luca.rossi@example.com' },
  { name: 'Fatima Al-Hassan', email: 'fatima.alhassan@example.com' },
  { name: 'Carlos Silva', email: 'carlos.silva@example.com' },
  { name: 'Yuki Tanaka', email: 'yuki.tanaka@example.com' },
];

async function seed() {
  console.log(`Inserting ${records.length} records...`);

  const rows = records.map((r, i) => {
    const submitter = submitters[i % submitters.length];
    // Spread creation over the last 90 days
    const daysAgo = Math.floor(Math.random() * 90);
    const created = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const priority = [0, 0, 0, 0, 1, 1, 2, 3][Math.floor(Math.random() * 8)];
    const approved = i < 80; // first 80 approved, last 20 pending

    return {
      name: r.name,
      url: r.url,
      description: r.description,
      category: r.category,
      submitted_by: submitter.name,
      submitted_email: submitter.email,
      approved,
      priority,
      created_at: created,
    };
  });

  const { data, error } = await supabase.from('backlinks').insert(rows).select('id');

  if (error) {
    console.error('❌ Insert failed:', error.message);
    process.exit(1);
  }

  console.log(`✅ Successfully inserted ${data.length} records!`);
  console.log(`   • 80 approved listings`);
  console.log(`   • 20 pending for review`);
}

seed();
