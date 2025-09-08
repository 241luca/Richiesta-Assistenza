import { Router } from 'express';
import { ResponseFormatter } from '../utils/responseFormatter';

const router = Router();

// Payment routes will be implemented here
router.get('/', (req, res) => {
  res.json(ResponseFormatter.success(
    null, 
    'Payments endpoint ready'
  ));
});

export default router;
