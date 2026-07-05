'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { adminFetch } from '@/lib/admin-client';
import { Loader2 } from 'lucide-react';

interface LogEntry {
  id: string;
  action: string;
  performedBy: string;
  targetType: string;
  targetId: string;
  changes?: any;
  timestamp: string;
}

export default function AdminAuditPage() {
  const t = useTranslations('admin');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminFetch('/api/admin/audit')
      .then((data) => setLogs(data.logs))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('audit')}</h1>

      {logs.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">{t('noLogs')}</p>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="p-4 rounded-md border text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono text-xs text-muted-foreground">{log.id.slice(0, 8)}</span>
                <span className="text-xs text-muted-foreground">{log.timestamp ? new Date(log.timestamp).toLocaleString() : '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium capitalize">{log.action.replace(/_/g, ' ')}</span>
                <span className="text-muted-foreground">on</span>
                <span className="font-mono text-xs">{log.targetType}:{log.targetId}</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">by {log.performedBy}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
