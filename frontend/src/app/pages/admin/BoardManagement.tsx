import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
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
  Image,
  Paperclip
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import ProfilePanel from './ProfilePanel';

interface BoardPost {
  id: string;
  title: string;
  content: string;
  category: 'notice' | 'event' | 'update' | 'urgent' | 'general';
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  isPinned: boolean;
  views: number;
  comments: number;
  targetAudience: 'all' | 'employees' | 'managers' | 'specific_location';
  location?: string;
  attachments?: string[];
  status: 'published' | 'draft' | 'archived';
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
  const { branchId } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('published');
  const [selectedPost, setSelectedPost] = useState<BoardPost | null>(null);
  const [showPostModal, setShowPostModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Mock data - 게시글 목록
  const [posts, setPosts] = useState<BoardPost[]>([
    {
      id: 'POST001',
      title: '3월 급여 지급 안내',
      content: '3월 급여는 3월 31일에 지급될 예정입니다. 주급 요청은 28일까지 가능합니다.',
      category: 'notice',
      author: '관리자',
      authorId: 'ADMIN001',
      createdAt: '2024-03-15 10:00',
      isPinned: true,
      views: 156,
      comments: 8,
      targetAudience: 'all',
      status: 'published'
    },
    {
      id: 'POST002',
      title: '[긴급] 강남점 주말 근무 인원 모집',
      content: '3월 23-24일 주말 근무 가능한 분을 긴급 모집합니다. 시급 +20% 추가 지급됩니다.',
      category: 'urgent',
      author: '김민수',
      authorId: 'EMP001',
      createdAt: '2024-03-20 14:30',
      isPinned: true,
      views: 89,
      comments: 15,
      targetAudience: 'specific_location',
      location: '강남점',
      status: 'published'
    },
    {
      id: 'POST003',
      title: '위생교육 일정 안내',
      content: '2024년 상반기 위생교육이 4월 5일에 진행됩니다. 전 직원 필수 참석입니다.',
      category: 'event',
      author: '관리자',
      authorId: 'ADMIN001',
      createdAt: '2024-03-18 09:00',
      isPinned: false,
      views: 124,
      comments: 3,
      targetAudience: 'all',
      attachments: ['교육자료.pdf'],
      status: 'published'
    },
    {
      id: 'POST004',
      title: '새로운 메뉴 출시 안내',
      content: '다음 주부터 봄 시즌 신메뉴가 출시됩니다. 조리법 교육은 월요일에 진행됩니다.',
      category: 'update',
      author: '박철수',
      authorId: 'EMP003',
      createdAt: '2024-03-19 16:20',
      isPinned: false,
      views: 67,
      comments: 12,
      targetAudience: 'employees',
      status: 'published'
    },
    {
      id: 'POST005',
      title: '직원 복지 개선 사항',
      content: '직원 식사 제공 시간이 변경되었습니다. 자세한 내용은 본문을 확인해주세요.',
      category: 'notice',
      author: '관리자',
      authorId: 'ADMIN001',
      createdAt: '2024-03-17 11:00',
      isPinned: false,
      views: 203,
      comments: 25,
      targetAudience: 'all',
      status: 'published'
    },
    {
      id: 'POST006',
      title: '임시 저장 - 4월 이벤트',
      content: '4월 프로모션 이벤트 준비 중...',
      category: 'event',
      author: '관리자',
      authorId: 'ADMIN001',
      createdAt: '2024-03-21 15:00',
      isPinned: false,
      views: 0,
      comments: 0,
      targetAudience: 'all',
      status: 'draft'
    }
  ]);

  const categories = [
    { value: 'all', label: '전체', color: 'gray' },
    { value: 'notice', label: '공지사항', color: 'blue' },
    { value: 'event', label: '이벤트', color: 'green' },
    { value: 'update', label: '업데이트', color: 'purple' },
    { value: 'urgent', label: '긴급', color: 'red' },
    { value: 'general', label: '일반', color: 'gray' }
  ];

  const filteredPosts = posts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || post.category === filterCategory;
    const matchesStatus = post.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryBadge = (category: string) => {
    const cat = categories.find(c => c.value === category);
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-100 text-blue-700',
      green: 'bg-green-100 text-green-700',
      purple: 'bg-purple-100 text-purple-700',
      red: 'bg-red-100 text-red-700',
      gray: 'bg-gray-100 text-gray-700'
    };
    return (
      <Badge className={colorMap[cat?.color || 'gray']} variant="outline">
        {cat?.label || category}
      </Badge>
    );
  };

  const getTargetAudienceBadge = (audience: string, location?: string) => {
    const labels: { [key: string]: string } = {
      all: '전체',
      employees: '직원',
      managers: '매니저',
      specific_location: location || '특정 매장'
    };
    return <Badge variant="outline">{labels[audience]}</Badge>;
  };

  const calculateStats = () => {
    const total = posts.filter(p => p.status === 'published').length;
    const pinned = posts.filter(p => p.isPinned && p.status === 'published').length;
    const drafts = posts.filter(p => p.status === 'draft').length;
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
    setPosts(posts.map(post =>
      post.id === postId ? { ...post, isPinned: !post.isPinned } : post
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/admin/dashboard/${branchId}`)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              대시보드로 돌아가기
            </Button>
            <ProfilePanel />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">게시판 관리</h1>
              <p className="text-gray-600 mt-1">공지사항 및 소식 관리</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                푸시 알림
              </Button>
              <Button onClick={handleCreatePost}>
                <Plus className="w-4 h-4 mr-2" />
                게시글 작성
              </Button>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">전체 게시글</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">고정 게시글</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.pinned}</p>
                </div>
                <Pin className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">임시 저장</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.drafts}</p>
                </div>
                <Edit className="w-8 h-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 조회수</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalViews}</p>
                </div>
                <Eye className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">총 댓글</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalComments}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filterStatus === 'published' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('published')}
          >
            게시됨
          </Button>
          <Button
            variant={filterStatus === 'draft' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('draft')}
          >
            임시 저장
          </Button>
          <Button
            variant={filterStatus === 'archived' ? 'default' : 'outline'}
            onClick={() => setFilterStatus('archived')}
          >
            보관함
          </Button>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="제목 또는 내용으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>

              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="border rounded-lg px-3 py-2"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>

              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                필터
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        <div className="space-y-4">
          {filteredPosts.map(post => (
            <Card key={post.id} className={`hover:shadow-lg transition-shadow ${post.isPinned ? 'border-blue-500 border-2' : ''}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isPinned && <Pin className="w-4 h-4 text-blue-500" />}
                      {getCategoryBadge(post.category)}
                      {getTargetAudienceBadge(post.targetAudience, post.location)}
                    </div>

                    <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{post.content}</p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{post.createdAt}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{post.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </div>
                      {post.attachments && post.attachments.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Paperclip className="w-4 h-4" />
                          <span>{post.attachments.length}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => togglePin(post.id)}
                    >
                      <Pin className={`w-4 h-4 ${post.isPinned ? 'fill-current' : ''}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditPost(post)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Create/Edit Post Modal */}
        {showPostModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{isCreating ? '새 게시글 작성' : '게시글 수정'}</CardTitle>
                  <Button variant="ghost" onClick={() => setShowPostModal(false)}>
                    <AlertCircle className="w-5 h-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">제목</label>
                    <input
                      type="text"
                      placeholder="게시글 제목을 입력하세요"
                      className="w-full border rounded-lg px-3 py-2"
                      defaultValue={selectedPost?.title}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">카테고리</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        defaultValue={selectedPost?.category}
                      >
                        <option value="notice">공지사항</option>
                        <option value="event">이벤트</option>
                        <option value="update">업데이트</option>
                        <option value="urgent">긴급</option>
                        <option value="general">일반</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">대상</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        defaultValue={selectedPost?.targetAudience}
                      >
                        <option value="all">전체</option>
                        <option value="employees">직원</option>
                        <option value="managers">매니저</option>
                        <option value="specific_location">특정 매장</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">매장</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2"
                        defaultValue={selectedPost?.location}
                      >
                        <option value="">선택 안함</option>
                        <option value="강남점">강남점</option>
                        <option value="홍대점">홍대점</option>
                        <option value="신촌점">신촌점</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">내용</label>
                    <textarea
                      rows={10}
                      placeholder="게시글 내용을 입력하세요"
                      className="w-full border rounded-lg px-3 py-2"
                      defaultValue={selectedPost?.content}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">첨부파일</label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Paperclip className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">파일을 드래그하거나 클릭하여 업로드</p>
                      <Button size="sm" variant="outline" className="mt-2">
                        파일 선택
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="pinPost"
                      className="w-4 h-4"
                      defaultChecked={selectedPost?.isPinned}
                    />
                    <label htmlFor="pinPost" className="text-sm font-medium">
                      상단 고정
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4 border-t">
                    <Button className="flex-1">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      게시하기
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <Edit className="w-4 h-4 mr-2" />
                      임시 저장
                    </Button>
                    <Button variant="outline" onClick={() => setShowPostModal(false)}>
                      취소
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardManagement;
