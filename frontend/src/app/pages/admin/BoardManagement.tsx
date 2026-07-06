import { useLanguage } from "../../i18n/useLanguage";
import { translations } from "../../i18n/translations";
import { API_BASE } from "../../../lib/axiosInstance";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_KEY as string,
);
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Plus, Search, Edit, Trash2, Pin, Eye, MessageSquare,
<<<<<<< HEAD
  Calendar, User, AlertCircle, CheckCircle, Bell,
  FileText, ClipboardCheck, UserPlus, Users, Wallet, BarChart3,
=======
  Calendar, User, AlertCircle, CheckCircle,
  FileText, Paperclip, ClipboardCheck, UserPlus, Users, Wallet, BarChart3,
>>>>>>> c3b2e86ec5f51eff8b7a290c03d54155b72e547e
  Video, X, Send, ChevronLeft, ChevronRight,
} from 'lucide-react';
import AdminHeader from './AdminHeader';
import { useTheme } from 'next-themes';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';

const parseContent = (raw: string) => {
  const sep = '\n\n---\n📎 첨부파일\n';
  const idx = raw.indexOf(sep);
  if (idx === -1) return { body: raw, attachments: [] };
  const body = raw.slice(0, idx);
  const attachLines = raw.slice(idx + sep.length).split('\n').filter(l => l.startsWith('- '));
  const attachments = attachLines.map(line => {
    const m = line.match(/^- \[(.+?)\]\((.+?)\)$/);
    return m ? { name: m[1], url: m[2] } : null;
  }).filter(Boolean) as { name: string; url: string }[];
  return { body, attachments };
};

function AttachmentLink({ name, url, color }: { name: string; url: string; color: string }) {
  const [href, setHref] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (url.startsWith('SUPABASE:')) {
      const path = url.slice('SUPABASE:'.length);
      supabase.storage.from('documents').createSignedUrl(path, 3600)
        .then(({ data }) => { if (data?.signedUrl) setHref(data.signedUrl); });
    } else {
      setHref(url);
    }
  }, [url]);
  if (!href) return <span style={{ fontSize: 14, color: '#999' }}>📄 {name} (로딩중...)</span>;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" download={name}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, color, textDecoration: 'none', fontWeight: 600 }}
    >
      📄 {name}
    </a>
  );
}
const LIGHT_GREEN = '#E6F5C8';

interface BoardVO {
  id: string;
  store_id: string;
  name: string;
  created_by: string;
  created_at: string;
}

interface BoardPostVO {
  id: string;
  board_id: string;
  store_id: string;
  writer_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
  status: string;
  is_pinned: string;
  comment_count: number;
  view_count: number;
  username?: string;
  writer_name?: string;
}

interface BoardCommentVO {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
  user_name?: string;
}

const BoardManagement: React.FC = () => {
  const language = useLanguage();
  const t = translations.boardManagement[language];
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const sidebarBg = isDark ? 'rgba(8,8,8,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#1a1a1a' : BORDER_GREEN;
  const textColor = isDark ? '#fff' : '#111';
  const subText = isDark ? '#c8c8c8' : '#8BA68D';
  const cardBg = isDark ? 'rgba(20,20,20,0.7)' : 'rgba(230,245,200,0.35)';
  const contentBg = isDark ? '#141414' : '#fff';
  const mainBg = isDark ? '#0f0f0f' : 'rgba(255,255,255,0.97)';
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: `1px solid ${isDark ? "#2a2a2a" : LIGHT_GREEN}`, fontSize: 14,
    background: isDark ? '#1a1a1a' : 'rgba(255,255,255,0.8)',
    outline: 'none', color: textColor, boxSizing: 'border-box',
  };

  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  // 유저 이름 맵 (id → name)
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});
  const displayName = (userId: string, customName?: string) => customName || userNameMap[userId] || userId;

  // ---------- 사이드바 ----------
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || stores[0]?.id || "";

  const menuItems = [
    { icon: Calendar, label: translations.adminDashboard[language].menuItems.scheduleManagement, path: selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: ClipboardCheck, label: translations.adminDashboard[language].menuItems.attendanceManagement, path: selectedBranchId ? `/admin/attendance/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: UserPlus, label: translations.adminDashboard[language].menuItems.substituteRecruitment, path: selectedBranchId ? `/admin/substitute/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Users, label: translations.adminDashboard[language].menuItems.employeeManagement, path: selectedBranchId ? `/admin/employees/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Wallet, label: translations.adminDashboard[language].menuItems.payrollManagement, path: selectedBranchId ? `/admin/payroll/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: FileText, label: translations.adminDashboard[language].menuItems.documentManagement, path: selectedBranchId ? `/admin/documents/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: MessageSquare, label: translations.adminDashboard[language].menuItems.board, path: selectedBranchId ? `/admin/board/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: BarChart3, label: translations.adminDashboard[language].menuItems.aiAnalytics, path: selectedBranchId ? `/admin/analytics/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Video, label: translations.adminDashboard[language].menuItems.cctvAnalysis, path: selectedBranchId ? `/admin/cctv/${selectedBranchId}` : '/admin/branch-selection' },
  ];

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    fetch(`${API_BASE}/users?store_id=${selectedBranchId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const map: Record<string, string> = {};
        // 현재 로그인 유저 먼저 등록
        if (currentUser?.id) map[currentUser.id] = currentUser.name || currentUser.username || currentUser.id;
        if (Array.isArray(data)) data.forEach(u => { map[u.id] = u.name || u.username || u.id; });
        setUserNameMap(map);
      })
      .catch(() => {
        // fetch 실패해도 현재 유저는 표시
        if (currentUser?.id) setUserNameMap({ [currentUser.id]: currentUser.name || currentUser.username || currentUser.id });
      });
  }, [selectedBranchId]);

  // ---------- 게시판/게시글 ----------
  const [boards, setBoards] = useState<BoardVO[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [posts, setPosts] = useState<BoardPostVO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [showBoardModal, setShowBoardModal] = useState(false);
  const [boardNameInput, setBoardNameInput] = useState('');
  const [savingBoard, setSavingBoard] = useState(false);

  const fetchBoards = async () => {
    if (!selectedBranchId) return;

    try {
      const res = await fetch(`${API_BASE}/board?store_id=${selectedBranchId}`);
      const data: BoardVO[] = await res.json();
      if (Array.isArray(data)) {
        setBoards(data);
        setSelectedBoardId((prev) => {
          if (prev === '__all__') return prev;
          if (data.some((board) => board.id === prev)) return prev;
          return data[0]?.id || '';
        });
      }
    } catch {
      setBoards([]);
      setSelectedBoardId('');
    }
  };

  const boardNameTranslations: Record<string, Record<string, string>> = {
    '공지사항': { ko: '공지사항', en: 'Notice', ja: 'お知らせ' },
    '메뉴얼': { ko: '메뉴얼', en: 'Manual', ja: 'マニュアル' },
    '분실물 관리': { ko: '분실물 관리', en: 'Lost Items', ja: '遺失物管理' },
    '분실물 공유': { ko: '분실물 공유', en: 'Lost & Found', ja: '遺失物共有' },
    '프로모션/이벤트': { ko: '프로모션/이벤트', en: 'Promotions/Events', ja: 'プロモーション/イベント' },
    '프로모션': { ko: '프로모션', en: 'Promotion', ja: 'プロモーション' },
    '이벤트': { ko: '이벤트', en: 'Event', ja: 'イベント' },
    '프로모셔/이벤트': { ko: '프로모셔/이벤트', en: 'Promotions/Events', ja: 'プロモーション/イベント' },
    '체크리스트': { ko: '체크리스트', en: 'Checklist', ja: 'チェックリスト' },
    '업무지시': { ko: '업무지시', en: 'Work Orders', ja: '業務指示' },
    '업무 지시': { ko: '업무 지시', en: 'Work Orders', ja: '業務指示' },
  };

  const translateBoardName = (name?: string) => {
    if (!name) return name || '';
    const m = boardNameTranslations[name];
    return m ? (m[language] || m['en']) : name;
  };

  useEffect(() => {
    if (!selectedBranchId) return;
    fetchBoards();
  }, [selectedBranchId]);

  useEffect(() => {
    if (!selectedBoardId) return;
    fetchPosts();
  }, [selectedBoardId]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      let data: BoardPostVO[] = [];
      if (searchTerm) {
        const res = await fetch(`${API_BASE}/board/post/search?store_id=${selectedBranchId}&keyword=${encodeURIComponent(searchTerm)}`);
        data = await res.json();
      } else if (selectedBoardId === '__all__') {
        const results = await Promise.all(boards.map(b => fetch(`${API_BASE}/board/post?board_id=${b.id}`).then(r => r.json())));
        results.forEach(r => { if (Array.isArray(r)) data.push(...r); });
        data.sort((a, b) => {
          if (a.is_pinned === 'Y' && b.is_pinned !== 'Y') return -1;
          if (a.is_pinned !== 'Y' && b.is_pinned === 'Y') return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      } else {
        const res = await fetch(`${API_BASE}/board/post?board_id=${selectedBoardId}`);
        data = await res.json();
      }
      setPosts(Array.isArray(data) ? data : []);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => { if (selectedBoardId) fetchPosts(); }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm(t.deletePostConfirm)) return;
    // 낙관적 업데이트: 즉시 제거
    setPosts(prev => prev.filter(p => p.id !== id));
    setSelectedPost(null);
    await fetch(`${API_BASE}/board/post?id=${id}`, { method: 'DELETE' });
  };

  const handleTogglePin = async (post: BoardPostVO) => {
    await fetch(`${API_BASE}/board/post`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...post, is_pinned: post.is_pinned === 'Y' ? 'N' : 'Y' }),
    });
    fetchPosts();
  };

  const handleCreateBoard = async () => {
    const name = boardNameInput.trim();
    if (!name) {
      alert('탭 이름을 입력해주세요.');
      return;
    }

    if (!selectedBranchId || !currentUser?.id) {
      alert('매장 또는 사용자 정보가 없습니다.');
      return;
    }

    setSavingBoard(true);
    try {
      const res = await fetch(`${API_BASE}/board/tab`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: selectedBranchId,
          name,
          created_by: currentUser.id,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        alert(data?.message || '탭 추가에 실패했습니다.');
        return;
      }

      setBoards((prev) => {
        if (prev.some((board) => board.id === data.id)) return prev;
        return [...prev, data];
      });
      setSelectedBoardId(data.id);
      setBoardNameInput('');
      setShowBoardModal(false);
    } finally {
      setSavingBoard(false);
    }
  };

  const handleDeleteBoard = async (board: BoardVO) => {
    if (!confirm(`'${board.name}' 탭을 삭제하시겠습니까?`)) return;

    const res = await fetch(`${API_BASE}/board?id=${encodeURIComponent(board.id)}`, {
      method: 'DELETE',
    });
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      alert(data?.message || '탭 삭제에 실패했습니다.');
      return;
    }

    setBoards((prev) => {
      const next = prev.filter((item) => item.id !== board.id);
      if (selectedBoardId === board.id) {
        setSelectedBoardId(next[0]?.id || '');
        setSelectedPost(null);
      }
      return next;
    });
  };

  const stats = {
    total: posts.length,
    pinned: posts.filter(p => p.is_pinned === 'Y').length,
    totalViews: posts.reduce((s, p) => s + (p.view_count || 0), 0),
    totalComments: posts.reduce((s, p) => s + (p.comment_count || 0), 0),
  };

  // ---------- 푸시 알림 모달 ----------
  // ---------- 게시글 작성/수정 모달 ----------
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BoardPostVO | null>(null);
  const [form, setForm] = useState({ title: '', content: '', is_pinned: 'N', status: 'PUBLISHED' });
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreateModal = () => {
    setEditingPost(null);
    setForm({ title: '', content: '', is_pinned: 'N', status: 'PUBLISHED' });
    setAttachedFiles([]);
    setShowPostModal(true);
  };

  const openEditModal = (post: BoardPostVO) => {
    setEditingPost(post);
    setForm({ title: post.title, content: post.content, is_pinned: post.is_pinned, status: post.status });
    setAttachedFiles([]);
    setShowPostModal(true);
  };

<<<<<<< HEAD
  const handleSubmitPost = async () => {
    if (!form.title.trim()) { alert(t.titleRequired); return; }
    const status = 'PUBLISHED';
=======
  const uploadFiles = async (): Promise<string> => {
    if (attachedFiles.length === 0) return form.content;
    const fileLinks: string[] = [];
    for (const file of attachedFiles) {
      try {
        const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
        const safeName = `${Date.now()}${ext}`;
        const path = `board/${currentUser.id || 'unknown'}/${safeName}`;
        const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
        if (error) throw error;
        // URL 대신 경로를 저장 → 렌더링 시 signed URL 생성
        fileLinks.push(`[${file.name}](SUPABASE:${path})`);
      } catch (e: any) {
        fileLinks.push(`[${file.name}](업로드 실패: ${e?.message ?? '알 수 없는 오류'})`);
      }
    }
    const attachSection = '\n\n---\n📎 첨부파일\n' + fileLinks.map(l => `- ${l}`).join('\n');
    return form.content + attachSection;
  };

  const handleSubmitPost = async (asDraft = false) => {
    if (!form.title.trim()) { alert(t.titleRequired); return; }
    const status = asDraft ? 'DRAFT' : 'PUBLISHED';
    const contentWithFiles = await uploadFiles();
>>>>>>> c3b2e86ec5f51eff8b7a290c03d54155b72e547e
    if (editingPost) {
      await fetch(`${API_BASE}/board/post`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingPost, ...form, content: contentWithFiles, status }),
      });
    } else {
      const id = 'POST_' + Date.now();
      await fetch(`${API_BASE}/board/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id, board_id: selectedBoardId, store_id: selectedBranchId,
          writer_id: currentUser.id || '',
          writer_role: currentUser.role || 'ADMIN',
          title: form.title, content: contentWithFiles,
          is_pinned: form.is_pinned, status,
        }),
      });
    }
    setShowPostModal(false);
    fetchPosts();
  };

  // ---------- 게시글 상세 + 댓글 ----------
  const [selectedPost, setSelectedPost] = useState<BoardPostVO | null>(null);
  const [comments, setComments] = useState<BoardCommentVO[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  const openPostDetail = async (post: BoardPostVO) => {
    setSelectedPost(post);
    setCommentText('');
    // 조회수 증가는 별도 API 없으므로 로컬 반영만
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, view_count: (p.view_count || 0) + 1 } : p));
    await fetchComments(post.id);
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE}/board/comment?post_id=${postId}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { setComments([]); }
    finally { setLoadingComments(false); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    await fetch(`${API_BASE}/board/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'CMT_' + Date.now(),
        post_id: selectedPost.id,
        store_id: selectedPost.store_id || selectedBranchId || '',
        user_id: currentUser.id || '',
        content: commentText.trim(),
      }),
    });
    setCommentText('');
    await fetchComments(selectedPost.id);
    // comment_count 로컬 동기화
    setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p));
  };

  const handleDeleteComment = async (comment: BoardCommentVO) => {
    if (!confirm(t.deleteCommentConfirm)) return;
    await fetch(`${API_BASE}/board/comment?id=${comment.id}&post_id=${comment.post_id}&user_id=${currentUser.id || ''}`, { method: 'DELETE' });
    await fetchComments(comment.post_id);
    setPosts(prev => prev.map(p => p.id === comment.post_id ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p));
  };


  const formatDate = (d: string) => {
    if (!d) return '';
    const locale = language === 'ja' ? 'ja-JP' : language === 'en' ? 'en-US' : 'ko-KR';
    return new Date(d).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // ---------- 렌더 ----------
  return (
    <div style={{ minHeight: '100vh', background: pageBg, backgroundAttachment: 'fixed', backgroundRepeat: 'no-repeat', backgroundSize: 'cover', backgroundPosition: 'top center', fontFamily: "'Noto Sans JP', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />
      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>

        {/* 사이드바 */}
        <aside style={{ width: 220, flexShrink: 0, background: sidebarBg, border: `1px solid ${sidebarBorder}`, borderRadius: 20, padding: '16px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', position: 'sticky', top: 140, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? '#1a1a1a' : LIGHT_GREEN, border: `1px solid ${BORDER_GREEN}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: DARK_GREEN }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && stores.length > 0 && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50, background: isDark ? '#0a0a0a' : '#fff', border: `1px solid ${sidebarBorder}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                {stores.map(s => (
                  <button key={s.id} onClick={() => { sessionStorage.setItem('store_id', s.id); sessionStorage.setItem('store_name', s.name); setBranchDropdownOpen(false); navigate(`/admin/dashboard/${s.id}`); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: s.id === selectedBranchId ? LIGHT_GREEN : 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#fff' : DARK_GREEN, fontSize: 13, fontWeight: 600 }}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
            return (
              <button key={item.label} onClick={() => navigate(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', marginBottom: 4, background: isActive ? GREEN : 'transparent', border: 'none', borderRadius: 12, cursor: 'pointer', color: isActive ? '#fff' : (isDark ? '#ccc' : DARK_GREEN), fontSize: 14, fontWeight: 600, textAlign: 'left', transition: 'all 0.15s', boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none' }}
                onMouseOver={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : LIGHT_GREEN; }}
                onMouseOut={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <item.icon size={16} color={isActive ? '#fff' : GREEN} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* 메인 카드 */}
        <div style={{ flex: 1, minWidth: 0, background: mainBg, borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)', minHeight: 'calc(100vh - 120px)' }}>

          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 13, color: isDark ? '#6b9e6b' : '#8BA68D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentBranch} <ChevronRight size={12} /> {t.breadcrumb}
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: isDark ? GREEN : DARK_GREEN, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <MessageSquare size={26} />{t.pageTitle}
              </h1>
              <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>{t.pageSubtitle}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowBoardModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <Plus size={16} />탭 추가
              </button>

              <button onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                <Plus size={16} />{t.writePost}
              </button>
            </div>
          </div>

          {/* 게시판 탭 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[{ id: '__all__', name: '전체' }, ...boards].map(b => (
              <button key={b.id} onClick={() => { setSelectedBoardId(b.id); setSelectedPost(null); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 50, fontSize: 14, fontWeight: 700, border: selectedBoardId === b.id ? 'none' : `1px solid ${BORDER_GREEN}`, background: selectedBoardId === b.id ? GREEN : 'transparent', color: selectedBoardId === b.id ? '#fff' : DARK_GREEN, cursor: 'pointer', transition: 'all 0.15s' }}>
                {b.name}
                {b.id !== '__all__' && (
                  <span
                    onClick={(e) => { e.stopPropagation(); handleDeleteBoard(b as BoardVO); }}
                    title="Delete tab"
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 18, borderRadius: '50%', color: selectedBoardId === b.id ? '#fff' : '#EF4444' }}
                  >
                    <Trash2 size={12} />
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div style={{ background: cardBg, borderRadius: 16, padding: '14px 18px', border: `1px solid ${isDark ? "#2a2a2a" : LIGHT_GREEN}`, marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: subText }} />
              <input type="text" placeholder={t.searchPlaceholder} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: 36 }} />
            </div>
          </div>

          {/* 게시글 상세 뷰 */}
          {selectedPost ? (
            <div>
              <button onClick={() => setSelectedPost(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
                <ChevronLeft size={16} />{t.backToList}
              </button>
              {/* 본문 + 댓글 통합 카드 */}
              <div style={{ border: `1.5px solid ${BORDER_GREEN}`, borderRadius: 20, overflow: 'hidden' }}>
                {/* 본문 — 흰 배경 */}
                <div style={{ background: contentBg, padding: '24px 24px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      {selectedPost.is_pinned === 'Y' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: isDark ? 'rgba(24,160,34,0.15)' : LIGHT_GREEN, color: isDark ? '#4cd964' : DARK_GREEN, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, marginBottom: 8 }}><Pin size={11} />{t.pinnedBadge}</span>}
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>{selectedPost.title}</h2>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#888' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={13} />{displayName(selectedPost.writer_id, selectedPost.writer_name)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{formatDate(selectedPost.created_at)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} />{selectedPost.view_count}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={13} />{selectedPost.comment_count}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openEditModal(selectedPost)} style={{ background: 'none', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: DARK_GREEN }}><Edit size={14} /></button>
                      <button onClick={() => { handleDelete(selectedPost.id); setSelectedPost(null); }} style={{ background: 'none', border: '1px solid #EF4444', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {(() => {
                    const { body, attachments } = parseContent(selectedPost.content);
                    return (
                      <div style={{ borderTop: `1px solid ${LIGHT_GREEN}`, paddingTop: 18, minHeight: 80 }}>
                        <p style={{ fontSize: 15, color: textColor, lineHeight: 1.8, whiteSpace: 'pre-wrap', margin: 0 }}>{body}</p>
                        {attachments.length > 0 && (
                          <div style={{ marginTop: 16, padding: '12px 16px', background: isDark ? 'rgba(0,162,0,0.08)' : '#f0faf0', borderRadius: 12, border: `1px solid ${BORDER_GREEN}` }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: DARK_GREEN, marginBottom: 8 }}>📎 첨부파일</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {attachments.map((a, i) => (
                                <AttachmentLink key={i} name={a.name} url={a.url} color={GREEN} />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* 댓글 */}
                <div style={{ background: contentBg, padding: '0 24px 24px' }}>
                <div style={{ border: `1.5px solid ${BORDER_GREEN}`, borderRadius: 16, background: cardBg, padding: '18px 24px' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: DARK_GREEN, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={15} />{t.commentCount(comments.length)}
                  </h3>
                  {loadingComments ? (
                    <p style={{ textAlign: 'center', color: subText, padding: '16px 0' }}>{t.loadingComments}</p>
                  ) : comments.length === 0 ? (
                    <p style={{ textAlign: 'center', color: subText, padding: '12px 0' }}></p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                      {comments.map(c => (
                        <div key={c.id} style={{ background: isDark ? 'rgba(255,255,255,0.06)' : LIGHT_GREEN, borderRadius: 12, padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                {(displayName(c.user_id, c.user_name) || '?')[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{displayName(c.user_id, c.user_name)}</span>
                              <span style={{ fontSize: 12, color: subText }}>{formatDate(c.created_at)}</span>
                            </div>
                            {(c.user_id === currentUser.id || currentUser.role === 'ADMIN') && (
                              <button onClick={() => handleDeleteComment(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><Trash2 size={13} /></button>
                            )}
                          </div>
                          <p style={{ fontSize: 14, color: textColor, margin: 0, paddingLeft: 34 }}>{c.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* 댓글 입력 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, margin: '0 8px' }}>
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder={t.commentPlaceholder}
                      rows={3}
                      style={{ ...inputStyle, resize: 'none', fontSize: 15 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button onClick={handleAddComment} disabled={!commentText.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 40px', background: commentText.trim() ? GREEN : '#ccc', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'default' }}>
                        <Send size={15} />{t.sendBtn}
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          ) : (
            /* 게시글 목록 */
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {loadingPosts ? (
                <p style={{ textAlign: 'center', color: subText, padding: '40px 0' }}>{t.loadingPosts}</p>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: subText }}>
                  <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>{t.noPosts}</p>
                  <button onClick={openCreateModal} style={{ marginTop: 12, padding: '10px 24px', background: GREEN, border: 'none', borderRadius: 50, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    <Plus size={14} style={{ display: 'inline', marginRight: 4 }} />{t.writeFirstPost}
                  </button>
                </div>
              ) : posts.map(post => (
                <div key={post.id} onClick={() => openPostDetail(post)} style={{ background: post.is_pinned === 'Y' ? (isDark ? 'rgba(230,245,200,0.08)' : '#F4FBE8') : (isDark ? 'rgba(20,20,20,0.7)' : '#fff'), borderRadius: 16, padding: '16px 18px', border: post.is_pinned === 'Y' ? `2px solid ${BORDER_GREEN}` : `1px solid ${BORDER_GREEN}`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        {post.is_pinned === 'Y' && <Pin size={14} color={DARK_GREEN} />}
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: textColor, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</h3>
                      <p style={{ fontSize: 13, color: subText, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{post.content}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: subText }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={13} />{displayName(post.writer_id, post.writer_name)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{formatDate(post.created_at)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} />{post.view_count || 0}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={13} />{post.comment_count || 0}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); handleTogglePin(post); }} style={{ background: post.is_pinned === 'Y' ? (isDark ? 'rgba(24,160,34,0.2)' : LIGHT_GREEN) : 'transparent', border: `1px solid ${isDark ? 'rgba(0,162,0,0.4)' : BORDER_GREEN}`, borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: isDark ? '#4cd964' : DARK_GREEN }}><Pin size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); openEditModal(post); }} style={{ background: 'transparent', border: `1px solid ${isDark ? '#3a3a3a' : BORDER_GREEN}`, borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: isDark ? '#9dc49d' : DARK_GREEN }}><Edit size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(post.id); }} style={{ background: isDark ? 'rgba(239,68,68,0.12)' : 'transparent', border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#EF4444'}`, borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showBoardModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: isDark ? '#3c3c46' : '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 420 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Plus size={18} />탭 추가
              </h2>
              <button onClick={() => setShowBoardModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subText }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>탭 이름</label>
                <input
                  type="text"
                  placeholder="예: 업무 지시"
                  value={boardNameInput}
                  onChange={e => setBoardNameInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateBoard(); }}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleCreateBoard} disabled={savingBoard} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: savingBoard ? '#ccc' : GREEN, color: '#fff', borderRadius: 50, padding: '11px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: savingBoard ? 'default' : 'pointer' }}>
                  <Plus size={15} />{savingBoard ? '추가 중...' : '추가'}
                </button>
                <button onClick={() => setShowBoardModal(false)} style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 게시글 작성/수정 모달 */}
      {showPostModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: isDark ? '#141414' : '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN, margin: 0 }}>{editingPost ? t.editPostTitle : t.createPostTitle}</h2>
              <button onClick={() => setShowPostModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subText }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>{t.boardLabel}</label>
                <select value={selectedBoardId} onChange={e => setSelectedBoardId(e.target.value)} style={inputStyle}>
                  {boards.map(b => <option key={b.id} value={b.id}>{translateBoardName(b.name)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>{t.titleLabel}</label>
                <input type="text" placeholder={t.titlePlaceholder} value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>{t.contentLabel}</label>
                <textarea rows={10} placeholder={t.contentPlaceholder} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
<<<<<<< HEAD
=======
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>{t.attachmentLabel}</label>
                <div
                  style={{ position: 'relative', border: `2px dashed ${BORDER_GREEN}`, borderRadius: 12, padding: 18, textAlign: 'center' }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault();
                    const files = Array.from(e.dataTransfer.files);
                    if (files.length > 0) setAttachedFiles(prev => [...prev, ...files]);
                  }}
                >
                  <input
                    type="file"
                    multiple
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      opacity: 0, cursor: 'pointer',
                    }}
                    onChange={e => {
                      const filesArray = Array.from(e.target.files || []);
                      e.target.value = '';
                      if (filesArray.length > 0) setAttachedFiles(prev => [...prev, ...filesArray]);
                    }}
                  />
                  <Paperclip size={24} color={DARK_GREEN} style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 13, color: subText }}>{t.attachDragHint}</p>
                  <span style={{ display: 'inline-block', background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '7px 16px', fontSize: 13, fontWeight: 700, marginTop: 8 }}>
                    {t.selectFile}
                  </span>
                </div>
                {attachedFiles.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {attachedFiles.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: isDark ? '#2a2a2a' : LIGHT_GREEN, borderRadius: 8, fontSize: 13 }}>
                        <span style={{ color: textColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                          📎 {f.name} <span style={{ color: subText }}>({(f.size / 1024).toFixed(1)} KB)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachedFiles(prev => prev.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 4px', fontSize: 16, lineHeight: 1 }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
>>>>>>> c3b2e86ec5f51eff8b7a290c03d54155b72e547e
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="pinPost" checked={form.is_pinned === 'Y'} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked ? 'Y' : 'N' }))} style={{ width: 16, height: 16, accentColor: GREEN }} />
                <label htmlFor="pinPost" style={{ fontSize: 14, fontWeight: 600, color: textColor }}>{t.pinPost}</label>
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: `1px solid ${LIGHT_GREEN}` }}>
                <button onClick={handleSubmitPost} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  <CheckCircle size={16} />{t.publishBtn}
                </button>
                <button onClick={() => setShowPostModal(false)} style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{t.cancelBtn}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardManagement;
