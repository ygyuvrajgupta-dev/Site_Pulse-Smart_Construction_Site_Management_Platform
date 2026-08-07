import { useState } from 'react';
import { FiDownload, FiFileText, FiFile } from 'react-icons/fi';
import { exportData } from '@/utils/export';

function ExportButton({ type, label = 'Export', params = {}, className = '' }) {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    setShowMenu(false);
    
    try {
      const result = await exportData(type, format, params);
      if (result.success) {
        alert(result.message);
      } else {
        alert(result.message);
      }
    } catch {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={exporting}
        className={`btn btn-secondary ${className}`}
      >
        <FiDownload className="w-4 h-4" />
        {exporting ? 'Exporting...' : label}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-20 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => handleExport('excel')}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
            >
              <FiFile className="w-4 h-4" />
              Export to Excel
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
            >
              <FiFileText className="w-4 h-4" />
              Export to PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default ExportButton;