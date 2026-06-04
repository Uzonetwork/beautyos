import { createClient } from '@supabase/supabase-js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req, res) {
  console.log('[og] raw url:', req.url);
  console.log('[og] query object:', JSON.stringify(req.query));

  const { business: businessId } = req.query;

  console.log('[og] businessId:', businessId);

  if (!businessId) {
    console.error('[og] no business param — returning 400');
    res.status(400).send('Missing business parameter');
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('[og] VITE_SUPABASE_URL set:', !!supabaseUrl);
  console.log('[og] SUPABASE_SERVICE_ROLE_KEY set:', !!serviceRoleKey);

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[og] missing env vars — returning 500');
    res.status(500).send('Server configuration error');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data: biz, error: bizError } = await supabase
    .from('businesses')
    .select('name, tagline')
    .eq('id', businessId)
    .single();

  console.log('[og] supabase data:', JSON.stringify(biz));
  console.log('[og] supabase error:', bizError ? JSON.stringify(bizError) : null);

  const name = biz?.name ?? 'Sabi';
  const tagline = biz?.tagline ?? 'Book your appointment online';

  const host = req.headers.host ?? 'beautyos.vercel.app';
  const protocol = host.startsWith('localhost') ? 'http' : 'https';
  const pageUrl = `${protocol}://${host}/?business=${encodeURIComponent(businessId)}`;

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(name)}</title>
    <meta name="description" content="${escapeHtml(tagline)}" />
    <meta property="og:title" content="${escapeHtml(name)}" />
    <meta property="og:description" content="${escapeHtml(tagline)}" />
    <meta property="og:url" content="${escapeHtml(pageUrl)}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Sabi" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(name)}" />
    <meta name="twitter:description" content="${escapeHtml(tagline)}" />
  </head>
  <body>
    <script>window.location.replace(${JSON.stringify(pageUrl)});</script>
    <p>Redirecting to ${escapeHtml(name)}&hellip;</p>
  </body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.status(200).send(html);
}
