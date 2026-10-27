import type { Request, Response, NextFunction } from 'express';
import { getTenantActor } from '../services/tenant-access.service';

// JWT 검증 후 DB의 현재 소속·승인 상태를 매 요청에 다시 반영한다.
export const tenantMiddleware = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const actor = await getTenantActor(req.user.id);
    req.user = {
      ...req.user,
      role: actor.isAdmin ? 'ADMIN' : 'USER',
      apartmentId: actor.apartmentId,
    };
    next();
  } catch (error) {
    next(error);
  }
};
