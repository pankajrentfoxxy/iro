# IRO – Indian Reform Organisation – Implementation Plan

## Research Summary: RSS, INC, BJP Websites

### [RSS (rss.org)](https://www.rss.org/)
- **Nav**: Home | Know us (dropdown: FAQ, Timeline, Swayamsevak, Vision & Mission) | Gallery | Videos (dropdown) | Sewa | Archives | Join RSS
- **Home**: Latest Updates (full-width cards with timestamps), Welcome section, Know Us cards (Vision, Swayamsevak, Timeline, FAQ), Social Media, Videos, Photo Gallery
- **Style**: Clean, content-first, saffron accents, member count ("Upto this moment: 1552997")

### [INC (inc.in)](https://inc.in/)
- **Nav**: Volunteer | Press Releases | National Herald | Donate | Key Issues | Organisation | In Focus | Voice | Media | Join the Movement
- **Home**: In Focus carousel, Key Issues, Rahul Gandhi speaks, Congress Sandesh, Our Achievements, Brief history, Dharohar Series
- **Style**: Modern, card-based, blue theme, prominent CTA buttons

### [BJP (bjp.org)](https://www.bjp.org/home)
- **Nav**: Full-width hero carousel, About us, Our Journey (timeline), National President section
- **Home**: Full-page image carousel, President highlight, Journey timeline
- **Style**: Bold, image-heavy, saffron-green, membership CTA

---

## IRO Implementation Plan

### Phase 1: Navigation & Page Structure

**Top-level nav (all pages):**
- Logo (IRO)
- Home
- About / Know Us (dropdown: Vision & Mission, FAQ, Timeline)
- Join the Movement (→ signup/login)
- Media (hover dropdown)
  - Gallery → `/media/gallery` (photo grid, admin upload)
  - Videos → `/media/videos` (video grid, admin upload)
- User box (when logged in) | Login (when not)

**Media pages:**
- Gallery: Grid of photos, admin can upload. Each item: image, caption, date.
- Videos: Grid of videos (YouTube embed or upload). Each item: thumbnail, title, date.

---

### Phase 2: Home Page Redesign

**Structure (top to bottom):**
1. **Hero / Latest Updates** – Full-viewport or near-full scrollable section
   - Background image (admin-configurable)
   - Overlay text: latest news/update (admin-editable)
   - "Read more" link to full article
   - Admin can add/edit/remove updates

2. **Stats strip** – Total Reformers, States, Districts, Growth % (compact)

3. **India Map section** – Member distribution
   - Hover on state: tooltip with state name + Reformer count
   - Click state: right panel shows state map (district boundaries)
   - Hover on district: tooltip with district name + count
   - No state name label on the map itself

4. **About IRO** – Vision, Mission, brief intro

5. **Footer** – Links, copyright

---

### Phase 3: India Map Enhancements

**Current:** State-level map, click shows district list in side panel.

**New:**
- India map: hover → state name + "X Reformers"
- Click state → load state-level district map on right
- State map: district paths, hover → district name + "X Reformers"
- Use district SVG where available (e.g. Wikimedia), or district list + future SVG

**Data:** `/api/public/stats`, `/api/public/stats/districts?state=X` already exist.

---

### Phase 4: Location Fields

**Current schema:** `state`, `district`, `tehsil` (block), `area`, `city`, `pincode`

**UI labels:**
- State
- District
- Block (Tehsil)
- Area / Place (village, locality)
- Pincode

**Geocode:** Already returns state, district, block, village, pincode. Map to:
- `tehsil` ← `block`
- `area` ← `village`

**Profile & onboarding:** Ensure all 5 fields are shown and saved.

---

### Phase 5: Latest Updates / News Admin

**Backend:**
- Table: `LatestUpdate` (id, title, excerpt, body, imageUrl, publishedAt, createdById, createdAt)
- API: `GET /api/public/latest-updates` (public), `POST/PATCH/DELETE /api/admin/latest-updates` (admin)
- Admin UI: List, create, edit, delete updates

**Frontend:**
- Hero section fetches latest update, displays image + text
- "Read more" → `/updates/[id]` or modal

---

### Phase 6: Login Page (Future)

- After login: dashboard with user stats, organisation info, referral, etc.
- Deferred to next phase.

---

## File Structure (New/Modified)

```
frontend/
  app/
    page.tsx              # Redesigned home
    layout.tsx             # Shared nav
    about/
      page.tsx            # About / Know Us
    media/
      gallery/page.tsx
      videos/page.tsx
    join/page.tsx         # Join the Movement (redirect or signup CTA)
  components/
    Nav.tsx               # Shared nav with dropdowns
    IndiaMap.tsx          # Enhanced map
    StateDistrictMap.tsx   # State-level district map (new)
    LatestUpdatesHero.tsx # Hero with latest news

backend/
  prisma/schema.prisma    # Add LatestUpdate, MediaItem
  src/routes/
    public.ts             # Add latest-updates
    admin.ts              # Add latest-updates CRUD, media upload
```

---

## Implementation Order

1. ✅ Nav component + routes (About, Join, Media/Gallery, Media/Videos)
2. ✅ Home page: Hero (Latest Updates) + Map section
3. ✅ India Map: hover tooltip (state + Reformer count), click → district list
4. ✅ Location fields in profile/onboarding (State, District, Block, Area/Place, Pincode)
5. ✅ LatestUpdate model + API + admin UI
6. Gallery/Videos pages + admin upload (placeholder pages created)

## Database Migration

To enable Latest Updates, run the migration:

```bash
cd backend
npx prisma migrate dev --name add_latest_update
```

Or add the `LatestUpdate` table manually using the SQL in `database/02_create_schema.sql` (run the full reset script or add the CREATE TABLE for LatestUpdate).
