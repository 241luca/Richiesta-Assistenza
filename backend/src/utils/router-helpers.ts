import type { Application, RequestHandler } from 'express';
import { Router } from 'express';
import type { Role } from '@prisma/client';

/**
 * Helper per organizzare e montare router Express in modo consistente.
 *
 * Linee guida:
 * - Usa `aggregateRouter` per raggruppare più router sotto lo stesso prefisso.
 * - Usa `mountAuth` per montare un router protetto da autenticazione.
 * - Usa `mountAdmin` per montare un router protetto da autenticazione e ruoli.
 *
 * Nota: questi helper non modificano i percorsi interni dei singoli router.
 */

/**
 * Crea un router aggregato che monta i router passati su `"/"` mantenendo i loro sotto-percorsi.
 *
 * Esempio:
 * const r = aggregateRouter(aRoutes, bRoutes);
 * app.use('/api/example', authenticate, r);
 */
export function aggregateRouter(...routers: Router[]): Router {
  const agg = Router();
  routers.forEach(r => agg.use('/', r));
  return agg;
}

/**
 * Monta un router con autenticazione.
 */
export function mountAuth(app: Application, prefix: string, auth: RequestHandler, router: Router) {
  app.use(prefix, auth, router);
}

/**
 * Monta un router con autenticazione e controllo ruoli.
 */
export function mountAdmin(
  app: Application,
  prefix: string,
  auth: RequestHandler,
  requireRole: (roles: Role | Role[]) => RequestHandler,
  roles: Role | Role[],
  router: Router
) {
  app.use(prefix, auth, requireRole(roles), router);
}