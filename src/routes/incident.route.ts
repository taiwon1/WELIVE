import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import * as controller from '../controllers/incident.controller';

const router = Router();
router.use(authMiddleware);
// Service validates current DB role, approval and apartment membership for every call.
router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:incidentId', controller.detail);
router.get('/:incidentId/updates', controller.updates);
router.post('/:incidentId/updates', controller.update);
router.post('/:incidentId/complaints', controller.link);
router.delete('/:incidentId/complaints/:complaintId', controller.unlink);
export default router;
