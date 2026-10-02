import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Title from '@/shared/Title';
import Button from '@/shared/Button';
import {
  detachComplaint,
  getIncident,
  IncidentDetail,
  IncidentStatus,
  postIncidentUpdate,
} from '@/entities/incident/api/incident.api';

const statusLabel: Record<IncidentStatus, string> = {
  PENDING: '접수',
  IN_PROGRESS: '처리 중',
  RESOLVED: '해결',
};

const nextStatuses: Record<IncidentStatus, IncidentStatus[]> = {
  PENDING: ['PENDING', 'IN_PROGRESS'],
  IN_PROGRESS: ['IN_PROGRESS', 'RESOLVED'],
  RESOLVED: ['RESOLVED', 'IN_PROGRESS'],
};

export default function IncidentDetailPage({ admin }: { admin: boolean }) {
  const router = useRouter();
  const incidentId = typeof router.query.id === 'string' ? router.query.id : null;
  const [incident, setIncident] = useState<IncidentDetail | null>(null);
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<IncidentStatus>('PENDING');
  const [expectedAt, setExpectedAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!incidentId) return;
    const data = await getIncident(incidentId);
    setIncident(data);
    setStatus(data.status);
    setExpectedAt(data.expectedResolutionAt ? data.expectedResolutionAt.slice(0, 16) : '');
  }, [incidentId]);

  useEffect(() => {
    load().catch((error) => console.error('공동 문제 조회 실패:', error));
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!incidentId || !incident || !content.trim()) return;
    setSubmitting(true);
    try {
      await postIncidentUpdate(incidentId, {
        requestId: crypto.randomUUID(),
        expectedVersion: incident.version,
        content: content.trim(),
        status,
        expectedResolutionAt: expectedAt ? new Date(expectedAt).toISOString() : null,
      });
      setContent('');
      await load();
    } catch (error) {
      console.error('공동 문제 업데이트 실패:', error);
      alert('업데이트하지 못했습니다. 다른 변경이 반영됐을 수 있으니 새로고침 후 확인해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!incident) return <p className='text-gray-400'>공동 문제를 불러오는 중입니다.</p>;

  return (
    <div className='space-y-8'>
      <div>
        <Title>{incident.title}</Title>
        <p className='mt-3 text-gray-600'>{incident.description}</p>
        <div className='mt-4 flex gap-5 text-sm text-gray-500'>
          <span>상태: {statusLabel[incident.status]}</span>
          <span>
            예상 처리일: {incident.expectedResolutionAt ? new Date(incident.expectedResolutionAt).toLocaleString('ko-KR') : '미정'}
          </span>
        </div>
      </div>

      {admin && (
        <>
          <section className='rounded-xl border border-gray-200 p-6'>
            <h3 className='mb-3 font-semibold'>연결된 민원</h3>
            <div className='flex flex-wrap gap-2'>
              {incident.complaintIds.map((complaintId) => (
                <div key={complaintId} className='flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm'>
                  <span>{complaintId}</span>
                  <button
                    className='text-red-500'
                    onClick={async () => {
                      if (!incidentId || !confirm('이 민원의 연결을 해제하시겠습니까?')) return;
                      await detachComplaint(incidentId, complaintId);
                      await load();
                    }}
                  >
                    해제
                  </button>
                </div>
              ))}
            </div>
          </section>

          <form onSubmit={submit} className='space-y-4 rounded-xl border border-gray-200 p-6'>
            <h3 className='font-semibold'>주민에게 처리 상황 알리기</h3>
            <textarea
              className='focus:border-main min-h-28 w-full rounded-xl border border-gray-200 p-4 text-sm outline-none'
              placeholder='확인한 내용, 조치와 지연 사유를 작성해주세요.'
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <div className='flex gap-3'>
              <select className='rounded-xl border border-gray-200 px-4' value={status} onChange={(event) => setStatus(event.target.value as IncidentStatus)}>
                {nextStatuses[incident.status].map((item) => (
                  <option key={item} value={item}>{statusLabel[item]}</option>
                ))}
              </select>
              <input className='rounded-xl border border-gray-200 px-4' type='datetime-local' value={expectedAt} onChange={(event) => setExpectedAt(event.target.value)} />
              <Button type='submit' disabled={submitting || !content.trim()}>{submitting ? '저장 중' : '업데이트 등록'}</Button>
            </div>
          </form>
        </>
      )}

      <section>
        <h3 className='mb-4 text-lg font-semibold'>처리 이력</h3>
        <ol className='space-y-3'>
          {incident.updates.map((update) => (
            <li key={update.id} className='rounded-xl border border-gray-200 p-5'>
              <div className='flex justify-between text-sm'>
                <strong>{statusLabel[update.status]}</strong>
                <span className='text-gray-400'>{new Date(update.createdAt).toLocaleString('ko-KR')}</span>
              </div>
              <p className='mt-3 text-gray-600'>{update.content}</p>
            </li>
          ))}
          {incident.updates.length === 0 && <p className='py-8 text-center text-gray-400'>아직 등록된 처리 이력이 없습니다.</p>}
        </ol>
      </section>
    </div>
  );
}
