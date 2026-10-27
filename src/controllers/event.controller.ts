import { Request, Response, NextFunction } from "express";
import * as eventService from "../services/event.service.js";
import { BadRequestError, ForbiddenError } from "../errors/errors.js";
import { requireEventInApartment, requireEventSourceInApartment } from "../services/tenant-access.service.js";

// GET /api/event
export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apartmentId, year, month } = req.query;

    if (!apartmentId) throw new BadRequestError("apartmentId는 필수입니다.");
    if (apartmentId !== req.user.apartmentId) throw new ForbiddenError("소속 단지의 일정만 조회할 수 있습니다.");
    const result = await eventService.getEvents({
      apartmentId: req.user.apartmentId!,
      year: Number(year),
      month: Number(month),
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

// PUT /api/event
export const upsertEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { boardType, boardId, startDate, endDate } = req.query;

    if (boardType !== 'NOTICE' && boardType !== 'POLL') {
      throw new BadRequestError("boardType은 NOTICE 또는 POLL이어야 합니다.");
    }
    await requireEventSourceInApartment(boardType, boardId as string, req.user.apartmentId!);
    await eventService.upsertEvent({
      boardType: boardType as "NOTICE" | "POLL",
      boardId: boardId as string,
      startDate: startDate as string,
      endDate: endDate as string,
    });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

// DELETE /api/event/:eventId
export const deleteEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const eventId = req.params["eventId"] as string;

    await requireEventInApartment(eventId, req.user.apartmentId!);
    await eventService.deleteEvent(eventId);

    res.status(200).json({ message: "이벤트가 삭제되었습니다." });
  } catch (err) {
    next(err);
  }
};