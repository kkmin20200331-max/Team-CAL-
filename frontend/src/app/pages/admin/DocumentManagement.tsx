import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  ArrowLeft,
  Upload,
  FileText,
  Image,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Eye,
  Trash2,
  Filter,
  Search,
  AlertCircle,
  User,
  Calendar,
  FileCheck,
  Scan
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import ProfilePanel from '../../components/admin/ProfilePanel';

interface Document {
  id: string;
  type: 'health_certificate' | 'contract' | 'id_card' | 'bank_account' | 'other';
  employeeId: string;
  employeeName: string;
  fileName: string;
  fileSize: number;
  uploadDate: string;
  expiryDate?: string;
  status: 'pending' | 'verified' | 'rejected' | 'expired';
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
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

const DocumentManagement: React.FC = () => {
  const navigate = useNavigate();
  const { branchId } = useParams();
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  // Mock data - 문서 목록
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: 'DOC001',
      type: 'health_certificate',
      employeeId: 'EMP001',
      employeeName: '김민수',
      fileName: '보건증_김민수.jpg',
      fileSize: 2048000,
      uploadDate: '2024-01-15',
      expiryDate: '2025-01-15',
      status: 'verified',
      ocrStatus: 'completed',
      extractedData: {
        name: '김민수',
        issueDate: '2024-01-10',
        expiryDate: '2025-01-10',
        certificateNumber: 'HC-2024-001234'
      }
    },
    {
      id: 'DOC002',
      type: 'contract',
      employeeId: 'EMP001',
      employeeName: '김민수',
      fileName: '근로계약서_김민수_2023.pdf',
      fileSize: 1536000,
      uploadDate: '2023-01-15',
      status: 'verified',
      ocrStatus: 'completed',
      extractedData: {
        name: '김민수',
        startDate: '2023-01-15',
        position: '주방장',
        salary: '3,500,000원'
      }
    },
    {
      id: 'DOC003',
      type: 'health_certificate',
      employeeId: 'EMP002',
      employeeName: '이지은',
      fileName: '보건증_이지은.jpg',
      fileSize: 1843200,
      uploadDate: '2024-03-01',
      expiryDate: '2024-04-15',
      status: 'expired',
      ocrStatus: 'completed',
      extractedData: {
        name: '이지은',
        issueDate: '2023-04-10',
        expiryDate: '2024-04-10',
        certificateNumber: 'HC-2023-005678'
      },
      notes: '갱신 필요'
    },
    {
      id: 'DOC004',
      type: 'contract',
      employeeId: 'EMP003',
      employeeName: '박철수',
      fileName: '근로계약서_박철수.pdf',
      fileSize: 2097152,
      uploadDate: '2024-03-10',
      status: 'pending',
      ocrStatus: 'processing',
      notes: '검토 대기 중'
    },
    {
      id: 'DOC005',
      type: 'id_card',
      employeeId: 'EMP004',
      employeeName: '최영희',
      fileName: '신분증_최영희.jpg',
      fileSize: 1024000,
      uploadDate: '2024-03-12',
      status: 'verified',
      ocrStatus: 'completed',
      extractedData: {
        name: '최영희',
        idNumber: '950325-2******',
        address: '서울시 용산구'
      }
    },
    {
      id: 'DOC006',
      type: 'bank_account',
      employeeId: 'EMP005',
      employeeName: '정대호',
      fileName: '통장사본_정대호.jpg',
      fileSize: 921600,
      uploadDate: '2024-03-14',
      status: 'rejected',
      ocrStatus: 'failed',
      notes: '이미지가 흐릿하여 재업로드 필요'
    }
  ]);

  const documentTypes = [
    { value: 'all', label: '전체' },
    { value: 'health_certificate', label: '보건증' },
    { value: 'contract', label: '근로계약서' },
    { value: 'id_card', label: '신분증' },
    { value: 'bank_account', label: '통장사본' },
    { value: 'other', label: '기타' }
  ];

  const statuses = [
    { value: 'all', label: '전체' },
    { value: 'pending', label: '대기중' },
    { value: 'verified', label: '확인완료' },
    { value: 'rejected', label: '반려' },
    { value: 'expired', label: '만료' }
  ];

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || doc.type === filterType;
    const matchesStatus = filterStatus === 'all' || doc.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />확인완료</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500"><Clock className="w-3 h-3 mr-1" />대기중</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500"><XCircle className="w-3 h-3 mr-1" />반려</Badge>;
      case 'expired':
        return <Badge className="bg-gray-500"><AlertCircle className="w-3 h-3 mr-1" />만료</Badge>;
      default:
        return null;
    }
  };

  const getOCRStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700"><FileCheck className="w-3 h-3 mr-1" />OCR 완료</Badge>;
      case 'processing':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700"><Scan className="w-3 h-3 mr-1" />처리중</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700"><Clock className="w-3 h-3 mr-1" />대기</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-red-50 text-red-700"><XCircle className="w-3 h-3 mr-1" />실패</Badge>;
      default:
        return null;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: { [key: string]: string } = {
      health_certificate: '보건증',
      contract: '근로계약서',
      id_card: '신분증',
      bank_account: '통장사본',
      other: '기타'
    };
    return typeMap[type] || type;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const calculateStats = () => {
    const total = documents.length;
    const pending = documents.filter(d => d.status === 'pending').length;
    const verified = documents.filter(d => d.status === 'verified').length;
    const expired = documents.filter(d => d.status === 'expired').length;
    const ocrProcessing = documents.filter(d => d.ocrStatus === 'processing').length;

    return { total, pending, verified, expired, ocrProcessing };
  };

  const stats = calculateStats();

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
                <h1 className="text-3xl font-bold text-gray-900">문서 관리</h1>
                <p className="text-gray-600 mt-1">보건증 및 계약서 OCR 자동 추출</p>
              </div>

              <div className="flex gap-3">
                <Button variant="outline">
                  <Scan className="w-4 h-4 mr-2" />
                  일괄 OCR
                </Button>
                <Button onClick={() => setUploadModalOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  문서 업로드
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
                    <p className="text-sm text-gray-600">전체 문서</p>
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
                    <p className="text-sm text-gray-600">확인완료</p>
                    <p className="text-3xl font-bold text-green-600">{stats.verified}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">대기중</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">만료</p>
                    <p className="text-3xl font-bold text-red-600">{stats.expired}</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-red-400" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">OCR 처리중</p>
                    <p className="text-3xl font-bold text-blue-600">{stats.ocrProcessing}</p>
                  </div>
                  <Scan className="w-8 h-8 text-blue-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                      type="text"
                      placeholder="직원명 또는 파일명으로 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border rounded-lg"
                  />
                </div>

                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >
                  {documentTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="border rounded-lg px-3 py-2"
                >
                  {statuses.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>

                <Button variant="outline">
                  <Filter className="w-4 h-4 mr-2" />
                  필터
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocuments.map(doc => (
                <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          {doc.type === 'health_certificate' && <FileCheck className="w-6 h-6 text-blue-600" />}
                          {doc.type === 'contract' && <FileText className="w-6 h-6 text-blue-600" />}
                          {doc.type === 'id_card' && <User className="w-6 h-6 text-blue-600" />}
                          {doc.type === 'bank_account' && <Image className="w-6 h-6 text-blue-600" />}
                          {doc.type === 'other' && <FileText className="w-6 h-6 text-blue-600" />}
                        </div>
                        <div>
                          <Badge variant="outline" className="mb-1">
                            {getDocumentTypeLabel(doc.type)}
                          </Badge>
                          <p className="text-sm font-medium">{doc.employeeName}</p>
                        </div>
                      </div>
                      {getStatusBadge(doc.status)}
                    </div>

                    <div className="space-y-2 mb-4">
                      <p className="text-sm font-medium truncate">{doc.fileName}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatFileSize(doc.fileSize)}</span>
                        <span>{doc.uploadDate}</span>
                      </div>
                      {doc.expiryDate && (
                          <div className="flex items-center gap-1 text-xs">
                            <Calendar className="w-3 h-3" />
                            <span>만료일: {doc.expiryDate}</span>
                          </div>
                      )}
                    </div>

                    <div className="mb-4">
                      {getOCRStatusBadge(doc.ocrStatus)}
                    </div>

                    {doc.extractedData && Object.keys(doc.extractedData).length > 0 && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-700 mb-2">OCR 추출 정보</p>
                          <div className="space-y-1">
                            {Object.entries(doc.extractedData).map(([key, value]) => (
                                value && (
                                    <div key={key} className="text-xs">
                                      <span className="text-gray-600">{key}: </span>
                                      <span className="font-medium">{value}</span>
                                    </div>
                                )
                            ))}
                          </div>
                        </div>
                    )}

                    {doc.notes && (
                        <div className="mb-4 p-2 bg-yellow-50 rounded text-xs text-gray-700">
                          <AlertCircle className="w-3 h-3 inline mr-1" />
                          {doc.notes}
                        </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedDocument(doc);
                            setShowDetailModal(true);
                          }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        보기
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1">
                        <Download className="w-4 h-4 mr-1" />
                        다운로드
                      </Button>
                      {doc.status === 'pending' && (
                          <Button size="sm" className="flex-1">
                            승인
                          </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
            ))}
          </div>

          {/* Upload Modal */}
          {uploadModalOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <Card className="max-w-2xl w-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>문서 업로드</CardTitle>
                      <Button variant="ghost" onClick={() => setUploadModalOpen(false)}>
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">직원 선택</label>
                        <select className="w-full border rounded-lg px-3 py-2">
                          <option>김민수 (EMP001)</option>
                          <option>이지은 (EMP002)</option>
                          <option>박철수 (EMP003)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">문서 유형</label>
                        <select className="w-full border rounded-lg px-3 py-2">
                          <option value="health_certificate">보건증</option>
                          <option value="contract">근로계약서</option>
                          <option value="id_card">신분증</option>
                          <option value="bank_account">통장사본</option>
                          <option value="other">기타</option>
                        </select>
                      </div>

                      <div className="border-2 border-dashed rounded-lg p-8 text-center">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 mb-2">
                          파일을 드래그하거나 클릭하여 업로드
                        </p>
                        <p className="text-xs text-gray-500">
                          JPG, PNG, PDF (최대 10MB)
                        </p>
                        <Button className="mt-4">파일 선택</Button>
                      </div>

                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <Scan className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-900">OCR 자동 추출</p>
                            <p className="text-xs text-blue-700 mt-1">
                              업로드된 문서에서 자동으로 정보를 추출합니다.
                              보건증, 신분증, 계약서의 주요 정보를 인식합니다.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button className="flex-1">
                          <Upload className="w-4 h-4 mr-2" />
                          업로드 및 OCR 실행
                        </Button>
                        <Button variant="outline" onClick={() => setUploadModalOpen(false)}>
                          취소
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
          )}

          {/* Detail Modal */}
          {showDetailModal && selectedDocument && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>문서 상세 정보</CardTitle>
                      <Button variant="ghost" onClick={() => setShowDetailModal(false)}>
                        <XCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-gray-600">문서 유형</label>
                          <p className="font-medium">{getDocumentTypeLabel(selectedDocument.type)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">직원명</label>
                          <p className="font-medium">{selectedDocument.employeeName}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">파일명</label>
                          <p className="font-medium">{selectedDocument.fileName}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">파일 크기</label>
                          <p className="font-medium">{formatFileSize(selectedDocument.fileSize)}</p>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">업로드일</label>
                          <p className="font-medium">{selectedDocument.uploadDate}</p>
                        </div>
                        {selectedDocument.expiryDate && (
                            <div>
                              <label className="text-sm text-gray-600">만료일</label>
                              <p className="font-medium">{selectedDocument.expiryDate}</p>
                            </div>
                        )}
                        <div>
                          <label className="text-sm text-gray-600">상태</label>
                          <div className="mt-1">{getStatusBadge(selectedDocument.status)}</div>
                        </div>
                        <div>
                          <label className="text-sm text-gray-600">OCR 상태</label>
                          <div className="mt-1">{getOCRStatusBadge(selectedDocument.ocrStatus)}</div>
                        </div>
                      </div>

                      {selectedDocument.extractedData && (
                          <div>
                            <h3 className="font-semibold mb-3">OCR 추출 정보</h3>
                            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                              {Object.entries(selectedDocument.extractedData).map(([key, value]) => (
                                  value && (
                                      <div key={key}>
                                        <label className="text-sm text-gray-600">{key}</label>
                                        <p className="font-medium">{value}</p>
                                      </div>
                                  )
                              ))}
                            </div>
                          </div>
                      )}

                      <div className="border rounded-lg p-4 bg-gray-100 text-center">
                        <Image className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">문서 미리보기</p>
                      </div>

                      <div className="flex gap-3">
                        <Button className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          다운로드
                        </Button>
                        {selectedDocument.status === 'pending' && (
                            <>
                              <Button className="flex-1">
                                <CheckCircle className="w-4 h-4 mr-2" />
                                승인
                              </Button>
                              <Button variant="outline" className="flex-1">
                                <XCircle className="w-4 h-4 mr-2" />
                                반려
                              </Button>
                            </>
                        )}
                        <Button variant="outline">
                          <Trash2 className="w-4 h-4 mr-2" />
                          삭제
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

export default DocumentManagement;
