import { sendJson } from '../_lib/http.js';

const PRIMARY_REPO = 'migzdndd/MFC-Youth-Area-Management-Database-System-Web';
const FALLBACK_REPO = 'migzdndd/MFC-Youth-Area-Management-System-Web';

const VERIFIED_COMMITS = [
  {
    sha: 'b62fed085067da49b1e8605c825c08d06697c73d',
    commit: {
      message: 'chore(release): bump version to 1.0.1 and update vercel domain references\n\nPort verified test site updates, add legal compliance documentation suite, and bump system version to 1.0.1.',
      author: { name: 'migzdndd', date: '2026-09-25T19:45:48Z' }
    },
    author: { login: 'migzdndd', avatar_url: 'https://avatars.githubusercontent.com/u/296757203?v=4' },
    html_url: 'https://github.com/migzdndd/MFC-Youth-Area-Management-Database-System-Web/commit/b62fed085067da49b1e8605c825c08d06697c73d'
  },
  {
    sha: 'af44636a330554936870e1ac945870ce936fe17b',
    commit: {
      message: 'Update vercel.json with explicit static and node build targets\n\nEnsure proper serverless node routing and frontend static asset delivery.',
      author: { name: 'migzdndd', date: '2026-09-25T03:11:12Z' }
    },
    author: { login: 'migzdndd', avatar_url: 'https://avatars.githubusercontent.com/u/296757203?v=4' },
    html_url: 'https://github.com/migzdndd/MFC-Youth-Area-Management-Database-System-Web/commit/af44636a330554936870e1ac945870ce936fe17b'
  },
  {
    sha: '62ee9ab5158cfa84ebc78a42c938768c8629361b',
    commit: {
      message: 'Fix 404 Issue\n\nResolve routing issues across dynamic API endpoints and static page rewrites.',
      author: { name: 'migzdndd', date: '2026-09-25T03:09:17Z' }
    },
    author: { login: 'migzdndd', avatar_url: 'https://avatars.githubusercontent.com/u/296757203?v=4' },
    html_url: 'https://github.com/migzdndd/MFC-Youth-Area-Management-Database-System-Web/commit/62ee9ab5158cfa84ebc78a42c938768c8629361b'
  },
  {
    sha: '23bced12b0b9a6210b52f96430625bc6ea69d203',
    commit: {
      message: 'Initial commit: MFC Youth Area Management System Web\n\nProduction codebase setup with Supabase Auth, Area multi-tenant isolation, and modular dashboards.',
      author: { name: 'migzdndd', date: '2026-09-25T03:04:02Z' }
    },
    author: { login: 'migzdndd', avatar_url: 'https://avatars.githubusercontent.com/u/296757203?v=4' },
    html_url: 'https://github.com/migzdndd/MFC-Youth-Area-Management-Database-System-Web/commit/23bced12b0b9a6210b52f96430625bc6ea69d203'
  }
];

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { ok: false, error: 'Method Not Allowed' });
  }

  const perPage = Math.min(Math.max(parseInt(req.query?.per_page, 10) || 50, 1), 100);

  // Set CDN and browser edge caching
  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  const fetchRepoCommits = async (repoName) => {
    const url = `https://api.github.com/repos/${repoName}/commits?per_page=${perPage}`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MFC-Youth-Area-Management-System-Web'
      }
    });
    if (!response.ok) {
      throw new Error(`GitHub HTTP ${response.status}`);
    }
    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Empty commits array');
    }
    return data;
  };

  try {
    try {
      const liveCommits = await fetchRepoCommits(PRIMARY_REPO);
      clearTimeout(timeout);
      return sendJson(res, 200, liveCommits);
    } catch (primaryErr) {
      const fallbackCommits = await fetchRepoCommits(FALLBACK_REPO);
      clearTimeout(timeout);
      return sendJson(res, 200, fallbackCommits);
    }
  } catch (error) {
    clearTimeout(timeout);
    console.warn('[Changelogs] GitHub live fetch failed, serving verified commits:', error.message);
    return sendJson(res, 200, VERIFIED_COMMITS);
  }
}
