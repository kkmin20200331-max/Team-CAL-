import axiosInstance from "../../../lib/axiosInstance";
import { API_BASE } from "../../../lib/axiosInstance";
import { useTheme } from 'next-themes';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import EmployeeHeader from './EmployeeHeader';
import { useNavigate } from 'react-router';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { ChevronLeft, ChevronRight, Plus, X, Paperclip, Edit, Trash2, Send, MessageSquare, ShieldCheck } from 'lucide-react';
import EmployeeBottomNav from './EmployeeBottomNav';
import { supabase } from '../../../utils/supabase';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

const ADMIN_ROLES = ['ADMIN', 'OWNER', 'MANAGER'];

function AdminBadge({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const isSm = size === 'sm';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: isSm ? 3 : 4,
      fontSize: isSm ? 10 : 11, fontWeight: 700,
      padding: isSm ? '2px 7px' : '3px 9px',
      borderRadius: 6,
      background: 'linear-gradient(135deg, #07790F 0%, #18A022 100%)',
      color: '#fff',
      letterSpacing: '0.02em',
      boxShadow: '0 1px 3px rgba(7,121,15,0.35)',
    }}>
      <ShieldCheck size={isSm ? 9 : 10} strokeWidth={2.5} />
      관리자
    </span>
  );
}

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
  updated_at: string;
  username?: string;
  writer_name?: string;
  writer_role?: string;
  is_pinned?: string;
  status?: string;
}

interface BoardCommentVO {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  username?: string;
  user_name?: string;
  user_role?: string;
}

interface PostItem extends BoardPostVO {
  categoryName: string;
  isNew: boolean;
}

const CHIP_COLORS = [
  { bg: '#E6F5C8', color: '#07790F' },
  { bg: 'rgba(24,160,34,0.12)', color: '#18A022' },
  { bg: 'rgba(7,121,15,0.1)', color: '#07790F' },
  { bg: '#D2FF79', color: '#07790F' },
  { bg: 'rgba(24,160,34,0.2)', color: '#07790F' },
  { bg: '#C8F0C8', color: '#07790F' },
];

const formatDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const checkIsNew = (s: string) => {
  if (!s) return false;
  return (new Date().getTime() - new Date(s).getTime()) / 86400000 <= 7;
};

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

interface CommentItemProps {
  comment: BoardCommentVO;
  isDark: boolean;
  currentUserId: string;
  currentUserRole: string;
  isAdmin: boolean;
  userRoleMap: Record<string, string>;
  adminUserIds: Set<string>;
  onDelete: (c: BoardCommentVO) => void;
  onUpdate: (c: BoardCommentVO, text: string) => void;
}

function CommentItem({ comment: c, isDark, currentUserId, currentUserRole, isAdmin, userRoleMap, adminUserIds, onDelete, onUpdate }: CommentItemProps) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(c.content);

  const role = c.user_role
    || (c.user_id === currentUserId ? currentUserRole : '')
    || userRoleMap[c.user_id]
    || '';
  const cIsAdmin = !!(role && ADMIN_ROLES.includes(role.toUpperCase())) || adminUserIds.has(c.user_id);
  const canEdit = c.user_id === currentUserId;
  const canDelete = c.user_id === currentUserId || isAdmin;

  const save = () => {
    if (!draft.trim() || draft.trim() === c.content) { setEditing(false); return; }
    onUpdate(c, draft.trim());
    setEditing(false);
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: '10px 14px',
      background: cIsAdmin
        ? (isDark ? 'rgba(7,121,15,0.12)' : 'rgba(230,245,200,0.6)')
        : (isDark ? 'rgba(255,255,255,0.04)' : 'rgba(240,250,240,0.8)'),
      border: `1px solid ${cIsAdmin ? 'rgba(0,162,0,0.3)' : 'rgba(0,162,0,0.1)'}`,
      borderRadius: 12,
    }}>
      {/* 작성자 행 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {cIsAdmin && <AdminBadge size="sm" />}
          <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? '#aaa' : '#5a8a5c' }}>
            {c.user_name || c.username || c.user_id}
          </span>
          <span style={{ fontSize: 11, color: '#aaa' }}>{formatDate(c.created_at)}</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {canEdit && !editing && (
            <button
              onClick={() => { setDraft(c.content); setEditing(true); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: DARK_GREEN, padding: '0 3px' }}
            >
              <Edit size={12} />
            </button>
          )}
          {canDelete && !editing && (
            <button
              onClick={() => onDelete(c)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '0 3px' }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* 본문 or 편집창 */}
      {editing ? (
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
            style={{
              flex: 1, padding: '6px 10px', borderRadius: 8, fontSize: 14,
              border: `1.5px solid ${BORDER_GREEN}`,
              background: isDark ? '#1e1e1e' : '#fff',
              color: isDark ? '#fff' : '#333', outline: 'none',
            }}
          />
          <button onClick={save} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: GREEN, color: '#fff', border: 'none', cursor: 'pointer' }}>저장</button>
          <button onClick={() => setEditing(false)} style={{ padding: '6px 10px', borderRadius: 8, fontSize: 13, background: 'none', border: `1px solid #ccc`, color: '#888', cursor: 'pointer' }}>취소</button>
        </div>
      ) : (
        <p style={{ fontSize: 14, color: isDark ? '#ddd' : '#333', margin: 0, lineHeight: 1.5 }}>
          {c.content}
        </p>
      )}
    </div>
  );
}

// 글쓰기/수정 모달
interface PostModalProps {
  isDark: boolean;
  boards: BoardVO[];
  initialBoardId: string;
  initialTitle: string;
  initialContent: string;
  isEdit: boolean;
  onClose: () => void;
  onSubmit: (boardId: string, title: string, content: string, files: File[]) => Promise<void>;
}

function PostModal({ isDark, boards, initialBoardId, initialTitle, initialContent, isEdit, onClose, onSubmit }: PostModalProps) {
  const [boardId, setBoardId] = useState(initialBoardId);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [files, setFiles] = useState<File[]>([]);
  const [saving, setSaving] = useState(false);
  const fileInputId = 'employee-post-file-input';

  const handleSubmit = async () => {
    if (!boardId || !title.trim()) return;
    setSaving(true);
    try {
      await onSubmit(boardId, title, content, files);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '0 20px',
    }}>
      <div style={{
        background: isDark ? '#141414' : '#fff',
        borderRadius: 24, width: '100%', maxWidth: 600,
        padding: '28px 28px 24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? '#fff' : '#111', margin: 0 }}>
            {isEdit ? '게시글 수정' : '글쓰기'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', padding: 4 }}>
            <X size={22} />
          </button>
        </div>

        {/* 게시판 선택 (수정 시 비활성화) */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#aaa' : '#555', display: 'block', marginBottom: 6 }}>게시판</label>
          <select value={boardId} onChange={e => setBoardId(e.target.value)} disabled={isEdit}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 15,
              border: `1.5px solid ${BORDER_GREEN}`,
              background: isDark ? '#1e1e1e' : '#f9fdf9',
              color: isDark ? '#fff' : '#111', outline: 'none',
              opacity: isEdit ? 0.6 : 1,
            }}
          >
            {boards.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>

        {/* 제목 */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#aaa' : '#555', display: 'block', marginBottom: 6 }}>제목</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="제목을 입력하세요"
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 15,
              border: `1.5px solid ${BORDER_GREEN}`,
              background: isDark ? '#1e1e1e' : '#f9fdf9',
              color: isDark ? '#fff' : '#111', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 내용 */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#aaa' : '#555', display: 'block', marginBottom: 6 }}>내용</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="내용을 입력하세요" rows={6}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 15,
              border: `1.5px solid ${BORDER_GREEN}`,
              background: isDark ? '#1e1e1e' : '#f9fdf9',
              color: isDark ? '#fff' : '#111', outline: 'none', resize: 'vertical',
              boxSizing: 'border-box', fontFamily: 'inherit',
            }}
          />
        </div>

        {/* 파일 첨부 */}
        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#aaa' : '#555', display: 'block', marginBottom: 6 }}>첨부파일</span>
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault();
              if (e.dataTransfer.files.length > 0) {
                setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
              }
            }}
            style={{
              position: 'relative',
              display: 'flex', alignItems: 'center', gap: 8,
              border: `1.5px dashed ${BORDER_GREEN}`, borderRadius: 12,
              padding: '14px 16px',
              background: isDark ? 'rgba(0,162,0,0.05)' : '#f0faf0',
              color: DARK_GREEN, fontSize: 14, fontWeight: 600,
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
                if (filesArray.length > 0) setFiles(prev => [...prev, ...filesArray]);
              }}
            />
            <Paperclip size={16} /> 파일 선택 또는 드래그
          </div>
          {files.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              {files.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 12px', background: isDark ? '#1e1e1e' : '#f0faf0', borderRadius: 8, fontSize: 14,
                }}>
                  <span style={{ color: isDark ? '#fff' : '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📄 {f.name}</span>
                  <button onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999', flexShrink: 0, padding: '0 0 0 8px' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose}
            style={{
              padding: '10px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600,
              background: 'none', border: `1px solid ${BORDER_GREEN}`,
              color: DARK_GREEN, cursor: 'pointer',
            }}
          >취소</button>
          <button onClick={handleSubmit} disabled={saving || !title.trim() || !boardId}
            style={{
              padding: '10px 24px', borderRadius: 12, fontSize: 15, fontWeight: 600,
              background: saving ? '#aaa' : GREEN, color: '#fff', border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >{saving ? '처리 중...' : isEdit ? '저장' : '등록'}</button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeBoard() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.employeeBoard[language];
  const [storeId, setStoreId] = useState(sessionStorage.getItem('store_id') || '');
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const isAdmin = ADMIN_ROLES.includes(currentUser.role?.toUpperCase?.() ?? '');

  const [boards, setBoards] = useState<BoardVO[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  // store_id 없으면 /store/my로 가져오기
  useEffect(() => {
    if (storeId || !currentUser.id) return;
    axiosInstance.get('/store/my', { params: { user_id: currentUser.id } })
      .then(res => {
        if (res.data?.id) {
          sessionStorage.setItem('store_id', res.data.id);
          setStoreId(res.data.id);
        } else {
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, []);
  const [selectedBoardId, setSelectedBoardId] = useState<string>('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  // writer_id → role 매핑 (기존 게시글 관리자 뱃지용)
  const [userRoleMap, setUserRoleMap] = useState<Record<string, string>>({});

  // 댓글
  const [comments, setComments] = useState<BoardCommentVO[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);

  // 모달 상태
  const [modal, setModal] = useState<{
    open: boolean;
    isEdit: boolean;
    post?: PostItem;
  }>({ open: false, isEdit: false });

  const colorMap = useMemo(() => {
    const map: Record<string, { bg: string; color: string }> = {};
    boards.forEach((b, i) => { map[b.id] = CHIP_COLORS[i % CHIP_COLORS.length]; });
    return map;
  }, [boards]);

  // 스토어 사용자 역할 매핑 (writer_id → role)
  useEffect(() => {
    if (!storeId) return;
    axiosInstance.get('/users', { params: { store_id: storeId } })
      .then(res => {
        const users: { id: string; role: string }[] = Array.isArray(res.data) ? res.data : [];
        const map: Record<string, string> = {};
        users.forEach(u => { if (u.id && u.role) map[u.id] = u.role; });
        setUserRoleMap(map);
      })
      .catch(() => {});
  }, [storeId]);

  const fetchPosts = () => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    axiosInstance.get('/board', { params: { store_id: storeId } })
      .then(res => {
        const boardList: BoardVO[] = Array.isArray(res.data) ? res.data : [];
        setBoards(boardList);
        return Promise.all(
          boardList.map(board =>
            axiosInstance.get('/board/post', { params: { board_id: board.id } })
              .then(r => {
                const list: BoardPostVO[] = Array.isArray(r.data) ? r.data : [];
                return list.map(p => ({ ...p, categoryName: board.name, isNew: checkIsNew(p.created_at) }));
              })
              .catch(() => [] as PostItem[])
          )
        );
      })
      .then(results => {
        const all = results.flat().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setPosts(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPosts(); }, [storeId]);

  const filtered = useMemo(() =>
    !selectedBoardId ? posts : posts.filter(p => p.board_id === selectedBoardId),
    [posts, selectedBoardId]
  );

  const selectedPost = posts.find(p => p.id === selectedPostId) ?? null;
  const isDetail = selectedPostId !== null;
  const currentIdx = posts.findIndex(p => p.id === selectedPostId);
  const prevPost = currentIdx > 0 ? posts[currentIdx - 1] : null;
  const nextPost = currentIdx < posts.length - 1 ? posts[currentIdx + 1] : null;

  const canEdit = (post: BoardPostVO) => isAdmin || post.writer_id === currentUser.id;

  // 게시판 생성자 ID 집합 (어드민 판별 fallback)
  const boardCreatorIds = useMemo(() => new Set(boards.map(b => b.created_by)), [boards]);

  const isAdminPost = (post: BoardPostVO) => {
    const role = post.writer_role || userRoleMap[post.writer_id] || '';
    if (role) return ADMIN_ROLES.includes(role.toUpperCase());
    return boardCreatorIds.has(post.writer_id);
  };

  const uploadFiles = async (files: File[]): Promise<string[]> => {
    const links: string[] = [];
    for (const file of files) {
      const ext = file.name.includes('.') ? `.${file.name.split('.').pop()}` : '';
      const safeName = `${Date.now()}${ext}`;
      const path = `board/${currentUser.id || 'unknown'}/${safeName}`;
      const { error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
      if (error) throw new Error(`${file.name}: ${error.message}`);
      links.push(`[${file.name}](SUPABASE:${path})`);
    }
    return links;
  };

  const buildContent = async (baseContent: string, files: File[]): Promise<{ content: string; uploadError?: string }> => {
    if (files.length === 0) return { content: baseContent };
    try {
      const fileLinks = await uploadFiles(files);
      return { content: baseContent + '\n\n---\n📎 첨부파일\n' + fileLinks.map(l => `- ${l}`).join('\n') };
    } catch (e: any) {
      return { content: baseContent, uploadError: e.message };
    }
  };

  const handleCreate = async (boardId: string, title: string, baseContent: string, files: File[]) => {
    const { content, uploadError } = await buildContent(baseContent, files);
    await axiosInstance.post('/board/post', {
      board_id: boardId,
      store_id: storeId,
      writer_id: currentUser.id,
      writer_role: currentUser.role || '',
      title: title.trim(),
      content,
    });
    setModal({ open: false, isEdit: false });
    fetchPosts();
    if (uploadError) alert(`게시글은 등록됐지만 파일 업로드 실패:\n${uploadError}`);
  };

  const handleEdit = async (boardId: string, title: string, baseContent: string, files: File[]) => {
    if (!modal.post) return;
    const { content, uploadError } = await buildContent(baseContent, files);
    await fetch(`${API_BASE}/board/post`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...modal.post, title: title.trim(), content }),
    });
    setModal({ open: false, isEdit: false });
    setSelectedPostId(null);
    fetchPosts();
    if (uploadError) alert(`수정됐지만 파일 업로드 실패:\n${uploadError}`);
  };

  const handleDelete = async (post: PostItem) => {
    if (!confirm(`"${post.title}" 게시글을 삭제하시겠습니까?`)) return;
    setPosts(prev => prev.filter(p => p.id !== post.id));
    setSelectedPostId(null);
    await fetch(`${API_BASE}/board/post?id=${post.id}`, { method: 'DELETE' });
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const res = await fetch(`${API_BASE}/board/comment?post_id=${postId}`);
      const data = await res.json();
      const list: BoardCommentVO[] = Array.isArray(data) ? data : [];
      setComments(list.map(c => ({ ...c, user_role: c.user_role || userRoleMap[c.user_id] || '' })));
    } catch { setComments([]); }
    finally { setLoadingComments(false); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPost) return;
    const text = commentText.trim();
    setCommentText('');
    await fetch(`${API_BASE}/board/comment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'CMT_' + Date.now(),
        post_id: selectedPost.id,
        store_id: storeId,
        user_id: currentUser.id || '',
        user_role: currentUser.role || '',
        content: text,
      }),
    });
    await fetchComments(selectedPost.id);
  };

  const handleDeleteComment = async (comment: BoardCommentVO) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;
    setComments(prev => prev.filter(c => c.id !== comment.id));
    await fetch(`${API_BASE}/board/comment?id=${comment.id}&post_id=${comment.post_id}&user_id=${currentUser.id || ''}`, { method: 'DELETE' });
  };

  const handleUpdateComment = async (comment: BoardCommentVO, newContent: string) => {
    if (!newContent.trim()) return;
    setComments(prev => prev.map(c => c.id === comment.id ? { ...c, content: newContent.trim() } : c));
    await fetch(`${API_BASE}/board/comment`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...comment, content: newContent.trim() }),
    });
  };

  // 상세 진입 시 댓글 로드
  React.useEffect(() => {
    if (selectedPostId) {
      setComments([]);
      fetchComments(selectedPostId);
    }
  }, [selectedPostId]);

  const cardBg = isDark ? '#141414' : 'rgba(255,255,255,0.8)';
  const textColor = isDark ? '#fff' : '#333';

  // 모달 열기 시 기본 board_id: 수정일 때 해당 게시글 board, 작성일 때 선택된 탭 or 첫 번째
  const modalInitialBoardId = modal.isEdit
    ? (modal.post?.board_id ?? '')
    : (selectedBoardId || (boards[0]?.id ?? ''));
  const modalInitialTitle = modal.isEdit ? (modal.post?.title ?? '') : '';
  const modalInitialContent = modal.isEdit
    ? parseContent(modal.post?.content ?? '').body
    : '';

  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
        : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)',
      paddingBottom: 120,
    }}>
      <EmployeeHeader>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB' }}>{t.title}</h1>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t.subtitle}</p>
        </div>
      </EmployeeHeader>

      {/* 카테고리 칩 */}
      <div style={{ padding: '12px 40px' }}>
        <div style={{
          display: 'grid', gap: 6,
          gridTemplateColumns: `repeat(${boards.length + 1}, minmax(0, 1fr))`,
        }}>
          {[{ id: '', name: t.allCategory }, ...boards].map(b => {
            const active = selectedBoardId === b.id;
            return (
              <button key={b.id || '__all__'} onClick={() => { setSelectedBoardId(b.id); setSelectedPostId(null); }}
                style={{
                  padding: '10px 0', borderRadius: 54, fontSize: 15, fontWeight: 600,
                  border: active ? 'none' : `1px solid ${BORDER_GREEN}`,
                  background: active ? DARK_GREEN : 'transparent',
                  color: active ? '#fff' : DARK_GREEN, cursor: 'pointer',
                }}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* 목록 뷰 */}
      {!isDetail && (
        <>
          <div style={{ padding: '0 40px 12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setModal({ open: true, isEdit: false })}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 20px', borderRadius: 54, fontSize: 15, fontWeight: 600,
                background: GREEN, color: '#fff', border: 'none', cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(24,160,34,0.3)',
              }}
            >
              <Plus size={16} /> 글쓰기
            </button>
          </div>

          <div style={{ padding: '0 40px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '48px 0', color: '#888', fontSize: 16 }}>{t.loading}</p>
            ) : filtered.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '48px 0', color: '#888', fontSize: 16 }}>{t.noPosts}</p>
            ) : (
              filtered.map(post => {
                const chipStyle = colorMap[post.board_id] ?? { bg: LIGHT_GREEN, color: DARK_GREEN };
                return (
                  <button key={post.id} onClick={() => setSelectedPostId(post.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '14px 16px', textAlign: 'left', width: '100%',
                      background: cardBg, border: '1px solid rgba(0,162,0,0.12)',
                      borderRadius: 16, cursor: 'pointer',
                      boxShadow: '0px 2px 6px rgba(0,0,0,0.04)',
                    }}
                  >
                    <span style={{
                      flexShrink: 0, fontSize: 13, fontWeight: 600,
                      padding: '4px 12px', borderRadius: 20,
                      background: chipStyle.bg, color: chipStyle.color, whiteSpace: 'nowrap',
                    }}>
                      {post.categoryName}
                    </span>
                    {isAdminPost(post) && <AdminBadge />}
                    <span style={{
                      flex: 1, fontSize: 16, color: textColor,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {post.title}
                    </span>
                    {post.isNew && (
                      <span style={{
                        flexShrink: 0, fontSize: 12, fontWeight: 700,
                        padding: '3px 10px', borderRadius: 20,
                        background: GREEN, color: '#fff',
                      }}>NEW</span>
                    )}
                    <span style={{ flexShrink: 0, fontSize: 13, color: '#5a8a5c' }}>
                      {formatDate(post.created_at)}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </>
      )}

      {/* 상세 뷰 */}
      {isDetail && selectedPost && (
        <div>
          <button onClick={() => setSelectedPostId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '12px 40px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 16, color: DARK_GREEN, fontWeight: 600,
            }}
          >
            <ChevronLeft size={16} />{t.backToList}
          </button>

          <div style={{ padding: '0 40px 24px' }}>
            <div style={{
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${BORDER_GREEN}`,
              borderRadius: 26, padding: '20px 20px',
              boxShadow: '0px 4px 12px rgba(0,162,0,0.08)',
            }}>
              {/* 헤더 행: 뱃지 + 수정/삭제 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {(() => {
                    const chipStyle = colorMap[selectedPost.board_id] ?? { bg: LIGHT_GREEN, color: DARK_GREEN };
                    return (
                      <span style={{
                        fontSize: 13, fontWeight: 600, padding: '4px 14px', borderRadius: 20,
                        background: chipStyle.bg, color: chipStyle.color,
                      }}>
                        {selectedPost.categoryName}
                      </span>
                    );
                  })()}
                  {isAdminPost(selectedPost) && <AdminBadge />}
                  {selectedPost.isNew && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                      background: GREEN, color: '#fff',
                    }}>NEW</span>
                  )}
                </div>
                {/* 수정/삭제 버튼 (본인 글 or 어드민) */}
                {canEdit(selectedPost) && (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setModal({ open: true, isEdit: true, post: selectedPost })}
                      style={{
                        background: 'none', border: `1px solid ${BORDER_GREEN}`,
                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: DARK_GREEN,
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600,
                      }}
                    >
                      <Edit size={13} /> 수정
                    </button>
                    <button
                      onClick={() => handleDelete(selectedPost)}
                      style={{
                        background: 'none', border: '1px solid #EF4444',
                        borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: '#EF4444',
                        display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600,
                      }}
                    >
                      <Trash2 size={13} /> 삭제
                    </button>
                  </div>
                )}
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 700, color: isDark ? '#fff' : '#111', marginBottom: 12, lineHeight: 1.4 }}>
                {selectedPost.title}
              </h2>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#5a8a5c',
                paddingBottom: 16, borderBottom: '1px solid rgba(0,162,0,0.15)', marginBottom: 16,
              }}>
                <span>{selectedPost.writer_name || selectedPost.writer_id}</span>
                <span>·</span>
                <span>{formatDate(selectedPost.created_at)}</span>
              </div>

              {(() => {
                const { body, attachments } = parseContent(selectedPost.content);
                return (
                  <>
                    <p style={{ fontSize: 16, color: isDark ? '#fff' : '#333', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                      {body}
                    </p>
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
                  </>
                );
              })()}
            </div>

            {/* 댓글 섹션 */}
            <div style={{
              marginTop: 12,
              background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
              border: `1px solid ${BORDER_GREEN}`,
              borderRadius: 20, padding: '18px 20px',
              boxShadow: '0px 2px 8px rgba(0,162,0,0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                <MessageSquare size={15} color={DARK_GREEN} />
                <span style={{ fontSize: 14, fontWeight: 700, color: DARK_GREEN }}>
                  댓글 {comments.length}
                </span>
              </div>

              {/* 댓글 입력 */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <div style={{
                  flex: 1, display: 'flex', alignItems: 'center',
                  background: isDark ? '#141414' : '#f0faf0',
                  border: `1.5px solid ${BORDER_GREEN}`, borderRadius: 12,
                  padding: '0 14px', gap: 8,
                }}>
                  {isAdminPost({ ...selectedPost, writer_id: currentUser.id }) && isAdmin && (
                    <AdminBadge size="sm" />
                  )}
                  <input
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment(); } }}
                    placeholder="댓글을 입력하세요..."
                    style={{
                      flex: 1, border: 'none', background: 'transparent',
                      fontSize: 14, color: isDark ? '#fff' : '#333',
                      padding: '10px 0', outline: 'none',
                    }}
                  />
                </div>
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  style={{
                    width: 42, height: 42, borderRadius: 12, border: 'none',
                    background: commentText.trim() ? GREEN : '#ccc',
                    color: '#fff', cursor: commentText.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Send size={16} />
                </button>
              </div>

              {/* 댓글 목록 */}
              {loadingComments ? (
                <p style={{ fontSize: 13, color: '#888', textAlign: 'center', padding: '8px 0' }}>불러오는 중...</p>
              ) : comments.length === 0 ? (
                <p style={{ fontSize: 13, color: '#aaa', textAlign: 'center', padding: '8px 0' }}>첫 댓글을 남겨보세요</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {comments.map(c => (
                    <CommentItem
                      key={c.id}
                      comment={c}
                      isDark={isDark}
                      currentUserId={currentUser.id}
                      currentUserRole={currentUser.role || ''}
                      isAdmin={isAdmin}
                      userRoleMap={userRoleMap}
                      adminUserIds={boardCreatorIds}
                      onDelete={handleDeleteComment}
                      onUpdate={handleUpdateComment}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 이전글 / 다음글 */}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {prevPost && (
                <button onClick={() => setSelectedPostId(prevPost.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,162,0,0.12)',
                    borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <ChevronLeft size={16} style={{ color: DARK_GREEN, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: '#5a8a5c', marginBottom: 2 }}>{t.nextPost}</p>
                    <p style={{ fontSize: 15, color: DARK_GREEN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prevPost.title}</p>
                  </div>
                </button>
              )}
              {nextPost && (
                <button onClick={() => setSelectedPostId(nextPost.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,162,0,0.12)',
                    borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <ChevronRight size={16} style={{ color: DARK_GREEN, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: '#5a8a5c', marginBottom: 2 }}>{t.prevPost}</p>
                    <p style={{ fontSize: 15, color: DARK_GREEN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{nextPost.title}</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 글쓰기 / 수정 모달 */}
      {modal.open && (
        <PostModal
          isDark={isDark}
          boards={boards}
          initialBoardId={modalInitialBoardId}
          initialTitle={modalInitialTitle}
          initialContent={modalInitialContent}
          isEdit={modal.isEdit}
          onClose={() => setModal({ open: false, isEdit: false })}
          onSubmit={modal.isEdit ? handleEdit : handleCreate}
        />
      )}

      <EmployeeBottomNav />
    </div>
  );
}
