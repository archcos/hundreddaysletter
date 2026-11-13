'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, Ban, Check, ExternalLink, MoreHorizontal, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const noun = kind => (kind === 'letters' ? 'letter' : 'reply');

// The "…" menu on every letter/reply row. There is no delete: archive hides, restore brings it back.
export function ItemActions({ kind, row, api, onDone }) {
  const [dialog, setDialog] = useState(null); // 'archive' | 'ban' | null
  const run = async (promise, message) => {
    try { await promise; toast.success(message); onDone(); } catch (e) { toast.error(e.message); }
  };
  const archived = !!row.archived_at;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Actions for this ${noun(kind)}`}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {row.uid && !archived && (
            <DropdownMenuItem asChild>
              <a href={`/?letter=${row.uid}`} target="_blank" rel="noopener"><ExternalLink /> View on map</a>
            </DropdownMenuItem>
          )}
          {!!row.held && !archived && (
            <DropdownMenuItem onSelect={() => run(api(`${kind}/${row.id}/approve`, { method: 'POST' }), 'Approved and published')}>
              <Check /> Approve &amp; publish
            </DropdownMenuItem>
          )}
          {row.reports > 0 && (
            <DropdownMenuItem onSelect={() => run(api(`${kind}/${row.id}/clear-reports`, { method: 'POST' }), 'Reports dismissed')}>
              <Undo2 /> Dismiss reports
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialog('ban')}><Ban /> Ban author…</DropdownMenuItem>
          {archived ? (
            <DropdownMenuItem onSelect={() => run(api(`${kind}/${row.id}/restore`, { method: 'POST' }), `${cap(noun(kind))} restored`)}>
              <ArchiveRestore /> Restore
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setDialog('archive')}><Archive /> Archive…</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={dialog === 'archive'} onOpenChange={o => !o && setDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this {noun(kind)}?</AlertDialogTitle>
            <AlertDialogDescription>
              It disappears from the {kind === 'letters' ? 'map (with its replies)' : 'letter'}. Nothing is deleted:
              you can restore it any time from the <b>Archived</b> filter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <blockquote className="max-h-32 overflow-auto rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">{row.body}</blockquote>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => run(api(`${kind}/${row.id}/archive`, { method: 'POST' }), `${cap(noun(kind))} archived`)}>
              <Archive /> Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BanDialog open={dialog === 'ban'} onClose={() => setDialog(null)} author={row.author}
        onBan={({ reason, archiveAll }) => run(
          api(`${kind}/${row.id}/ban`, { method: 'POST', body: { reason, archiveAll } })
            .then(r => { if (archiveAll) toast.info(`Archived ${r.archived} post${r.archived === 1 ? '' : 's'} by this author`); }),
          `Author ${row.author} banned`,
        )} />
    </>
  );
}

const cap = s => s[0].toUpperCase() + s.slice(1);

function BanDialog({ open, onClose, author, onBan }) {
  const [reason, setReason] = useState('');
  const [archiveAll, setArchiveAll] = useState(false);
  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ban author <code className="font-mono">{author}</code>?</DialogTitle>
          <DialogDescription>
            They won&apos;t be able to post letters or replies. Bans work by connection, so people sharing a network
            (a school, an office) can be affected too. You can unban from the Bans tab.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ban-reason">Reason (only admins see this)</Label>
            <Input id="ban-reason" value={reason} maxLength={200} onChange={e => setReason(e.target.value)} placeholder="e.g. spam wave, harassment" />
          </div>
          <label className="flex items-start gap-3 rounded-md border p-3">
            <Checkbox checked={archiveAll} onCheckedChange={v => setArchiveAll(!!v)} className="mt-0.5" />
            <span className="text-sm">
              Also archive everything this author has posted
              <span className="block text-muted-foreground">Hides all their letters and replies. You can restore them from the Archived filter.</span>
            </span>
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={() => { onBan({ reason, archiveAll }); onClose(); }}>
            <Ban /> {archiveAll ? 'Ban and archive posts' : 'Ban author'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
