import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

/**
 * PDF Download Button Component
 * Downloads PDF files from API endpoints
 */
const PDFDownloadButton = ({ 
  onDownload, 
  filename, 
  label = 'Download PDF',
  className = '',
  variant = 'primary',
  size = 'md',
  icon = true,
  disabled = false
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await onDownload();
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      console.error('PDF download error:', error);
      toast.error(error.response?.data?.message || 'Failed to download PDF');
    } finally {
      setIsDownloading(false);
    }
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    outline: 'border border-gray-300 hover:bg-gray-50 text-gray-700'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled || isDownloading}
      className={`
        inline-flex items-center justify-center gap-2 
        rounded-lg font-medium transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {icon && <Download className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />}
      <span>{isDownloading ? 'Downloading...' : label}</span>
    </button>
  );
};

export default PDFDownloadButton;
