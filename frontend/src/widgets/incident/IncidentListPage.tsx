import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Title from '@/shared/Title';
import Button from '@/shared/Button';
import Input from '@/shared/Input';
import axios from '@/shared/lib/axios';
import { CivilListType } from '@/entities/civil/type';
import {
  createIncident,
  getIncidents,
  IncidentSummary,
  IncidentStatus,
} from '@/entities/incident/api/incident.api';

const statusLabel: Record<IncidentStatus, string> = {
  PENDING: '접수',
  IN_PROGRESS: '처리 중',
  RESOLVED: '해결',
};

export default function IncidentListPage() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);
  const [complaints, setComplaints] = useState<CivilListType[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    const [incidentData, complaintResponse] = await Promise.all([
      getIncidents(1, 100),
      axios.get<{ complaints: CivilListType[] }>('/complaints', { params: { page: 1, limit: 100 } }),
    ]);
    setIncidents(incidentData.incidents);
    setComplaints(complaintResponse.data.complaints);
  }, []);

  useEffect(() => {
    load().catch((error) => console.error('공동 문제 목록 조회 실패:', error));
  }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || selected.length === 0) return;

    setSubmitting(true);
    try {
      await createIncident({ title: title.trim(), description: description.trim(), complaintIds: selected });
      setTitle('');
      setDescription('');
      setSelected([]);
      await load();
    } catch (error) {
      console.error('공동 문제 생성 실패:', error);
      alert('공동 문제를 만들지 못했습니다. 이미 연결된 민원이 있는지 확인해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className='space-y-10'>
      <Title>공동 문제 관리</Title>

      <form onSubmit={submit} className='space-y-5 rounded-xl border border-gray-200 p-6'>
        <div>
          <h3 className='text-lg font-semibold'>여러 민원을 하나의 공동 문제로 묶기</h3>
          <p className='mt-2 text-sm text-gray-500'>
            제목과 설명, 처리 이력은 연결된 주민에게 공개됩니다. 같은 장소라도 원인이 다르면 묶지 마세요.
          </p>
        </div>
        <Input label='공동 문제 제목' value={title} onChange={(event) => setTitle(event.target.value)} />
        <div>
          <label className='mb-3 block text-sm font-semibold'>주민 공개 설명</label>
          <textarea
            className='focus:border-main min-h-28 w-full rounded-xl border border-gray-200 p-4 text-sm outline-none'
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div>
          <p className='mb-3 text-sm font-semibold'>연결할 민원</p>
          <div className='max-h-64 overflow-auto rounded-xl border border-gray-200'>
            {complaints.map((complaint) => (
              <label key={complaint.complaintId} className='flex cursor-pointer gap-3 border-b p-3 text-sm last:border-b-0'>
                <input
                  type='checkbox'
                  checked={selected.includes(complaint.complaintId)}
                  onChange={() =>
                    setSelected((current) =>
                      current.includes(complaint.complaintId)
                        ? current.filter((id) => id !== complaint.complaintId)
                        : [...current, complaint.complaintId],
                    )
                  }
                />
                <span className='text-gray-500'>{complaint.dong}동 {complaint.ho}호</span>
                <span>{complaint.title}</span>
              </label>
            ))}
          </div>
        </div>
        <Button type='submit' disabled={submitting || !title.trim() || !description.trim() || selected.length === 0}>
          {submitting ? '묶는 중' : `${selected.length}건 공동 문제로 묶기`}
        </Button>
      </form>

      <section>
        <h3 className='mb-4 text-lg font-semibold'>공동 문제 목록</h3>
        <div className='space-y-3'>
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/admin/incidents/${incident.id}`}
              className='block rounded-xl border border-gray-200 p-5 hover:border-gray-400'
            >
              <div className='flex items-center justify-between'>
                <strong>{incident.title}</strong>
                <span className='text-main text-sm'>{statusLabel[incident.status]}</span>
              </div>
              <p className='mt-2 line-clamp-2 text-sm text-gray-500'>{incident.description}</p>
            </Link>
          ))}
          {incidents.length === 0 && <p className='py-8 text-center text-gray-400'>등록된 공동 문제가 없습니다.</p>}
        </div>
      </section>
    </div>
  );
}
