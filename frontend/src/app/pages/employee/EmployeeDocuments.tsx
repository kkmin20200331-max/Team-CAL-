import { useState, useEffect, useMemo, useRef } from 'react';
import { useTheme } from 'next-themes';
import { useLanguage } from '../../i18n/useLanguage';
import { translations } from '../../i18n/translations';
import { FolderOpen, Upload, FileCheck, FileText, Clock, CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import EmployeeHeader from './EmployeeHeader';
import EmployeeBottomNav from './EmployeeBottomNav';
import { API_BASE } from '../../../lib/axiosInstance';

const DARK_GREEN = '#07790F';
const BORDER_GREEN = '#00A200';

type DocType = 'health_certificate' | 'contract';
type DocStatus = 'pending' | 'approved' | 'rejected';

interface MyFile {
  id: string;
  file_type: string;
  original_name: string;
  created_at: string;
  status: string;
  notes?: string;
}

const TYPE_LABELS: Record<DocType, Record<string, string>> = {
  health_certificate: { ko: '보건증', en: 'Health Certificate', ja: '保健証' },
  contract:          { ko: '근로계약서', en: 'Employment Contract', ja: '雇用契約書' },
};

const STATUS_LABELS: Record<string, Record<string, string>> = {
  pending:  { ko: '검토 중', en: 'Pending', ja: '審査中' },
  approved: { ko: '승인됨', en: 'Approved', ja: '承認済み' },
  rejected: { ko: '반려됨', en: 'Rejected', ja: '却下' },
};

export default function EmployeeDocuments() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const language = useLanguage();
  const t = translations.employeeDocuments[language];
  const user = useMemo(() => JSON.parse(sessionStorage.getItem('user') || '{}'), []);
  const storeId = sessionStorage.getItem('store_id') || '';

  const [myFiles, setMyFiles] = useState<MyFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState<DocType>('health_certificate');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMsg, setUploadMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pageBg = isDark
    ? 'linear-gradient(180deg, #0d2010 -12.05%, #1a2e1a 17.27%, #1c1c1e 87.95%)'
    : 'linear-gradient(180deg, #D2FF79 -12.05%, #EEFAD6 17.27%, #F2F5EB 87.95%)';

  const cardStyle: React.CSSProperties = {
    background: isDark ? '#141414' : 'rgba(255,255,255,0.5)',
    border: `1px solid ${isDark ? '#2a2a2a' : BORDER_GREEN}`,
    borderRadius: 26,
    boxShadow: '0px 4px 7.7px rgba(188,192,188,0.25)',
    marginBottom: 16,
  };

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    background: DARK_GREEN, borderRadius: 54.55,
    height: 36, padding: '0 20px',
    fontSize: 16, fontWeight: 600, color: '#fff',
  };

  const txtGreen = isDark ? '#4cd964' : DARK_GREEN;
  const txtSub = isDark ? '#8ba68d' : '#8BA68D';
  const divider = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,162,0,0.2)';

  const fetchMyFiles = async () => {
    if (!user.id || !storeId) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/file/store/${storeId}`);
      if (!res.ok) throw new Error();
      const all: MyFile[] = await res.json();
      setMyFiles(all.filter(f => f.file_type === 'health_certificate' || f.file_type === 'contract' ||
        (all as any[]).find((x: any) => x.id === f.id)?.user_id === user.id
      ));
    } catch {
      setMyFiles([]);
    } finally {
      setLoading(false);
    }
  };

  // 내 파일만 필터링: store endpoint는 전체 직원 파일을 반환하므로 user_id로 필터
  const fetchMyFilesFiltered = async () => {
    if (!user.id || !storeId) { setLoading(false); return; }
    try {
      const res = await fetch(`${API_BASE}/file/store/${storeId}`);
      if (!res.ok) throw new Error();
      const all = await res.json() as Array<MyFile & { user_id?: string }>;
      setMyFiles(all.filter(f => f.user_id === user.id));
    } catch {
      setMyFiles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyFilesFiltered(); }, [user.id, storeId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setSelectedFile(f);
    setUploadMsg(null);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (selectedFile.size > 10 * 1024 * 1024) {
      setUploadMsg({ type: 'error', text: t.fileSizeError });
      return;
    }
    setUploading(true);
    setUploadMsg(null);
    try {
      const formData = new FormData();
      formData.append('store_id', storeId);
      formData.append('user_id', user.id);
      formData.append('file_type', selectedType);
      formData.append('file', selectedFile);
      const res = await fetch(`${API_BASE}/file/upload`, { method: 'POST', body: formData });
      if (!res.ok) throw new Error(await res.text());
      setUploadMsg({ type: 'success', text: t.uploadSuccess });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchMyFilesFiltered();
    } catch (e: any) {
      setUploadMsg({ type: 'error', text: `${t.uploadFail} ${e?.message || ''}` });
    } finally {
      setUploading(false);
    }
  };

  const getStatusStyle = (status: string): React.CSSProperties => {
    switch (status) {
      case 'approved': return { background: isDark ? 'rgba(24,160,34,0.2)' : '#d1fae5', color: isDark ? '#4cd964' : '#065f46', border: `1px solid ${isDark ? 'rgba(24,160,34,0.4)' : '#6ee7b7'}` };
      case 'rejected': return { background: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2', color: isDark ? '#f87171' : '#991b1b', border: `1px solid ${isDark ? 'rgba(239,68,68,0.4)' : '#fca5a5'}` };
      default:         return { background: isDark ? 'rgba(245,158,11,0.15)' : '#fef3c7', color: isDark ? '#fbbf24' : '#92400e', border: `1px solid ${isDark ? 'rgba(245,158,11,0.4)' : '#fcd34d'}` };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 size={14} />;
      case 'rejected': return <XCircle size={14} />;
      default:         return <Clock size={14} />;
    }
  };

  const typeLabel = (type: string) => {
    if (type === 'health_certificate') return TYPE_LABELS.health_certificate[language] || '보건증';
    if (type === 'contract') return TYPE_LABELS.contract[language] || '근로계약서';
    return type;
  };

  const statusLabel = (status: string) =>
    STATUS_LABELS[status]?.[language] || STATUS_LABELS.pending[language];

  const canUpload = !!selectedFile && !uploading && !!storeId;

  return (
    <div style={{ minHeight: '100vh', background: pageBg, paddingBottom: 120 }}>
      <EmployeeHeader>
        <div>
          <h1 style={{ fontSize: 40, fontWeight: 800, color: '#F2F5EB', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <FolderOpen size={34} color="#F2F5EB" />
            {t.pageTitle}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>{t.pageSubtitle}</p>
        </div>
      </EmployeeHeader>

      <div style={{ padding: '16px 40px 0' }}>

        {/* ── 서류 업로드 ── */}
        <div style={cardStyle}>
          <div style={{ padding: '18px 20px 14px' }}>
            <span style={pillStyle}><Upload size={15} />{t.uploadSection}</span>
          </div>
          <div style={{ padding: '0 20px 20px' }}>

            {/* 서류 종류 선택 */}
            <p style={{ fontSize: 14, fontWeight: 600, color: txtSub, marginBottom: 10 }}>{t.docTypeLabel}</p>
            <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
              {(['health_certificate', 'contract'] as DocType[]).map(type => {
                const active = selectedType === type;
                return (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    style={{
                      flex: 1, padding: '12px 0', borderRadius: 54,
                      border: active ? 'none' : `1px solid ${isDark ? '#4cd964' : BORDER_GREEN}`,
                      background: active ? DARK_GREEN : 'transparent',
                      color: active ? '#fff' : txtGreen,
                      fontSize: 15, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {type === 'health_certificate' ? <FileCheck size={16} /> : <FileText size={16} />}
                    {TYPE_LABELS[type][language]}
                  </button>
                );
              })}
            </div>

            {/* 파일 선택 영역 */}
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${isDark ? '#2a2a2a' : BORDER_GREEN}`,
                borderRadius: 16, padding: '28px 20px',
                textAlign: 'center', cursor: 'pointer',
                background: isDark ? '#1a2e1a' : 'rgba(7,121,15,0.03)',
                marginBottom: 14, transition: 'background 0.15s',
              }}
            >
              {selectedFile ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 700, color: txtGreen, margin: '0 0 4px' }}>{selectedFile.name}</p>
                  <p style={{ fontSize: 13, color: txtSub, margin: 0 }}>{(selectedFile.size / 1024).toFixed(1)} KB</p>
                </>
              ) : (
                <>
                  <p style={{ fontSize: 15, fontWeight: 600, color: txtGreen, margin: '0 0 4px' }}>{t.selectFile}</p>
                  <p style={{ fontSize: 13, color: txtSub, margin: 0 }}>{t.fileHint}</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleFileChange} style={{ display: 'none' }} />

            {/* 업로드 결과 메시지 */}
            {uploadMsg && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderRadius: 12, marginBottom: 14,
                background: uploadMsg.type === 'success' ? (isDark ? 'rgba(24,160,34,0.15)' : '#d1fae5') : (isDark ? 'rgba(239,68,68,0.12)' : '#fee2e2'),
                border: uploadMsg.type === 'success' ? '1px solid #6ee7b7' : '1px solid #fca5a5',
                color: uploadMsg.type === 'success' ? (isDark ? '#4cd964' : '#065f46') : (isDark ? '#f87171' : '#991b1b'),
                fontSize: 14,
              }}>
                {uploadMsg.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                {uploadMsg.text}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!canUpload}
              style={{
                width: '100%', padding: '14px 0', borderRadius: 54, border: 'none',
                background: canUpload ? DARK_GREEN : (isDark ? '#2a2a2a' : '#ccc'),
                color: canUpload ? '#fff' : (isDark ? '#555' : '#999'),
                fontSize: 17, fontWeight: 700, cursor: canUpload ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <Upload size={18} />
              {uploading ? t.uploading : t.uploadBtn}
            </button>
          </div>
        </div>

        {/* ── 제출 내역 ── */}
        <div style={cardStyle}>
          <div style={{ padding: '18px 20px 14px' }}>
            <span style={pillStyle}><FileText size={15} />{t.historySection}</span>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading ? (
              <p style={{ textAlign: 'center', padding: '24px 0', color: txtSub, fontSize: 15 }}>{t.loading}</p>
            ) : myFiles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px 0', color: txtSub }}>
                <FolderOpen size={40} color={isDark ? '#2a2a2a' : '#ccc'} style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 15, margin: 0 }}>{t.noFiles}</p>
              </div>
            ) : (
              myFiles.map(file => {
                const st = getStatusStyle(file.status);
                return (
                  <div key={file.id} style={{ borderRadius: 16, padding: '14px 16px', ...st }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 700, color: st.color }}>
                            {getStatusIcon(file.status)}{statusLabel(file.status)}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 700, color: st.color }}>
                            {typeLabel(file.file_type)}
                          </span>
                        </div>
                        <p style={{ fontSize: 14, color: st.color, margin: '0 0 3px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {file.original_name}
                        </p>
                        <p style={{ fontSize: 12, color: st.color, opacity: 0.7, margin: 0 }}>
                          {t.submittedAt} {file.created_at?.slice(0, 10)}
                        </p>
                        {file.notes && (
                          <p style={{ fontSize: 12, color: st.color, marginTop: 6, padding: '6px 10px', background: 'rgba(0,0,0,0.06)', borderRadius: 8 }}>
                            📝 {file.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ── 안내 ── */}
        <div style={cardStyle}>
          <div style={{ padding: '18px 20px 14px' }}>
            <span style={{ ...pillStyle, background: isDark ? '#1a2e1a' : 'rgba(7,121,15,0.08)', color: txtGreen, border: `1px solid ${isDark ? '#2a2a2a' : 'rgba(0,162,0,0.25)'}` }}>
              <AlertCircle size={14} />{t.infoSection}
            </span>
          </div>
          <div style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {t.infoItems.map((g, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 13, color: txtSub }}>
                <span style={{ color: txtGreen, fontWeight: 700, flexShrink: 0 }}>•</span>
                <span>{g}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
      <EmployeeBottomNav />
    </div>
  );
}
