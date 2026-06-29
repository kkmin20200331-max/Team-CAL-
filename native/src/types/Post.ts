// 게시글(Post) 데이터의 형태를 정의하는 설계도입니다.
export interface Post {
  id: string;
  category: string;
  title: string;
  date: string; // 예: "2026.08.25"
  content: string;
  badge?: 'badgeNew' | 'badgeImportant' | null;
  authorId?: string; // ✅ [오류 수정] 작성자 ID 속성 추가 (optional)
  author?: string;   // ✅ [오류 수정] 작성자 이름 속성 추가 (optional)
  isPinned?: boolean; // boolean trues
}