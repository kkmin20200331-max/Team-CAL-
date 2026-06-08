import { useState, useRef } from 'react';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { X, Bell, CheckCircle, XCircle, Store, User, LogOut, Camera } from 'lucide-react';

const API = axios.create({ baseURL: 'http://localhost:8080/api' });

interface PendingEmployee {
  id: string;
  name: string;
  phone: string;
  username: string;
  store_id: string;
  store_name: string;
}

export default function ProfilePanel() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const [profileImage, setProfileImage] = useState<string>(
    () => localStorage.getItem('profile_image') || ''
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      localStorage.setItem('profile_image', base64);
      setProfileImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const [pendingList, setPendingList] = useState<PendingEmployee[]>(() => {
    try {
      const cached = sessionStorage.getItem('pendingList');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const handleApprove = async (emp: PendingEmployee) => {
    try {
      await API.put('/users/approve', null, { params: { id: emp.id } });
      await API.put('/store_member', null, { params: { user_id: emp.id, store_id: emp.store_id } });
      setPendingList(prev => {
        const updated = prev.filter(p => p.id !== emp.id);
        sessionStorage.setItem('pendingList', JSON.stringify(updated));
        return updated;
      });
      alert(`${emp.name}님이 승인되었습니다.`);
    } catch {
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReject = async (emp: PendingEmployee) => {
    if (!confirm(`${emp.name}님의 가입 요청을 거절하시겠습니까?`)) return;
    try {
      await API.delete('/users', { params: { id: emp.id } });
      setPendingList(prev => {
        const updated = prev.filter(p => p.id !== emp.id);
        sessionStorage.setItem('pendingList', JSON.stringify(updated));
        return updated;
      });
    } catch {
      alert('거절 처리 중 오류가 발생했습니다.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('store_id');
    localStorage.removeItem('store_name');
    sessionStorage.removeItem('pendingList');
    navigate('/auth/login');
  };

  const handleDeleteAccount = async () => {
    if (!confirm('정말 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await API.delete('/users', { params: { id: currentUser.id } });
      handleLogout();
    } catch {
      alert('탈퇴 처리 중 오류가 발생했습니다.');
    }
  };

  return (
    <>
      {/* 프로필 아이콘 */}
      <button
        onClick={() => setOpen(true)}
        className="relative rounded-full hover:opacity-80 transition-opacity flex-shrink-0"
      >
        <Avatar className="w-10 h-10 border-2 border-blue-200">
          <AvatarImage src={profileImage} />
          <AvatarFallback className="bg-blue-600 text-white font-bold text-sm">
            {currentUser?.name?.[0] ?? '?'}
          </AvatarFallback>
        </Avatar>
        {pendingList.length > 0 && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </button>

      {/* 슬라이드 패널 */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0" onClick={() => setOpen(false)} />
          <div className="relative z-50 w-full max-w-sm bg-white dark:bg-gray-800 h-full shadow-2xl flex flex-col">

            {/* 닫기 */}
            <div className="flex justify-end px-4 pt-4">
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 프로필 정보 */}
            <div className="flex flex-col items-center px-6 pb-6 pt-2">
              {/* 클릭하면 사진 변경 */}
              <div
                className="relative cursor-pointer group mb-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="w-20 h-20 border-4 border-blue-100">
                  <AvatarImage src={profileImage} />
                  <AvatarFallback className="bg-blue-600 text-white font-bold text-3xl">
                    {currentUser?.name?.[0] ?? '?'}
                  </AvatarFallback>
                </Avatar>
                {/* 호버 시 카메라 아이콘 */}
                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <p className="text-xs text-gray-400 mb-2">사진을 클릭하여 변경</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{currentUser?.name ?? ''}</h2>
              <p className="text-sm text-gray-500 mt-1">{currentUser?.username ?? ''}</p>
              <span className="mt-2 px-3 py-1 bg-blue-100 text-blue-600 text-xs font-semibold rounded-full">
                관리자
              </span>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* 알림 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="flex items-center gap-2 mb-3">
                <Bell className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">알림</h3>
                {pendingList.length > 0 && (
                  <Badge className="bg-red-500 text-white text-xs">{pendingList.length}</Badge>
                )}
              </div>

              <div className="space-y-3">
                {pendingList.length === 0 ? (
                  <div className="flex flex-col items-center py-8 text-gray-400">
                    <CheckCircle className="w-8 h-8 mb-2 text-green-400" />
                    <p className="text-xs">대기 중인 승인 요청이 없습니다.</p>
                  </div>
                ) : (
                  pendingList.map(emp => (
                    <div
                      key={emp.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 space-y-2 bg-gray-50 dark:bg-gray-900"
                    >
                      <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold">
                        <Store className="w-3 h-3" />{emp.store_name}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-gray-900 dark:text-white">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.phone}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">직원 승인 요청이 있습니다.</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white gap-1 text-xs h-7"
                          onClick={() => handleApprove(emp)}
                        >
                          <CheckCircle className="w-3 h-3" />승인
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-500 border-red-300 hover:bg-red-50 gap-1 text-xs h-7"
                          onClick={() => handleReject(emp)}
                        >
                          <XCircle className="w-3 h-3" />거절
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* 로그아웃 / 탈퇴 */}
            <div className="px-6 py-4 space-y-2">
              <Button
                variant="outline"
                className="w-full gap-2 text-gray-700 dark:text-gray-300"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />로그아웃
              </Button>
              <div className="text-center pt-1">
                <button
                  onClick={handleDeleteAccount}
                  className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
                >
                  회원 탈퇴하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
