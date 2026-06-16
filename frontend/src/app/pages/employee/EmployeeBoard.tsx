import { useState, useEffect, useMemo } from "react";
import EmployeeHeader from "../../components/employee/EmployeeHeader";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Home,
  Calendar,
  QrCode,
  Wallet,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";

const API = axios.create({ baseURL: "http://localhost:8080/api" });

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
}

// 포스트 + 카테고리명 + NEW 여부
interface PostItem extends BoardPostVO {
  categoryName: string;
  isNew: boolean;
}

// board 이름별 색상 (순서대로 순환)
const CHIP_COLORS = [
  "bg-gray-100 text-gray-600",
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-purple-100 text-purple-700",
  "bg-orange-100 text-orange-700",
  "bg-pink-100 text-pink-700",
];

const formatDate = (s: string) => {
  if (!s) return "";
  const d = new Date(s);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

const checkIsNew = (s: string) => {
  if (!s) return false;
  return (new Date().getTime() - new Date(s).getTime()) / 86400000 <= 7;
};

export default function EmployeeBoard() {
  const navigate = useNavigate();
  const storeId = sessionStorage.getItem("store_id") || "";

  const [boards, setBoards] = useState<BoardVO[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  // ── 게시판 목록 + 전체 포스트 불러오기 ──
  useEffect(() => {
    if (!storeId) return;
    setLoading(true);

    API.get("/board", { params: { store_id: storeId } })
      .then((res) => {
        const boardList: BoardVO[] = Array.isArray(res.data) ? res.data : [];
        setBoards(boardList);

        // 모든 게시판 포스트 병렬 조회
        return Promise.all(
          boardList.map((board) =>
            API.get("/board_post", { params: { board_id: board.id } })
              .then((r) => {
                const list: BoardPostVO[] = Array.isArray(r.data) ? r.data : [];
                return list.map((p) => ({
                  ...p,
                  categoryName: board.name,
                  isNew: checkIsNew(p.created_at),
                }));
              })
              .catch(() => [] as PostItem[]),
          ),
        );
      })
      .then((results) => {
        // 전체 합치고 최신순 정렬
        const all = results
          .flat()
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          );
        setPosts(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeId]);

  // ── 카테고리 필터 ──
  const filtered = useMemo(
    () =>
      selectedCategory === "전체"
        ? posts
        : posts.filter((p) => p.categoryName === selectedCategory),
    [posts, selectedCategory],
  );

  // ── 상세용 ──
  const selectedPost = posts.find((p) => p.id === selectedPostId) ?? null;
  const isDetail = selectedPostId !== null;

  // prev / next (전체 포스트 기준 최신순)
  const currentIdx = posts.findIndex((p) => p.id === selectedPostId);
  const prevPost = currentIdx > 0 ? posts[currentIdx - 1] : null;
  const nextPost = currentIdx < posts.length - 1 ? posts[currentIdx + 1] : null;

  // board 이름 → 색상
  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    boards.forEach((b, i) => {
      map[b.name] = CHIP_COLORS[i % CHIP_COLORS.length];
    });
    return map;
  }, [boards]);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedPostId(null);
  };

  const bottomNavItems = [
    { icon: Home, label: "홈", path: "/employee/home" },
    { icon: Calendar, label: "근무표", path: "/employee/schedule" },
    { icon: QrCode, label: "체크인", path: "/employee/checkin" },
    { icon: Wallet, label: "급여", path: "/employee/payroll" },
    {
      icon: MessageSquare,
      label: "게시판",
      path: "/employee/board",
      active: true,
    },
  ];

  // 카테고리 칩 목록 (전체 + DB board 이름들)
  const categoryChips = ["전체", ...boards.map((b) => b.name)];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20">
      {/* ── 헤더 ── */}
      <EmployeeHeader>
        <div>
          <h1 className="text-2xl font-bold">게시판</h1>
          <p className="text-blue-100 text-sm mt-1">
            공지사항과 소식을 확인하세요
          </p>
        </div>
      </EmployeeHeader>

      {/* ── 카테고리 칩 (sticky) ── */}
      <div className="bg-white dark:bg-gray-900 sticky top-0 z-10 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div
          className="grid gap-1.5"
          style={{
            gridTemplateColumns: `repeat(${categoryChips.length}, minmax(0, 1fr))`,
          }}
        >
          {categoryChips.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryClick(cat)}
              className={`py-2 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-gray-800 text-white dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── 목록 뷰 ── */}
      {!isDetail && (
        <>
          {loading ? (
            <p className="text-center py-12 text-sm text-gray-400">
              불러오는 중...
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-12 text-sm text-gray-400">
              게시물이 없습니다
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map((post) => (
                <button
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  {/* 카테고리 뱃지 */}
                  <span
                    className={`flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded ${colorMap[post.categoryName] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {post.categoryName}
                  </span>
                  {/* 제목 */}
                  <span className="flex-1 text-sm text-gray-800 dark:text-gray-100 truncate">
                    {post.title}
                  </span>
                  {/* NEW 뱃지 */}
                  {post.isNew && (
                    <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded bg-red-500 text-white">
                      NEW
                    </span>
                  )}
                  {/* 날짜 */}
                  <span className="flex-shrink-0 text-xs text-gray-400">
                    {formatDate(post.created_at)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── 상세 뷰 ── */}
      {isDetail && selectedPost && (
        <div>
          {/* 뒤로가기 */}
          <button
            onClick={() => setSelectedPostId(null)}
            className="flex items-center gap-1 px-4 py-3 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            목록으로
          </button>

          <div className="px-4 pb-6">
            {/* 카테고리 뱃지 + NEW */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded ${colorMap[selectedPost.categoryName] ?? "bg-gray-100 text-gray-600"}`}
              >
                {selectedPost.categoryName}
              </span>
              {selectedPost.isNew && (
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-red-500 text-white">
                  NEW
                </span>
              )}
            </div>

            {/* 제목 */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 leading-snug">
              {selectedPost.title}
            </h2>

            {/* 작성자 / 날짜 */}
            <div className="flex items-center gap-1.5 text-xs text-gray-400 pb-4 border-b border-gray-100 dark:border-gray-800">
              <Clock className="w-3 h-3" />
              <span>{selectedPost.writer_id}</span>
              <span>·</span>
              <span>{formatDate(selectedPost.created_at)}</span>
            </div>

            {/* 본문 */}
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed pt-4">
              {selectedPost.content}
            </p>
          </div>

          {/* ── 이전글 / 다음글 ── */}
          <div className="border-t border-gray-100 dark:border-gray-800 mx-4">
            {prevPost && (
              <button
                onClick={() => setSelectedPostId(prevPost.id)}
                className="w-full flex items-center gap-3 py-3.5 border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <ChevronLeft className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">다음 글 (최신)</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                    {prevPost.title}
                  </p>
                </div>
              </button>
            )}
            {nextPost && (
              <button
                onClick={() => setSelectedPostId(nextPost.id)}
                className="w-full flex items-center gap-3 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              >
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-400 mb-0.5">
                    이전 글 (오래된)
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
                    {nextPost.title}
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── 하단 네비 ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-around px-2 py-2">
          {bottomNavItems.map((item, i) => (
            <button
              key={i}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                (item as any).active
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
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
