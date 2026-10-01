import type { Request, Response, NextFunction } from 'express';
import { assert } from 'superstruct';
import { BadRequestError } from '../errors/errors';
import { CreateIncidentStruct, IncidentUpdateStruct, LinkIncidentStruct } from '../structs/incident.struct';
import * as service from '../services/incident.service';

function param(req: Request, key: string) {
  const value = req.params[key];
  if (typeof value !== 'string' || value.length > 100) throw new BadRequestError('잘못된 경로입니다.');
  return value;
}
function pagination(req: Request) {
  const parse = (value: unknown, fallback: number, max: number) => {
    if (value === undefined) return fallback;
    if (typeof value !== 'string' || !/^\d+$/.test(value)) throw new BadRequestError('페이지 형식이 잘못되었습니다.');
    const n = Number(value);
    if (!Number.isSafeInteger(n) || n < 1 || n > max) throw new BadRequestError('페이지 범위를 확인해주세요.');
    return n;
  };
  return { page: parse(req.query.page, 1, 100000), limit: parse(req.query.limit, 20, 100) };
}
const handle = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => { void fn(req, res).catch(next); };

export const create = handle(async (req, res) => {
  assert(req.body, CreateIncidentStruct);
  res.status(201).json(await service.createIncident(req.user.id, req.body));
});
export const list = handle(async (req, res) => {
  const { page, limit } = pagination(req);
  res.json(await service.getIncidents(req.user.id, page, limit));
});
export const detail = handle(async (req, res) => {
  res.json(await service.getIncident(req.user.id, param(req, 'incidentId')));
});
export const updates = handle(async (req, res) => {
  const { page, limit } = pagination(req);
  res.json(await service.getUpdates(req.user.id, param(req, 'incidentId'), page, limit));
});
export const link = handle(async (req, res) => {
  assert(req.body, LinkIncidentStruct);
  res.json(await service.attachComplaints(req.user.id, param(req, 'incidentId'), req.body.complaintIds));
});
export const unlink = handle(async (req, res) => {
  await service.detachComplaint(req.user.id, param(req, 'incidentId'), param(req, 'complaintId'));
  res.status(204).end();
});
export const update = handle(async (req, res) => {
  assert(req.body, IncidentUpdateStruct);
  res.json(await service.postUpdate(req.user.id, param(req, 'incidentId'), req.body));
});
