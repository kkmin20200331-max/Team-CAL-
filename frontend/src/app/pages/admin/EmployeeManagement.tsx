import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import axios from 'axios';
import {
  ArrowLeft, DollarSign, Users, Edit2, Trash2, Search,
  CheckCircle, Clock, UserCheck
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

interface UserVo {
  id: string; name: string; phone: string; username: string; role: string; status: string;
}
interface StoreMemberVo {
  user_id: string; store_id: string; member_role: string; user_level: string;
  approval_status: string; pay_type: string | null; pay_amount: number | null;
}

const LEVEL_LABEL: Record<string, string> = {
  NEWBIE: '신입', REGULAR: '일반', CLOSER: '마감가능', MANAGER: '매니저',
};
const LEVEL_COLOR: Record<string, string> = {
  NEWBIE: 'bg-gray-100 text-gray-600', REGULAR: 'bg-blue-100 text-blue-600',
  CLOSER: 'bg-purple-100 text-purple-600', MANAGER: 'bg-orange-100 text-orange-600',
};

export default function EmployeeManagement() {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const storeId = branchId || localStorage.getItem('store_id') || '';
  const storeName = localStorage.getItem('store_name') || '매장';

  const [employees, setEmployees] = useState<UserVo[]>([]);
  const [memberMap, setMemberMap] = useState<Record<string, StoreMemberVo>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [editTarget, setEditTarget] = useState<UserVo | null>(null);
  const [payType, setPayType] = useState<'HOURLY' | 'MONTHLY'>('HOURLY');
  const [payAmount, setPayAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const res = await API.get('/users', { params: { store_id: storeId } });
      const list: UserVo[] = Array.isArray(res.data) ? res.data : [];
      setEmployees(list);
      const results = await Promise.allSettled(
        list.map(u => API.get('/store_member/pay', { params: { user_id: u.id, store_id: storeId } }))
      );
      const map: Record<string, StoreMemberVo> = {};
      results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value.data) map[list[i].id] = r.value.data;
      });
      setMemberMap(map);
    } catch (err) {
      console.error('직원 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [storeId]);

  const openEdit = (emp: UserVo) => {
    const info = memberMap[emp.id];
    setEditTarget(emp);
    setPayType((info?.pay_type as 'HOURLY' | 'MONTHLY') || 'HOURLY');
    setPayAmount(info?.pay_amount?.toString() || '');
  };

  const handleSavePay = async () => {
    if (!editTarget || !payAmount) return;
    setSaving(true);
    try {
      await API.put('/store_member/pay', {
        user_id: editTarget.id, store_id: storeId,
        pay_type: payType, pay_amount: parseInt(payAmount),
      });
      setMemberMap(prev => ({
        ...prev,
        [editTarget.id]: {
          ...(prev[editTarget.id] || {}),
          user_id: editTarget.id, store_id: storeId,
          pay_type: payType, pay_amount: parseInt(payAmount),
        } as StoreMemberVo,
      }));
      setEditTarget(null);
    } catch { alert('저장 중 오류가 발생했습니다.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (emp: UserVo) => {
    if (!confirm(`${emp.name}님을 매장에서 제거하시겠습니까?`)) return;
    try {
      await API.delete('/store_member', { params: { store_id: storeId, user_id: emp.id } });
      setEmployees(prev => prev.filter(e => e.id !== emp.id));
    } catch { alert('삭제 중 오류가 발생했습니다.'); }
  };

  const filtered = employees.filter(e =>
    e.name.includes(searchTerm) || e.phone.includes(searchTerm)
  );

  const approvedCount = employees.filter(e => memberMap[e.id]?.approval_status === 'APPROVED').length;
  const pendingCount  = employees.filter(e => memberMap[e.id]?.approval_status === 'PENDING').length;
  const unsetCount    = employees.filter(e => !memberMap[e.id]?.pay_amount).length;

  const getPayDisplay = (info?: StoreMemberVo) => {
    if (!info?.pay_amount) return <span className="text-orange-400 text-xs">미설정</span>;
    return info.pay_type === 'HOURLY'
      ? <span className="text-blue-600 text-xs">{info.pay_amount.toLocaleString()}원/시</span>
      : <span className="text-purple-600 text-xs">{(info.pay_amount / 10000).toFixed(1)}만원/월</span>;
  };

  const getStatusBadge = (status?: string) => {
    if (status === 'APPROVED') return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
        <CheckCircle className="w-3 h-3" />승인됨
      </span>
    );
    if (status === 'PENDING') return (
      <span className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
        <Clock className="w-3 h-3" />대기중
      </span>
    );
    return <span className="text-xs text-gray-400">-</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">직원 관리</h1>
            <p className="text-sm text-gray-500">{storeName}</p>
          </div>
        </div>

        {/* 통계 카드 4개 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <Card><CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">전체 직원</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{employees.length}명</p>
              </div>
              <Users className="w-7 h-7 text-blue-400" />
            </div>
          </CardContent></Card>

          <Card><CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">재직중</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}명</p>
              </div>
              <UserCheck className="w-7 h-7 text-green-400" />
            </div>
          </CardContent></Card>

          <Card><CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">승인 대기</p>
                <p className={`text-2xl font-bold ${pendingCount > 0 ? 'text-yellow-500' : 'text-gray-400'}`}>{pendingCount}명</p>
              </div>
              <Clock className={`w-7 h-7 ${pendingCount > 0 ? 'text-yellow-400' : 'text-gray-300'}`} />
            </div>
          </CardContent></Card>

          <Card><CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">급여 미설정</p>
                <p className={`text-2xl font-bold ${unsetCount > 0 ? 'text-orange-500' : 'text-green-500'}`}>{unsetCount}명</p>
              </div>
              <DollarSign className={`w-7 h-7 ${unsetCount > 0 ? 'text-orange-400' : 'text-green-400'}`} />
            </div>
          </CardContent></Card>
        </div>

        {/* 검색바 */}
        <Card className="mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="이름 또는 전화번호로 검색..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* 테이블 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">직원 목록 ({filtered.length}명)</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-10 text-sm text-gray-400">불러오는 중...</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-10 text-sm text-gray-400">
                {employees.length === 0 ? '등록된 직원이 없습니다' : '검색 결과가 없습니다'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">직원</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">연락처</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">레벨</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">급여</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-gray-500">상태</th>
                      <th className="text-right py-2.5 px-3 text-xs font-medium text-gray-500">작업</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filtered.map(emp => {
                      const info = memberMap[emp.id];
                      return (
                        <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-xs shrink-0">
                                {emp.name[0]}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{emp.name}</p>
                                <p className="text-xs text-gray-400">{emp.username}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-400 text-xs">{emp.phone}</td>
                          <td className="py-3 px-3">
                            {info?.user_level
                              ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLOR[info.user_level] || 'bg-gray-100 text-gray-600'}`}>
                                  {LEVEL_LABEL[info.user_level] || info.user_level}
                                </span>
                              : <span className="text-xs text-gray-400">-</span>}
                          </td>
                          <td className="py-3 px-3">{getPayDisplay(info)}</td>
                          <td className="py-3 px-3">{getStatusBadge(info?.approval_status)}</td>
                          <td className="py-3 px-3">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => openEdit(emp)} title="급여 설정"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                size="sm" variant="ghost"
                                className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                                onClick={() => handleDelete(emp)} title="직원 제거"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 급여 설정 다이얼로그 */}
      <Dialog open={!!editTarget} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editTarget?.name}님 급여 설정</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>급여 유형</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => setPayType('HOURLY')}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                    payType === 'HOURLY' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >시급</button>
                <button
                  onClick={() => setPayType('MONTHLY')}
                  className={`flex-1 py-2.5 rounded-lg border-2 text-sm font-medium transition-colors ${
                    payType === 'MONTHLY' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >월급</button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>{payType === 'HOURLY' ? '시급 (원)' : '월급 (원)'}</Label>
              <Input
                type="number" value={payAmount}
                onChange={e => setPayAmount(e.target.value)}
                placeholder={payType === 'HOURLY' ? '예: 10030' : '예: 2500000'}
              />
              {payAmount && Number(payAmount) > 0 && (
                <p className="text-xs text-gray-500">
                  {payType === 'HOURLY'
                    ? `시간당 ${Number(payAmount).toLocaleString()}원`
                    : `월 ${(Number(payAmount) / 10000).toFixed(1)}만원`}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditTarget(null)}>취소</Button>
            <Button
              onClick={handleSavePay}
              disabled={!payAmount || Number(payAmount) <= 0 || saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
