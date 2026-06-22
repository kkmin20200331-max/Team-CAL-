import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Pin,
  Eye,
  MessageSquare,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Bell,
  FileText,
  Paperclip,
  UserPlus,
  Users,
  Wallet,
  BarChart3,
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import AdminHeader from './AdminHeader';
import { useTheme } from 'next-themes';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

interface BoardPost {
  id: string;
  title: string;
  content: string;
  category: "notice" | "event" | "update" | "urgent" | "general";
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  isPinned: boolean;
  views: number;
  comments: number;
  targetAudience: "all" | "employees" | "managers" | "specific_location";
  location?: string;
  attachments?: string[];
  status: "published" | "draft" | "archived";
}

interface Comment {
  id: string;
  postId: string;
  author: string;
  authorId: string;
  content: string;
  createdAt: string;
}

const BoardManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("published");
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const sidebarBg = isDark ? 'rgba(44,44,46,0.95)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#3a3a3c' : BORDER_GREEN;
  const textColor = isDark ? '#fff' : '#111';

  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`http://localhost:8080/api/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  const menuItems = [
    { icon: Calendar, label: '근무표 관리', path: `/admin/schedule/monthly/${branchId}` },
    { icon: UserPlus, label: '대타 모집', path: `/admin/substitute/${branchId}` },
    { icon: Users, label: '직원 관리', path: `/admin/employees/${branchId}` },
    { icon: Wallet, label: '급여 관리', path: `/admin/payroll/${branchId}` },
    { icon: FileText, label: '문서 관리', path: `/admin/documents/${branchId}` },
    { icon: MessageSquare, label: '게시판', path: `/admin/board/${branchId}` },
    { icon: BarChart3, label: 'AI 고객 분석', path: `/admin/analytics/${branchId}` },
  ];

  // Mock data - 게시글 목록
  const [posts, setPosts] = useState<BoardPost[]>([
    {
      id: "POST001",
      title: "3월 급여 지급 안내",
      content: "3월 급여는 3월 31일에 지급될 예정입니다. 주급 요청은 28일까지 가능합니다.",
      category: "notice",
      author: "관리자",
      authorId: "ADMIN001",
      createdAt: "2024-03-15 10:00",
      isPinned: true,
      views: 156,
      comments: 8,
      targetAudience: "all",
      status: "published",
    },
    {
      id: "POST002",
      title: "[긴급] 강남점 주말 근무 인원 모집",
      content: "3월 23-24일 주말 근무 가능한 분을 긴급 모집합니다. 시급 +20% 추가 지급됩니다.",
      category: "urgent",
      author: "김민수",
      authorId: "EMP001",
      createdAt: "2024-03-20 14:30",
      isPinned: true,
      views: 89,
      comments: 15,
      targetAudience: "specific_location",
      location: "강남점",
      status: "published",
    },
    {
      id: "POST003",
      title: "위생교육 일정 안내",
      content: "2024년 상반기 위생교육이 4월 5일에 진행됩니다. 전 직원 필수 참석입니다.",
      category: "event",
      author: "관리자",
      authorId: "ADMIN001",
      createdAt: "2024-03-18 09:00",
      isPinned: false,
      views: 124,
      comments: 3,
      targetAudience: "all",
      attachments: ["교육자료.pdf"],
      status: "published",
    },
    {
      id: "POST004",
      title: "새로운 메뉴 출시 안내",
      content: "다음 주부터 봄 시즌 신메뉴가 출시됩니다. 조리법 교육은 월요일에 진행됩니다.",
      category: "update",
      author: "박철수",
      authorId: "EMP003",
      createdAt: "2024-03-19 16:20",
      isPinned: false,
      views: 67,
      comments: 12,
      targetAudience: "employees",
      status: "published",
    },
    {
      id: "POST005",
      title: "직원 복지 개선 사항",
      content: "직원 식사 제공 시간이 변경되었습니다. 자세한 내용은 본문을 확인해주세요.",
      category: "notice",
      author: "관리자",
      authorId: "ADMIN001",
      createdAt: "2024-03-17 11:00",
      isPinned: false,
      views: 203,
      comments: 25,
      targetAudience: "all",
      status: "published",
    },
    {
      id: "POST006",
      title: "임시 저장 - 4월 이벤트",
      content: "4월 프로모션 이벤트 준비 중...",
      category: "event",
      author: "관리자",
      authorId: "ADMIN001",
      createdAt: "2024-03-21 15:00",
      isPinned: false,
      views: 0,
      comments: 0,
      targetAudience: "all",
      status: "draft",
    },
  ]);

  const categories = [
    { value: "all", label: "전체", color: "gray" },
    { value: "notice", label: "공지사항", color: "blue" },
    { value: "event", label: "이벤트", color: "green" },
    { value: "update", label: "업데이트", color: "purple" },
    { value: "urgent", label: "긴급", color: "red" },
    { value: "general", label: "일반", color: "gray" },
  ];

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || post.category === filterCategory;
    const matchesStatus = post.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryBadge = (category: string) => {
    const cat = categories.find((c) => c.value === category);
    const colorMap: { [key: string]: string } = {
      blue: "bg-blue-100 text-blue-700",
      green: "bg-green-100 text-green-700",
      purple: "bg-purple-100 text-purple-700",
      red: "bg-red-100 text-red-700",
      gray: "bg-gray-100 text-gray-700",
    };
    return (
      <Badge className={colorMap[cat?.color || "gray"]} variant="outline">
        {cat?.label || category}
      </Badge>
    );
  };

  const getTargetAudienceBadge = (audience: string, location?: string) => {
    const labels: { [key: string]: string } = {
      all: "전체",
      employees: "직원",
      managers: "매니저",
      specific_location: location || "특정 매장",
    };
    return <Badge variant="outline">{labels[audience]}</Badge>;
  };

  const calculateStats = () => {
    const total = posts.filter((p) => p.status === "published").length;
    const pinned = posts.filter((p) => p.isPinned && p.status === "published").length;
    const drafts = posts.filter((p) => p.status === "draft").length;
    const totalViews = posts.reduce((sum, p) => sum + p.views, 0);
    const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
    return { total, pinned, drafts, totalViews, totalComments };
  };

  const stats = calculateStats();

  const handleCreatePost = () => {
    setIsCreating(true);
    setSelectedPost(null);
    setShowPostModal(true);
  };

  const handleEditPost = (post: BoardPost) => {
    setIsCreating(false);
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const togglePin = (postId: string) => {
    setPosts(posts.map((post) => post.id === postId ? { ...post, isPinned: !post.isPinned } : post));
  };

  return (
    <div style={{ minHeight: '100vh', background: pageBg, fontFamily: "'Bookk Gothic', 'Noto Sans KR', sans-serif" }}>
      <AdminHeader />

      <div style={{ display: 'flex', gap: 20, padding: '24px 40px 40px', alignItems: 'flex-start' }}>
        {/* Sidebar */}
        <aside style={{
          width: 220, flexShrink: 0,
          background: sidebarBg,
          border: `1px solid ${sidebarBorder}`,
          borderRadius: 20, padding: '20px 12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          position: 'sticky', top: 140,
          maxHeight: 'calc(100vh - 160px)',
          overflowY: 'auto',
        }}>
          <div style={{ position: 'relative', marginBottom: 18 }}>
            <button
              onClick={() => setBranchDropdownOpen(o => !o)}
              style={{
                width: '100%', padding: '10px 14px',
                background: isDark ? 'rgba(255,255,255,0.06)' : LIGHT_GREEN,
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : BORDER_GREEN}`,
                borderRadius: 12, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6,
                color: isDark ? '#fff' : DARK_GREEN, fontSize: 12, fontWeight: 700,
              }}
            >
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentBranch}</span>
              <svg width="10" height="6" viewBox="0 0 10 6" fill="none" style={{ flexShrink: 0, transform: branchDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                <path d="M1 1L5 5L9 1" stroke={isDark ? 'white' : DARK_GREEN} strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            {branchDropdownOpen && stores.length > 0 && (
              <div style={{
                position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50,
                background: isDark ? '#1c1c1e' : '#fff',
                border: `1px solid ${isDark ? '#3a3a3c' : BORDER_GREEN}`,
                borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
              }}>
                {stores.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      sessionStorage.setItem('store_id', s.id);
                      sessionStorage.setItem('store_name', s.name);
                      setBranchDropdownOpen(false);
                      navigate(`/admin/dashboard/${s.id}`);
                    }}
                    style={{
                      display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left',
                      background: s.id === branchId ? LIGHT_GREEN : 'transparent',
                      border: 'none', cursor: 'pointer',
                      color: isDark ? '#fff' : DARK_GREEN, fontSize: 13, fontWeight: 600,
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = LIGHT_GREEN; }}
                    onMouseOut={e => { e.currentTarget.style.background = s.id === branchId ? LIGHT_GREEN : 'transparent'; }}
                  >
                    {s.name}
                  </button>
                ))}
                <div style={{ borderTop: `1px solid ${isDark ? '#3a3a3c' : '#e5e7eb'}` }} />
                <button
                  onClick={() => { setBranchDropdownOpen(false); navigate('/admin/branch-selection'); }}
                  style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#888' : '#aaa', fontSize: 12 }}
                  onMouseOver={e => { e.currentTarget.style.background = isDark ? '#2c2c2e' : '#f5f5f5'; }}
                  onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  + 지점 선택 페이지로
                </button>
              </div>
            )}
          </div>

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '11px 14px', marginBottom: 4,
                  background: isActive ? GREEN : 'transparent',
                  border: 'none',
                  borderRadius: 12, cursor: 'pointer',
                  color: isActive ? '#fff' : (isDark ? '#ccc' : DARK_GREEN),
                  fontSize: 14, fontWeight: 600, textAlign: 'left',
                  transition: 'all 0.15s',
                  boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none',
                }}
                onMouseOver={e => { if (!isActive) { e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : LIGHT_GREEN; } }}
                onMouseOut={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; } }}
              >
                <item.icon size={16} color={isActive ? '#fff' : GREEN} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* Main white card */}
        <div style={{
          flex: 1, minWidth: 0,
          background: 'rgba(255,255,255,0.97)',
          borderRadius: 24,
          padding: '28px 28px 32px',
          boxShadow: '0px 8px 40px rgba(0,0,0,0.18)',
        }}>
          {/* Page title row */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 24, justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: 0 }}>게시판 관리</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <Bell size={16} />푸시 알림
              </button>
              <button onClick={handleCreatePost} style={{ display: 'flex', alignItems: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                <Plus size={16} />게시글 작성
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: '전체 게시글', value: stats.total, icon: <FileText size={20} color={DARK_GREEN} /> },
              { label: '고정 게시글', value: stats.pinned, icon: <Pin size={20} color="#3B82F6" /> },
              { label: '임시 저장', value: stats.drafts, icon: <Edit size={20} color="#F59E0B" /> },
              { label: '총 조회수', value: stats.totalViews, icon: <Eye size={20} color={GREEN} /> },
              { label: '총 댓글', value: stats.totalComments, icon: <MessageSquare size={20} color="#8B5CF6" /> },
            ].map(({ label, value, icon }) => (
              <div key={label} style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#8BA68D', margin: 0 }}>{label}</p>
                  {icon}
                </div>
                <p style={{ fontSize: 26, fontWeight: 800, color: DARK_GREEN, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[
              { key: 'published', label: '게시됨' },
              { key: 'draft', label: '임시 저장' },
              { key: 'archived', label: '보관함' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                style={{
                  padding: '10px 24px', borderRadius: 50, fontSize: 14, fontWeight: 700,
                  border: filterStatus === key ? 'none' : `1px solid ${BORDER_GREEN}`,
                  background: filterStatus === key ? GREEN : 'transparent',
                  color: filterStatus === key ? '#fff' : DARK_GREEN,
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search and Filters */}
          <div style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}`, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8BA68D' }} />
                <input
                  type="text"
                  placeholder="제목 또는 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor, boxSizing: 'border-box' }}
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor }}
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Posts List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                style={{
                  background: 'rgba(230,245,200,0.35)',
                  borderRadius: 16,
                  padding: '18px 20px',
                  border: post.isPinned ? `2px solid ${BORDER_GREEN}` : `1px solid ${LIGHT_GREEN}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      {post.isPinned && <Pin size={16} color={DARK_GREEN} />}
                      {getCategoryBadge(post.category)}
                      {getTargetAudienceBadge(post.targetAudience, post.location)}
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: textColor, margin: '0 0 6px' }}>{post.title}</h3>
                    <p style={{ fontSize: 14, color: '#8BA68D', margin: '0 0 10px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {post.content}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#8BA68D' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User size={14} />{post.author}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={14} />{post.createdAt}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={14} />{post.views}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageSquare size={14} />{post.comments}</div>
                      {post.attachments && post.attachments.length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Paperclip size={14} />{post.attachments.length}</div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>
                    <button
                      onClick={() => togglePin(post.id)}
                      style={{ background: post.isPinned ? LIGHT_GREEN : 'transparent', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: DARK_GREEN }}
                    >
                      <Pin size={14} />
                    </button>
                    <button
                      onClick={() => handleEditPost(post)}
                      style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: DARK_GREEN }}
                    >
                      <Edit size={14} />
                    </button>
                    <button style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: DARK_GREEN }}>
                      <Eye size={14} />
                    </button>
                    <button style={{ background: 'transparent', border: '1px solid #EF4444', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: '#EF4444' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Create/Edit Post Modal */}
          {showPostModal && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN, margin: 0 }}>{isCreating ? "새 게시글 작성" : "게시글 수정"}</p>
                  <button onClick={() => setShowPostModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8BA68D' }}><AlertCircle size={22} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>제목</label>
                    <input
                      type="text"
                      placeholder="게시글 제목을 입력하세요"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor, boxSizing: 'border-box' }}
                      defaultValue={selectedPost?.title}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>카테고리</label>
                      <select style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, outline: 'none', color: textColor }} defaultValue={selectedPost?.category}>
                        <option value="notice">공지사항</option>
                        <option value="event">이벤트</option>
                        <option value="update">업데이트</option>
                        <option value="urgent">긴급</option>
                        <option value="general">일반</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>대상</label>
                      <select style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, outline: 'none', color: textColor }} defaultValue={selectedPost?.targetAudience}>
                        <option value="all">전체</option>
                        <option value="employees">직원</option>
                        <option value="managers">매니저</option>
                        <option value="specific_location">특정 매장</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>매장</label>
                      <select style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, outline: 'none', color: textColor }} defaultValue={selectedPost?.location}>
                        <option value="">선택 안함</option>
                        <option value="강남점">강남점</option>
                        <option value="홍대점">홍대점</option>
                        <option value="신촌점">신촌점</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>내용</label>
                    <textarea
                      rows={10}
                      placeholder="게시글 내용을 입력하세요"
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor, resize: 'vertical', boxSizing: 'border-box' }}
                      defaultValue={selectedPost?.content}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>첨부파일</label>
                    <div style={{ border: `2px dashed ${BORDER_GREEN}`, borderRadius: 12, padding: 20, textAlign: 'center' }}>
                      <Paperclip size={28} color={DARK_GREEN} style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 13, color: '#8BA68D', marginBottom: 8 }}>파일을 드래그하거나 클릭하여 업로드</p>
                      <button style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '8px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>파일 선택</button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input type="checkbox" id="pinPost" style={{ width: 16, height: 16, accentColor: GREEN }} defaultChecked={selectedPost?.isPinned} />
                    <label htmlFor="pinPost" style={{ fontSize: 14, fontWeight: 600, color: textColor }}>상단 고정</label>
                  </div>
                  <div style={{ display: 'flex', gap: 10, paddingTop: 8, borderTop: `1px solid ${LIGHT_GREEN}` }}>
                    <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                      <CheckCircle size={16} />게시하기
                    </button>
                    <button style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      <Edit size={16} />임시 저장
                    </button>
                    <button onClick={() => setShowPostModal(false)} style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      취소
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BoardManagement;
