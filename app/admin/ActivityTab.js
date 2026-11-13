'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { since } from './api';

const LABELS = {
  archive: 'Archived', restore: 'Restored', approve: 'Approved', 'dismiss-reports': 'Dismissed reports',
  ban: 'Banned', unban: 'Unbanned', 'block-word': 'Blocked word', 'unblock-word': 'Unblocked word',
};

// Every admin action, newest first. The server has no way to edit or delete this log,
// so if the admin account is ever misused you can see exactly what happened and undo it.
export default function ActivityTab({ api, tick }) {
  const [rows, setRows] = useState(null);
  useEffect(() => { api('log').then(setRows).catch(e => { setRows([]); toast.error(e.message); }); }, [tick]);

  return (
    <div className="grid gap-3">
      <p className="text-sm text-muted-foreground">
        Every admin action is recorded here and can&apos;t be edited or erased from the panel. Nothing in the admin can
        delete letters or replies: archived items can always be restored from the <b>Archived</b> filter.
      </p>
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Details</TableHead>
              <TableHead>From</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null && <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
            {rows?.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">No admin actions yet.</TableCell></TableRow>}
            {rows?.map(r => (
              <TableRow key={r.id}>
                <TableCell className="text-sm whitespace-nowrap" title={new Date(r.at).toLocaleString()}>{since(r.at)}</TableCell>
                <TableCell>
                  <Badge variant={r.action === 'archive' || r.action === 'ban' ? 'secondary' : 'outline'}>{LABELS[r.action] || r.action}</Badge>
                  {r.kind && <span className="ml-2 text-xs text-muted-foreground">{r.kind === 'letters' ? 'letter' : 'reply'}{r.item_id ? ` #${r.item_id}` : ''}</span>}
                </TableCell>
                <TableCell className="max-w-md text-sm whitespace-normal break-words">{r.detail}</TableCell>
                <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs" title="Hashed connection of whoever did it">{r.by_ip}</code></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
