export async function onRequest(context) {
  const url = new URL(context.request.url);
  const targetUrl = new URL('/listings.html', url.origin);
  return context.env.ASSETS.fetch(new Request(targetUrl, context.request));
}
