import React, { useCallback, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  FileText, Upload, Download, Trash2, Eye, PenTool, X, Check
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

type DealDocStatus = 'draft' | 'in_review' | 'signed';

interface DealDocument {
  id: string;
  name: string;
  type: string;
  size: string;
  lastModified: string;
  status: DealDocStatus;
  url: string;
  signatureDataUrl?: string;
}

const initialDocuments: DealDocument[] = [
  {
    id: 'd1',
    name: 'Pitch Deck 2024.pdf',
    type: 'application/pdf',
    size: '2.4 MB',
    lastModified: '2024-02-15',
    status: 'in_review',
    url: '',
  },
  {
    id: 'd2',
    name: 'Term Sheet Draft.pdf',
    type: 'application/pdf',
    size: '1.1 MB',
    lastModified: '2024-02-10',
    status: 'draft',
    url: '',
  },
  {
    id: 'd3',
    name: 'Investment Agreement.pdf',
    type: 'application/pdf',
    size: '3.2 MB',
    lastModified: '2024-02-05',
    status: 'signed',
    url: '',
  },
];

const statusConfig: Record<DealDocStatus, { label: string; variant: 'gray' | 'warning' | 'success' }> = {
  draft: { label: 'Draft', variant: 'gray' },
  in_review: { label: 'In Review', variant: 'warning' },
  signed: { label: 'Signed', variant: 'success' },
};

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SignaturePad: React.FC<{ onSave: (dataUrl: string) => void; onCancel: () => void }> = ({ onSave, onCancel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const point = 'touches' in e ? e.touches[0] : (e as React.MouseEvent);
    return { x: point.clientX - rect.left, y: point.clientY - rect.top };
  };

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    drawing.current = true;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current!.getContext('2d')!;
    const { x, y } = getPos(e);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1f2937';
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const save = () => {
    if (!hasDrawn) {
      toast.error('Please draw your signature first');
      return;
    }
    onSave(canvasRef.current!.toDataURL());
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Sign in the box below using your mouse or finger.</p>
      <canvas
        ref={canvasRef}
        width={440}
        height={160}
        className="w-full border-2 border-dashed border-gray-300 rounded-md bg-gray-50 cursor-crosshair touch-none"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      <div className="flex justify-between">
        <Button variant="outline" size="sm" onClick={clear}>Clear</Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
          <Button size="sm" leftIcon={<Check size={14} />} onClick={save}>Apply Signature</Button>
        </div>
      </div>
    </div>
  );
};

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<DealDocument[]>(initialDocuments);
  const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);
  const [signingDoc, setSigningDoc] = useState<DealDocument | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newDocs: DealDocument[] = acceptedFiles.map(file => ({
      id: `d${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: file.name,
      type: file.type || 'application/octet-stream',
      size: formatSize(file.size),
      lastModified: new Date().toISOString().split('T')[0],
      status: 'draft',
      url: URL.createObjectURL(file),
    }));
    setDocuments(prev => [...newDocs, ...prev]);
    toast.success(`${acceptedFiles.length} file${acceptedFiles.length > 1 ? 's' : ''} uploaded`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
  });

  const updateStatus = (id: string, status: DealDocStatus) => {
    setDocuments(prev => prev.map(d => (d.id === id ? { ...d, status } : d)));
    toast.success(`Status updated to "${statusConfig[status].label}"`);
  };

  const deleteDoc = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
    toast('Document deleted', { icon: '🗑️' });
  };

  const handleSaveSignature = (dataUrl: string) => {
    if (!signingDoc) return;
    setDocuments(prev =>
      prev.map(d => (d.id === signingDoc.id ? { ...d, signatureDataUrl: dataUrl, status: 'signed' } : d))
    );
    toast.success('Document signed');
    setSigningDoc(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Chamber</h1>
          <p className="text-gray-600">Upload, review, and e-sign deal documents</p>
        </div>
      </div>

      <Card>
        <CardBody>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-sm font-medium text-gray-700">
              {isDragActive ? 'Drop the files here...' : 'Drag & drop files here, or click to browse'}
            </p>
            <p className="text-xs text-gray-400 mt-1">PDF, Word, or image files</p>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-medium text-gray-900">All Documents</h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-2">
            {documents.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-6">No documents yet. Upload one above.</p>
            )}
            {documents.map(doc => (
              <div
                key={doc.id}
                className="flex items-center p-4 hover:bg-gray-50 rounded-lg transition-colors duration-200"
              >
                <div className="p-2 bg-primary-50 rounded-lg mr-4">
                  <FileText size={24} className="text-primary-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{doc.name}</h3>
                    <Badge variant={statusConfig[doc.status].variant} size="sm">
                      {statusConfig[doc.status].label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>{doc.size}</span>
                    <span>Modified {doc.lastModified}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <select
                    value={doc.status}
                    onChange={e => updateStatus(doc.id, e.target.value as DealDocStatus)}
                    className="text-xs border border-gray-300 rounded-md px-2 py-1.5 mr-1"
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In Review</option>
                    <option value="signed">Signed</option>
                  </select>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    aria-label="Preview"
                    onClick={() => setPreviewDoc(doc)}
                    disabled={!doc.url}
                  >
                    <Eye size={18} />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2"
                    aria-label="Sign"
                    onClick={() => setSigningDoc(doc)}
                  >
                    <PenTool size={18} />
                  </Button>

                  {doc.url && (
                    <a href={doc.url} download={doc.name}>
                      <Button variant="ghost" size="sm" className="p-2" aria-label="Download">
                        <Download size={18} />
                      </Button>
                    </a>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    className="p-2 text-error-600 hover:text-error-700"
                    aria-label="Delete"
                    onClick={() => deleteDoc(doc.id)}
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {previewDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-3xl max-h-[85vh] flex flex-col">
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 truncate">{previewDoc.name}</h3>
              <button onClick={() => setPreviewDoc(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardBody className="flex-1 overflow-auto">
              {previewDoc.type === 'application/pdf' ? (
                <iframe src={previewDoc.url} title={previewDoc.name} className="w-full h-[60vh] rounded-md border" />
              ) : previewDoc.type.startsWith('image/') ? (
                <img src={previewDoc.url} alt={previewDoc.name} className="max-w-full mx-auto rounded-md" />
              ) : (
                <p className="text-sm text-gray-500 text-center py-12">
                  No inline preview available for this file type. Use Download to view it.
                </p>
              )}
              {previewDoc.signatureDataUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Signature on file:</p>
                  <img src={previewDoc.signatureDataUrl} alt="Signature" className="h-16" />
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {signingDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 truncate">Sign: {signingDoc.name}</h3>
              <button onClick={() => setSigningDoc(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </CardHeader>
            <CardBody>
              <SignaturePad onSave={handleSaveSignature} onCancel={() => setSigningDoc(null)} />
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
};