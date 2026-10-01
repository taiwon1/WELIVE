import { useEffect, useState } from 'react';
import Link from 'next/link';
import Title from '@/shared/Title';
import { getIncidents, IncidentSummary, IncidentStatus } from '@/entities/incident/api/incident.api';

const statusLabel: Record<IncidentStatus, string> = {
  PENDING: '접수',
  IN_PROGRESS: '처리 중',
  RESOLVED: '해결',
};

export default function ResidentIncidentListPage() {
  const [incidents, setIncidents] = useState<IncidentSummary[]>([]);

  useEffect(() => {
    getIncidents(1, 100)
      .then(({ incidents: result }) => setIncidents(result))
      .catch((error) => console.error('공동 문제 목록 조회 실패:', error));
  }, []);

  return (
    <div>
      <Title>내 민원 처리 현황</Title>
      <p className='mt-3 text-sm text-gray-500'>내 민원이 공동 문제로 연결된 경우 공통 처리 상황을 확인할 수 있습니다.</p>
      <div className='mt-8 space-y-3'>
        {incidents.map((incident) => (
          <Link
            key={incident.id}
            href={`/resident/incidents/${incident.id}`}
            className='block rounded-xl border border-gray-200 p-5 hover:border-gray-400'
          >
            <div className='flex items-center justify-between'>
              <strong>{incident.title}</strong>
              <span className='text-main text-sm'>{statusLabel[incident.status]}</span>
            </div>
            <p className='mt-2 line-clamp-2 text-sm text-gray-500'>{incident.description}</p>
          </Link>
        ))}
        {incidents.length === 0 && <p className='py-12 text-center text-gray-400'>연결된 공동 문제가 없습니다.</p>}
      </div>
    </div>
  );
}
