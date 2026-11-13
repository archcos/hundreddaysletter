# Hundred Day Letters — Website

Next.js site for Hundred Day Letters: a world map where anyone can leave a letter at any place.
Every letter fades and disappears after 100 days. It talks to the separate Express API (the server repo).

- `/` is the map (`app/(site)/`), with its own hand-written CSS.
- `/admin` is the moderation panel (`app/admin/`), built with shadcn/ui and Tailwind. Those styles
  load only on `/admin`.

## There is no delete

**The admin panel cannot delete letters or replies, and neither can the API behind it.** This is
deliberate, so that a stolen admin password can't destroy anything.

- **Archive** hides a letter or reply from the map. **Restore** brings it back. Find archived items under
  **Letters → Archived** (or **Replies → Archived**).
- **Ban author** can optionally *archive* (not delete) everything that author posted.
- **Dismiss reports** stops reports counting, but they stay stored.
- The **Activity** tab lists every admin action. It can't be edited or cleared from the panel.
- The only permanent removal is the automatic 100-day expiry on the server.

See the server repo's README for the full details.

## Running locally

```bash
cp .env.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5100
npm install
npm run dev                  # http://localhost:3100 (admin: /admin)
```

The API must be running too, and its `WEB_ORIGIN` must match this site's address
(`http://localhost:3100` locally).
