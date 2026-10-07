import { useEffect, useState } from 'react';
import axios from '@/shared/lib/axios';
import { CivilListType } from '../type';

type Params = {
  page: number;
  limit: number;
  dong?: string;
  ho?: string;
  status?: string;
  isPublic?: boolean;
  keyword?: string;
  attention?: string;
};

type CivilResponse = {
  complaints: CivilListType[];
  totalCount: number;
};

export function useCivilList({
  page,
  limit,
  status,
  isPublic,
  dong,
  ho,
  keyword,
  attention,
}: Params) {
  const [data, setData] = useState<CivilResponse>({ complaints: [], totalCount: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get('/complaints', {
          params: {
            page,
            limit,
            ...Object.fromEntries(
              Object.entries({ status, isPublic, dong, ho, keyword, attention }).filter(
                ([, value]) => value !== undefined,
              ),
            ),
          },
        });

        if (active) setData(res.data || { complaints: [], totalCount: 0 });
      } catch (err) {
        console.error('민원 데이터 불러오기 실패:', err);
        if (active) {
          setError(err);
          setData({ complaints: [], totalCount: 0 });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => {
      active = false;
    };
  }, [page, limit, status, isPublic, dong, ho, keyword, attention, revision]);

  return { data, loading, error, refetch: () => setRevision((value) => value + 1) };
}
