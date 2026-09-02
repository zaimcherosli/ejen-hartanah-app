export async function onRequest(context) {
  const url = new URL(context.request.url);

  // Bypass static assets (e.g. .png, .jpg, .svg, .webp) so original images are served
  if (/\.(png|jpg|jpeg|webp|svg|gif|ico|css|js|json)$/i.test(url.pathname)) {
    return context.env.ASSETS.fetch(context.request);
  }

  const slugArr = context.params.slug;
  const slug = Array.isArray(slugArr) ? slugArr.join('/') : (slugArr || '');
  if (slug === 'wanazemi') {
    const targetUrl = new URL('/agent-wanazemi', url.origin);
    return context.env.ASSETS.fetch(new Request(targetUrl, context.request));
  }
  const targetUrl = new URL('/agents', url.origin);
  return context.env.ASSETS.fetch(new Request(targetUrl, context.request));
}
