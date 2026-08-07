import api from '@/services/axios';

const EXPORT_API = '/api/v1/export';

/**
 * Export data to Excel format
 */
export async function exportToExcel(type, params = {}) {
  try {
    const response = await api.get(`${EXPORT_API}/${type}`, {
      params: { format: 'excel', ...params },
    });

    const { data } = response.data.data;
    
    // Convert data to CSV for Excel compatibility
    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Handle values with commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value ?? '';
          }).join(',')
        )
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `export_${Date.now()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      return { success: true, message: 'Excel export downloaded successfully' };
    }
    
    return { success: false, message: 'No data to export' };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: error.response?.data?.message || 'Export failed' };
  }
}

/**
 * Export data to PDF format
 */
export async function exportToPDF(type, params = {}) {
  try {
    const response = await api.get(`${EXPORT_API}/${type}`, {
      params: { format: 'pdf', ...params },
    });

    const { data, title } = response.data.data;
    
    // For PDF, we'll create a printable HTML window
    if (data && data.length > 0) {
      const headers = Object.keys(data[0]);
      
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title || 'Export'}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            tr:nth-child(even) { background-color: #f2f2f2; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${title || 'Export'}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(h => `<td>${row[h] ?? ''}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <p>Total records: ${data.length}</p>
          </div>
        </body>
        </html>
      `;

      const printWindow = window.open('', '_blank');
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
      
      return { success: true, message: 'PDF export ready for printing' };
    }
    
    return { success: false, message: 'No data to export' };
  } catch (error) {
    console.error('Export error:', error);
    return { success: false, message: error.response?.data?.message || 'Export failed' };
  }
}

/**
 * Generic export function
 */
export async function exportData(type, format = 'excel', params = {}) {
  if (format === 'pdf') {
    return exportToPDF(type, params);
  }
  return exportToExcel(type, params);
}