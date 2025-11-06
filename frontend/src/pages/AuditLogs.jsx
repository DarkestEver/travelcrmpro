import { Shield } from 'lucide-react';
import AuditLogViewer from '../components/AuditLogViewer';

/**
 * Audit Logs Page
 * Displays system audit logs with advanced filtering
 */
const AuditLogs = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <Shield className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">Track all system activities and user actions</p>
          </div>
        </div>
      </div>

      {/* Audit Log Viewer */}
      <AuditLogViewer />
    </div>
  );
};

export default AuditLogs;
