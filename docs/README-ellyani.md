# My part: listings, search, map, dashboard and languages

**Member:** Said Ellyani (`sellyani`)
**Role:** Developer, frontend and listings API (`<role>`)

## What I did

- **Backend:** a listings API with filters, sorting and pagination, a PostgreSQL table, migrations and sample data.
- **Frontend:** the home page, the listings page (sorting and pages), a map that shows each listing as a price marker, and an analytics dashboard.
- **Languages:** the whole interface in Arabic, French and English, with a right-to-left layout for Arabic.
- **Legal:** Privacy Policy and Terms of Service pages.

## Features

- **Search listings** by city (any language), property type and price. Results come from the database.
- **Listings page** with cards, a details drawer, and filters kept in the URL (refresh and back button keep the search).
- **Owner of each listing** shown in the details; your own listings are marked and you cannot contact yourself.
- **Sorting and pages**: newest, price (low or high) or most bedrooms; 12 listings per page with page numbers.
- **Map search**: listings shown as price markers; a marker opens the details; the map follows the search.
- **Languages** with a switcher; the choice is remembered.
- **Dashboard** for signed-in users: numbers, a chart and the top listings for the last 7, 30 or 90 days.
- **Right-to-left layout**: the whole page mirrors in Arabic.
- **Privacy Policy** and **Terms of Service** linked from the footer.

## Modules (9 points)

| Module | Type | Points |
|--------|------|--------|
| Framework for frontend and backend | Major | 2 |
| ORM for the database | Minor | 1 |
| Multiple languages (3) | Minor | 1 |
| Right-to-left (RTL) support | Minor | 1 |
| Custom: interactive map-based search | Major | 2 |
| Advanced search: filters, sorting and pagination | Minor | 1 |
| User activity analytics and insights dashboard | Minor | 1 |

The framework and ORM modules are shared with the team. The languages, RTL, map and advanced search modules are mine. The dashboard is shared: I built the frontend, another team member builds the backend.

### Framework for frontend and backend (Major, 2 pts)
- **Why:** React and NestJS give a clear structure and let several people work in parallel.
- **How:** React + Vite + Tailwind CSS for the frontend; NestJS for the API, split into modules, controllers and services.

### ORM (Minor, 1 pt)
- **Why:** TypeORM avoids hand-written SQL and keeps the schema under version control.
- **How:** entities `User`, `RegistrationSession`, `Listing`; changes only through migrations; the search uses bound parameters, so input is never concatenated into SQL.
- **Relation:** each listing belongs to a user. In the code, `@ManyToOne(() => User)` on `Listing.owner`; in the database, the foreign key `FK_listing_owner` (`ownerId` → `user.id`, `ON DELETE CASCADE`), so a listing can never point to a user who does not exist.

### Multiple languages (Minor, 1 pt)
- **Why:** our users in Morocco speak Arabic, French and English.
- **What the subject asks, and where it is done:**

| Requirement | Done | Where |
|-------------|------|-------|
| At least 3 languages | Arabic, French, English | `frontend/src/translations.ts` |
| A translation system | one typed dictionary + a `lang` state | `translations.ts`, `App.tsx` |
| Complete translations | the same keys exist in the 3 languages (the build fails if one is missing) | `translations.ts` |
| Language switcher in the UI | dropdown on desktop, buttons on mobile | `Components/Navbar.tsx` |
| All user-facing text translatable | no text written directly in the pages | all `frontend/src` |

- **What I did, step by step:**
  1. Moved the last hard-coded texts into the dictionary (page titles, footer address, currency `DH`, `aria-label` of the drawer).
  2. `<html lang>`, `<html dir>` and the page title follow the chosen language.
  3. The choice is saved in `localStorage`; the first visit uses the browser language, then English.
  4. Checked every page in the 3 languages and fixed a missing French word (`Détails`).
- **Adding a text:** add the same key in `ar`, `fr` and `en`, then use `translations[lang].section.key`.
- **Limits:** the labels drawn by Google Maps (street and city names) use Google's own language and are not part of our dictionary; numbers and dates are not formatted per language (not required).

### Right-to-left support (Minor, 1 pt)
- **Why:** Arabic is read from right to left, so the layout must mirror, not only the text.
- **How:**
  - `<html dir="rtl">` is set for Arabic;
  - logical CSS (`start` / `end`) makes elements mirror by themselves;
  - arrows, hover motion, the drawer and the ticker are adjusted for RTL;
  - switching needs no reload.

### Custom module: interactive map-based search (Major, 2 pts)
- **Why:** renting is about location; a map shows where a home is, a list does not.
- **What is hard:**
  - a 3D vector Google map with our own HTML price markers;
  - the map stays in sync with the search (markers = API results, typing a city moves the camera);
  - geolocation finds the nearest city and centres the map;
  - markers of the same city do not overlap;
  - a marker opens the same details drawer as a card.
- **Why Major:** it combines an external mapping API, a 3D map with custom markers, browser geolocation, and state shared between the map, the filters and the drawer, with server-side filtering behind it.

### Advanced search (Minor, 1 pt)
- **Why:** sending every listing to the browser does not scale; the server should send only what is shown.
- **What the subject asks, and where it is done:**

| Requirement | Done | Where |
|-------------|------|-------|
| Filters | city, property type, price range (and a bedrooms filter in the API) | `HomeFilterFields.tsx`, `filter-listings.dto.ts` |
| Sorting | newest, price low to high, price high to low, most bedrooms | sort menu in `ListingsPage.tsx`, `sortBy` and `sortOrder` in the API |
| Pagination | 12 per page, previous and next buttons, page numbers | `ListingsPage.tsx`, `page` and `limit` in the API |

- **How:**
  - one SQL query does the filtering, the sorting and the paging (`WHERE`, `ORDER BY`, `LIMIT` and `OFFSET`);
  - the answer holds the listings and the paging data: `{ data, meta: { total, page, limit, totalPage } }`;
  - the sort and the page are kept in the URL, like the filters;
  - every parameter is validated by the backend.

### User activity analytics dashboard (Minor, 1 pt)
- **Why:** an owner wants to know if people look at the listings and contact them.
- **My part:** the frontend of the dashboard. The backend (recording the activity and the `GET /analytics` API) is done by another team member.
- **What it shows:**
  - a period selector: last 7, 30 or 90 days;
  - three numbers: views, contacts and active listings, each with the change against the previous period (green for up, red for down);
  - a chart of the views day by day;
  - a table of the most viewed listings.
- **How:**
  - the page `DashboardPage.tsx` gets everything from one function, `fetchAnalytics`, so the components do not know where the data comes from;
  - `types/analytics.ts` describes the answer of the API (summary, previous period, daily points, top listings);
  - the chart uses the `recharts` library;
  - the page is only for signed-in users (`/dashboard`) and opens from the dashboard icon of the profile sidebar;
  - texts are in the three languages and the page mirrors in Arabic (the chart axes too).
- **Status:** the frontend is finished and works with sample data. One switch (`USE_MOCK` in `api/analytics.ts`) points it to the real API when the backend is ready.
- **What the page expects from `GET /analytics?range=30d`** (`range` is `7d`, `30d` or `90d`; the request sends the sign-in cookie):

```json
{
  "summary":  { "views": 2460, "contacts": 180, "activeListings": 14 },
  "previous": { "views": 2190, "contacts": 150, "activeListings": 12 },
  "daily": [ { "date": "2026-10-20", "views": 77 } ],
  "topListings": [
    {
      "id": 1,
      "title": { "ar": "...", "fr": "...", "en": "..." },
      "city":  { "ar": "...", "fr": "...", "en": "..." },
      "views": 412
    }
  ]
}
```

`previous` holds the same numbers for the period just before, so the page can show the change. `daily` has one entry per day, oldest first.

## Mandatory requirements I covered

- Privacy Policy and Terms of Service pages, three languages, linked from the footer.
- CSS framework: Tailwind CSS.
- Responsive layout (desktop and mobile).
- Inputs validated on both sides: the frontend accepts only known types and price ranges; the backend validates every parameter.
- One-command deployment: `docker compose up --build`.

## API

`GET /listings` returns one page of listings and the paging data: `{ data, meta }`. All parameters are optional:

| Parameter | Meaning |
|-----------|---------|
| `city` | text searched in the Arabic, French and English city names |
| `type` | `apartment`, `house`, `studio`, `riad` or `villa` |
| `minPrice`, `maxPrice` | price range |
| `minBedrooms` | minimum number of bedrooms |
| `sortBy` | `id` (newest), `price` or `bedrooms` |
| `sortOrder` | `ASC` or `DESC` |
| `page` | page number, starts at 1 |
| `limit` | listings per page, 12 by default, 50 at most |

An invalid value (for example `type=hotel`) returns `400`.

## Database: table `listing`

| Column | Type |
|--------|------|
| `id` | serial, primary key |
| `ownerId` | integer, foreign key to `user.id` |
| `cityAr`, `cityFr`, `cityEn` | varchar |
| `titleAr`, `titleFr`, `titleEn` | varchar |
| `descriptionAr`, `descriptionFr`, `descriptionEn` | text |
| `district`, `districtEnFr` | varchar |
| `price`, `bedrooms` | integer |
| `hasWifi` | boolean |
| `imageUrl`, `ownerName`, `type` | varchar |
| `images` | text, nullable |
| `video` | varchar, nullable |
| `lat`, `lng` | double precision |

Each text is stored once per language, so a listing can be searched and shown in any language.

## How to see my work

1. Home page: search `rabat`, type `Apartment`, press **Search**. The listings page opens with the same filters in the URL.
2. Refresh, then go back: the search is kept.
3. Click a card: the details drawer opens.
4. Home page: type `casablanca`; the map moves there. Click a marker: the drawer opens.
5. Switch to Arabic: the whole page mirrors. Refresh: the language is kept.
6. Open Privacy Policy and Terms of Service from the footer.
7. Listings page: choose **Price: low to high**, go to page 2, refresh. The sort and the page are kept.
8. Sign in, open your profile and click the first icon of the sidebar: the dashboard opens. Change the period, then switch to Arabic.
9. Sign in as a demo owner, for example `salma.owner@irent.local` (the password is `DEMO_OWNER_PASSWORD` from `backend/.env`). Her listings have an orange frame and a "Your listing" badge, and their details show no contact button. Other listings show their owner and the contact button.

## Challenges and how I solved them

### 1. The backend crashed when the stack started
- **Problem:** the backend tried to connect before PostgreSQL was ready, so it failed with a connection error.
- **Solution:** I added a healthcheck to the database container and made the backend wait until it is healthy (`depends_on` with `service_healthy`). Migrations now run when the backend starts, so a fresh clone works with one command.

### 2. The search was lost when changing page
- **Problem:** filters were kept in component state, so going to another page, refreshing or pressing back erased them.
- **Solution:** I moved the filters into the URL (`/listings?city=rabat&type=riad`). The page reads them with `useSearchParams`, and the home page saves its filters in its own URL before navigating, so the back button restores them.

### 3. The Arabic layout was not mirrored
- **Problem:** setting `dir="rtl"` only changed the text direction. Elements placed with `left` / `right` (badges, dropdowns, arrows) stayed on the wrong side.
- **Solution:** I replaced fixed sides with logical CSS (`start` / `end`, `text-start`), which flips with the direction, and used `rtl:` variants for what needed a special case (flipped arrows, reversed hover motion, the drawer opening from the right).

### 4. Map markers were stacked on top of each other
- **Problem:** several listings of the same city had the same position, so only one marker was visible.
- **Solution:** each listing stores its own latitude and longitude, and the markers use them. The sample data places the listings of a city a few hundred metres apart, so the markers are spread and stay in the same place after a refresh.

### 5. The browser blocked calls from the frontend to the API
- **Problem:** the frontend (port 5173) and the API (port 3000) have different origins, so the browser refused the requests (CORS).
- **Solution:** I enabled CORS in the backend for the frontend origin only.

### 6. Search parameters arrive as text
- **Problem:** `minPrice=3000` reaches the API as the string `"3000"`, which fails number validation.
- **Solution:** the DTO converts the value with `@Type(() => Number)` and the global `ValidationPipe` runs with `transform: true`; invalid values return `400`.

### 7. An empty page after changing a filter
- **Problem:** a user on page 3 who changes a filter gets fewer results, so page 3 no longer exists and the list is empty.
- **Solution:** every change of a filter or of the sort goes back to page 1; only the page buttons change the page.

### 8. Equal values moved between pages
- **Problem:** when many listings have the same price, the database may order them differently from one request to the next, so a listing could appear on two pages or on none.
- **Solution:** every sort gets a second rule, the listing `id`, so the order is always the same and the pages are stable.

### 9. The chart in Arabic
- **Problem:** with `dir="rtl"` the page mirrored, but the chart kept its axes on the English side.
- **Solution:** in Arabic the time axis is reversed (the newest day on the left) and the numbers axis moves to the right.

### 10. The sample listings had owners who did not exist
- **Problem:** the sample listings pointed to owner ids (101, 201...) that were not in the `user` table, so the database refused the foreign key, and nobody could receive a contact request for them.
- **Solution:** one migration (test data only) creates four demo owners, gives them the orphan listings one after the other, then adds the foreign key. The demo owners can sign in, so the contact and chat flow can be tested.

## Limitations

- My API only reads listings; creating them is done by another team member.
- The sample listings and the four demo owners are **test data** created by migrations, for development and evaluation. Real users and listings come from sign-up and the add-listing page.
- The sample listings have approximate coordinates, not real addresses.
- The dashboard shows sample data until the analytics API of my teammate is connected.
- The text drawn by Google Maps itself (street and city names) is not translated by us.
