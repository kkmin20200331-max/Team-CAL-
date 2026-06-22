import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Plus, Search, Edit, Trash2, Pin, Eye, MessageSquare,
  Calendar, User, AlertCircle, CheckCircle, Bell,
  FileText, Paperclip, UserPlus, Users, Wallet, BarChart3,
  Video, X, Send, ChevronLeft,
} from 'lucide-react';
import AdminHeader from './AdminHeader';
import { useTheme } from 'next-themes';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';
const API = 'http://localhost:8080/api';

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
}

interface BoardCommentVO {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

const BoardManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const sidebarBg = isDark ? 'rgba(44,44,46,0.95)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#3a3a3c' : BORDER_GREEN;
  const textColor = isDark ? '#fff' : '#111';
  const subText = isDark ? '#aaa' : '#8BA68D';
  const cardBg = isDark ? 'rgba(44,44,46,0.6)' : 'rgba(230,245,200,0.35)';
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 12,
    border: `1px solid ${LIGHT_GREEN}`, fontSize: 14,
    background: isDark ? '#3a3a3c' : 'rgba(255,255,255,0.8)',
    outline: 'none', color: textColor, boxSizing: 'border-box',
  };

  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  // 유저 이름 맵 (id → name)
  const [userNameMap, setUserNameMap] = useState<Record<string, string>>({});
  const displayName = (userId: string) => userNameMap[userId] || userId;

  // ---------- 사이드바 ----------
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);

  const menuItems = [
    { icon: Calendar, label: '근무표 관리', path: `/admin/schedule/monthly/${branchId}` },
    { icon: UserPlus, label: '대타 모집', path: `/admin/substitute/${branchId}` },
    { icon: Users, label: '직원 관리', path: `/admin/employees/${branchId}` },
    { icon: Wallet, label: '급여 관리', path: `/admin/payroll/${branchId}` },
    { icon: FileText, label: '문서 관리', path: `/admin/documents/${branchId}` },
    { icon: MessageSquare, label: '게시판', path: `/admin/board/${branchId}` },
    { icon: BarChart3, label: 'AI 고객 분석', path: `/admin/analytics/${branchId}` },
    { icon: Video, label: 'CCTV 분석', path: `/admin/cctv/${branchId}` },
  ];

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!branchId) return;
    fetch(`${API}/users?store_id=${branchId}`)
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
  }, [branchId]);

  // ---------- 게시판/게시글 ----------
  const [boards, setBoards] = useState<BoardVO[]>([]);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [posts, setPosts] = useState<BoardPostVO[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPosts, setLoadingPosts] = useState(false);

  useEffect(() => {
    if (!branchId) return;
    fetch(`${API}/board?store_id=${branchId}`)
      .then(r => r.json())
      .then((data: BoardVO[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setBoards(data);
          setSelectedBoardId(data[0].id);
        }
      })
      .catch(() => {});
  }, [branchId]);

  useEffect(() => {
    if (!selectedBoardId) return;
    fetchPosts();
  }, [selectedBoardId]);

  const fetchPosts = async () => {
    setLoadingPosts(true);
    try {
      let data: BoardPostVO[] = [];
      if (searchTerm) {
        const res = await fetch(`${API}/board/post/search?store_id=${branchId}&keyword=${encodeURIComponent(searchTerm)}`);
        data = await res.json();
      } else if (selectedBoardId === '__all__') {
        const results = await Promise.all(boards.map(b => fetch(`${API}/board/post?board_id=${b.id}`).then(r => r.json())));
        results.forEach(r => { if (Array.isArray(r)) data.push(...r); });
        data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      } else {
        const res = await fetch(`${API}/board/post?board_id=${selectedBoardId}`);
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
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    await fetch(`${API}/board/post?id=${id}`, { method: 'DELETE' });
    fetchPosts();
  };

  const handleTogglePin = async (post: BoardPostVO) => {
    await fetch(`${API}/board/post`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...post, is_pinned: post.is_pinned === 'Y' ? 'N' : 'Y' }),
    });
    fetchPosts();
  };

  const stats = {
    total: posts.length,
    pinned: posts.filter(p => p.is_pinned === 'Y').length,
    totalViews: posts.reduce((s, p) => s + (p.view_count || 0), 0),
    totalComments: posts.reduce((s, p) => s + (p.comment_count || 0), 0),
  };

  // ---------- 푸시 알림 모달 ----------
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushForm, setPushForm] = useState({ title: '', content: '' });
  const [pushSending, setPushSending] = useState(false);

  const handleSendPush = async () => {
    if (!pushForm.title.trim()) { alert('알림 제목을 입력해주세요.'); return; }
    setPushSending(true);
    try {
      // 해당 매장 직원 목록 조회
      const res = await fetch(`${API}/users?store_id=${branchId}`);
      const staff: any[] = await res.json();
      // 관리자 본인도 포함
      const targets = Array.isArray(staff) ? staff : [];
      if (currentUser.id && !targets.find((u: any) => u.id === currentUser.id)) {
        targets.push({ id: currentUser.id });
      }
      // 각 직원에게 알림 생성
      await Promise.all(targets.map((u: any) =>
        fetch(`${API}/notification`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `NOTIF_${Date.now()}_${u.id}`,
            user_id: u.id,
            store_id: branchId,
            type: 'BOARD_PUSH',
            title: pushForm.title,
            content: pushForm.content,
            ref_id: selectedBoardId,
          }),
        })
      ));
      alert(`${targets.length}명에게 푸시 알림을 발송했습니다.`);
      setShowPushModal(false);
      setPushForm({ title: '', content: '' });
    } catch {
      alert('알림 발송에 실패했습니다.');
    } finally {
      setPushSending(false);
    }
  };

  // ---------- 게시글 작성/수정 모달 ----------
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingPost, setEditingPost] = useState<BoardPostVO | null>(null);
  const [form, setForm] = useState({ title: '', content: '', is_pinned: 'N', status: 'PUBLISHED' });

  const openCreateModal = () => {
    setEditingPost(null);
    setForm({ title: '', content: '', is_pinned: 'N', status: 'PUBLISHED' });
    setShowPostModal(true);
  };

  const openEditModal = (post: BoardPostVO) => {
    setEditingPost(post);
    setForm({ title: post.title, content: post.content, is_pinned: post.is_pinned, status: post.status });
    setShowPostModal(true);
  };

  const handleSubmitPost = async (asDraft = false) => {
    if (!form.title.trim()) { alert('제목을 입력해주세요.'); return; }
    const status = asDraft ? 'DRAFT' : 'PUBLISHED';
    if (editingPost) {
      await fetch(`${API}/board/post`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingPost, ...form, status }),
      });
    } else {
      const id = 'POST_' + Date.now();
      await fetch(`${API}/board/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id, board_id: selectedBoardId, store_id: branchId,
          writer_id: currentUser.id || '',
          title: form.title, content: form.content,
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
      const res = await fetch(`${API}/board/comment?post_id=${postId}`);
      const data = await res.json();
      setComments(Array.isArray(data) ? data : []);
    } catch { setComments([]); }
    finally { setLoadingComments(false); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    await fetch(`${API}/board/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'CMT_' + Date.now(),
        post_id: selectedPost.id,
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
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    await fetch(`${API}/board/comment?id=${comment.id}&post_id=${comment.post_id}`, { method: 'DELETE' });
    await fetchComments(comment.post_id);
    setPosts(prev => prev.map(p => p.id === comment.post_id ? { ...p, comment_count: Math.max(0, (p.comment_count || 1) - 1) } : p));
  };

  const formatDate = (d: string) => {
    if (!d) return '';
    return new Date(d).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  // ---------- 렌더 ----------
  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />
      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>

        {/* 사이드바 */}
        <aside style={{ width: 220, flexShrink: 0, background: sidebarBg, border: `1px solid ${sidebarBorder}`, borderRadius: 20, padding: '20px 12px', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', position: 'sticky', top: 140, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <button onClick={() => setBranchDropdownOpen(o => !o)} style={{ width: '100%', padding: '10px 14px', background: isDark ? 'rgba(255,255,255,0.06)' : LIGHT_GREEN, border: `1px solid ${sidebarBorder}`, borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, color: isDark ? '#fff' : DARK_GREEN, fontSize: 12, fontWeight: 700 }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <span style={{ fontSize: 10 }}>{branchDropdownOpen ? '▲' : '▼'}</span>
            </button>
            {branchDropdownOpen && stores.length > 0 && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50, background: isDark ? '#1c1c1e' : '#fff', border: `1px solid ${sidebarBorder}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                {stores.map(s => (
                  <button key={s.id} onClick={() => { sessionStorage.setItem('store_id', s.id); sessionStorage.setItem('store_name', s.name); setBranchDropdownOpen(false); navigate(`/admin/dashboard/${s.id}`); }} style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: s.id === branchId ? LIGHT_GREEN : 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#fff' : DARK_GREEN, fontSize: 13, fontWeight: 600 }}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || location.pathname.startsWith(item.path);
            return (
              <button key={item.label} onClick={() => navigate(item.path)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', marginBottom: 4, background: isActive ? GREEN : 'transparent', border: 'none', borderRadius: 12, cursor: 'pointer', color: isActive ? '#fff' : (isDark ? '#ccc' : DARK_GREEN), fontSize: 14, fontWeight: 600, transition: 'all 0.15s', boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none' }}>
                <item.icon size={16} color={isActive ? '#fff' : GREEN} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* 메인 카드 */}
        <div style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.97)', borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)' }}>

          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: 0 }}>게시판 관리</h1>
              <p style={{ fontSize: 14, color: subText, marginTop: 4 }}>{currentBranch}</p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setShowPushModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <Bell size={16} />푸시 알림
              </button>
              <button onClick={openCreateModal} style={{ display: 'flex', alignItems: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                <Plus size={16} />게시글 작성
              </button>
            </div>
          </div>

          {/* 게시판 탭 */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {[{ id: '__all__', name: '전체' }, ...boards].map(b => (
              <button key={b.id} onClick={() => { setSelectedBoardId(b.id); setSelectedPost(null); }} style={{ padding: '9px 20px', borderRadius: 50, fontSize: 14, fontWeight: 700, border: selectedBoardId === b.id ? 'none' : `1px solid ${BORDER_GREEN}`, background: selectedBoardId === b.id ? GREEN : 'transparent', color: selectedBoardId === b.id ? '#fff' : DARK_GREEN, cursor: 'pointer', transition: 'all 0.15s' }}>
                {b.name}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div style={{ background: cardBg, borderRadius: 16, padding: '14px 18px', border: `1px solid ${LIGHT_GREEN}`, marginBottom: 20 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: subText }} />
              <input type="text" placeholder="제목 또는 내용으로 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: 36 }} />
            </div>
          </div>

          {/* 게시글 상세 뷰 */}
          {selectedPost ? (
            <div>
              <button onClick={() => setSelectedPost(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: DARK_GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, padding: 0 }}>
                <ChevronLeft size={16} />목록으로
              </button>
              {/* 본문 + 댓글 통합 카드 */}
              <div style={{ border: `1.5px solid ${BORDER_GREEN}`, borderRadius: 20, overflow: 'hidden' }}>
                {/* 본문 — 흰 배경 */}
                <div style={{ background: '#fff', padding: '24px 24px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      {selectedPost.is_pinned === 'Y' && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: LIGHT_GREEN, color: DARK_GREEN, fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, marginBottom: 8 }}><Pin size={11} />고정됨</span>}
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 8px' }}>{selectedPost.title}</h2>
                      <div style={{ display: 'flex', gap: 16, fontSize: 13, color: '#888' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={13} />{displayName(selectedPost.writer_id)}</span>
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
                  <div style={{ borderTop: `1px solid ${LIGHT_GREEN}`, paddingTop: 18, fontSize: 15, color: '#111', lineHeight: 1.8, whiteSpace: 'pre-wrap', minHeight: 80 }}>{selectedPost.content}</div>
                </div>

                {/* 댓글 */}
                <div style={{ background: '#fff', padding: '0 24px 24px' }}>
                <div style={{ border: `1.5px solid ${BORDER_GREEN}`, borderRadius: 16, background: cardBg, padding: '18px 24px' }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: DARK_GREEN, margin: '0 0 2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MessageSquare size={15} />댓글 {comments.length}개
                  </h3>
                  {loadingComments ? (
                    <p style={{ textAlign: 'center', color: subText, padding: '16px 0' }}>불러오는 중...</p>
                  ) : comments.length === 0 ? (
                    <p style={{ textAlign: 'center', color: subText, padding: '12px 0' }}></p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
                      {comments.map(c => (
                        <div key={c.id} style={{ background: isDark ? 'rgba(255,255,255,0.06)' : LIGHT_GREEN, borderRadius: 12, padding: '11px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${GREEN}, ${DARK_GREEN})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                {(displayName(c.user_id) || '?')[0].toUpperCase()}
                              </div>
                              <span style={{ fontSize: 13, fontWeight: 700, color: textColor }}>{displayName(c.user_id)}</span>
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
                      placeholder="댓글을 입력하세요"
                      rows={3}
                      style={{ ...inputStyle, resize: 'none', fontSize: 15 }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button onClick={handleAddComment} disabled={!commentText.trim()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 40px', background: commentText.trim() ? GREEN : '#ccc', border: 'none', borderRadius: 12, color: '#fff', fontSize: 14, fontWeight: 700, cursor: commentText.trim() ? 'pointer' : 'default' }}>
                        <Send size={15} />등록
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
                <p style={{ textAlign: 'center', color: subText, padding: '40px 0' }}>불러오는 중...</p>
              ) : posts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '48px 0', color: subText }}>
                  <MessageSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                  <p>게시글이 없습니다.</p>
                  <button onClick={openCreateModal} style={{ marginTop: 12, padding: '10px 24px', background: GREEN, border: 'none', borderRadius: 50, color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    <Plus size={14} style={{ display: 'inline', marginRight: 4 }} />첫 게시글 작성
                  </button>
                </div>
              ) : posts.map(post => (
                <div key={post.id} onClick={() => openPostDetail(post)} style={{ background: post.is_pinned === 'Y' ? (isDark ? 'rgba(230,245,200,0.08)' : '#F4FBE8') : (isDark ? 'rgba(44,44,46,0.6)' : '#fff'), borderRadius: 16, padding: '16px 18px', border: post.is_pinned === 'Y' ? `2px solid ${BORDER_GREEN}` : `1px solid ${BORDER_GREEN}`, cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        {post.is_pinned === 'Y' && <Pin size={14} color={DARK_GREEN} />}
                        {post.status === 'DRAFT' && <span style={{ fontSize: 11, background: '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>임시저장</span>}
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: textColor, margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</h3>
                      <p style={{ fontSize: 13, color: subText, margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' } as any}>{post.content}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: subText }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={13} />{displayName(post.writer_id)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{formatDate(post.created_at)}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={13} />{post.view_count || 0}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={13} />{post.comment_count || 0}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, marginLeft: 12, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); handleTogglePin(post); }} style={{ background: post.is_pinned === 'Y' ? LIGHT_GREEN : 'transparent', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: DARK_GREEN }}><Pin size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); openEditModal(post); }} style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: DARK_GREEN }}><Edit size={13} /></button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(post.id); }} style={{ background: 'transparent', border: '1px solid #EF4444', borderRadius: 8, padding: '6px 9px', cursor: 'pointer', color: '#EF4444' }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 푸시 알림 모달 */}
      {showPushModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: isDark ? '#2c2c2e' : '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={18} />푸시 알림 보내기</h2>
              <button onClick={() => setShowPushModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subText }}><X size={20} /></button>
            </div>
            <p style={{ fontSize: 13, color: subText, marginBottom: 20 }}>{currentBranch} 소속 모든 직원에게 알림을 발송합니다.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>알림 제목</label>
                <input type="text" placeholder="알림 제목을 입력하세요" value={pushForm.title} onChange={e => setPushForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>내용 (선택)</label>
                <textarea rows={4} placeholder="알림 내용을 입력하세요" value={pushForm.content} onChange={e => setPushForm(f => ({ ...f, content: e.target.value }))} style={{ ...inputStyle, resize: 'none' }} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleSendPush} disabled={pushSending} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: pushSending ? '#ccc' : GREEN, color: '#fff', borderRadius: 50, padding: '11px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: pushSending ? 'default' : 'pointer' }}>
                  <Bell size={15} />{pushSending ? '발송 중...' : '전송'}
                </button>
                <button onClick={() => setShowPushModal(false)} style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '11px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 게시글 작성/수정 모달 */}
      {showPostModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16 }}>
          <div style={{ background: isDark ? '#2c2c2e' : '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN, margin: 0 }}>{editingPost ? '게시글 수정' : '새 게시글 작성'}</h2>
              <button onClick={() => setShowPostModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: subText }}><X size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>게시판</label>
                <select value={selectedBoardId} onChange={e => setSelectedBoardId(e.target.value)} style={inputStyle}>
                  {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>제목</label>
                <input type="text" placeholder="게시글 제목을 입력하세요" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>내용</label>
                <textarea rows={10} placeholder="게시글 내용을 입력하세요" value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>첨부파일</label>
                <div style={{ border: `2px dashed ${BORDER_GREEN}`, borderRadius: 12, padding: 18, textAlign: 'center' }}>
                  <Paperclip size={24} color={DARK_GREEN} style={{ margin: '0 auto 6px' }} />
                  <p style={{ fontSize: 13, color: subText }}>파일을 드래그하거나 클릭하여 업로드</p>
                  <button style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '7px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>파일 선택</button>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input type="checkbox" id="pinPost" checked={form.is_pinned === 'Y'} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked ? 'Y' : 'N' }))} style={{ width: 16, height: 16, accentColor: GREEN }} />
                <label htmlFor="pinPost" style={{ fontSize: 14, fontWeight: 600, color: textColor }}>상단 고정</label>
              </div>
              <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: `1px solid ${LIGHT_GREEN}` }}>
                <button onClick={() => handleSubmitPost(false)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                  <CheckCircle size={16} />게시하기
                </button>
                <button onClick={() => handleSubmitPost(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  <Edit size={16} />임시 저장
                </button>
                <button onClick={() => setShowPostModal(false)} style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>취소</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardManagement;
