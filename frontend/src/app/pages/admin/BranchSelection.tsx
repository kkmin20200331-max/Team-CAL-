import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import { Store, Clock, MapPin, LayoutGrid, Bell, X, CheckCircle, XCircle, User } from 'lucide-react';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

interface StoreVo {
  id: string;
  name: string;
  address: string;
  capacity: number;
  open_time: string;
  close_time: string;
}

interface PendingEmployee {
  id: string;
  name: string;
  phone: string;
  username: string;
  store_id: string;
  store_name: string;
}

export default function BranchSelection() {
  const navigate = useNavigate();
  const [stores, setStores] = useState<StoreVo[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  // ✅ sessionStorage에서 캐싱된 pendingList 초기값으로 사용
  const [pendingList, setPendingList] = useState<PendingEmployee[]>(() => {
    try {
      const cached = sessionStorage.getItem('pendingList');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const res = await API.get('/store', { params: { user_id: user.id } });
        const storeList: StoreVo[] = Array.isArray(res.data) ? res.data : [];
        setStores(storeList);

        const pending: PendingEmployee[] = [];
        for (const store of storeList) {
          try {
            const guestRes = await API.get('/users/guest', {
              params: { store_id: store.id, role: 'ADMIN' }
            });
            const guests = Array.isArray(guestRes.data) ? guestRes.data : [];
            guests.forEach((g: any) => {
              pending.push({
                id: g.id,
                name: g.name,
                phone: g.phone,
                username: g.username,
                store_id: store.id,
                store_name: store.name,
              });
            });
          } catch {}
        }

        setPendingList(pending);
        // ✅ 최신 데이터 sessionStorage에 저장
        sessionStorage.setItem('pendingList', JSON.stringify(pending));
      } catch (err) {
        console.error('매장 조회 실패:', err);
      } finally {
        setStoresLoading(false);
      }
    };
    fetchAll();
  }, []);

  const handleSelectStore = (store: StoreVo) => {
    localStorage.setItem('store_id', store.id);
    localStorage.setItem('store_name', store.name);
    navigate(`/admin/dashboard/${store.id}`);
  };

  const handleApprove = async (emp: PendingEmployee) => {
    try {
      await API.put('/users/approve', null, { params: { id: emp.id } });
      await API.put('/store_member', null, { params: { user_id: emp.id, store_id: emp.store_id } });
      setPendingList(prev => {
        const updated = prev.filter(p => p.id !== emp.id);
        // ✅ sessionStorage도 같이 업데이트
        sessionStorage.setItem('pendingList', JSON.stringify(updated));
        return updated;
      });
      alert(`${emp.name}님이 승인되었습니다.`);
    } catch (err) {
      console.error('승인 실패:', err);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (emp: PendingEmployee) => {
    if (!confirm(`${emp.name}님의 가입 요청을 거절하시겠습니까?`)) return;
    try {
      await API.delete('/users', { params: { id: emp.id } });
      setPendingList(prev => {
        const updated = prev.filter(p => p.id !== emp.id);
        // ✅ sessionStorage도 같이 업데이트
        sessionStorage.setItem('pendingList', JSON.stringify(updated));
        return updated;
      });
      alert(`${emp.name}님의 요청이 거절되었습니다.`);
    } catch (err) {
      console.error('거절 실패:', err);
      alert('거절 처리 중 오류가 발생했습니다.');
    }
  };

  return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* ✅ Header는 로딩 중에도 항상 표시 */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <button
                  onClick={() => setPanelOpen(true)}
                  className={`relative p-2 rounded-full transition-colors ${
                      pendingList.length > 0
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                <Bell
                    className={`w-6 h-6 ${pendingList.length > 0 ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`}
                    fill={pendingList.length > 0 ? 'currentColor' : 'none'}
                />
              </button>

              <div className="flex-1 ml-4">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">지점 선택</h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">관리할 지점을 선택해주세요</p>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={() => navigate('/admin/multibranch')} variant="outline" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  전체 지점 통합 보기
                </Button>
                <button onClick={() => navigate('/admin/mypage')} className="rounded-full hover:opacity-80 transition-opacity">
                  <Avatar className="w-10 h-10 border-2 border-blue-200">
                    <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
                      {currentUser?.name?.[0] ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Store Cards - 여기서만 로딩 처리 */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {storesLoading ? (
              <div className="flex items-center justify-center py-20 text-gray-500">불러오는 중...</div>
          ) : stores.length === 0 ? (
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
                        <Button
                            className="w-full mt-4"
                            onClick={(e) => { e.stopPropagation(); handleSelectStore(store); }}
                        >
                          지점 상세 보기
                        </Button>
                      </CardContent>
                    </Card>
                ))}
              </div>
          )}
        </div>

        {/* 사이드 패널 */}
        {panelOpen && (
            <div className="fixed inset-0 z-40 flex justify-start">
              <div className="absolute inset-0" onClick={() => setPanelOpen(false)} />
              <div className="relative z-50 w-full max-w-md bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">승인 요청</h2>
                    {pendingList.length > 0 && (
                        <Badge className="bg-red-500 text-white">{pendingList.length}</Badge>
                    )}
                  </div>
                  <button
                      onClick={() => setPanelOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                  {pendingList.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                        <CheckCircle className="w-12 h-12 mb-3 text-green-400" />
                        <p className="text-sm">대기 중인 승인 요청이 없습니다.</p>
                      </div>
                  ) : (
                      pendingList.map((emp) => (
                          <div
                              key={emp.id}
                              className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-gray-900"
                          >
                            <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                              <Store className="w-3 h-3" />
                              {emp.store_name}
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <User className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 dark:text-white text-sm">{emp.name}</p>
                                <p className="text-xs text-gray-500">{emp.phone}</p>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                              직원 승인 요청이 있습니다.
                            </p>
                            <div className="flex gap-2">
                              <Button
                                  size="sm"
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1"
                                  onClick={() => handleApprove(emp)}
                              >
                                <CheckCircle className="w-3 h-3" />
                                승인
                              </Button>
                              <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1 text-red-500 border-red-300 hover:bg-red-50 gap-1"
                                  onClick={() => handleReject(emp)}
                              >
                                <XCircle className="w-3 h-3" />
                                거절
                              </Button>
                            </div>
                          </div>
                      ))
                  )}
                </div>
              </div>
            </div>
        )}
      </div>
  );
}