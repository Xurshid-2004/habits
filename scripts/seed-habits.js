/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('node:fs')
const path = require('node:path')

function loadDotenvFile(dotenvPath) {
  if (!fs.existsSync(dotenvPath)) return

  const contents = fs.readFileSync(dotenvPath, 'utf8')
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue

    const eqIndex = line.indexOf('=')
    if (eqIndex === -1) continue

    const key = line.slice(0, eqIndex).trim()
    let value = line.slice(eqIndex + 1).trim()

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

function extractStaticCardItems(tsxText) {
  const items = []
  const cardRegex = /<CardItem\s+title="([^"]+)"\s+image="([^"]+)"\s*\/>/g

  let match
  while ((match = cardRegex.exec(tsxText)) !== null) {
    items.push({ title: match[1].trim(), image: match[2].trim() })
  }

  return items
}

async function fetchAsDataUrl(imageUrl) {
  const trimmed = imageUrl.trim()
  if (!trimmed) throw new Error('Empty image URL')
  if (trimmed.startsWith('data:')) return trimmed

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20_000)

  try {
    const res = await fetch(trimmed, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0' },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }

    const contentTypeHeader = res.headers.get('content-type') || ''
    const contentType = contentTypeHeader.split(';')[0].trim() || 'application/octet-stream'

    const bytes = Buffer.from(await res.arrayBuffer())
    const base64 = bytes.toString('base64')
    return `data:${contentType};base64,${base64}`
  } finally {
    clearTimeout(timeoutId)
  }
}

async function main() {
  loadDotenvFile(path.join(process.cwd(), '.env'))
  loadDotenvFile(path.join(process.cwd(), '.env.local'))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or NEXT_PUBLIC_SUPABASE_ANON_KEY')
    console.error('Add them to `.env` (or your shell env) then re-run.')
    process.exitCode = 1
    return
  }

  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const habitsPagePath = path.join(process.cwd(), 'src', 'app', 'dashboard', 'habits', 'page.tsx')
  if (!fs.existsSync(habitsPagePath)) {
    console.error(`Could not find habits page at: ${habitsPagePath}`)
    process.exitCode = 1
    return
  }

  const tsx = fs.readFileSync(habitsPagePath, 'utf8')
  const seeds = extractStaticCardItems(tsx)

  if (seeds.length === 0) {
    console.error('No static <CardItem title="..." image="..."/> entries found to seed.')
    process.exitCode = 1
    return
  }

  const { data: existing, error: existingError } = await supabase.from('habits').select('id, title, name')
  if (existingError) {
    console.error('Failed to read existing rows from `habits`:', existingError.message)
    process.exitCode = 1
    return
  }

  const existingTitles = new Set(
    (existing || [])
      .map((row) => (row && (row.title || row.name) ? String(row.title || row.name) : ''))
      .filter(Boolean)
      .map((s) => s.toLowerCase()),
  )

  let insertedCount = 0
  const errors = []

  for (const seed of seeds) {
    const normalized = seed.title.toLowerCase()
    if (existingTitles.has(normalized)) {
      console.log(`Skip (exists): ${seed.title}`)
      continue
    }

    console.log(`Fetch image -> base64: ${seed.title}`)
    let iconUrl
    try {
      iconUrl = await fetchAsDataUrl(seed.image)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push({ title: seed.title, step: 'image', message })
      console.error(`  Failed to encode image for "${seed.title}": ${message}`)
      continue
    }

    const row = {
      title: seed.title,
      name: seed.title,
      icon_url: iconUrl,
      description: '-',
      target_days: 1,
      created_at: new Date().toISOString(),
    }

    const { error: insertError } = await supabase.from('habits').insert(row)
    if (insertError) {
      errors.push({ title: seed.title, step: 'insert', message: insertError.message })
      console.error(`  Insert failed for "${seed.title}": ${insertError.message}`)
      continue
    }

    insertedCount += 1
    existingTitles.add(normalized)
    console.log(`  Inserted: ${seed.title}`)
  }

  const { count, error: countError } = await supabase.from('habits').select('*', { count: 'exact', head: true })
  if (countError) {
    console.error('Could not count rows:', countError.message)
  }

  console.log('')
  console.log(`Done. Inserted: ${insertedCount}. Total rows in habits: ${count ?? 'unknown'}.`)
  if (errors.length > 0) {
    console.log(`Errors: ${errors.length}`)
    for (const e of errors) {
      console.log(`- ${e.title} (${e.step}): ${e.message}`)
    }
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
