# Spec 00 — Project Setup & Base Configuration

## Purpose

Bootstrap a runnable Next.js 14 (App Router, TypeScript, Tailwind) project with all dependencies installed, shadcn/ui initialized, CSS theme tokens defined, and the ThemeProvider wired up. After this phase the app starts, shows a blank page at `/`, and dark/light switching works. No features yet.

## Dependencies

- Nothing. This is the first step.

---

## Commands — Run in Order

```bash
# 1. Scaffold (run inside the project root — it will populate the current folder)
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=no --import-alias="@/*"

# 2. Core runtime deps
npm install next-auth@beta mongoose bcryptjs zod next-themes lucide-react

# 3. Type stubs
npm install -D @types/bcryptjs tsx

# 4. Tailwind animation plugin
npm install tailwindcss-animate

# 5. shadcn/ui init (select "New York" style, CSS variables: yes, base colour: Slate)
npx shadcn@latest init

# 6. Install shadcn primitives used across all phases
npx shadcn@latest add button input label select textarea badge card table dialog dropdown-menu avatar separator sheet tooltip skeleton
```

---

## Configuration Files

### `tailwind.config.ts`

```ts
import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [animate],
}

export default config
```

### `app/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 47% 10%;
    --card-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 60.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 48%;
  }
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
}
```

### `next.config.ts`

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
}

export default nextConfig
```

### `app/layout.tsx`

```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from 'next-themes'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'WisdmLabs Smart Logger',
  description: 'Corporate time logging system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### `.env.local` (already exists — confirm these keys are present)

```env
MONGODB_URI=<already configured>
NEXTAUTH_SECRET=<generate: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
```

---

## Folder Skeleton to Create

```
app/
  (auth)/          ← auth pages (no sidebar)
  (dashboard)/     ← protected pages (with sidebar)
  api/
components/
  layout/
  modals/
  ui/              ← populated by shadcn
lib/
models/
types/
scripts/
specs/             ← already exists
```

---

## Checklist

- [ ] `npx create-next-app@14` scaffold complete
- [ ] All runtime deps installed (`next-auth@beta`, `mongoose`, `bcryptjs`, `zod`, `next-themes`, `lucide-react`)
- [ ] Dev deps installed (`@types/bcryptjs`, `tsx`, `tailwindcss-animate`)
- [ ] `npx shadcn@latest init` complete
- [ ] shadcn primitives installed (button, input, label, select, textarea, badge, card, table, dialog, dropdown-menu, avatar, separator, sheet, tooltip, skeleton)
- [ ] `tailwind.config.ts` — `darkMode: 'class'`, tokens wired
- [ ] `globals.css` — CSS variables for light + dark
- [ ] `next.config.ts` — mongoose externalPackages
- [ ] `app/layout.tsx` — ThemeProvider with `suppressHydrationWarning`
- [ ] `.env.local` — NEXTAUTH_SECRET and NEXTAUTH_URL added
- [ ] Folder skeleton created
- [ ] `npm run dev` starts without errors

## Verification

1. Run `npm run dev` — app starts at `http://localhost:3000`
2. Visit `http://localhost:3000` — page renders (blank is fine)
3. Open DevTools → no console errors
4. No TypeScript errors (`npx tsc --noEmit`)
