import { useState, useEffect } from 'react';
import { processOcr, listOcrDocuments, getOcrDocument, deleteOcrDocument } from '@/services/aiService';
import { FiImage, FiUpload, FiTrash2, FiRefreshCw, FiEye } from 'react-icons/fi';

export default function AiOcr() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [form, setForm] = useState({ fileName: '', mimeType: '', fileUrl: '' });

  useEffect(() => { loadDocuments(); }, []);

  async function loadDocuments() {
    try {
      setLoading(true);
      const res = await listOcrDocuments();
      setDocuments(res.data || []);
    } catch (err) { console.error('Failed to load OCR documents', err); }
    finally { setLoading(false); }
  }

  async function handleProcess() {
    if (!form.fileName.trim()) return;
    try {
      setProcessing(true);
      const res = await processOcr(form);
      setDocuments([res.data, ...documents]);
      setForm({ fileName: '', mimeType: '', fileUrl: '' });
    } catch (err) { console.error('Failed to process OCR', err); }
    finally { setProcessing(false); }
  }

  async function handleView(docId) {
    try {
      const res = await getOcrDocument(docId);
      setSelectedDoc(res.data);
    } catch (err) { console.error('Failed to load OCR document', err); }
  }

  async function handleDelete(docId) {
    try {
      await deleteOcrDocument(docId);
      setDocuments(documents.filter((d) => d.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err) { console.error('Failed to delete OCR document', err); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            <FiImage className="inline mr-3" /> AI OCR
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Extract text and data from documents using AI</p>
        </div>
        <button onClick={loadDocuments} className="flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
          <FiRefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Process Document</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input type="text" value={form.fileName} onChange={(e) => setForm({ ...form, fileName: e.target.value })} placeholder="document.pdf" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white" />
          <input type="text" value={form.mimeType} onChange={(e) => setForm({ ...form, mimeType: e.target.value })} placeholder="application/pdf" className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white" />
          <input type="text" value={form.fileUrl} onChange={(e) => setForm({ ...form, fileUrl: e.target.value })} placeholder="https://..." className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-gray-900 dark:text-white" />
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={handleProcess} disabled={processing || !form.fileName.trim()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-6 py-2 disabled:opacity-50">
            <FiUpload size={16} /> {processing ? 'Processing...' : 'Process'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white truncate">{doc.fileName}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{doc.mimeType || 'Unknown type'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleView(doc.id)} className="text-blue-500 hover:text-blue-600 p-1"><FiEye size={16} /></button>
                  <button onClick={() => handleDelete(doc.id)} className="text-red-500 hover:text-red-600 p-1"><FiTrash2 size={16} /></button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded-full ${doc.status === 'COMPLETED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : doc.status === 'FAILED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>{doc.status}</span>
                {doc.confidence > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">{(doc.confidence * 100).toFixed(0)}% confidence</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedDoc(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedDoc.fileName}</h2>
              <button onClick={() => setSelectedDoc(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
            </div>
            {selectedDoc.structuredData && Object.keys(selectedDoc.structuredData).length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Structured Data</h3>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{JSON.stringify(selectedDoc.structuredData, null, 2)}</pre>
                </div>
              </div>
            )}
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Extracted Text</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{selectedDoc.extractedText}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}