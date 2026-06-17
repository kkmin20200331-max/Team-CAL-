import { useState, useEffect, useMemo } from 'react';
import EmployeeHeader from './EmployeeHeader';
import { useNavigate } from 'react-router';
import axios from 'axios';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import EmployeeBottomNav from './EmployeeBottomNav';

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

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

interface PostItem extends BoardPostVO {
  categoryName: string;
  isNew: boolean;
}

// category chip colors — green palette variants
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
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

const checkIsNew = (s: string) => {
  if (!s) return false;
  return (new Date().getTime() - new Date(s).getTime()) / 86400000 <= 7;
};

export default function EmployeeBoard() {
  const navigate = useNavigate();
  const language = useLanguage();
  const t = translations.employeeBoard[language];
  const storeId = sessionStorage.getItem('store_id') || '';

  const [boards, setBoards] = useState<BoardVO[]>([]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) return;
    setLoading(true);
    API.get('/board', { params: { store_id: storeId } })
      .then(res => {
        const boardList: BoardVO[] = Array.isArray(res.data) ? res.data : [];
        setBoards(boardList);
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
      .then(results => {
        const all = results.flat().sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setPosts(all);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [storeId]);

  const filtered = useMemo(() =>
    !selectedCategory || selectedCategory === t.allCategory
      ? posts
      : posts.filter(p => p.categoryName === selectedCategory),
    [posts, selectedCategory, t.allCategory]
  );

  const selectedPost = posts.find(p => p.id === selectedPostId) ?? null;
  const isDetail = selectedPostId !== null;

  const currentIdx = posts.findIndex(p => p.id === selectedPostId);
  const prevPost = currentIdx > 0 ? posts[currentIdx - 1] : null;
  const nextPost = currentIdx < posts.length - 1 ? posts[currentIdx + 1] : null;

  const colorMap = useMemo(() => {
    const map: Record<string, { bg: string; color: string }> = {};
    boards.forEach((b, i) => { map[b.name] = CHIP_COLORS[i % CHIP_COLORS.length]; });
    return map;
  }, [boards]);

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    setSelectedPostId(null);
  };

  const categoryChips = [t.allCategory, ...boards.map(b => b.name)];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)',
      paddingBottom: 120,
    }}>
      <EmployeeHeader>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{t.title}</h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginTop: 4 }}>{t.subtitle}</p>
        </div>
      </EmployeeHeader>

      {/* ── 카테고리 칩 (sticky) ── */}
      <div style={{
        background: 'rgba(230,245,200,0.95)', backdropFilter: 'blur(8px)',
        position: 'sticky', top: 0, zIndex: 10,
        borderBottom: `1px solid rgba(0,162,0,0.15)`,
        padding: '12px 40px',
      }}>
        <div style={{
          display: 'grid', gap: 6,
          gridTemplateColumns: `repeat(${categoryChips.length}, minmax(0, 1fr))`,
        }}>
          {categoryChips.map(cat => {
            const active = selectedCategory === cat || (!selectedCategory && cat === t.allCategory);
            return (
              <button
                key={cat}
                onClick={() => handleCategoryClick(cat)}
                style={{
                  padding: '10px 0', borderRadius: 54, fontSize: 15, fontWeight: 600,
                  border: active ? 'none' : `1px solid ${BORDER_GREEN}`,
                  background: active ? DARK_GREEN : 'transparent',
                  color: active ? '#fff' : DARK_GREEN,
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 목록 뷰 ── */}
      {!isDetail && (
        <div style={{ padding: '16px 40px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {loading ? (
            <p style={{ textAlign: 'center', padding: '48px 0', color: '#888', fontSize: 16 }}>{t.loading}</p>
          ) : filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '48px 0', color: '#888', fontSize: 16 }}>{t.noPosts}</p>
          ) : (
            filtered.map((post, i) => {
              const chipStyle = colorMap[post.categoryName] ?? { bg: LIGHT_GREEN, color: DARK_GREEN };
              return (
                <button
                  key={post.id}
                  onClick={() => setSelectedPostId(post.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '14px 16px', textAlign: 'left', width: '100%',
                    background: i % 2 === 0 ? 'rgba(255,255,255,0.8)' : 'rgba(24,160,34,0.04)',
                    border: '1px solid rgba(0,162,0,0.12)',
                    borderRadius: 16, cursor: 'pointer',
                    boxShadow: '0px 2px 6px rgba(0,0,0,0.04)',
                  }}
                >
                  {/* 카테고리 뱃지 */}
                  <span style={{
                    flexShrink: 0, fontSize: 13, fontWeight: 600,
                    padding: '4px 12px', borderRadius: 20,
                    background: chipStyle.bg, color: chipStyle.color,
                    whiteSpace: 'nowrap',
                  }}>
                    {post.categoryName}
                  </span>
                  {/* 제목 */}
                  <span style={{
                    flex: 1, fontSize: 16, color: '#333',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {post.title}
                  </span>
                  {/* NEW 뱃지 */}
                  {post.isNew && (
                    <span style={{
                      flexShrink: 0, fontSize: 12, fontWeight: 700,
                      padding: '3px 10px', borderRadius: 20,
                      background: GREEN, color: '#fff',
                    }}>
                      NEW
                    </span>
                  )}
                  {/* 날짜 */}
                  <span style={{ flexShrink: 0, fontSize: 13, color: '#5a8a5c' }}>
                    {formatDate(post.created_at)}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}

      {/* ── 상세 뷰 ── */}
      {isDetail && selectedPost && (
        <div>
          {/* 뒤로가기 */}
          <button
            onClick={() => setSelectedPostId(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '12px 40px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 16, color: DARK_GREEN, fontWeight: 600,
            }}
          >
            <ChevronLeft size={16} />
            {t.backToList}
          </button>

          <div style={{ padding: '0 40px 24px' }}>
            <div style={{
              background: 'rgba(255,255,255,0.6)', border: `1px solid ${BORDER_GREEN}`,
              borderRadius: 26, padding: '20px 20px',
              boxShadow: '0px 4px 12px rgba(0,162,0,0.08)',
            }}>
              {/* 카테고리 + NEW */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                {(() => {
                  const chipStyle = colorMap[selectedPost.categoryName] ?? { bg: LIGHT_GREEN, color: DARK_GREEN };
                  return (
                    <span style={{
                      fontSize: 13, fontWeight: 600, padding: '4px 14px', borderRadius: 20,
                      background: chipStyle.bg, color: chipStyle.color,
                    }}>
                      {selectedPost.categoryName}
                    </span>
                  );
                })()}
                {selectedPost.isNew && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                    background: GREEN, color: '#fff',
                  }}>NEW</span>
                )}
              </div>

              {/* 제목 */}
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#111', marginBottom: 12, lineHeight: 1.4 }}>
                {selectedPost.title}
              </h2>

              {/* 작성자 / 날짜 */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: '#5a8a5c',
                paddingBottom: 16, borderBottom: '1px solid rgba(0,162,0,0.15)',
                marginBottom: 16,
              }}>
                <span>{selectedPost.writer_id}</span>
                <span>·</span>
                <span>{formatDate(selectedPost.created_at)}</span>
              </div>

              {/* 본문 */}
              <p style={{ fontSize: 16, color: '#333', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                {selectedPost.content}
              </p>
            </div>

            {/* 이전글 / 다음글 */}
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {prevPost && (
                <button
                  onClick={() => setSelectedPostId(prevPost.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,162,0,0.12)',
                    borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <ChevronLeft size={16} style={{ color: DARK_GREEN, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: '#5a8a5c', marginBottom: 2 }}>{t.nextPost}</p>
                    <p style={{ fontSize: 15, color: DARK_GREEN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prevPost.title}
                    </p>
                  </div>
                </button>
              )}
              {nextPost && (
                <button
                  onClick={() => setSelectedPostId(nextPost.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
                    background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(0,162,0,0.12)',
                    borderRadius: 16, cursor: 'pointer', textAlign: 'left', width: '100%',
                  }}
                >
                  <ChevronRight size={16} style={{ color: DARK_GREEN, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, color: '#5a8a5c', marginBottom: 2 }}>{t.prevPost}</p>
                    <p style={{ fontSize: 15, color: DARK_GREEN, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {nextPost.title}
                    </p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <EmployeeBottomNav />
    </div>
  );
}
