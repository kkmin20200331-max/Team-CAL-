import { useState } from 'react';
import EmployeeHeader from '../../components/employee/EmployeeHeader';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';
import {
  Home,
  Calendar,
  QrCode,
  Wallet,
  MessageSquare,
  Search,
  Pin,
  FileText,
  Image,
  Clock,
  Eye,
  ThumbsUp,
  MessageCircle,
  ChevronRight,
  Bell,
  Award,
  AlertCircle,
  Calendar as CalendarIcon,
  Users
} from 'lucide-react';

export default function EmployeeBoard() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [postDialogOpen, setPostDialogOpen] = useState(false);

  const announcements = [
    {
      id: 1,
      type: 'important',
      title: '6월 행사 일정 안내',
      content: '6월 중순 매장 리뉴얼 관련 일정을 공유드립니다.\n\n- 6/15: 임시 휴무\n- 6/16: 재오픈 이벤트\n\n해당 기간 근무 조정이 필요한 직원은 매니저에게 연락 바랍니다.',
      author: '홍길동 매니저',
      authorRole: '매니저',
      date: '2024-05-19',
      time: '10:30',
      isPinned: true,
      views: 45,
      likes: 12,
      comments: 3,
      hasAttachment: true
    },
    {
      id: 2,
      type: 'notice',
      title: '여름 휴가 신청 안내',
      content: '7-8월 여름 휴가 신청을 받습니다.\n\n신청 기간: 5/20 ~ 5/31\n휴가 가능 기간: 7/1 ~ 8/31\n\n연차가 남아있는 직원은 휴가 신청 메뉴에서 신청해주세요.',
      author: '김영희 매니저',
      authorRole: '매니저',
      date: '2024-05-18',
      time: '14:20',
      isPinned: true,
      views: 38,
      likes: 8,
      comments: 5
    },
    {
      id: 3,
      type: 'info',
      title: '신규 메뉴 출시 안내',
      content: '5월 23일부터 신규 여름 메뉴가 출시됩니다.\n\n- 망고 빙수\n- 딸기 라떼\n- 복숭아 스무디\n\n제조 방법은 별도 교육 예정입니다.',
      author: '박서준',
      authorRole: '직원',
      date: '2024-05-17',
      time: '16:45',
      isPinned: false,
      views: 52,
      likes: 15,
      comments: 8,
      hasImage: true
    }
  ];

  const generalPosts = [
    {
      id: 4,
      title: '5월 우수 직원 선정',
      content: '이번 달 우수 직원으로 이지영님이 선정되었습니다! 축하드립니다.\n\n- 근태: 무결점\n- 고객 만족도: 4.8/5.0\n- 동료 평가: 우수',
      author: '홍길동 매니저',
      authorRole: '매니저',
      date: '2024-05-16',
      time: '11:00',
      views: 67,
      likes: 23,
      comments: 12,
      category: 'award'
    },
    {
      id: 5,
      title: '주말 근무 교대 부탁드립니다',
      content: '5월 25일(토) 17:00-22:00 근무를 급한 일정으로 교대해주실 분 찾습니다.\n\n연락 주시면 감사하겠습니다!',
      author: '최유나',
      authorRole: '직원',
      date: '2024-05-15',
      time: '19:30',
      views: 28,
      likes: 2,
      comments: 4,
      category: 'request'
    },
    {
      id: 6,
      title: '신입 직원 환영합니다',
      content: '5월부터 미금점에 합류하신 정태현님을 환영합니다!\n\n많은 관심과 도움 부탁드립니다.',
      author: '홍길동 매니저',
      authorRole: '매니저',
      date: '2024-05-14',
      time: '09:00',
      views: 41,
      likes: 18,
      comments: 7,
      category: 'general'
    },
    {
      id: 7,
      title: '매장 청결 관리 협조 요청',
      content: '최근 고객 피드백에서 청결 관련 의견이 있었습니다.\n\n근무 시간 중 틈틈이 매장 정리 부탁드립니다.\n특히 테이블과 바닥 청소에 신경 써주세요.',
      author: '김영희 매니저',
      authorRole: '매니저',
      date: '2024-05-13',
      time: '15:20',
      views: 55,
      likes: 8,
      comments: 3,
      category: 'notice'
    }
  ];

  const quickLinks = [
    {
      icon: FileText,
      label: '근무 규정',
      count: null,
      color: 'bg-blue-500'
    },
    {
      icon: CalendarIcon,
      label: '행사 일정',
      count: 3,
      color: 'bg-purple-500'
    },
    {
      icon: Users,
      label: '직원 명단',
      count: null,
      color: 'bg-green-500'
    },
    {
      icon: Award,
      label: '우수 직원',
      count: null,
      color: 'bg-orange-500'
    }
  ];

  const handlePostClick = (post: any) => {
    setSelectedPost(post);
    setPostDialogOpen(true);
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case 'important':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'notice':
        return <Bell className="w-5 h-5 text-blue-500" />;
      case 'info':
        return <FileText className="w-5 h-5 text-green-500" />;
      default:
        return <MessageSquare className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'award':
        return <Badge className="bg-yellow-500">우수직원</Badge>;
      case 'request':
        return <Badge className="bg-orange-500">요청</Badge>;
      case 'notice':
        return <Badge className="bg-blue-500">공지</Badge>;
      default:
        return <Badge variant="secondary">일반</Badge>;
    }
  };

  const bottomNavItems = [
    { icon: Home, label: '홈', path: '/employee/home', active: false },
    { icon: Calendar, label: '근무표', path: '/employee/schedule', active: false },
    { icon: QrCode, label: '체크인', path: '/employee/checkin', active: false },
    { icon: Wallet, label: '급여', path: '/employee/payroll', active: false },
    { icon: MessageSquare, label: '게시판', path: '/employee/board', active: true }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-20">
      {/* Header */}
      <EmployeeHeader>
        <div>
          <h1 className="text-2xl font-bold">게시판</h1>
          <p className="text-blue-100 text-sm mt-1">공지사항과 소식을 확인하세요</p>
        </div>
      </EmployeeHeader>

      <div className="px-4 py-4">
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="게시물 검색..."
            className="pl-10"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {quickLinks.map((link, index) => (
            <button
              key={index}
              className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`${link.color} w-10 h-10 rounded-full flex items-center justify-center relative`}>
                <link.icon className="w-5 h-5 text-white" />
                {link.count && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {link.count}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium text-center">{link.label}</span>
            </button>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="announcements" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="announcements">
              공지사항 ({announcements.length})
            </TabsTrigger>
            <TabsTrigger value="general">
              일반 게시판 ({generalPosts.length})
            </TabsTrigger>
          </TabsList>

          {/* Announcements */}
          <TabsContent value="announcements" className="space-y-3">
            {announcements.map((post) => (
              <Card
                key={post.id}
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  post.isPinned ? 'border-2 border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10' : ''
                }`}
                onClick={() => handlePostClick(post)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getPostIcon(post.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {post.isPinned && (
                              <Pin className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                            )}
                            <h3 className="font-bold text-base line-clamp-1">{post.title}</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {post.content.split('\n')[0]}
                          </p>
                        </div>
                        {post.hasImage && (
                          <div className="ml-3 w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Image className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="text-xs bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                              {post.author[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{post.author}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{post.date} {post.time}</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>

                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {post.views}
                        </span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3 h-3" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3 h-3" />
                          {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* General Board */}
          <TabsContent value="general" className="space-y-3">
            {generalPosts.map((post) => (
              <Card
                key={post.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handlePostClick(post)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryBadge(post.category)}
                      </div>
                      <h3 className="font-bold mb-1">{post.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                        {post.content}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-3 flex-shrink-0" />
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {post.author[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-xs font-medium">{post.author}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{post.date} {post.time}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {post.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3 h-3" />
                        {post.comments}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Detail Dialog */}
      <Dialog open={postDialogOpen} onOpenChange={setPostDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedPost && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {selectedPost.isPinned && (
                        <Pin className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                      )}
                      {selectedPost.type && (
                        <Badge variant={selectedPost.type === 'important' ? 'destructive' : 'default'}>
                          {selectedPost.type === 'important' ? '중요' : selectedPost.type === 'notice' ? '공지' : '안내'}
                        </Badge>
                      )}
                      {selectedPost.category && getCategoryBadge(selectedPost.category)}
                    </div>
                    <DialogTitle className="text-xl">{selectedPost.title}</DialogTitle>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                {/* Author Info */}
                <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                      {selectedPost.author[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{selectedPost.author}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Badge variant="secondary" className="text-xs">
                        {selectedPost.authorRole}
                      </Badge>
                      <Clock className="w-3 h-3" />
                      <span>{selectedPost.date} {selectedPost.time}</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                    {selectedPost.content}
                  </p>
                </div>

                {/* Attachment */}
                {selectedPost.hasAttachment && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="font-medium">첨부파일_행사일정.pdf</span>
                      <Button variant="ghost" size="sm" className="ml-auto">
                        다운로드
                      </Button>
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center justify-between py-4 border-y border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      조회 {selectedPost.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      좋아요 {selectedPost.likes}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      댓글 {selectedPost.comments}
                    </span>
                  </div>
                  <Button variant="outline" size="sm">
                    <ThumbsUp className="w-4 h-4 mr-2" />
                    좋아요
                  </Button>
                </div>

                {/* Comments Section */}
                <div className="space-y-3">
                  <h4 className="font-bold">댓글 {selectedPost.comments}</h4>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="text-xs">이</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">이지영</span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">1시간 전</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          확인했습니다! 감사합니다.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 safe-bottom">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item, index) => (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                item.active
                  ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
