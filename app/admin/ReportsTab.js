'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ItemActions } from './ItemActions';
import { AuthorTag, StatusBadges } from './ContentTab';
import { REASON_LABELS, since } from './api';

// Everything people reported, newest first, with how many times and why.
export default function ReportsTab({ api, onChange, tick, hideAt, onAuthor }) {
  const [rows, setRows] = useState(null);
  const load = () => api('reports').then(setRows).catch(e => { setRows([]); toast.error(e.message); });
  useEffect(() => { load(); }, [tick]);
  const done = () => { load(); onChange(); };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Reported item</TableHead>
            <TableHead>Why people reported it</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Author</TableHead>
            <TableHead>Last report</TableHead>
            <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows === null && [0, 1].map(i => <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>)}
          {rows?.length === 0 && <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No reports. 🎉</TableCell></TableRow>}
          {rows?.map(row => {
            const counts = {};
            (row.reasons || '').split(',').filter(Boolean).forEach(r => { counts[r] = (counts[r] || 0) + 1; });
            return (
              <TableRow key={`${row.kind}-${row.id}`} className={row.reports >= hideAt ? 'bg-destructive/5' : ''}>
                <TableCell className="max-w-md align-top whitespace-normal">
                  <Badge variant="outline" className="mb-1">{row.kind === 'letters' ? 'Letter' : 'Reply'}</Badge>
                  <p dir="auto" className="line-clamp-4 whitespace-pre-wrap break-words">{row.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">— <bdi>{row.name || 'anonymous'}</bdi></p>
                </TableCell>
                <TableCell className="align-top">
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(counts).map(([r, n]) => (
                      <Badge key={r} variant={r === 'danger' || r === 'abuse' ? 'destructive' : 'secondary'}>{REASON_LABELS[r] || r}{n > 1 ? ` ×${n}` : ''}</Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell className="align-top"><StatusBadges row={row} hideAt={hideAt} /></TableCell>
                <TableCell className="align-top"><AuthorTag author={row.author} onPick={a => onAuthor(row.kind, a)} /></TableCell>
                <TableCell className="align-top text-sm whitespace-nowrap">{since(row.last_at)}</TableCell>
                <TableCell className="align-top"><ItemActions kind={row.kind} row={row} api={api} onDone={done} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
