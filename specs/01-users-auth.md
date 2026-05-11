# Spec 01 — Users & Auth

## Purpose

Implement the full authentication system: User model, password hashing, NextAuth v5 credentials provider, JWT with role, middleware route protection, register/login pages, profile page, and admin user management. After this phase any user can register, log in, and be redirected to the dashboard. Admins can manage users.

## Dependencies

- `specs/00-setup.md` complete — Next.js running, all deps installed

---

## Model — `models/User.ts`

```ts
import mongoose, { Schema, Document } from 'mongoose'

export type UserRole = 'dev' | 'sme' | 'manager' | 'admin'

export interface IUser extends Document {
  name: string
  email: string
  passwordHash: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['dev', 'sme', 'manager', 'admin'], default: 'dev' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
```

---

## Utility — `lib/mongodb.ts`

```ts
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) throw new Error('MONGODB_URI not set in .env.local')

let cached = (global as any).__mongoose ?? { conn: null, promise: null }
;(global as any).__mongoose = cached

export async function connectDB() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false })
  }
  cached.conn = await cached.promise
  return cached.conn
}
```

---

## Auth Config — `lib/auth.ts`

```ts
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { connectDB } from './mongodb'
import User from '@/models/User'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        await connectDB()
        const user = await User.findOne({ email: credentials.email, isActive: true })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password as string, user.passwordHash)
        if (!valid) return null
        return { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      return session
    },
  },
  pages: { signIn: '/login' },
  session: { strategy: 'jwt' },
})
```

---

## Type Augmentation — `types/next-auth.d.ts`

```ts
import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
  }
  interface Session {
    user: {
      id: string
      name: string
      email: string
      role: string
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: string
  }
}
```

---

## Route Handler — `app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from '@/lib/auth'
export const { GET, POST } = handlers
```

---

## Middleware — `middleware.ts`

```ts
import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

const PROTECTED = ['/dashboard', '/logs', '/projects', '/reports', '/profile', '/admin']

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const path = req.nextUrl.pathname
  const isProtected = PROTECTED.some((p) => path.startsWith(p))

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  // Admin-only routes
  if (path.startsWith('/admin') && req.auth?.user?.role !== 'admin') {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }
})

export const config = {
  matcher: ['/dashboard/:path*', '/logs/:path*', '/projects/:path*', '/reports/:path*', '/profile/:path*', '/admin/:path*'],
}
```

Note: Route groups like `(dashboard)` do not appear in the URL. The matcher uses the real URL paths above.

---

## Zod Schemas — `lib/zod-schemas.ts` (auth portion)

```ts
import { z } from 'zod'

export const RegisterSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8).max(100).optional(),
}).refine(
  (d) => !d.newPassword || !!d.currentPassword,
  { message: 'Current password required to set a new password', path: ['currentPassword'] }
)

export const UpdateUserRoleSchema = z.object({
  role: z.enum(['dev', 'sme', 'manager', 'admin']).optional(),
  isActive: z.boolean().optional(),
})
```

---

## Server Actions — `app/(auth)/register/actions.ts`

```ts
'use server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { RegisterSchema } from '@/lib/zod-schemas'

export async function registerUser(formData: FormData) {
  const parsed = RegisterSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  await connectDB()
  const existing = await User.findOne({ email: parsed.data.email })
  if (existing) return { error: { email: ['Email already registered'] } }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12)
  await User.create({ name: parsed.data.name, email: parsed.data.email, passwordHash })
  return { success: true }
}
```

---

## API Routes

### `app/api/users/route.ts` — Admin: list users

```
GET /api/users
Auth: session (admin only)
Response: IUser[] (without passwordHash)
```

### `app/api/users/[id]/route.ts` — Admin: update user

```
PATCH /api/users/[id]
Auth: session (admin only)
Body: { role?: UserRole, isActive?: boolean }
Response: updated IUser
```

### `app/api/profile/route.ts` — Own user: update profile

```
PATCH /api/profile
Auth: session (own user)
Body: { name?: string, currentPassword?: string, newPassword?: string }
Response: { success: true }
```

---

## Pages

### `app/(auth)/login/page.tsx`
- Client component
- Fields: email, password
- On submit: calls `signIn('credentials', { email, password, redirectTo: '/dashboard' })`
- Shows field errors inline
- Link to `/register`

### `app/(auth)/register/page.tsx`
- Client component
- Fields: name, email, password
- On submit: calls `registerUser()` server action, then `signIn()` on success
- Shows field errors inline
- Link to `/login`

### `app/(dashboard)/profile/page.tsx`
- Server component — reads session via `auth()`
- Renders `<UpdateProfileForm>` client component with current name/email pre-filled
- `UpdateProfileForm` submits PATCH to `/api/profile`, calls `router.refresh()` on success

### `app/(dashboard)/admin/users/page.tsx`
- Server component — fetches all users from DB
- Renders `<UsersTable>` with columns: name, email, role badge, active status, actions
- Row actions (hover-reveal): Edit role/status → opens `<EditUserModal>`

---

## Revalidation Pattern

All modals and forms that mutate data follow this pattern:

```ts
// In the modal/form component (client)
const router = useRouter()

async function handleSubmit(data) {
  const res = await fetch('/api/...', { method: 'PATCH', body: JSON.stringify(data) })
  if (res.ok) {
    onSuccess?.()       // closes modal
    router.refresh()    // re-fetches server component data
  }
}
```

Never use `revalidatePath()` from a client component — only from server actions. Use `router.refresh()` from client components after a successful `fetch`.

---

## Checklist

- [ ] `lib/mongodb.ts` — connection singleton
- [ ] `models/User.ts`
- [ ] `lib/auth.ts` — NextAuth v5 credentials provider
- [ ] `types/next-auth.d.ts` — session type augmentation
- [ ] `app/api/auth/[...nextauth]/route.ts`
- [ ] `middleware.ts` — protect routes + admin guard
- [ ] `lib/zod-schemas.ts` — RegisterSchema, LoginSchema, UpdateProfileSchema, UpdateUserRoleSchema
- [ ] `app/(auth)/login/page.tsx`
- [ ] `app/(auth)/register/page.tsx` + `actions.ts`
- [ ] `app/(dashboard)/profile/page.tsx` + UpdateProfileForm client component
- [ ] `app/api/profile/route.ts`
- [ ] `app/api/users/route.ts`
- [ ] `app/api/users/[id]/route.ts`
- [ ] `app/(dashboard)/admin/users/page.tsx` + UsersTable component
- [ ] `components/modals/EditUserModal.tsx`

## Verification

1. Register a new user at `/register` — user appears in MongoDB `users` collection
2. Log in at `/login` — redirected to `/dashboard`
3. Access `/dashboard` without a session — redirected to `/login`
4. Log in with wrong password — error shown, no redirect
5. Deactivated user (`isActive: false`) cannot log in
6. Non-admin accessing `/admin/users` — redirected to `/dashboard`
7. Admin can change another user's role — badge updates after refresh
8. `npx tsc --noEmit` — no type errors on session.user.id / session.user.role
