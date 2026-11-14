// Vercel serverless entry for the Express app.
//
// Why this file changed (fix/vercel-backend):
// The old file did `import app from '../server'` at module top level.
// If anything in server.ts throws while the module loads, Vercel reports an
// opaque `500 FUNCTION_INVOCATION_FAILED` HTML page and /api/health never
// answers. This version lazy-loads the app inside the handler, so an import
// failure becomes a JSON 500 with the real error message instead of a dead
// function. It also keeps the app module cached between invocations.
import type { IncomingMessage, ServerResponse } from 'http';

let cachedApp: any = null;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    if (!cachedApp) {
      const mod = await import('../server');
      cachedApp = mod.default || mod.app;
    }
    return cachedApp(req, res);
  } catch (err: any) {
    // eslint-disable-next-line no-console
    console.error('[api/index] failed to load server:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ ok: false, error: 'API failed to start', detail: String(err?.message || err) }));
    }
  }
}
