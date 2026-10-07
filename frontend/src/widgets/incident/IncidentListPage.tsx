import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Title from '@/shared/Title';
import Button from '@/shared/Button';
import Input from '@/shared/Input';
import axios from '@/shared/lib/axios';
import { CivilListType } from '@/entities/civil/type';
import {
  createIncident,
  getIncidents,
  IncidentSummary,
} from '@/entities/incident/api/incident.api';
import { suggestIncidentTitle } from '@/entities/incident/model/suggestTitle';

const labels = { PENDING: '처리 대기', IN_PROGRESS: '처리 중', RESOLVED: '처리 완료' };
const limit = 20;

export default function IncidentListPage() {
  const router = useRouter();
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [incidentPage, setIncidentPage] = useState(1);
  const [incidentTotal, setIncidentTotal] = useState(0);
  const [complaints, setComplaints] = useState<CivilListType[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<CivilListType[]>([]);
  const [title, setTitle] = useState('');
  const [titleEdited, setTitleEdited] = useState(false);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const suggestion = useMemo(
    () => suggestIncidentTitle(selected.map((item) => item.title)),
    [selected],
  );
  const effectiveTitle = titleEdited ? title : suggestion;

  useEffect(() => {
    let active = true;
    getIncidents(incidentPage, limit)
      .then((data) => {
        if (active) {
          setIncidents(data.incidents);
          setIncidentTotal(data.totalCount);
        }
      })
      .catch(() => {
        if (active) setError('공동 문제 목록을 불러오지 못했습니다. 다시 시도해주세요.');
      });
    return () => {
      active = false;
    };
  }, [incidentPage, retry]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    axios
      .get<{ complaints: CivilListType[]; totalCount: number }>('/complaints', {
        params: {
          page,
          limit,
          keyword: keyword || undefined,
          unlinked: true,
          attention: 'unfinished',
        },
      })
      .then(({ data }) => {
        if (active) {
          setComplaints(data.complaints);
          setTotal(data.totalCount);
        }
      })
      .catch(() => {
        if (active) setError('민원을 불러오지 못했습니다. 다시 시도해주세요.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [page, keyword, retry]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting || !effectiveTitle.trim() || !description.trim() || !selected.length) return;
    setSubmitting(true);
    setError('');
    try {
      const incident = await createIncident({
        title: effectiveTitle.trim(),
        description: description.trim(),
        complaintIds: selected.map((item) => item.complaintId),
      });
      await router.push('/admin/incidents/' + incident.id + '#progress');
    } catch {
      setError(
        '묶지 못했습니다. 다른 공동 문제에 연결된 민원이 있는지 새로 확인해주세요. 입력한 내용은 유지됩니다.',
      );
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-8'>
      <Title>공동 문제 관리</Title>
      {error && (
        <div role='alert' className='rounded-xl bg-red-50 p-4 text-red-800'>
          {error}{' '}
          <button
            type='button'
            className='min-h-11 underline'
            onClick={() => {
              setError('');
              setRetry((value) => value + 1);
            }}
          >
            다시 불러오기
          </button>
        </div>
      )}
      <form onSubmit={submit} className='space-y-5 rounded-xl border border-gray-200 p-6'>
        <h2 className='text-xl font-semibold'>같은 문제의 민원 묶기</h2>
        <p className='text-gray-700'>
          같은 장소·원인인지 직접 확인하고 선택해주세요. 완료되거나 이미 묶인 민원은 제외됩니다.
        </p>
        <Input
          label='민원 검색'
          value={keyword}
          onChange={(event) => {
            setKeyword(event.target.value);
            setPage(1);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.preventDefault();
          }}
        />
        <fieldset
          disabled={submitting || loading}
          className='max-h-72 overflow-auto rounded-xl border border-gray-200'
        >
          <legend className='px-2 font-semibold'>연결할 민원 · {selected.length}건 선택</legend>
          {loading ? (
            <p role='status' className='p-4'>
              민원을 불러오는 중입니다.
            </p>
          ) : (
            complaints.map((complaint) => (
              <label
                key={complaint.complaintId}
                className='flex min-h-12 cursor-pointer items-center gap-3 border-b p-3 last:border-b-0'
              >
                <input
                  type='checkbox'
                  className='h-5 w-5 shrink-0'
                  checked={selected.some((item) => item.complaintId === complaint.complaintId)}
                  onChange={() =>
                    setSelected((current) =>
                      current.some((item) => item.complaintId === complaint.complaintId)
                        ? current.filter((item) => item.complaintId !== complaint.complaintId)
                        : [...current, complaint],
                    )
                  }
                  disabled={
                    selected.length >= 100 &&
                    !selected.some((item) => item.complaintId === complaint.complaintId)
                  }
                />
                <span className='flex-1'>
                  {complaint.title}{' '}
                  <span className='text-sm text-gray-600'>
                    ({complaint.dong}동 · {labels[complaint.status]})
                  </span>
                </span>
                <Link
                  className='min-h-11 content-center underline'
                  href={'/admin/civil/detail/' + complaint.complaintId}
                  target='_blank'
                  onClick={(event) => event.stopPropagation()}
                >
                  내용 보기<span className='sr-only'> (새 창)</span>
                </Link>
              </label>
            ))
          )}
          {!loading && !complaints.length && <p className='p-4'>선택할 민원이 없습니다.</p>}
        </fieldset>
        <div className='flex items-center gap-4'>
          <button
            type='button'
            className='min-h-11 disabled:text-gray-400'
            disabled={page === 1 || loading}
            onClick={() => setPage((p) => p - 1)}
          >
            이전
          </button>
          <span>
            {page} / {Math.max(1, Math.ceil(total / limit))}쪽
          </span>
          <button
            type='button'
            className='min-h-11 disabled:text-gray-400'
            disabled={page * limit >= total || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            다음
          </button>
          {selected.length > 0 && (
            <button type='button' className='min-h-11 underline' onClick={() => setSelected([])}>
              선택 해제
            </button>
          )}
        </div>
        <Input
          label='공동 문제 제목'
          maxLength={150}
          value={effectiveTitle}
          onChange={(event) => {
            setTitleEdited(true);
            setTitle(event.target.value);
          }}
        />
        <p className='text-sm text-gray-600'>
          선택한 민원 제목의 주요 단어로 제안합니다. 자유롭게 수정하고, 이름·동호수 같은 개인정보는
          지워주세요.{' '}
          {titleEdited && suggestion && (
            <button
              type='button'
              className='min-h-11 underline'
              onClick={() => setTitleEdited(false)}
            >
              추천 제목 사용
            </button>
          )}
        </p>
        <div>
          <label htmlFor='incident-description' className='mb-2 block font-semibold'>
            주민에게 공유할 설명
          </label>
          <textarea
            id='incident-description'
            maxLength={5000}
            className='min-h-28 w-full rounded-xl border border-gray-300 p-4 text-base'
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder='어떤 공통 문제인지 작성해주세요. 선택한 민원의 주민에게 공개됩니다.'
          />
        </div>
        <Button
          type='submit'
          disabled={submitting || !effectiveTitle.trim() || !description.trim() || !selected.length}
        >
          {submitting ? '묶는 중…' : selected.length + '건 묶고 처리 상황 작성'}
        </Button>
      </form>
      <section>
        <h2 className='mb-4 text-xl font-semibold'>공동 문제 목록</h2>
        <div className='space-y-3'>
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={'/admin/incidents/' + incident.id}
              className='block rounded-xl border border-gray-200 p-5 hover:border-gray-500'
            >
              <div className='flex flex-wrap justify-between gap-2'>
                <strong>{incident.title}</strong>
                <span>{labels[incident.status]}</span>
              </div>
              <p className='mt-2 line-clamp-2 text-gray-600'>{incident.description}</p>
            </Link>
          ))}
          {!incidents.length && <p className='py-5 text-gray-600'>등록된 공동 문제가 없습니다.</p>}
        </div>
        <div className='mt-4 flex gap-5'>
          <button
            className='min-h-11 disabled:text-gray-400'
            disabled={incidentPage === 1}
            onClick={() => setIncidentPage((p) => p - 1)}
          >
            이전
          </button>
          <span className='content-center'>
            {incidentPage} / {Math.max(1, Math.ceil(incidentTotal / limit))}쪽
          </span>
          <button
            className='min-h-11 disabled:text-gray-400'
            disabled={incidentPage * limit >= incidentTotal}
            onClick={() => setIncidentPage((p) => p + 1)}
          >
            다음
          </button>
        </div>
      </section>
    </div>
  );
}
