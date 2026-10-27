import { Request, Response, NextFunction } from "express";
import { assert } from "superstruct";
import * as noticeService from "../services/notice.service";
import { CreateNoticeStruct, UpdateNoticeStruct } from "../structs/notice.struct";
import { parsePagination } from "../utils/pagination.util";
import { NoticeListQuery, CreateNoticeBody, UpdateNoticeBody } from "../types/notice.types";


export const getNotices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page, limit, category, search } = req.query;
    const apartmentId = (req.user as any).apartmentId;

    if (!apartmentId) {
      res.status(400).json({ success: false, message: "아파트 정보를 찾을 수 없습니다." });
      return;
    }

    const pagination = parsePagination(page as string, limit as string, 11);

    const query: NoticeListQuery = {
      ...pagination,
      ...(category && { category: category as string }),
      ...(search && { search: search as string }),
    };

    const result = await noticeService.getNotices(apartmentId, query, req.user.id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


export const createNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assert(req.body, CreateNoticeStruct);

    const authorId = req.user.id;
    const result = await noticeService.createNotice(authorId, req.body as unknown as CreateNoticeBody);

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};


export const getNoticeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const noticeId = req.params["noticeId"] as string;
    const result = await noticeService.getNoticeById(noticeId, req.user.id);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const updateNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    assert(req.body, UpdateNoticeStruct);

    const noticeId = req.params["noticeId"] as string;
    const result = await noticeService.updateNotice(noticeId, req.body as unknown as UpdateNoticeBody, req.user.id);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};


export const deleteNotice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const noticeId = req.params["noticeId"] as string;
    const result = await noticeService.deleteNotice(noticeId, req.user.id);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};
