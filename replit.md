# Workspace — IconVault (piodev.studio)

## Overview

**IconVault** is a full-stack free icon warehouse platform + browser-based developer/designer tools. Built with a strict Neo Brutalism design system.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS (artifacts/iconvault)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM (built-in Replit DB)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **Routing**: Wouter
- **Design**: Neo Brutalism — thick black borders, hard shadows, loud accent colors

## Design System

- Background: `#FFFBF0` (warm cream)
- Accents: Yellow `#FFE034`, Pink `#FF6B9D`, Blue `#4DBBFF`, Green `#00E676`, Orange `#FF6B35`
- Borders: 3px solid `#0A0A0A` everywhere
- Shadows: 4px 4px 0px `#0A0A0A` (hard offset, no blur)
- Fonts: Space Grotesk (headings) + JetBrains Mono (code/mono)

## Pages

- `/` — Home (hero, stats bar, featured icons, tools preview)
- `/icons` — Icon Library (search, category filter, grid)
- `/icons/:slug` — Icon Detail (preview, download, copy SVG, likes, similar)
- `/tools` — Tools Hub
- `/tools/svg-optimizer` — SVG Optimizer
- `/tools/image-converter` — Image Format Converter
- `/tools/color-converter` — Color Picker & Converter
- `/tools/base64` — Base64 Encoder/Decoder
- `/tools/json-formatter` — JSON Formatter/Minifier
- `/tools/css-shadow-generator` — CSS Box-Shadow Generator
- `/tools/favicon-generator` — Favicon Generator
- `/tools/gradient-generator` — CSS Gradient Generator
- `/upload` — Upload Icon
- `/admin` — Admin Dashboard (sidebar layout, staff+)
- `/admin/icons` — Kelola Ikon (staff+)
- `/admin/users` — Kelola Pengguna (admin only)

## Admin Panel Architecture

Admin routes (`/admin/*`) use a dedicated `AdminLayout` (sidebar + main content) that bypasses the main `Layout` (Navbar + Footer). Each admin page wraps itself in `AdminLayout` + `RoleGuard`. The Router in `App.tsx` detects `/admin` prefix via `useLocation` and renders admin pages without the global Layout wrapper.

- `src/components/layout/AdminLayout.tsx` — sidebar layout with nav, user info, logout
- `src/pages/admin/index.tsx` — dashboard (stats + quick actions)
- `src/pages/admin/icons.tsx` — icon browser with search + pagination
- `src/pages/admin/users.tsx` — user management table (role/tier editor)

## Database Schema

- `icons` table: id, name, slug, description, svg_content, category, tags[], style, downloads, likes, is_featured, license, created_at

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## API Endpoints

- `GET /api/icons` — list icons (search, category, style, page, limit)
- `POST /api/icons` — upload icon
- `GET /api/icons/featured` — featured icons
- `GET /api/icons/stats` — global stats
- `GET /api/icons/categories` — categories with counts
- `GET /api/icons/:slug` — single icon by slug
- `POST /api/icons/:id/download` — increment download count
- `POST /api/icons/:id/like` — toggle like
- `GET /api/icons/similar/:id` — similar icons by category
