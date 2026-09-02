export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (/\.(png|jpg|jpeg|webp|svg|gif|ico|css|js|json)$/i.test(url.pathname)) {
    return context.env.ASSETS.fetch(context.request);
  }
  const targetUrl = new URL('/blog', url.origin);
  return context.env.ASSETS.fetch(new Request(targetUrl, context.request));
}
