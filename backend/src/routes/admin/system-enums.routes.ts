import { Router } from 'express';
import { ResponseFormatter } from '../../utils/responseFormatter';
import { authenticate } from '../../middleware/auth';
import { requireRole } from '../../middleware/rbac';

const router = Router();

/**
 * GET /api/admin/system-enums
 * Ottieni tutti gli enum di sistema (admin only)
 */
router.get('/', authenticate, requireRole(['ADMIN', 'SUPER_ADMIN']), (req, res) => {
  const systemEnums = {
    userRoles: {
      CLIENT: 'Cliente',
      PROFESSIONAL: 'Professionista',
      ADMIN: 'Admin',
      SUPER_ADMIN: 'Super Admin'
    },
    requestStatus: {
      pending: 'In attesa',
      assigned: 'Assegnato',
      in_progress: 'In corso',
      completed: 'Completato',
      cancelled: 'Annullato'
    },
    requestPriority: {
      low: 'Bassa',
      medium: 'Media',
      high: 'Alta',
      urgent: 'Urgente'
    },
    paymentStatus: {
      pending: 'In attesa',
      paid: 'Pagato',
      failed: 'Fallito',
      refunded: 'Rimborsato'
    }
  };

  return res.json(ResponseFormatter.success(
    systemEnums,
    'System enums retrieved'
  ));
});

export default router;
