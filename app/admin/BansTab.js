'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { since } from './api';

export default function BansTab({ api, onChange, tick }) {
  const [rows, setRows] = useState(null);
  const [unban, setUnban] = useState(null);
  const load = () => api('bans').then(setRows).catch(e => { setRows([]); toast.error(e.message); });
  useEffect(() => { load(); }, [tick]);

  const confirmUnban = async () => {
    try { await api(`bans/${unban.hash}/unban`, { method: 'POST' }); toast.success(`Author ${unban.author} unbanned`); load(); onChange(); }
    catch (e) { toast.error(e.message); }
  };

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Author</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Banned</TableHead>
            <TableHead className="w-28"><span className="sr-only">Actions</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows === null && <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>}
          {rows?.length === 0 && <TableRow><TableCell colSpan={4} className="py-10 text-center text-muted-foreground">Nobody is banned.</TableCell></TableRow>}
          {rows?.map(b => (
            <TableRow key={b.hash}>
              <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs">{b.author}</code></TableCell>
              <TableCell className="whitespace-normal">{b.reason || <span className="text-muted-foreground">No reason given</span>}</TableCell>
              <TableCell className="text-sm">{since(b.created_at)}</TableCell>
              <TableCell><Button size="sm" variant="outline" onClick={() => setUnban(b)}><Undo2 /> Unban</Button></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!unban} onOpenChange={o => !o && setUnban(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unban author {unban?.author}?</AlertDialogTitle>
            <AlertDialogDescription>They&apos;ll be able to post letters and replies again.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmUnban}>Unban</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
