import type { Request, Response, NextFunction } from "express";
import * as pollService from "../services/poll.service";
import { requireBoardInApartment, requirePollInApartment } from "../services/tenant-access.service";
import { create } from "superstruct";
import { CreatePollStruct, UpdatePollStruct, validatePollListQuery } from "../structs/poll.struct";
import { BadRequestError } from "../errors/errors";
import type { CreatePollDto, UpdatePollDto } from "../types/poll.types";

export const getPolls = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const query = validatePollListQuery(req.query);
    const result = await pollService.getPolls(query, req.user.apartmentId!);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const getPollById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params["pollId"] as string;
    if (!id) throw new BadRequestError("pollId가 필요합니다.");
    await requirePollInApartment(id, req.user.apartmentId!);
    const result = await pollService.getPollById(id);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const createPoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const raw = create(req.body, CreatePollStruct);
    const dto: CreatePollDto = {
      boardId: raw.boardId,
      title: raw.title,
      content: raw.content,
      buildingPermission: raw.buildingPermission,
      startDate: raw.startDate,
      endDate: raw.endDate,
      options: raw.options,
      ...(raw.status !== undefined ? { status: raw.status } : {}),
    };
    await requireBoardInApartment(dto.boardId, req.user.apartmentId!, 'POLL');
    const result = await pollService.createPoll(dto, req.user.id);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
};

export const updatePoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params["pollId"] as string;
    if (!id) throw new BadRequestError("pollId가 필요합니다.");
    const raw = create(req.body, UpdatePollStruct);
    const dto: UpdatePollDto = {
      ...(raw.title !== undefined ? { title: raw.title } : {}),
      ...(raw.content !== undefined ? { content: raw.content } : {}),
      ...(raw.buildingPermission !== undefined ? { buildingPermission: raw.buildingPermission } : {}),
      ...(raw.startDate !== undefined ? { startDate: raw.startDate } : {}),
      ...(raw.endDate !== undefined ? { endDate: raw.endDate } : {}),
      ...(raw.status !== undefined ? { status: raw.status } : {}),
      ...(raw.options !== undefined ? { options: raw.options } : {}),
    };
    await requirePollInApartment(id, req.user.apartmentId!);
    const result = await pollService.updatePoll(id, dto);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const deletePoll = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = req.params["pollId"] as string;
    if (!id) throw new BadRequestError("pollId가 필요합니다.");
    await requirePollInApartment(id, req.user.apartmentId!);
    await pollService.deletePoll(id);
    res.status(200).json({ message: "정상적으로 삭제 처리되었습니다." });
  } catch (err) {
    next(err);
  }
};
