# My part: listings, map search and languages

**Member:** Said Ellyani (`sellyani`)
**Role:** Developer, frontend and listings API (`<role>`)

## What I did

- **Backend:** a listings API with search filters, a PostgreSQL table, migrations and sample data.
- **Frontend:** the home page, the listings page and a map that shows each listing as a price marker.
- **Languages:** the whole interface in Arabic, French and English, with a right-to-left layout for Arabic.
- **Legal:** Privacy Policy and Terms of Service pages.

## Features

- **Search listings** by city (any language), property type and price. Results come from the database.
- **Listings page** with cards, a details drawer, and filters kept in the URL (refresh and back button keep the search).
- **Map search**: listings shown as price markers; a marker opens the details; the map follows the search.
- **Languages** with a switcher; the choice is remembered.
- **Right-to-left layout**: the whole page mirrors in Arabic.
- **Privacy Policy** and **Terms of Service** linked from the footer.

## Modules (7 points)

| Module | Type | Points |
|--------|------|--------|
| Framework for frontend and backend | Major | 2 |
| ORM for the database | Minor | 1 |
| Multiple languages (3) | Minor | 1 |
| Right-to-left (RTL) support | Minor | 1 |
| Custom: interactive map-based search | Major | 2 |

The framework and ORM modules are shared with the team. The languages, RTL and map modules are mine.

### Framework for frontend and backend (Major, 2 pts)
- **Why:** React and NestJS give a clear structure and let several people work in parallel.
- **How:** React + Vite + Tailwind CSS for the frontend; NestJS for the API, split into modules, controllers and services.

### ORM (Minor, 1 pt)
- **Why:** TypeORM avoids hand-written SQL and keeps the schema under version control.
- **How:** entities `User`, `RegistrationSession`, `Listing`; changes only through migrations; the search uses bound parameters, so input is never concatenated into SQL.

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
  4. The map receives the language, so its labels match the site.
  5. Checked every page in the 3 languages and fixed a missing French word (`Détails`).
- **Adding a text:** add the same key in `ar`, `fr` and `en`, then use `translations[lang].section.key`.
- **Limits:** the map language changes after a refresh (Google Maps loads once); numbers and dates are not formatted per language (not required).

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

## Mandatory requirements I covered

- Privacy Policy and Terms of Service pages, three languages, linked from the footer.
- CSS framework: Tailwind CSS.
- Responsive layout (desktop and mobile).
- Inputs validated on both sides: the frontend accepts only known types and price ranges; the backend validates every parameter.
- One-command deployment: `docker compose up --build`.

## API

`GET /listings` returns the listings, newest first. All parameters are optional:

| Parameter | Meaning |
|-----------|---------|
| `city` | text searched in the Arabic, French and English city names |
| `type` | `apartment`, `house`, `studio`, `riad` or `villa` |
| `minPrice`, `maxPrice` | price range |

An invalid value (for example `type=hotel`) returns `400`.

## Database: table `listing`

| Column | Type |
|--------|------|
| `id` | serial, primary key |
| `ownerId` | integer |
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
- **Solution:** each marker is moved around the city centre with a deterministic spiral offset (the angle and distance depend on its index), so markers are spread and stay stable between renders.

### 5. The browser blocked calls from the frontend to the API
- **Problem:** the frontend (port 5173) and the API (port 3000) have different origins, so the browser refused the requests (CORS).
- **Solution:** I enabled CORS in the backend for the frontend origin only.

### 6. Search parameters arrive as text
- **Problem:** `minPrice=3000` reaches the API as the string `"3000"`, which fails number validation.
- **Solution:** the DTO converts the value with `@Type(() => Number)` and the global `ValidationPipe` runs with `transform: true`; invalid values return `400`.

## Limitations

- Listings are read-only for now (they come from the seed data); `ownerId` is not a foreign key yet.
- Markers are placed around the centre of the city, not at the exact address.
- The map language changes after a page refresh.
