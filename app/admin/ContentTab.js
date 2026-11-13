'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Archive, ArchiveRestore, Search, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ItemActions } from './ItemActions';
import { FLAG_LABELS, LIFE, ageText } from './api';

export const FILTERS = [
  ['all', 'All'], ['held', 'Waiting for review'], ['flagged', 'Auto-flagged'], ['reported', 'Reported'], ['hidden', 'Hidden'],
  ['archived', 'Archived'],
];

export function StatusBadges({ row, hideAt = 3 }) {
  const flags = row.flags ? row.flags.split(',') : [];
  const parts = [];
  if (row.archived_at) parts.push(<Badge key="arch" variant="outline" className="gap-1"><Archive className="size-3" /> Archived</Badge>);
  if (row.held) parts.push(<Badge key="held" className="bg-warning text-black">Waiting for review</Badge>);
  if (row.reports >= hideAt) parts.push(<Badge key="hidden" variant="destructive">Hidden</Badge>);
  if (row.reports > 0) parts.push(<Badge key="rep" variant="outline">{row.reports} report{row.reports === 1 ? '' : 's'}</Badge>);
  flags.forEach(f => parts.push(<Badge key={f} variant="secondary">{FLAG_LABELS[f] || f}</Badge>));
  return parts.length ? <div className="flex flex-wrap gap-1">{parts}</div> : <span className="text-sm text-muted-foreground">OK</span>;
}

export function AuthorTag({ author, onPick }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs hover:bg-accent" onClick={() => onPick(author)}>{author}</button>
      </TooltipTrigger>
      <TooltipContent>Show everything from this author</TooltipContent>
    </Tooltip>
  );
}

export default function ContentTab({ kind, api, filter, setFilter, author, setAuthor, onChange, tick, hideAt }) {
  const [rows, setRows] = useState(null);
  const [text, setText] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);

  const load = () => {
    api(`${kind}?${new URLSearchParams({ filter, q: query, author })}`)
      .then(r => { setRows(r); setSelected(new Set()); })
      .catch(e => { setRows([]); toast.error(e.message); });
  };
  useEffect(load, [kind, filter, query, author, tick]);
  const done = () => { load(); onChange(); };

  const toggle = id => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allChecked = rows?.length > 0 && selected.size === rows.length ? true : selected.size ? 'indeterminate' : false;

  // No delete anywhere: the bulk action archives (or, in the Archived view, restores).
  const restoring = filter === 'archived';
  const items = n => `${n} ${kind === 'letters' ? (n === 1 ? 'letter' : 'letters') : (n === 1 ? 'reply' : 'replies')}`;
  const bulk = async () => {
    try {
      const r = await api(`${kind}/bulk`, { method: 'POST', body: { action: restoring ? 'restore' : 'archive', ids: [...selected] } });
      toast.success(`${restoring ? 'Restored' : 'Archived'} ${items(r.changed)}`);
      done();
    } catch (e) { toast.error(e.message); }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-1" role="group" aria-label="Filter">
          {FILTERS.map(([k, label]) => (
            <Button key={k} size="sm" variant={filter === k ? 'default' : 'outline'} aria-pressed={filter === k} onClick={() => setFilter(k)}>{label}</Button>
          ))}
        </div>
        <form className="ml-auto flex w-full gap-2 sm:w-auto" onSubmit={e => { e.preventDefault(); setQuery(text.trim()); }} role="search">
          <Input value={text} onChange={e => setText(e.target.value)} placeholder={`Search ${kind}…`} className="sm:w-64" aria-label={`Search ${kind}`} />
          <Button type="submit" variant="secondary" size="icon" aria-label="Search"><Search /></Button>
        </form>
      </div>

      {(author || query || selected.size > 0) && (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {query && <Badge variant="outline" className="gap-1">Text: “{query}”<button aria-label="Clear search" onClick={() => { setQuery(''); setText(''); }}><X className="size-3" /></button></Badge>}
          {author && <Badge variant="outline" className="gap-1">Author: <span className="font-mono">{author}</span><button aria-label="Clear author filter" onClick={() => setAuthor('')}><X className="size-3" /></button></Badge>}
          {selected.size > 0 && (
            <Button size="sm" variant={restoring ? 'default' : 'outline'} className="ml-auto" onClick={() => (restoring ? bulk() : setConfirmBulk(true))}>
              {restoring ? <><ArchiveRestore /> Restore {selected.size} selected</> : <><Archive /> Archive {selected.size} selected</>}
            </Button>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allChecked} onCheckedChange={v => setSelected(v ? new Set(rows.map(r => r.id)) : new Set())} aria-label="Select all" />
              </TableHead>
              <TableHead>{kind === 'letters' ? 'Letter' : 'Reply'}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Age</TableHead>
              <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows === null && [0, 1, 2].map(i => (
              <TableRow key={i}><TableCell colSpan={6}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
            ))}
            {rows?.length === 0 && (
              <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground">Nothing here. 🎉</TableCell></TableRow>
            )}
            {rows?.map(row => (
              <TableRow key={row.id} data-state={selected.has(row.id) ? 'selected' : undefined}
                className={row.archived_at ? 'opacity-70' : row.held ? 'bg-warning/10' : row.reports >= hideAt ? 'bg-destructive/5' : ''}>
                <TableCell className="align-top">
                  <Checkbox checked={selected.has(row.id)} onCheckedChange={() => toggle(row.id)} aria-label="Select row" />
                </TableCell>
                <TableCell className="max-w-md align-top whitespace-normal">
                  <p className="line-clamp-4 whitespace-pre-wrap break-words">{row.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    — {row.name || 'anonymous'}
                    {kind === 'letters'
                      ? <> · {Number(row.lat).toFixed(2)}, {Number(row.lng).toFixed(2)} · {row.font}/{row.paper} · {row.replies} repl{row.replies === 1 ? 'y' : 'ies'}</>
                      : <> · on “{row.letter_body}{row.letter_body?.length >= 80 ? '…' : ''}”</>}
                  </p>
                </TableCell>
                <TableCell className="align-top"><StatusBadges row={row} hideAt={hideAt} /></TableCell>
                <TableCell className="align-top"><AuthorTag author={row.author} onPick={setAuthor} /></TableCell>
                <TableCell className="align-top text-sm whitespace-nowrap">
                  {ageText(row.age_days)}
                  {kind === 'letters' && <span className="block text-xs text-muted-foreground">{Math.max(0, Math.ceil(LIFE - Number(row.age_days)))}d left</span>}
                </TableCell>
                <TableCell className="align-top"><ItemActions kind={kind} row={row} api={api} onDone={done} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {rows?.length === 200 && <p className="text-sm text-muted-foreground">Showing the first 200. Use search or filters to narrow it down.</p>}

      <AlertDialog open={confirmBulk} onOpenChange={setConfirmBulk}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {items(selected.size)}?</AlertDialogTitle>
            <AlertDialogDescription>
              They disappear from the {kind === 'letters' ? 'map' : 'letters'}. Nothing is deleted: restore them any time from the <b>Archived</b> filter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulk}><Archive /> Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
