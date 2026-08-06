// Cloudflare Pages Function
// Deployed automatically at: https://<your-domain>/api/hello
export async function onRequest(context) {
  return new Response(JSON.stringify({ message: 'Hello from Cloudflare Pages Functions', method: context.request.method }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
