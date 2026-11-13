'use client';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Lock, Plus, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

// Letters or replies containing any of these are refused when posted (whole-word matching, see server/lib.js).
export default function WordsTab({ api, tick }) {
  const [data, setData] = useState(null);
  const [word, setWord] = useState('');
  const load = () => api('words').then(setData).catch(e => toast.error(e.message));
  useEffect(() => { load(); }, [tick]);

  const add = async e => {
    e.preventDefault();
    try { await api('words', { method: 'POST', body: { word } }); toast.success(`Blocked “${word.trim().toLowerCase()}”`); setWord(''); load(); }
    catch (err) { toast.error(err.message); }
  };
  const remove = async w => {
    try { await api('words/remove', { method: 'POST', body: { word: w } }); toast.success(`Unblocked “${w}”`); load(); }
    catch (err) { toast.error(err.message); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Blocked words</CardTitle>
        <CardDescription>
          Letters and replies containing any of these are refused when someone tries to post them.
          Matching is by whole word, so blocking a word doesn&apos;t block longer words that contain it. It also
          catches capitals, accents, leetspeak (r3tard), spaced or dotted letters (s p a m), repeated letters, and
          endings: plurals for short words, and s/ed/ing/er for words of 5+ letters.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form onSubmit={add} className="flex gap-2">
          <Input value={word} onChange={e => setWord(e.target.value)} maxLength={60} placeholder="Add a word or phrase" aria-label="Word to block" />
          <Button type="submit" disabled={!word.trim()}><Plus /> Block</Button>
        </form>
        <div className="flex flex-wrap gap-2">
          {data?.words.map(w => (
            <Badge key={w} variant="secondary" className="gap-1 py-1 text-sm">
              {w}
              <button onClick={() => remove(w)} aria-label={`Unblock ${w}`} className="rounded-full hover:text-destructive"><X className="size-3.5" /></button>
            </Badge>
          ))}
          {data?.env.map(w => (
            <Badge key={`env-${w}`} variant="outline" className="gap-1 py-1 text-sm" title="Set in server/.env (BLOCKED_WORDS)">
              <Lock className="size-3" /> {w}
            </Badge>
          ))}
          {data && !data.words.length && !data.env.length && <p className="text-sm text-muted-foreground">No blocked words yet.</p>}
        </div>
        {data?.env.length > 0 && <p className="text-xs text-muted-foreground">Words with a lock come from BLOCKED_WORDS in server/.env and can only be changed there.</p>}
      </CardContent>
    </Card>
  );
}
