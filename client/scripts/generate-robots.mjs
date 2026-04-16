import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL } from './seoBuildData.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const robotsPath = path.join(publicDir, 'robots.txt');

const robotsTxt = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /staff
Disallow: /staff/
Disallow: /mypage
Disallow: /booking-success
Disallow: /payments/

# GEO: AI 검색 봇 허용 (ChatGPT, Perplexity, Claude 등)
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

# AI 학습 크롤러 차단 (수집 목적)
User-agent: CCBot
Disallow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

await fs.mkdir(publicDir, { recursive: true });
await fs.writeFile(robotsPath, robotsTxt, 'utf8');
console.log(`[generate-robots] Wrote ${robotsPath}`);
