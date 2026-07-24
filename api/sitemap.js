import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://sabipro.ng';

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlEntry(loc, priority, lastmod) {
  return [
    '  <url>',
    `    <loc>${escapeXml(loc)}</loc>`,
    lastmod ? `    <lastmod>${lastmod}</lastmod>` : null,
    `    <priority>${priority}</priority>`,
    '  </url>',
  ].filter(Boolean).join('\n');
}

export default async function handler(req, res) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  const entries = [
    urlEntry(`${SITE_URL}/`, '1.0'),
    urlEntry(`${SITE_URL}/#/marketplace`, '0.9'),
    urlEntry(`${SITE_URL}/#/terms`, '0.3'),
    urlEntry(`${SITE_URL}/#/privacy`, '0.3'),
  ];

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: businesses } = await supabase
      .from('businesses')
      .select('slug, updated_at')
      .eq('subscription_status', 'active')
      .gt('plan_expires_at', new Date().toISOString())
      .not('slug', 'is', null);

    for (const biz of businesses || []) {
      const lastmod = biz.updated_at
        ? new Date(biz.updated_at).toISOString().split('T')[0]
        : undefined;
      entries.push(urlEntry(`${SITE_URL}/${biz.slug}`, '0.8', lastmod));
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
