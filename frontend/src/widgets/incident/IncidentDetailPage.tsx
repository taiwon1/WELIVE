import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { isAxiosError } from 'axios';
import { useRouter } from 'next/router';
import Title from '@/shared/Title';
import Button from '@/shared/Button';
import {
  detachComplaint,
  getIncident,
  getIncidentUpdates,
  IncidentDetail,
  IncidentStatus,
  postIncidentUpdate,
} from '@/entities/incident/api/incident.api';

const statusLabel: Record<IncidentStatus, string> = {
  PENDING: '처리 대기',
  IN_PROGRESS: '처리 중',
  RESOLVED: '처리 완료',
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
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [moreHistory, setMoreHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const pending = useRef<{ key: string; requestId: string } | null>(null);
  const contentInput = useRef<HTMLTextAreaElement>(null);
  const loadedId = incident?.id;

  const load = useCallback(async () => {
    if (!incidentId) return;
    const data = await getIncident(incidentId);
    setIncident(data);
    setStatus(data.status);
    const date = data.expectedResolutionAt ? new Date(data.expectedResolutionAt) : null;
    setExpectedAt(
      date
        ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        : '',
    );
    setHistoryPage(1);
    setMoreHistory(data.updates.length === 20);
  }, [incidentId]);

  useEffect(() => {
    load().catch(() =>
      setError('공동 문제를 불러오지 못했습니다. 접근 권한이나 연결 상태를 확인해주세요.'),
    );
  }, [load]);

  useEffect(() => {
    if (loadedId && router.asPath.endsWith('#progress')) contentInput.current?.focus();
  }, [loadedId, router.asPath]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!incidentId || !incident || !content.trim() || submitting) return;
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const body = {
        expectedVersion: incident.version,
        content: content.trim(),
        status,
        expectedResolutionAt: expectedAt ? new Date(expectedAt).toISOString() : null,
      };
      const key = JSON.stringify(body);
      if (pending.current?.key !== key) pending.current = { key, requestId: crypto.randomUUID() };
      await postIncidentUpdate(incidentId, { ...body, requestId: pending.current.requestId });
      pending.current = null;
      setContent('');
      setMessage(
        '처리 상황을 저장했습니다. 연결된 민원 상태도 함께 반영되고, 해당 주민에게 알림을 보냅니다.',
      );
      await load().catch(() =>
        setError('저장은 완료됐지만 최신 내용을 불러오지 못했습니다. 다시 불러오기를 눌러주세요.'),
      );
      if (
        status === 'RESOLVED' &&
        incident.status !== 'RESOLVED' &&
        window.confirm(
          '처리가 완료됐습니다. 전체 주민에게도 공지할까요?\n확인을 누르면 공지 초안이 열립니다. 등록 버튼을 누르기 전에는 게시되지 않습니다.',
        )
      ) {
        await router.push('/admin/notice/create?incidentId=' + incidentId);
      }
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        pending.current = null;
        await load().catch(() => undefined);
        setError(
          '다른 변경이 먼저 저장됐습니다. 최신 상태와 작성한 내용을 확인하고 다시 저장해주세요.',
        );
      } else
        setError(
          '저장 결과를 확인하지 못했습니다. 같은 내용으로 다시 누르면 중복 없이 재시도합니다.',
        );
    } finally {
      setSubmitting(false);
    }
  };

  if (!incident)
    return (
      <div role={error ? 'alert' : 'status'}>
        <p>{error || '공동 문제를 불러오는 중입니다.'}</p>
        {error && (
          <button
            className='min-h-11 underline'
            onClick={() => {
              setError('');
              load().catch(() => setError('불러오지 못했습니다.'));
            }}
          >
            다시 불러오기
          </button>
        )}
        <Link className='ml-4 underline' href={admin ? '/admin/incidents' : '/resident/incidents'}>
          목록으로
        </Link>
      </div>
    );

  return (
    <div className='space-y-8'>
      <Link
        className='inline-block min-h-11 underline'
        href={admin ? '/admin/incidents' : '/resident/incidents'}
      >
        공동 문제 목록으로
      </Link>
      {error && (
        <p role='alert' className='rounded-xl bg-red-50 p-4 text-red-800'>
          {error}{' '}
          <button
            className='min-h-11 underline'
            onClick={() =>
              load()
                .then(() => setError(''))
                .catch(() => undefined)
            }
          >
            다시 불러오기
          </button>
        </p>
      )}
      {message && (
        <p role='status' className='rounded-xl bg-green-50 p-4 text-green-900'>
          {message}
        </p>
      )}
      <div>
        <Title>{incident.title}</Title>
        <p className='mt-3 text-gray-600'>{incident.description}</p>
        <div className='mt-4 flex gap-5 text-sm text-gray-500'>
          <span>상태: {statusLabel[incident.status]}</span>
          <span>
            예상 처리일:{' '}
            {incident.expectedResolutionAt
              ? new Date(incident.expectedResolutionAt).toLocaleString('ko-KR')
              : '미정'}
          </span>
        </div>
      </div>

      {admin && (
        <>
          <section className='rounded-xl border border-gray-200 p-6'>
            <h3 className='mb-3 font-semibold'>연결된 민원</h3>
            <div className='flex flex-wrap gap-2'>
              {incident.complaints.map(({ id: complaintId, title }) => (
                <div
                  key={complaintId}
                  className='flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm'
                >
                  <Link
                    className='min-h-11 content-center underline'
                    href={'/admin/civil/detail/' + complaintId}
                  >
                    {title}
                  </Link>
                  <button
                    className='min-h-11 px-2 text-red-700'
                    disabled={submitting}
                    onClick={async () => {
                      if (
                        !incidentId ||
                        !confirm(
                          '연결을 해제할까요? 현재 민원 상태는 유지되며, 이후 공동 문제 알림은 받지 않습니다.',
                        )
                      )
                        return;
                      try {
                        await detachComplaint(incidentId, complaintId);
                        await load();
                      } catch {
                        setError('연결을 해제하지 못했습니다. 다시 시도해주세요.');
                      }
                    }}
                  >
                    해제
                  </button>
                </div>
              ))}
            </div>
          </section>

          {incident.status === 'RESOLVED' && (
            <aside className='rounded-xl border border-blue-200 bg-blue-50 p-5'>
              <strong>전체 주민에게도 알려야 하나요?</strong>
              <p className='my-2'>
                공지는 자동으로 게시되지 않습니다. 초안을 확인하고 등록하면 단지 전체 주민에게
                공개됩니다.
              </p>
              <Link
                className='inline-block min-h-11 content-center font-semibold underline'
                href={'/admin/notice/create?incidentId=' + incident.id}
              >
                전체 주민 공지 작성
              </Link>
            </aside>
          )}
          <form
            id='progress'
            onSubmit={submit}
            className='space-y-4 rounded-xl border border-gray-200 p-6'
          >
            <h3 className='font-semibold'>주민에게 처리 상황 알리기</h3>
            <p className='text-gray-700'>
              저장하면 연결된 민원 상태가 함께 바뀝니다. 아래 내용은 해당 민원의 주민에게
              공개됩니다.
            </p>
            <label htmlFor='progress-content' className='block font-medium'>
              처리 내용
            </label>
            <textarea
              id='progress-content'
              ref={contentInput}
              maxLength={5000}
              className='focus:border-main min-h-28 w-full rounded-xl border border-gray-300 p-4 text-base'
              placeholder='확인한 내용, 조치와 지연 사유를 작성해주세요.'
              value={content}
              onChange={(event) => setContent(event.target.value)}
            />
            <div className='flex flex-wrap items-end gap-4'>
              <label className='grid gap-2'>
                처리 상태
                <select
                  className='min-h-12 rounded-xl border border-gray-300 px-4'
                  value={status}
                  onChange={(event) => setStatus(event.target.value as IncidentStatus)}
                >
                  {nextStatuses[incident.status].map((item) => (
                    <option key={item} value={item}>
                      {statusLabel[item]}
                    </option>
                  ))}
                </select>
              </label>
              <label className='grid gap-2'>
                예상 처리일 (선택)
                <input
                  className='min-h-12 rounded-xl border border-gray-300 px-4'
                  type='datetime-local'
                  value={expectedAt}
                  onChange={(event) => setExpectedAt(event.target.value)}
                />
              </label>
              <Button type='submit' disabled={submitting || !content.trim()}>
                {submitting ? '저장 중' : '저장하고 주민에게 알리기'}
              </Button>
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
                <span className='text-gray-400'>
                  {new Date(update.createdAt).toLocaleString('ko-KR')}
                </span>
              </div>
              <p className='mt-3 text-gray-600'>{update.content}</p>
            </li>
          ))}
          {incident.updates.length === 0 && (
            <p className='py-8 text-center text-gray-400'>아직 등록된 처리 이력이 없습니다.</p>
          )}
        </ol>
        {moreHistory && (
          <button
            disabled={loadingHistory}
            className='mt-4 min-h-11 underline'
            onClick={async () => {
              setLoadingHistory(true);
              try {
                const data = await getIncidentUpdates(incident.id, historyPage + 1);
                setIncident((current) =>
                  current
                    ? { ...current, updates: [...current.updates, ...data.updates] }
                    : current,
                );
                setHistoryPage((p) => p + 1);
                setMoreHistory((historyPage + 1) * 20 < data.totalCount);
              } catch {
                setError('이전 처리 이력을 불러오지 못했습니다.');
              } finally {
                setLoadingHistory(false);
              }
            }}
          >
            {loadingHistory ? '불러오는 중…' : '이전 처리 이력 더 보기'}
          </button>
        )}
      </section>
    </div>
  );
}
