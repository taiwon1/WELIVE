import axios from '@/shared/lib/axios';

export type IncidentStatus = 'PENDING' | 'IN_PROGRESS' | 'RESOLVED';

export interface IncidentSummary {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  expectedResolutionAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentUpdate {
  id: string;
  content: string;
  status: IncidentStatus;
  expectedResolutionAt: string | null;
  createdAt: string;
}

export interface IncidentDetail extends IncidentSummary {
  complaintIds: string[];
  updates: IncidentUpdate[];
}

export async function getIncidents(page = 1, limit = 20) {
  const response = await axios.get<{ incidents: IncidentSummary[]; totalCount: number }>(
    '/incidents',
    { params: { page, limit } },
  );
  return response.data;
}

export async function getIncident(id: string) {
  const response = await axios.get<IncidentDetail>(`/incidents/${id}`);
  return response.data;
}

export async function createIncident(input: {
  title: string;
  description: string;
  complaintIds: string[];
}) {
  const response = await axios.post<IncidentSummary>('/incidents', input);
  return response.data;
}

export async function detachComplaint(incidentId: string, complaintId: string) {
  await axios.delete(`/incidents/${incidentId}/complaints/${complaintId}`);
}

export async function postIncidentUpdate(
  incidentId: string,
  input: {
    requestId: string;
    expectedVersion: number;
    content: string;
    status: IncidentStatus;
    expectedResolutionAt: string | null;
  },
) {
  const response = await axios.post<{ updateId: string; version: number }>(
    `/incidents/${incidentId}/updates`,
    input,
  );
  return response.data;
}
