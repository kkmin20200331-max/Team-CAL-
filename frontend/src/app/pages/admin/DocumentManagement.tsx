import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { Badge } from "../../components/ui/badge";
import AdminHeader from "./AdminHeader";
import { useTheme } from "next-themes";
import { API_BASE } from "../../../lib/axiosInstance";

const GREEN = '#18A022';
const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';
const LIGHT_GREEN = '#E6F5C8';

interface Document {
  id: string;
  type: "health_certificate" | "contract" | "id_card" | "bank_account" | "other";
  employeeId: string;
  employeeName: string;
  fileName: string;
  fileSize: number;
  mimeType?: string;
  uploadDate: string;
  expiryDate?: string;
  status: "pending" | "verified" | "rejected" | "expired";
  ocrStatus: "pending" | "processing" | "completed" | "failed";
  extractedData?: {
    name?: string;
    issueDate?: string;
    expiryDate?: string;
    idNumber?: string;
    certificateNumber?: string;
    address?: string;
    [key: string]: string | undefined;
  };
  notes?: string;
}

interface Employee {
  id: string;
  name: string;
}

interface BackendFile {
  id: string;
  user_id: string;
  store_id?: string;
  file_type: string;
  original_name?: string;
  storage_path?: string;
  file_size?: number;
  mime_type?: string;
  status?: string;
  ocr_status?: string;
  expiry_date?: string;
  notes?: string;
  extracted_data?: string;
  created_at?: string;
}

const DocumentManagement: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { branchId } = useParams();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [uploadUserId, setUploadUserId] = useState("");
  const [uploadFileType, setUploadFileType] = useState<Document["type"]>("health_certificate");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';
  const sidebarBg = isDark ? 'rgba(44,44,46,0.95)' : 'rgba(255,255,255,0.85)';
  const sidebarBorder = isDark ? '#3a3a3c' : BORDER_GREEN;
  const textColor = isDark ? '#fff' : '#111';

  const currentBranch = sessionStorage.getItem('store_name') || '지점 선택';
  const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const selectedBranchId =
    branchId && branchId !== "undefined"
      ? branchId
      : sessionStorage.getItem("store_id") || stores[0]?.id || "";

  const employeeNameById = (userId: string) => {
    return employees.find((employee) => employee.id === userId)?.name || userId;
  };

  const parseExtractedData = (value?: string): Document["extractedData"] => {
    if (!value) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  };

  const mapFileType = (type?: string): Document["type"] => {
    switch ((type || "").toUpperCase()) {
      case "HEALTH_CERT":
        return "health_certificate";
      case "CONTRACT":
        return "contract";
      case "ID_CARD":
        return "id_card";
      case "BANK_ACCOUNT":
        return "bank_account";
      default:
        return "other";
    }
  };

  const mapStatus = (status?: string): Document["status"] => {
    switch ((status || "").toUpperCase()) {
      case "VERIFIED":
        return "verified";
      case "REJECTED":
        return "rejected";
      case "EXPIRED":
        return "expired";
      default:
        return "pending";
    }
  };

  const mapOcrStatus = (status?: string): Document["ocrStatus"] => {
    switch ((status || "").toUpperCase()) {
      case "COMPLETED":
        return "completed";
      case "PROCESSING":
        return "processing";
      case "FAILED":
        return "failed";
      default:
        return "pending";
    }
  };

  const mapBackendFile = (file: BackendFile): Document => ({
    id: file.id,
    type: mapFileType(file.file_type),
    employeeId: file.user_id,
    employeeName: employeeNameById(file.user_id),
    fileName: file.original_name || file.storage_path || file.id,
    fileSize: file.file_size || 0,
    mimeType: file.mime_type,
    uploadDate: file.created_at ? file.created_at.slice(0, 10) : "",
    expiryDate: file.expiry_date ? file.expiry_date.slice(0, 10) : undefined,
    status: mapStatus(file.status),
    ocrStatus: mapOcrStatus(file.ocr_status),
    extractedData: parseExtractedData(file.extracted_data),
    notes: file.notes,
  });

  const fetchDocuments = async () => {
    if (!selectedBranchId) return;
    const response = await fetch(`${API_BASE}/file/store/${selectedBranchId}`);
    if (!response.ok) throw new Error("failed to load documents");
    const data = await response.json();
    setDocuments(Array.isArray(data) ? data.map(mapBackendFile) : []);
  };

  const handleUpload = async () => {
    if (!selectedBranchId || !uploadUserId || !uploadFile) {
      alert("직원과 파일을 선택해주세요.");
      return;
    }
    if (uploadFile.size > 10 * 1024 * 1024) {
      alert("10MB 이하 파일만 업로드할 수 있습니다.");
      return;
    }

    const formData = new FormData();
    formData.append("store_id", selectedBranchId);
    formData.append("user_id", uploadUserId);
    formData.append("file_type", uploadFileType);
    formData.append("file", uploadFile);

    setIsUploading(true);
    try {
      const response = await fetch(`${API_BASE}/file/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
      await fetchDocuments();
      setUploadModalOpen(false);
      setUploadFile(null);
    } catch (error) {
      alert(`문서 업로드에 실패했습니다.\n${error instanceof Error ? error.message : ""}`);
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    const response = await fetch(`${API_BASE}/file/${doc.id}/signed-url`);
    if (!response.ok) {
      alert("다운로드 URL을 만들 수 없습니다.");
      return;
    }
    const data = await response.json();
    if (data.url) {
      window.open(data.url, "_blank");
    }
  };

  const loadPreview = async (doc: Document) => {
    setPreviewUrl("");
    setIsPreviewLoading(true);
    try {
      const response = await fetch(`${API_BASE}/file/${doc.id}/signed-url`);
      if (!response.ok) throw new Error(await response.text());
      const data = await response.json();
      setPreviewUrl(data.url || "");
    } catch (error) {
      console.error(error);
      setPreviewUrl("");
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const isImageDocument = (doc: Document) => {
    return (doc.mimeType || "").startsWith("image/") || /\.(png|jpe?g|gif|webp)$/i.test(doc.fileName);
  };

  const isPdfDocument = (doc: Document) => {
    return doc.mimeType === "application/pdf" || /\.pdf$/i.test(doc.fileName);
  };

  const handleUpdateStatus = async (doc: Document, status: Document["status"]) => {
    const response = await fetch(`${API_BASE}/file/${doc.id}/status?status=${status}`, {
      method: "PUT",
    });
    if (!response.ok) {
      alert("문서 상태 변경에 실패했습니다.");
      return;
    }
    await fetchDocuments();
    if (selectedDocument?.id === doc.id) {
      setSelectedDocument((prev) => prev ? { ...prev, status } : prev);
    }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm("문서를 삭제할까요?")) return;
    const response = await fetch(`${API_BASE}/file/${doc.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      alert("문서 삭제에 실패했습니다.");
      return;
    }
    setShowDetailModal(false);
    await fetchDocuments();
  };

  useEffect(() => {
    if (!currentUser?.id) return;
    fetch(`${API_BASE}/store?user_id=${currentUser.id}`)
      .then(r => r.json())
      .then(data => setStores(Array.isArray(data) ? data.map((s: any) => ({ id: s.id, name: s.name })) : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedBranchId) return;
    fetch(`${API_BASE}/users?store_id=${selectedBranchId}`)
      .then(r => r.json())
      .then(data => {
        const nextEmployees = Array.isArray(data) ? data.map((user: any) => ({ id: user.id, name: user.name })) : [];
        setEmployees(nextEmployees);
        if (!uploadUserId && nextEmployees.length > 0) {
          setUploadUserId(nextEmployees[0].id);
        }
      })
      .catch(() => setEmployees([]));
  }, [selectedBranchId]);

  useEffect(() => {
    fetchDocuments().catch(() => {});
  }, [selectedBranchId, employees.length]);

  useEffect(() => {
    if (!showDetailModal || !selectedDocument) {
      setPreviewUrl("");
      return;
    }
    loadPreview(selectedDocument);
  }, [showDetailModal, selectedDocument?.id]);

  const menuItems = [
    { icon: Calendar, label: '근무표 관리', path: selectedBranchId ? `/admin/schedule/monthly/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: UserPlus, label: '대타 모집', path: selectedBranchId ? `/admin/substitute/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Users, label: '직원 관리', path: selectedBranchId ? `/admin/employees/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Wallet, label: '급여 관리', path: selectedBranchId ? `/admin/payroll/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: FileText, label: '문서 관리', path: selectedBranchId ? `/admin/documents/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: MessageSquare, label: '게시판', path: selectedBranchId ? `/admin/board/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: BarChart3, label: 'AI 고객 분석', path: selectedBranchId ? `/admin/analytics/${selectedBranchId}` : '/admin/branch-selection' },
    { icon: Video, label: 'CCTV 분석', path: selectedBranchId ? `/admin/cctv/${selectedBranchId}` : '/admin/branch-selection' },
  ];

  // Mock data - 문서 목록
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: "DOC001",
      type: "health_certificate",
      employeeId: "EMP001",
      employeeName: "김민수",
      fileName: "보건증_김민수.jpg",
      fileSize: 2048000,
      uploadDate: "2024-01-15",
      expiryDate: "2025-01-15",
      status: "verified",
      ocrStatus: "completed",
      extractedData: { name: "김민수", issueDate: "2024-01-10", expiryDate: "2025-01-10", certificateNumber: "HC-2024-001234" },
    },
    {
      id: "DOC002",
      type: "contract",
      employeeId: "EMP001",
      employeeName: "김민수",
      fileName: "근로계약서_김민수_2023.pdf",
      fileSize: 1536000,
      uploadDate: "2023-01-15",
      status: "verified",
      ocrStatus: "completed",
      extractedData: { name: "김민수", startDate: "2023-01-15", position: "주방장", salary: "3,500,000원" },
    },
    {
      id: "DOC003",
      type: "health_certificate",
      employeeId: "EMP002",
      employeeName: "이지은",
      fileName: "보건증_이지은.jpg",
      fileSize: 1843200,
      uploadDate: "2024-03-01",
      expiryDate: "2024-04-15",
      status: "expired",
      ocrStatus: "completed",
      extractedData: { name: "이지은", issueDate: "2023-04-10", expiryDate: "2024-04-10", certificateNumber: "HC-2023-005678" },
      notes: "갱신 필요",
    },
    {
      id: "DOC004",
      type: "contract",
      employeeId: "EMP003",
      employeeName: "박철수",
      fileName: "근로계약서_박철수.pdf",
      fileSize: 2097152,
      uploadDate: "2024-03-10",
      status: "pending",
      ocrStatus: "processing",
      notes: "검토 대기 중",
    },
    {
      id: "DOC005",
      type: "id_card",
      employeeId: "EMP004",
      employeeName: "최영희",
      fileName: "신분증_최영희.jpg",
      fileSize: 1024000,
      uploadDate: "2024-03-12",
      status: "verified",
      ocrStatus: "completed",
      extractedData: { name: "최영희", idNumber: "950325-2******", address: "서울시 용산구" },
    },
    {
      id: "DOC006",
      type: "bank_account",
      employeeId: "EMP005",
      employeeName: "정대호",
      fileName: "통장사본_정대호.jpg",
      fileSize: 921600,
      uploadDate: "2024-03-14",
      status: "rejected",
      ocrStatus: "failed",
      notes: "이미지가 흐릿하여 재업로드 필요",
    },
  ]);

  const documentTypes = [
    { value: "all", label: "전체" },
    { value: "health_certificate", label: "보건증" },
    { value: "contract", label: "근로계약서" },
    { value: "id_card", label: "신분증" },
    { value: "bank_account", label: "통장사본" },
    { value: "other", label: "기타" },
  ];

  const statuses = [
    { value: "all", label: "전체" },
    { value: "pending", label: "대기중" },
    { value: "verified", label: "확인완료" },
    { value: "rejected", label: "반려" },
    { value: "expired", label: "만료" },
  ];

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || doc.type === filterType;
    const matchesStatus = filterStatus === "all" || doc.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />확인완료</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />대기중</Badge>;
      case "rejected":
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />반려</Badge>;
      case "expired":
        return <Badge className="bg-gray-500"><AlertCircle className="w-3 h-3 mr-1" />만료</Badge>;
      default:
        return null;
    }
  };

  const getOCRStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700"><FileCheck className="w-3 h-3 mr-1" />OCR 완료</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Scan className="w-3 h-3 mr-1" />처리중</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-gray-50 text-gray-700"><Clock className="w-3 h-3 mr-1" />대기</Badge>;
      case "failed":
        return <Badge variant="outline" className="bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" />실패</Badge>;
      default:
        return null;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      health_certificate: "보건증",
      contract: "근로계약서",
      id_card: "신분증",
      bank_account: "통장사본",
      other: "기타",
    };
    return typeMap[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const calculateStats = () => {
    const total = documents.length;
    const pending = documents.filter((d) => d.status === "pending").length;
    const verified = documents.filter((d) => d.status === "verified").length;
    const expired = documents.filter((d) => d.status === "expired").length;
    const ocrProcessing = documents.filter((d) => d.ocrStatus === "processing").length;
    return { total, pending, verified, expired, ocrProcessing };
  };

  const stats = calculateStats();

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
                      background: s.id === selectedBranchId ? LIGHT_GREEN : 'transparent',
                      border: 'none', cursor: 'pointer',
                      color: isDark ? '#fff' : DARK_GREEN, fontSize: 13, fontWeight: 600,
                    }}
                    onMouseOver={e => { e.currentTarget.style.background = LIGHT_GREEN; }}
                    onMouseOut={e => { e.currentTarget.style.background = s.id === selectedBranchId ? LIGHT_GREEN : 'transparent'; }}
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
            <h1 style={{ fontSize: 28, fontWeight: 900, color: DARK_GREEN, margin: 0 }}>문서 관리</h1>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                <Scan size={16} />일괄 OCR
              </button>
              <button onClick={() => setUploadModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                <Upload size={16} />문서 업로드
              </button>
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: '전체 문서', value: stats.total, icon: <FileText size={20} color={DARK_GREEN} /> },
              { label: '확인완료', value: stats.verified, icon: <CheckCircle size={20} color={GREEN} /> },
              { label: '대기중', value: stats.pending, icon: <Clock size={20} color="#F59E0B" /> },
              { label: '만료', value: stats.expired, icon: <AlertCircle size={20} color="#EF4444" /> },
              { label: 'OCR 처리중', value: stats.ocrProcessing, icon: <Scan size={20} color="#3B82F6" /> },
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

          {/* Search and Filters */}
          <div style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}`, marginBottom: 20 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, position: 'relative', minWidth: 200 }}>
                <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#8BA68D' }} />
                <input
                  type="text"
                  placeholder="직원명 또는 파일명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', paddingLeft: 36, paddingRight: 14, paddingTop: 10, paddingBottom: 10, borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor, boxSizing: 'border-box' }}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor }}
              >
                {documentTypes.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{ padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, background: 'rgba(255,255,255,0.8)', outline: 'none', color: textColor }}
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Documents Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filteredDocuments.map((doc) => (
              <div key={doc.id} style={{ background: 'rgba(230,245,200,0.35)', borderRadius: 16, padding: '18px 20px', border: `1px solid ${LIGHT_GREEN}` }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 44, height: 44, background: LIGHT_GREEN, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {doc.type === "health_certificate" && <FileCheck size={22} color={DARK_GREEN} />}
                      {doc.type === "contract" && <FileText size={22} color={DARK_GREEN} />}
                      {doc.type === "id_card" && <User size={22} color={DARK_GREEN} />}
                      {doc.type === "bank_account" && <Image size={22} color={DARK_GREEN} />}
                      {doc.type === "other" && <FileText size={22} color={DARK_GREEN} />}
                    </div>
                    <div>
                      <span style={{ fontSize: 12, background: LIGHT_GREEN, color: DARK_GREEN, borderRadius: 6, padding: '2px 8px', fontWeight: 600 }}>{getDocumentTypeLabel(doc.type)}</span>
                      <p style={{ fontSize: 14, fontWeight: 600, color: textColor, margin: '4px 0 0' }}>{doc.employeeName}</p>
                    </div>
                  </div>
                  {getStatusBadge(doc.status)}
                </div>

                <div style={{ marginBottom: 12 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: textColor, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.fileName}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#8BA68D' }}>
                    <span>{formatFileSize(doc.fileSize)}</span>
                    <span>{doc.uploadDate}</span>
                  </div>
                  {doc.expiryDate && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, color: '#8BA68D', marginTop: 4 }}>
                      <Calendar size={12} />
                      <span>만료일: {doc.expiryDate}</span>
                    </div>
                  )}
                </div>

                <div style={{ marginBottom: 12 }}>{getOCRStatusBadge(doc.ocrStatus)}</div>

                {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                  <div style={{ background: 'rgba(255,255,255,0.7)', borderRadius: 8, padding: '10px 12px', marginBottom: 10 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: DARK_GREEN, marginBottom: 6 }}>OCR 추출 정보</p>
                    {Object.entries(doc.extractedData).map(([key, value]) =>
                      value && (
                        <div key={key} style={{ fontSize: 12, color: textColor, marginBottom: 2 }}>
                          <span style={{ color: '#8BA68D' }}>{key}: </span>
                          <span style={{ fontWeight: 600 }}>{value}</span>
                        </div>
                      )
                    )}
                  </div>
                )}

                {doc.notes && (
                  <div style={{ background: '#fef9c3', borderRadius: 8, padding: '8px 10px', marginBottom: 10, fontSize: 12, color: '#713f12', display: 'flex', alignItems: 'flex-start', gap: 4 }}>
                    <AlertCircle size={12} style={{ marginTop: 2, flexShrink: 0 }} />
                    {doc.notes}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => { setSelectedDocument(doc); setShowDetailModal(true); }}
                  >
                    <Eye size={14} />보기
                  </button>
                  <button onClick={() => handleDownload(doc)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    <Download size={14} />다운로드
                  </button>
                  {doc.status === "pending" && (
                    <button onClick={() => handleUpdateStatus(doc, "verified")} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: GREEN, border: 'none', color: '#fff', borderRadius: 8, padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      승인
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Upload Modal */}
          {uploadModalOpen && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 560 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN, margin: 0 }}>문서 업로드</p>
                  <button onClick={() => setUploadModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8BA68D' }}><XCircle size={22} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>직원 선택</label>
                    <select value={uploadUserId} onChange={(e) => setUploadUserId(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, outline: 'none', color: textColor }}>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>{employee.name} ({employee.id})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 13, fontWeight: 600, color: DARK_GREEN, display: 'block', marginBottom: 6 }}>문서 유형</label>
                    <select value={uploadFileType} onChange={(e) => setUploadFileType(e.target.value as Document["type"])} style={{ width: '100%', padding: '10px 14px', borderRadius: 12, border: `1px solid ${LIGHT_GREEN}`, fontSize: 14, outline: 'none', color: textColor }}>
                      <option value="health_certificate">보건증</option>
                      <option value="contract">근로계약서</option>
                      <option value="id_card">신분증</option>
                      <option value="bank_account">통장사본</option>
                      <option value="other">기타</option>
                    </select>
                  </div>
                  <div style={{ border: `2px dashed ${BORDER_GREEN}`, borderRadius: 12, padding: 28, textAlign: 'center' }}>
                    <Upload size={40} color={DARK_GREEN} style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: 14, color: '#8BA68D', marginBottom: 6 }}>파일을 드래그하거나 클릭하여 업로드</p>
                    <p style={{ fontSize: 12, color: '#8BA68D' }}>{uploadFile ? uploadFile.name : 'JPG, PNG, PDF (최대 10MB)'}</p>
                    <input id="document-upload-file" type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => setUploadFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                    <button type="button" onClick={() => document.getElementById('document-upload-file')?.click()} style={{ marginTop: 12, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>파일 선택</button>
                  </div>
                  <div style={{ background: LIGHT_GREEN, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10 }}>
                    <Scan size={20} color={DARK_GREEN} style={{ flexShrink: 0, marginTop: 2 }} />
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: DARK_GREEN, margin: 0 }}>OCR 자동 추출</p>
                      <p style={{ fontSize: 13, color: DARK_GREEN, marginTop: 4 }}>업로드된 문서에서 자동으로 정보를 추출합니다. 보건증, 신분증, 계약서의 주요 정보를 인식합니다.</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleUpload} disabled={isUploading} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: isUploading ? 'not-allowed' : 'pointer', opacity: isUploading ? 0.6 : 1 }}>
                      <Upload size={16} />{isUploading ? '업로드 중...' : '업로드 및 OCR 실행'}
                    </button>
                    <button onClick={() => setUploadModalOpen(false)} style={{ background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                      취소
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Detail Modal */}
          {showDetailModal && selectedDocument && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
              <div style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <p style={{ fontSize: 18, fontWeight: 700, color: DARK_GREEN, margin: 0 }}>문서 상세 정보</p>
                  <button onClick={() => setShowDetailModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8BA68D' }}><XCircle size={22} /></button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: '문서 유형', value: getDocumentTypeLabel(selectedDocument.type) },
                    { label: '직원명', value: selectedDocument.employeeName },
                    { label: '파일명', value: selectedDocument.fileName },
                    { label: '파일 크기', value: formatFileSize(selectedDocument.fileSize) },
                    { label: '업로드일', value: selectedDocument.uploadDate },
                    ...(selectedDocument.expiryDate ? [{ label: '만료일', value: selectedDocument.expiryDate }] : []),
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: 13, color: '#8BA68D', marginBottom: 4 }}>{label}</p>
                      <p style={{ fontSize: 14, fontWeight: 600, color: textColor, margin: 0 }}>{value}</p>
                    </div>
                  ))}
                  <div>
                    <p style={{ fontSize: 13, color: '#8BA68D', marginBottom: 6 }}>상태</p>
                    {getStatusBadge(selectedDocument.status)}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, color: '#8BA68D', marginBottom: 6 }}>OCR 상태</p>
                    {getOCRStatusBadge(selectedDocument.ocrStatus)}
                  </div>
                </div>
                {selectedDocument.extractedData && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: DARK_GREEN, marginBottom: 12 }}>OCR 추출 정보</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: LIGHT_GREEN, borderRadius: 12, padding: '14px 16px' }}>
                      {Object.entries(selectedDocument.extractedData).map(([key, value]) =>
                        value && (
                          <div key={key}>
                            <p style={{ fontSize: 12, color: '#8BA68D', margin: 0 }}>{key}</p>
                            <p style={{ fontSize: 14, fontWeight: 600, color: textColor, margin: 0 }}>{value}</p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
                <div style={{ background: LIGHT_GREEN, borderRadius: 12, padding: 12, textAlign: 'center', marginBottom: 16, minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {isPreviewLoading ? (
                    <p style={{ fontSize: 14, color: '#8BA68D', margin: 0 }}>미리보기 불러오는 중...</p>
                  ) : previewUrl && isImageDocument(selectedDocument) ? (
                    <img
                      src={previewUrl}
                      alt={selectedDocument.fileName}
                      style={{ maxWidth: '100%', maxHeight: 520, objectFit: 'contain', borderRadius: 10, background: '#fff' }}
                    />
                  ) : previewUrl && isPdfDocument(selectedDocument) ? (
                    <iframe
                      title={selectedDocument.fileName}
                      src={previewUrl}
                      style={{ width: '100%', height: 520, border: 'none', borderRadius: 10, background: '#fff' }}
                    />
                  ) : previewUrl ? (
                    <button onClick={() => window.open(previewUrl, "_blank")} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: DARK_GREEN }}>
                      <Image size={48} color={DARK_GREEN} style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 14, color: DARK_GREEN, margin: 0, fontWeight: 700 }}>새 탭에서 미리보기</p>
                    </button>
                  ) : (
                    <div>
                      <Image size={48} color={DARK_GREEN} style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 14, color: '#8BA68D', margin: 0 }}>미리보기를 불러올 수 없습니다</p>
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => handleDownload(selectedDocument)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                    <Download size={16} />다운로드
                  </button>
                  {selectedDocument.status === "pending" && (
                    <>
                      <button onClick={() => handleUpdateStatus(selectedDocument, "verified")} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: GREEN, color: '#fff', borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer' }}>
                        <CheckCircle size={16} />승인
                      </button>
                      <button onClick={() => handleUpdateStatus(selectedDocument, "rejected")} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: `1px solid ${BORDER_GREEN}`, color: DARK_GREEN, borderRadius: 50, padding: '10px 24px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                        <XCircle size={16} />반려
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDelete(selectedDocument)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'transparent', border: `1px solid #EF4444`, color: '#EF4444', borderRadius: 50, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                    <Trash2 size={16} />삭제
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentManagement;
