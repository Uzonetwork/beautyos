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
  ];

  console.log('[sitemap] VITE_SUPABASE_URL set:', !!supabaseUrl);
  console.log('[sitemap] VITE_SUPABASE_ANON_KEY set:', !!supabaseAnonKey);

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: businesses, error } = await supabase
      .from('businesses_public')
      .select('slug')
      .eq('is_active', true)
      .not('slug', 'is', null);

    if (error) {
      console.error('[sitemap] supabase query error:', JSON.stringify(error));
    }
    console.log('[sitemap] businesses returned:', businesses?.length ?? 0);

    for (const biz of businesses || []) {
      entries.push(urlEntry(`${SITE_URL}/${biz.slug}`, '0.8'));
    }
  } else {
    console.error('[sitemap] missing env vars — returning static sitemap only');
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join('\n')}
</urlset>`;

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
