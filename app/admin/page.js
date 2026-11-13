'use client';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Archive, Ban, CalendarClock, EyeOff, Flag, Hourglass, LogOut, Mail, Map as MapIcon, RefreshCw, ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { basicAuth, makeApi, session } from './api';
import ContentTab from './ContentTab';
import ReportsTab from './ReportsTab';
import BansTab from './BansTab';
import WordsTab from './WordsTab';
import ActivityTab from './ActivityTab';

export default function AdminPage() {
  const [auth, setAuth] = useState(null);       // Basic credentials once signed in
  const [overview, setOverview] = useState(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('letters');
  const [filters, setFilters] = useState({ letters: 'all', replies: 'all' });
  const [authors, setAuthors] = useState({ letters: '', replies: '' });
  const [tick, setTick] = useState(0);          // bump to reload the open tab

  // Follow the map's theme: Night on the map = dark admin.
  useEffect(() => {
    try { document.documentElement.classList.toggle('dark', localStorage.getItem('letters-theme') === 'night'); } catch {}
  }, []);

  const logout = () => { session.set(''); setAuth(null); setOverview(null); };
  const api = useMemo(() => auth && makeApi(auth, logout), [auth]);
  const loadOverview = () => api('overview').then(setOverview).catch(e => toast.error(e.message));

  const signIn = async creds => {
    const o = await makeApi(creds)('overview');
    setOverview(o); setAuth(creds); session.set(creds);
  };
  useEffect(() => {
    const saved = session.get();
    if (!saved) return setChecking(false);
    signIn(saved).catch(() => session.set('')).finally(() => setChecking(false));
  }, []);

  if (checking) return null;
  if (!auth) return <Login onSignIn={signIn} />;

  const go = (t, filter) => { setTab(t); if (filter) setFilters(f => ({ ...f, [t]: filter })); };
  const o = overview || {};
  const tiles = [
    { label: 'Waiting for review', value: o.held, icon: Hourglass, alert: o.held > 0, onClick: () => go('letters', 'held'), hint: 'Auto-held until you approve' },
    { label: 'Reported', value: o.reported, icon: ShieldAlert, alert: o.reported > 0, onClick: () => go('reports') },
    { label: 'Auto-flagged', value: o.flagged, icon: Flag, onClick: () => go('letters', 'flagged') },
    { label: 'Hidden by reports', value: o.hidden, icon: EyeOff, onClick: () => go('letters', 'hidden'), hint: `${o.hideAt ?? 3}+ reports` },
    { label: 'Letters on the map', value: o.live, icon: Mail, onClick: () => go('letters', 'all') },
    { label: 'Archived', value: o.archived, icon: Archive, onClick: () => go('letters', 'archived'), hint: 'Hidden, restorable' },
    { label: 'New in 24 hours', value: o.today, icon: CalendarClock, onClick: () => go('letters', 'all') },
    { label: 'Banned authors', value: o.bans, icon: Ban, onClick: () => go('bans') },
  ];
  const content = kind => (
    <ContentTab kind={kind} api={api} tick={tick} hideAt={o.hideAt ?? 3} onChange={loadOverview}
      filter={filters[kind]} setFilter={v => setFilters(f => ({ ...f, [kind]: v }))}
      author={authors[kind]} setAuthor={v => setAuthors(a => ({ ...a, [kind]: v }))} />
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <div className="mr-auto">
            <h1 className="font-serif text-lg font-semibold">Hundred Day Letters <span className="text-muted-foreground">· Admin</span></h1>
            <p className="text-xs text-muted-foreground">
              Signed in as <b>{o.user}</b> · posting limit {o.postsPerHour > 0 ? `${o.postsPerHour}/hour` : 'off'}
            </p>
          </div>
          <Button variant="outline" size="sm" asChild><a href="/"><MapIcon /> View map</a></Button>
          <Button variant="outline" size="sm" onClick={() => { loadOverview(); setTick(t => t + 1); }}><RefreshCw /> Refresh</Button>
          <Button variant="ghost" size="sm" onClick={logout}><LogOut /> Log out</Button>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6">
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4" aria-label="Overview">
          {tiles.map(t => (
            <button key={t.label} onClick={t.onClick}
              className={`rounded-xl border bg-card p-4 text-left shadow-xs transition hover:bg-accent focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none ${t.alert ? 'border-primary/50' : ''}`}>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                {t.label}<t.icon className={`size-4 ${t.alert ? 'text-primary' : ''}`} />
              </div>
              <div className={`mt-1 text-2xl font-semibold tabular-nums ${t.alert ? 'text-primary' : ''}`}>{t.value ?? '–'}</div>
              {t.hint && <div className="text-xs text-muted-foreground">{t.hint}</div>}
            </button>
          ))}
        </section>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto flex-wrap">
            <TabsTrigger value="letters">Letters</TabsTrigger>
            <TabsTrigger value="replies">Replies</TabsTrigger>
            <TabsTrigger value="reports">Reports {o.reported > 0 && <Badge className="ml-1 h-5 px-1.5">{o.reported}</Badge>}</TabsTrigger>
            <TabsTrigger value="bans">Bans</TabsTrigger>
            <TabsTrigger value="words">Blocked words</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          <TabsContent value="letters" className="mt-4">{content('letters')}</TabsContent>
          <TabsContent value="replies" className="mt-4">{content('replies')}</TabsContent>
          <TabsContent value="reports" className="mt-4">
            <ReportsTab api={api} tick={tick} hideAt={o.hideAt ?? 3} onChange={loadOverview}
              onAuthor={(kind, a) => { setAuthors(x => ({ ...x, [kind]: a })); go(kind, 'all'); }} />
          </TabsContent>
          <TabsContent value="bans" className="mt-4"><BansTab api={api} tick={tick} onChange={loadOverview} /></TabsContent>
          <TabsContent value="words" className="mt-4"><WordsTab api={api} tick={tick} /></TabsContent>
          <TabsContent value="activity" className="mt-4"><ActivityTab api={api} tick={tick} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function Login({ onSignIn }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    setBusy(true); setError('');
    try { await onSignIn(basicAuth(user, pass)); }
    catch (err) { setError(err.message); setBusy(false); }
  };

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="font-serif text-xl">Letters admin</CardTitle>
          <CardDescription>Sign in to moderate letters, replies and reports.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="user">Username</Label>
              <Input id="user" autoComplete="username" value={user} onChange={e => setUser(e.target.value)} required autoFocus />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pass">Password</Label>
              <Input id="pass" type="password" autoComplete="current-password" value={pass} onChange={e => setPass(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
            <Button type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
