import { DEMO_AUTH_USERS, DEMO_BADGES, DEMO_CATEGORIES, DEMO_CHECKINS, DEMO_ORGANIZATIONS, DEMO_PLACES, DEMO_QR_CODES, DEMO_QUEST_STEPS, DEMO_QUESTS, DEMO_USER_BADGES, DEMO_USER_PROFILES, DEMO_USER_PROGRESS } from './demo-data'

const COOKIE_USER = 'mt_user'
const COOKIE_EXTRA_PLACES = 'mt_places_extra'
const COOKIE_CHECKINS = 'mt_checkins'
const COOKIE_PROGRESS = 'mt_progress'
const COOKIE_BADGES = 'mt_user_badges'
const COOKIE_USERS = 'mt_users'
const COOKIE_QR_CODES = 'mt_qr_codes'


type CookieStoreLike = { get: (name: string) => { value?: string } | undefined; set?: (name: string, value: string, options?: Record<string, any>) => void }
type Ctx = { kind: 'browser' } | { kind: 'server'; cookieStore: CookieStoreLike }

type AuthUser = { id: string; email: string; password?: string; is_admin?: boolean }

function parseCookieHeader(header: string) {
  return header.split(';').reduce<Record<string, string>>((acc, part) => {
    const [rawKey, ...rest] = part.trim().split('=')
    if (!rawKey) return acc
    acc[rawKey] = decodeURIComponent(rest.join('='))
    return acc
  }, {})
}

function getCookie(ctx: Ctx, key: string): string | null {
  if (ctx.kind === 'browser') {
    const all = parseCookieHeader(document.cookie || '')
    return all[key] || null
  }
  return ctx.cookieStore.get(key)?.value || null
}

function setCookie(ctx: Ctx, key: string, value: string) {
  const cookieValue = `${key}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax`
  if (ctx.kind === 'browser') {
    document.cookie = cookieValue
    return
  }
  try {
    ctx.cookieStore.set?.(key, value, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' })
  } catch {
    // server component read-only
  }
}

function removeCookie(ctx: Ctx, key: string) {
  if (ctx.kind === 'browser') {
    document.cookie = `${key}=; path=/; max-age=0; samesite=lax`
    return
  }
  try {
    ctx.cookieStore.set?.(key, '', { path: '/', maxAge: 0, sameSite: 'lax' })
  } catch {
    // read-only
  }
}

function readJson<T>(ctx: Ctx, key: string, fallback: T): T {
  const raw = getCookie(ctx, key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function getAuthUsers(ctx: Ctx): AuthUser[] {
  return [...DEMO_AUTH_USERS, ...readJson<AuthUser[]>(ctx, COOKIE_USERS, [])]
}

function getCurrentUser(ctx: Ctx): AuthUser | null {
  const userId = getCookie(ctx, COOKIE_USER)
  if (!userId) return null
  return getAuthUsers(ctx).find((u) => u.id === userId) || null
}

function getTableData(ctx: Ctx, table: string): any[] {
  switch (table) {
    case 'categories':
      return clone(DEMO_CATEGORIES)
    case 'organizations':
      return clone(DEMO_ORGANIZATIONS)
    case 'places':
      return [...clone(DEMO_PLACES), ...readJson<any[]>(ctx, COOKIE_EXTRA_PLACES, [])]
    case 'badges':
      return clone(DEMO_BADGES)
    case 'quests':
      return clone(DEMO_QUESTS)
    case 'quest_steps':
      return clone(DEMO_QUEST_STEPS)
    case 'qr_codes':
      return readJson<any[]>(ctx, COOKIE_QR_CODES, clone(DEMO_QR_CODES))
    case 'checkins':
      return readJson<any[]>(ctx, COOKIE_CHECKINS, clone(DEMO_CHECKINS))
    case 'user_progress':
      return readJson<any[]>(ctx, COOKIE_PROGRESS, clone(DEMO_USER_PROGRESS))
    case 'user_badges':
      return readJson<any[]>(ctx, COOKIE_BADGES, clone(DEMO_USER_BADGES))
    case 'user_profiles': {
      const extraUsers = readJson<AuthUser[]>(ctx, COOKIE_USERS, [])
      const extraProfiles = extraUsers.map((u) => ({
        id: u.id,
        username: u.email.split('@')[0],
        display_name: u.email.split('@')[0],
        avatar_url: null,
        bio: null,
        explorer_level: 1,
        total_points: 0,
        home_city: 'Bielsko-Biała',
        is_admin: !!u.is_admin,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }))
      return [...clone(DEMO_USER_PROFILES), ...extraProfiles]
    }
    default:
      return []
  }
}

function setTableData(ctx: Ctx, table: string, rows: any[]) {
  switch (table) {
    case 'places':
      setCookie(ctx, COOKIE_EXTRA_PLACES, JSON.stringify(rows.filter((r) => !DEMO_PLACES.some((p) => p.id === r.id))))
      break
    case 'qr_codes':
      setCookie(ctx, COOKIE_QR_CODES, JSON.stringify(rows))
      break
    case 'checkins':
      setCookie(ctx, COOKIE_CHECKINS, JSON.stringify(rows))
      break
    case 'user_progress':
      setCookie(ctx, COOKIE_PROGRESS, JSON.stringify(rows))
      break
    case 'user_badges':
      setCookie(ctx, COOKIE_BADGES, JSON.stringify(rows))
      break
    default:
      break
  }
}

function enrichRow(table: string, row: any) {
  if (!row) return row
  const categories = DEMO_CATEGORIES
  const organizations = DEMO_ORGANIZATIONS
  const places = [...DEMO_PLACES]
  const badges = DEMO_BADGES
  const quests = DEMO_QUESTS
  const steps = DEMO_QUEST_STEPS

  if (table === 'organizations') {
    return { ...row, category: categories.find((c) => c.id === row.category_id) || null }
  }
  if (table === 'places') {
    return {
      ...row,
      category: categories.find((c) => c.id === row.category_id) || null,
      organization: organizations.find((o) => o.id === row.organization_id) || null,
    }
  }
  if (table === 'quests') {
    return {
      ...row,
      category: categories.find((c) => c.id === row.category_id) || null,
      badge: badges.find((b) => b.id === row.badge_id) || null,
      steps: steps.filter((s) => s.quest_id === row.id).map((s) => ({
        ...s,
        place: places.find((p) => p.id === s.place_id) || null,
      })),
    }
  }
  if (table === 'quest_steps') {
    return { ...row, place: places.find((p) => p.id === row.place_id) || null }
  }
  if (table === 'checkins') {
    return { ...row, place: places.find((p) => p.id === row.place_id) || null }
  }
  if (table === 'user_progress') {
    return { ...row, quest: quests.find((q) => q.id === row.quest_id) || null }
  }
  if (table === 'user_badges') {
    return { ...row, badge: badges.find((b) => b.id === row.badge_id) || null }
  }
  if (table === 'qr_codes') {
    return { ...row, place: places.find((p) => p.id === row.place_id) || null }
  }
  return row
}

class SelectBuilder {
  private filters: Array<{ field: string; value: any }> = []
  private sortField: string | null = null
  private ascending = true
  private maxRows: number | null = null
  private requireSingle = false
  private allowNullSingle = false

  constructor(private ctx: Ctx, private table: string, private options?: { head?: boolean; count?: 'exact' | null }) {}

  eq(field: string, value: any) {
    this.filters.push({ field, value })
    return this
  }

  // Obsługa ILIKE (case-insensitive zawieranie)
  ilike(field: string, pattern: string) {
    // pattern w stylu Supabase: '%słowo%' → szukamy 'słowo'
    const term = pattern.replace(/%/g, '').toLowerCase()
    this.filters.push({ field: `__ilike__${field}`, value: term })
    return this
  }

  order(field: string, opts?: { ascending?: boolean }) {
    this.sortField = field
    this.ascending = opts?.ascending ?? true
    return this
  }

  limit(count: number) {
    this.maxRows = count
    return this
  }

  single() {
    this.requireSingle = true
    return this
  }

  maybeSingle() {
    this.allowNullSingle = true
    return this
  }

  async execute() {
    let rows = getTableData(this.ctx, this.table)
    for (const filter of this.filters) {
      if (filter.field.startsWith('__ilike__')) {
        const realField = filter.field.replace('__ilike__', '')
        rows = rows.filter((row) =>
          String(row?.[realField] ?? '').toLowerCase().includes(filter.value)
        )
      } else {
        rows = rows.filter((row) => row?.[filter.field] === filter.value)
      }
    }
    const count = rows.length
    if (this.sortField) {
      rows.sort((a, b) => {
        const av = a?.[this.sortField as string]
        const bv = b?.[this.sortField as string]
        if (av === bv) return 0
        return (av > bv ? 1 : -1) * (this.ascending ? 1 : -1)
      })
    }
    if (typeof this.maxRows === 'number') {
      rows = rows.slice(0, this.maxRows)
    }
    const enriched = rows.map((row) => enrichRow(this.table, row))

    if (this.options?.head) {
      return { data: null, error: null, count }
    }
    if (this.requireSingle) {
      const row = enriched[0]
      if (!row) return { data: null, error: { message: 'Not found' }, count }
      return { data: row, error: null, count }
    }
    if (this.allowNullSingle) {
      return { data: enriched[0] || null, error: null, count }
    }
    return { data: enriched, error: null, count }
  }

  then(resolve: (value: any) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject)
  }
}

class InsertBuilder {
  private returnSelected = false
  private requireSingle = false
  constructor(private ctx: Ctx, private table: string, private payload: any) {}

  select() {
    this.returnSelected = true
    return this
  }

  single() {
    this.requireSingle = true
    return this
  }

  async execute() {
    const rows = getTableData(this.ctx, this.table)
    const incoming = Array.isArray(this.payload) ? this.payload : [this.payload]
    const stamped = incoming.map((item) => ({
      id: item.id || `${this.table}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...item,
    }))
    const updatedRows = [...rows, ...stamped]
    setTableData(this.ctx, this.table, updatedRows)
    const data = this.returnSelected ? stamped.map((row) => enrichRow(this.table, row)) : null
    if (this.requireSingle) {
      return { data: data?.[0] || null, error: null }
    }
    return { data, error: null }
  }

  then(resolve: (value: any) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject)
  }
}

class UpdateBuilder {
  private filters: Array<{ field: string; value: any }> = []
  private returnSelected = false
  private requireSingle = false
  constructor(private ctx: Ctx, private table: string, private values: any) {}

  eq(field: string, value: any) {
    this.filters.push({ field, value })
    return this
  }

  select() {
    this.returnSelected = true
    return this
  }

  single() {
    this.requireSingle = true
    return this
  }

  async execute() {
    const rows = getTableData(this.ctx, this.table)
    const updated: any[] = []
    const nextRows = rows.map((row) => {
      const match = this.filters.every((f) => row?.[f.field] === f.value)
      if (!match) return row
      const merged = { ...row, ...this.values, updated_at: new Date().toISOString() }
      updated.push(merged)
      return merged
    })
    setTableData(this.ctx, this.table, nextRows)
    const data = this.returnSelected ? updated.map((row) => enrichRow(this.table, row)) : null
    if (this.requireSingle) {
      return { data: data?.[0] || null, error: null }
    }
    return { data, error: null }
  }

  then(resolve: (value: any) => any, reject?: (reason: any) => any) {
    return this.execute().then(resolve, reject)
  }
}

function createDemoAuth(ctx: Ctx) {
  return {
    async getUser() {
      const current = getCurrentUser(ctx)
      return { data: { user: current ? { id: current.id, email: current.email } : null }, error: null }
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const user = getAuthUsers(ctx).find((u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
      if (!user) {
        return { data: { user: null }, error: { message: 'Nieprawidłowy e-mail lub hasło.' } }
      }
      setCookie(ctx, COOKIE_USER, user.id)
      return { data: { user: { id: user.id, email: user.email } }, error: null }
    },
    async signUp({ email, password }: { email: string; password: string }) {
      const users = getAuthUsers(ctx)
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { data: { user: null }, error: { message: 'To konto już istnieje.' } }
      }
      const id = `user-${Date.now()}`
      const created = { id, email, password, is_admin: false }
      const stored = [...readJson<AuthUser[]>(ctx, COOKIE_USERS, []), created]
      setCookie(ctx, COOKIE_USERS, JSON.stringify(stored))
      setCookie(ctx, COOKIE_USER, id)
      return { data: { user: { id, email } }, error: null }
    },
    async signOut() {
      removeCookie(ctx, COOKIE_USER)
      return { error: null }
    },
  }
}

function createDemoClient(ctx: Ctx) {
  return {
    auth: createDemoAuth(ctx),
    from(table: string) {
      return {
        select(_columns?: string, options?: { head?: boolean; count?: 'exact' | null }) {
          return new SelectBuilder(ctx, table, options)
        },
        insert(payload: any) {
          return new InsertBuilder(ctx, table, payload)
        },
        update(values: any) {
          return new UpdateBuilder(ctx, table, values)
        },
      }
    },
    async rpc(name: string, params: any) {
      if (name === 'increment_user_points') {
        const profiles = getTableData(ctx, 'user_profiles')
        const current = profiles.find((profile) => profile.id === params.user_id)
        if (current && !DEMO_USER_PROFILES.some((p) => p.id === current.id)) {
          const users = readJson<AuthUser[]>(ctx, COOKIE_USERS, [])
          const idx = users.findIndex((u) => u.id === params.user_id)
          if (idx >= 0) {
            // no-op for stored auth user cookie; profile points kept in separate progress cookies for demo
          }
        }
        return { data: true, error: null }
      }
      return { data: null, error: null }
    },
  }
}

export function getBrowserDemoClient() {
  return createDemoClient({ kind: 'browser' })
}

export function getServerDemoClient(cookieStore: CookieStoreLike) {
  return createDemoClient({ kind: 'server', cookieStore })
}

