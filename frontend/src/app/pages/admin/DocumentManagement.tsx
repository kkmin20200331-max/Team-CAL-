import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Upload,
  FileText,
  Image,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  Search,
  AlertCircle,
  User,
  Calendar,
  FileCheck,
  Scan,
  UserPlus,
  Users,
  Wallet,
  MessageSquare,
  BarChart3,
  Video,
  ChevronRight,
} from "lucide-react";
import AdminHeader from "./AdminHeader";
import { useTheme } from "next-themes";

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';
const API = 'http://localhost:8080/api';

interface FileVO {
  id: string;
  user_id: string;
  user_name: string;
  file_type: string;        // HEALTH_CERT | CONTRACT | ID_CARD | BANK_ACCOUNT | OTHER
  original_name: string;
  storage_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface EmployeeVO { id: string; name: string; }

const DOC_TYPE_LABELS: Record<string, string> = {
  HEALTH_CERT: '보건증',
  CONTRACT: '근로계약서',
  ID_CARD: '신분증',
  BANK_ACCOUNT: '통장사본',
  OTHER: '기타',
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const DocumentManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [filterType, setFilterType] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<FileVO | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [documents, setDocuments] = useState<FileVO[]>([]);
  const [employees, setEmployees] = useState<EmployeeVO[]>([]);
  const [loading, setLoading] = useState(false);

  const [uploadForm, setUploadForm] = useState({
    user_id: '',
    file_type: 'HEALTH_CERT',
  });
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const pageBg = isDark
    ? 'linear-gradient(180deg, #1a3020 -12.05%, #2a3a28 17.27%, #30303a 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const sidebarBg = isDark ? 'rgba(52,52,60,0.97)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#50505a' : BORDER_GREEN;
  const textColor = isDark ? '#fff' : '#111';
  const mainBg = isDark ? '#35353f' : 'rgba(255,255,255,0.97)';
  const contentBg = isDark ? '#3c3c46' : '#fff';

  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const storeId = branchId || sessionStorage.getItem('store_id') || '';

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  const fetchDocuments = () => {
    if (!storeId) return;
    setLoading(true);
    fetch(`${API}/file/store/${storeId}`)
      .then(r => r.json())
      .then(data => setDocuments(Array.isArray(data) ? data : []))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDocuments(); }, [storeId]);

  useEffect(() => {
    if (!storeId) return;
    fetch(`${API}/users?store_id=${storeId}`)
      .then(r => r.json())
      .then(data => setEmployees(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [storeId]);

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

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch =
      (doc.user_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.original_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.file_type === filterType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: documents.length,
    health: documents.filter(d => d.file_type === 'HEALTH_CERT').length,
    contract: documents.filter(d => d.file_type === 'CONTRACT').length,
    other: documents.filter(d => !['HEALTH_CERT','CONTRACT'].includes(d.file_type)).length,
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'HEALTH_CERT': return <FileCheck size={22} color={DARK_GREEN} />;
      case 'CONTRACT':    return <FileText size={22} color={DARK_GREEN} />;
      case 'ID_CARD':     return <User size={22} color={DARK_GREEN} />;
      case 'BANK_ACCOUNT':return <Image size={22} color={DARK_GREEN} />;
      default:            return <FileText size={22} color={DARK_GREEN} />;
    }
  };

  const handleUpload = async () => {
    if (!uploadFile || !uploadForm.user_id) {
      alert('직원과 파일을 선택해주세요.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('user_id', uploadForm.user_id);
      formData.append('file_type', uploadForm.file_type);
      formData.append('file', uploadFile);

      const res = await fetch(`${API}/file/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('업로드 실패');
      setUploadModalOpen(false);
      setUploadFile(null);
      setUploadForm({ user_id: '', file_type: 'HEALTH_CERT' });
      fetchDocuments();
    } catch {
      alert('업로드 중 오류가 발생했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 문서를 삭제하시겠습니까?')) return;
    await fetch(`${API}/file/supabase/${id}`, { method: 'DELETE' });
    setShowDetailModal(false);
    fetchDocuments();
  };

  const handleDownload = async (doc: FileVO) => {
    try {
      const res = await fetch(`${API}/file/${doc.id}/url`);
      const data = await res.json();
      if (data.url) window.open(data.url, '_blank');
    } catch {
      alert('다운로드 URL 생성 실패');
    }
  };

  const handleOpenDetail = async (doc: FileVO) => {
    setSelectedDocument(doc);
    setPreviewUrl(null);
    setShowDetailModal(true);
    try {
      const res = await fetch(`${API}/file/${doc.id}/url`);
      const data = await res.json();
      if (data.url) setPreviewUrl(data.url);
    } catch {}
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
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, zIndex: 50, background: isDark ? '#30303a' : '#fff', border: `1px solid ${isDark ? '#50505a' : BORDER_GREEN}`, borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                {stores.map(s => (
                  <button key={s.id} onClick={() => { sessionStorage.setItem('store_id', s.id); sessionStorage.setItem('store_name', s.name); setBranchDropdownOpen(false); navigate(`/admin/dashboard/${s.id}`); }}
                    style={{ display: 'block', width: '100%', padding: '10px 14px', textAlign: 'left', background: s.id === branchId ? LIGHT_GREEN : 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#fff' : DARK_GREEN, fontSize: 13, fontWeight: 600 }}>
                    {s.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button key={item.label} onClick={() => navigate(item.path)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '11px 14px', marginBottom: 4, background: isActive ? GREEN : 'transparent', border: 'none', borderRadius: 12, cursor: 'pointer', color: isActive ? '#fff' : (isDark ? '#ccc' : DARK_GREEN), fontSize: 14, fontWeight: 600, textAlign: 'left', transition: 'all 0.15s', boxShadow: isActive ? '0 2px 8px rgba(24,160,34,0.3)' : 'none' }}>
                <item.icon size={16} color={isActive ? '#fff' : GREEN} />
                {item.label}
              </button>
            );
          })}
        </aside>

        {/* 메인 카드 */}
        <div style={{ flex: 1, minWidth: 0, background: mainBg, borderRadius: 24, padding: '28px 28px 32px', boxShadow: '0px 8px 40px rgba(0,0,0,0.18)' }}>

          {/* 헤더 */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 24, justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, color: '#8BA68D', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                {currentBranch} <ChevronRight size={12} /> 문서 관리
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileText size={26} />직원 서류 및 문서 관리
              </h1>
              <p style={{ fontSize: 13, color: '#8BA68D', margin: 0 }}>보건증, 계약서 등 직원 서류를 관리합니다.</p>
            </div>
            <button onClick={() => setUploadModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <Upload size={16} />문서 업로드
            </button>
          </div>

          {/* 통계 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: '전체 문서',  value: stats.total,    icon: <FileText size={20} color={DARK_GREEN} /> },
              { label: '보건증',     value: stats.health,   icon: <FileCheck size={20} color={GREEN} /> },
              { label: '근로계약서', value: stats.contract, icon: <FileText size={20} color={GREEN} /> },
              { label: '기타',       value: stats.other,    icon: <FileText size={20} color="#9CA3AF" /> },
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

          {/* 검색 & 필터 */}
          <div style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}`, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8BA68D' }} />
                <input type="text" placeholder="직원명 또는 파일명 검색..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor, boxSizing: 'border-box' }} />
              </div>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor }}>
                <option value="all">전체 유형</option>
                <option value="HEALTH_CERT">보건증</option>
                <option value="CONTRACT">근로계약서</option>
                <option value="ID_CARD">신분증</option>
                <option value="BANK_ACCOUNT">통장사본</option>
                <option value="OTHER">기타</option>
              </select>
            </div>
          </div>

          {/* 문서 목록 */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8BA68D' }}>불러오는 중...</div>
          ) : filteredDocuments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#8BA68D' }}>
              <FileText size={48} color={LIGHT_GREEN} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 15 }}>문서가 없습니다. 업로드 버튼으로 추가하세요.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {filteredDocuments.map(doc => (
                <div key={doc.id} style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, background: LIGHT_GREEN, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {getFileTypeIcon(doc.file_type)}
                      </div>
                      <div>
                        <span style={{ fontSize: 12, background: LIGHT_GREEN, color: DARK_GREEN, borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{DOC_TYPE_LABELS[doc.file_type] || doc.file_type}</span>
                        <p style={{ fontSize: 14, fontWeight: 600, color: textColor, margin: '4px 0 0' }}>{doc.user_name || '직원'}</p>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: textColor, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.original_name}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8BA68D' }}>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>{doc.created_at ? String(doc.created_at).split('T')[0] : ''}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleOpenDetail(doc)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <Eye size={14} />보기
                    </button>
                    <button onClick={() => handleDownload(doc)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <Download size={14} />다운로드
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 업로드 모달 */}
      {uploadModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: contentBg, borderRadius: 20, padding: 28, width: '100%', maxWidth: 520 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN, margin: 0 }}>문서 업로드</p>
              <button onClick={() => setUploadModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8BA68D' }}><XCircle size={22} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>직원 선택 *</label>
                <select value={uploadForm.user_id} onChange={e => setUploadForm(f => ({ ...f, user_id: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, outline: 'none', color: '#111' }}>
                  <option value="">직원을 선택하세요</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>문서 유형 *</label>
                <select value={uploadForm.file_type} onChange={e => setUploadForm(f => ({ ...f, file_type: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, outline: 'none', color: '#111' }}>
                  <option value="HEALTH_CERT">보건증</option>
                  <option value="CONTRACT">근로계약서</option>
                  <option value="ID_CARD">신분증</option>
                  <option value="BANK_ACCOUNT">통장사본</option>
                  <option value="OTHER">기타</option>
                </select>
              </div>

              {/* 파일 선택 영역 */}
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{ border: `2px dashed ${uploadFile ? BORDER_GREEN : LIGHT_GREEN}`, borderRadius: 12, padding: 24, textAlign: 'center', cursor: 'pointer', background: uploadFile ? 'rgba(230,245,200,0.4)' : 'transparent', transition: 'all 0.2s' }}>
                <input ref={fileInputRef} type="file" accept="image/*,.pdf" style={{ display: 'none' }} onChange={e => setUploadFile(e.target.files?.[0] || null)} />
                {uploadFile ? (
                  <>
                    <CheckCircle size={32} color={GREEN} style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: DARK_GREEN, margin: '0 0 4px' }}>{uploadFile.name}</p>
                    <p style={{ fontSize: 12, color: '#8BA68D', margin: 0 }}>{formatFileSize(uploadFile.size)}</p>
                  </>
                ) : (
                  <>
                    <Upload size={32} color={DARK_GREEN} style={{ margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 14, color: '#8BA68D', margin: '0 0 4px' }}>클릭하여 파일 선택</p>
                    <p style={{ fontSize: 12, color: '#8BA68D', margin: 0 }}>JPG, PNG, PDF (최대 50MB)</p>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={handleUpload} disabled={uploading}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: uploading ? '#aaa' : GREEN, color: '#fff', borderRadius: 50, padding: '12px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: uploading ? 'not-allowed' : 'pointer' }}>
                  <Upload size={16} />{uploading ? '업로드 중...' : '업로드'}
                </button>
                <button onClick={() => setUploadModalOpen(false)} style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '12px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상세 모달 */}
      {showDetailModal && selectedDocument && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: contentBg, borderRadius: 20, padding: 28, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN, margin: 0 }}>문서 상세 정보</p>
              <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8BA68D' }}><XCircle size={22} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[
                { label: '문서 유형', value: DOC_TYPE_LABELS[selectedDocument.file_type] || selectedDocument.file_type },
                { label: '직원명',   value: selectedDocument.user_name || '직원' },
                { label: '파일명',   value: selectedDocument.original_name },
                { label: '파일 크기',value: formatFileSize(selectedDocument.file_size) },
                { label: '업로드일', value: String(selectedDocument.created_at || '').split('T')[0] },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: 13, color: '#8BA68D', marginBottom: 4 }}>{label}</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: textColor, margin: 0 }}>{value}</p>
                </div>
              ))}
            </div>

            {/* 미리보기 */}
            <div style={{ background: LIGHT_GREEN, borderRadius: 12, overflow: 'hidden', marginBottom: 16, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {previewUrl ? (
                selectedDocument.original_name.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={previewUrl} style={{ width: '100%', height: 360, border: 'none' }} title="문서 미리보기" />
                ) : (
                  <img src={previewUrl} alt="문서 미리보기" style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain' }} />
                )
              ) : (
                <div style={{ textAlign: 'center', padding: 40 }}>
                  <Image size={48} color={DARK_GREEN} style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14, color: '#8BA68D', margin: 0 }}>미리보기 로딩 중...</p>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => handleDownload(selectedDocument)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                <Download size={16} />다운로드
              </button>
              <button onClick={() => handleDelete(selectedDocument.id)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: '1px solid #EF4444', color: '#EF4444', borderRadius: 50, padding: '10px 16px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <Trash2 size={16} />삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentManagement;
