import { Request, Response, NextFunction } from 'express';
import { assert } from 'superstruct';
import * as complaintService from '../services/complaint.service';
import {
  CreateComplaintStruct,
  UpdateComplaintStruct,
  UpdateComplaintStatusStruct,
} from '../structs/complaint.structs';
import { parsePagination } from '../utils/pagination.util';
import { ComplaintListQuery } from '../types/complaint.types';

// GET /api/complaints
export const getComplaints = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, status, isPublic, dong, ho, keyword, attention, unlinked } = req.query;
    const requestUserId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    const apartmentId = (req.user as any).apartmentId;
    if (!apartmentId) {
      res.status(400).json({ success: false, message: '아파트 정보를 찾을 수 없습니다.' });
      return;
    }

    const pagination = parsePagination(page as string, limit as string);

    const query: ComplaintListQuery = {
      ...pagination,
      ...(status !== undefined && { status: status as any }),
      ...(isPublic === 'true' && { isPublic: true }),
      ...(isPublic === 'false' && { isPublic: false }),
      ...(dong !== undefined && { dong: dong as string }),
      ...(ho !== undefined && { ho: ho as string }),
      ...(keyword !== undefined && { keyword: keyword as string }),
      ...((attention === 'unread' || attention === 'unfinished') && { attention }),
      ...(unlinked === 'true' && { unlinked: true }),
    };

    const result = await complaintService.getComplaints(
      apartmentId,
      query,
      isAdmin,
      requestUserId,
    );

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// POST /api/complaints
export const createComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assert(req.body, CreateComplaintStruct);

    const authorId = req.user.id;

    const complaint = await complaintService.createComplaint(authorId, req.body);

    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
};

// GET /api/complaints/:complaintId
export const getComplaintById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params['complaintId'] as string;
    const requestUserId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    const complaint = await complaintService.getComplaintById(complaintId, requestUserId, isAdmin);

    res.status(200).json(complaint);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/complaints/:complaintId
export const updateComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assert(req.body, UpdateComplaintStruct);

    const complaintId = req.params['complaintId'] as string;
    const requestUserId = req.user.id;

    const complaint = await complaintService.updateComplaint(complaintId, requestUserId, req.body);

    res.status(200).json(complaint);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/complaints/:complaintId/status
export const updateComplaintStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assert(req.body, UpdateComplaintStatusStruct);

    const complaintId = req.params['complaintId'] as string;

    const result = await complaintService.updateComplaintStatus(complaintId, req.body, req.user.id);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/complaints/:complaintId
export const deleteComplaint = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const complaintId = req.params['complaintId'] as string;
    const requestUserId = req.user.id;
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    const result = await complaintService.deleteComplaint(complaintId, requestUserId, isAdmin);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
