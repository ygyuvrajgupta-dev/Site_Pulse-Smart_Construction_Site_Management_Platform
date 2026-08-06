import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  FiFolder, FiFile, FiUpload, FiSearch,
  FiGrid, FiList, FiShare2, FiLock, FiGlobe, FiHome
} from 'react-icons/fi';
import api from '@/services/axios';

const DOCS_API = '/api/v1/documents';

function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('documents');
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);

  const { data: folders } = useQuery({
    queryKey: ['documentFolders'],
    queryFn: async () => {
      const response = await api.get(`${DOCS_API}/folders`);
      return response.data.data;
    },
  });

  const { data: documents, refetch: refetchDocuments } = useQuery({
    queryKey: ['documents', searchTerm],
    queryFn: async () => {
      const response = await api.get(`${DOCS_API}/documents`);
      return response.data.data;
    },
  });

  const getVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'PRIVATE': return <FiLock className="w-4 h-4" />;
      case 'SHARED': return <FiShare2 className="w-4 h-4" />;
      case 'COMPANY': return <FiGlobe className="w-4 h-4" />;
      default: return <FiHome className="w-4 h-4" />;
    }
  };

  const getFileIcon = (mimeType) => {
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('word') || mimeType?.includes('document')) return '📝';
    if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
    if (mimeType?.includes('video')) return '🎥';
    if (mimeType?.includes('audio')) return '🎵';
    return '📁';
  };

  const filteredDocuments = documents?.filter(doc =>
    doc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.fileName?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const stats = {
    totalDocuments: documents?.length || 0,
    totalFolders: folders?.length || 0,
    totalSize: documents?.reduce((sum, doc) => sum + (doc.fileSize || 0), 0) || 0,
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage files, folders, and sharing permissions
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFolderModal(true)}
            className="btn btn-secondary"
          >
            <FiFolder className="w-4 h-4" />
            New Folder
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
          >
            <FiUpload className="w-4 h-4" />
            Upload File
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Documents</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalDocuments}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Folders</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFolders}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Size</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatFileSize(stats.totalSize)}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'documents' ? 'bg-secondary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FiFile className="w-4 h-4" />
          Documents
        </button>
        <button
          onClick={() => setActiveTab('folders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'folders' ? 'bg-secondary text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FiFolder className="w-4 h-4" />
          Folders
        </button>
      </div>

      {/* Search and View Toggle */}
      {activeTab === 'documents' && (
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary dark:bg-gray-800 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-secondary text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <FiGrid className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-secondary text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <FiList className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === 'documents' && (
        <div>
          {filteredDocuments?.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FiFile className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>No documents found. Upload your first file!</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredDocuments?.map((doc) => (
                <div key={doc.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="text-4xl mb-2 text-center">{getFileIcon(doc.mimeType)}</div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={doc.name}>
                    {doc.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatFileSize(doc.fileSize)}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="card">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Folder</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredDocuments?.map((doc) => (
                      <tr key={doc.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{doc.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{formatFileSize(doc.fileSize)}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{doc.mimeType || 'N/A'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{doc.folder?.name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{doc.uploader?.name || '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-600">{new Date(doc.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'folders' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders?.map((folder) => (
            <div key={folder.id} className="card hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start justify-between">
                <FiFolder className="w-8 h-8 text-yellow-500" />
                {getVisibilityIcon(folder.visibility)}
              </div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mt-2">{folder.name}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {folder._count?.documents || 0} documents
              </p>
              {folder.description && (
                <p className="text-xs text-gray-400 mt-1 line-clamp-2">{folder.description}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Upload File</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const file = formData.get('file');
              if (file) {
                const uploadForm = new FormData();
                uploadForm.append('file', file);
                api.post(`${DOCS_API}/documents`, uploadForm, {
                  headers: { 'Content-Type': 'multipart/form-data' }
                }).then(() => {
                  refetchDocuments();
                  setShowUploadModal(false);
                  e.target.reset();
                });
              }
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select File</label>
                <input
                  type="file"
                  name="file"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowUploadModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showFolderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create Folder</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              api.post(`${DOCS_API}/folders`, {
                name: e.target.name.value,
                description: e.target.description.value,
                visibility: e.target.visibility.value,
              }).then(() => {
                refetchDocuments();
                setShowFolderModal(false);
                e.target.reset();
              });
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Folder Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibility</label>
                <select
                  name="visibility"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="PRIVATE">Private</option>
                  <option value="COMPANY">Company</option>
                  <option value="SHARED">Shared</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowFolderModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default DocumentsPage;