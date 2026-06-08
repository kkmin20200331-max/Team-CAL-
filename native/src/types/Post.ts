// 게시글(Post) 데이터의 형태를 정의하는 설계도입니다.
export interface Post {
  id: string;
  category: 'ALL' | 'NOTICE' | 'MENU' | 'EVENT' | 'MANUAL' | 'LOST';
  title: string;
  date: string; // 예: "2026.08.25"
  content: string;
  badge?: 'badgeNew' | 'badgeImportant' | null;
}
