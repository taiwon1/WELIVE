import { array, enums, integer, min, nullable, object, pattern, refine, size, string } from 'superstruct';

const text = (max: number) => refine(size(string(), 1, max), 'NonBlank', value => value.trim().length > 0);
const id = size(string(), 1, 100);
const complaintIds = refine(size(array(id), 1, 100), 'UniqueIds', values => new Set(values).size === values.length);
const date = nullable(refine(string(), 'ISODateTime', value =>
  /^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value))));

export const CreateIncidentStruct = object({
  title: text(150),
  description: text(5000),
  complaintIds,
});
export const LinkIncidentStruct = object({ complaintIds });
export const IncidentUpdateStruct = object({
  requestId: pattern(string(), /^[a-zA-Z0-9_-]{8,100}$/),
  expectedVersion: min(integer(), 0),
  content: text(5000),
  status: enums(['PENDING', 'IN_PROGRESS', 'RESOLVED']),
  // Required: null clears the estimate; an ISO timestamp sets it.
  expectedResolutionAt: date,
});
