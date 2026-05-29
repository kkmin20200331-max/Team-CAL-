import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Store, Clock, MapPin, LayoutGrid } from 'lucide-react';
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8080/api',
});

interface StoreVo {
  id: string;
  name: string;
  address: string;
  capacity: number;
  open_time: string;
  close_time: string;
}

export default function BranchSelection() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreVo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const res = await API.get('/store', { params: { user_id: user.id } });
        setStores(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('매장 조회 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  const handleSelectStore = (store: StoreVo) => {
    localStorage.setItem('store_id', store.id);
    localStorage.setItem('store_name', store.name);
    navigate(`/admin/dashboard/${store.id}`);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">불러오는 중...</div>;

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">지점 선택</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">관리할 지점을 선택해주세요</p>
              </div>
              <Button onClick={() => navigate('/admin/multibranch')} variant="outline" className="gap-2">
                <LayoutGrid className="w-4 h-4" />
                전체 지점 통합 보기
              </Button>
            </div>
          </div>
        </div>

        {/* Store Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {stores.length === 0 ? (
              <div className="text-center text-gray-500 py-20">등록된 매장이 없습니다.</div>
          ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map((store) => (
                    <Card
                        key={store.id}
                        className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleSelectStore(store)}
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Store className="w-5 h-5 text-blue-600" />
                          {store.name}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {store.address}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>운영시간: {store.open_time} ~ {store.close_time}</span>
                        </div>
                        <Button className="w-full mt-4" onClick={(e) => { e.stopPropagation(); handleSelectStore(store); }}>
                          지점 상세 보기
                        </Button>
                      </CardContent>
                    </Card>
                ))}
              </div>
          )}
        </div>
      </div>
  );
}