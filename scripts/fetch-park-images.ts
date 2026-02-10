/**
 * Fetches representative images for Canadian parks from Wikimedia Commons.
 *
 * Usage:
 *   npx tsx scripts/fetch-park-images.ts
 *
 * Requirements:
 *   npm i -D sharp (image processing)
 *
 * What it does:
 *   1. Reads parks.json
 *   2. For each park without an imageUrl, searches Wikimedia Commons
 *   3. Downloads the best landscape image
 *   4. Resizes to 1200×600 WebP
 *   5. Saves to public/parks/{id}.webp
 *   6. Updates parks.json with imageUrl
 */

import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const PARKS_JSON = path.resolve(import.meta.dirname, '../src/data/parks.json')
const OUTPUT_DIR = path.resolve(import.meta.dirname, '../public/parks')
const TARGET_WIDTH = 1200
const TARGET_HEIGHT = 600
const WEBP_QUALITY = 80
const RATE_LIMIT_MS = 1500 // be polite to Wikimedia

interface Park {
  id: string
  name: string
  province: string
  imageUrl?: string
}

async function searchWikimediaImage(query: string): Promise<string | null> {
  const searchUrl = new URL('https://commons.wikimedia.org/w/api.php')
  searchUrl.searchParams.set('action', 'query')
  searchUrl.searchParams.set('format', 'json')
  searchUrl.searchParams.set('generator', 'search')
  searchUrl.searchParams.set('gsrsearch', query)
  searchUrl.searchParams.set('gsrlimit', '5')
  searchUrl.searchParams.set('gsrnamespace', '6') // File namespace
  searchUrl.searchParams.set('prop', 'imageinfo')
  searchUrl.searchParams.set('iiprop', 'url|size|mime')
  searchUrl.searchParams.set('iiurlwidth', String(TARGET_WIDTH))

  const res = await fetch(searchUrl.toString(), {
    headers: { 'User-Agent': 'WoodsmokeApp/1.0 (camping trip planner; contact@woodsmoke.app)' },
  })

  if (!res.ok) return null

  const data = await res.json()
  const pages = data?.query?.pages
  if (!pages) return null

  // Find best landscape image (width > height, decent resolution)
  for (const page of Object.values(pages) as any[]) {
    const info = page.imageinfo?.[0]
    if (!info) continue
    if (!info.mime?.startsWith('image/')) continue
    if (info.width < 800) continue
    if (info.width <= info.height) continue // skip portrait

    // Use the thumbnail URL at our target width, or the full URL
    return info.thumburl || info.url
  }

  return null
}

async function downloadAndProcess(url: string, outputPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WoodsmokeApp/1.0 (camping trip planner; contact@woodsmoke.app)' },
    })

    if (!res.ok) return false

    const buffer = Buffer.from(await res.arrayBuffer())

    await sharp(buffer)
      .resize(TARGET_WIDTH, TARGET_HEIGHT, { fit: 'cover', position: 'centre' })
      .webp({ quality: WEBP_QUALITY })
      .toFile(outputPath)

    return true
  } catch (err) {
    console.error(`  Failed to process image: ${(err as Error).message}`)
    return false
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  // Read parks
  const parks: Park[] = JSON.parse(fs.readFileSync(PARKS_JSON, 'utf-8'))
  console.log(`Found ${parks.length} parks\n`)

  let fetched = 0
  let skipped = 0
  let failed = 0

  for (const park of parks) {
    // Skip if already has an imageUrl
    if (park.imageUrl) {
      console.log(`[skip] ${park.name} — already has image`)
      skipped++
      continue
    }

    const outputPath = path.join(OUTPUT_DIR, `${park.id}.webp`)

    // Skip if file already exists on disk
    if (fs.existsSync(outputPath)) {
      console.log(`[skip] ${park.name} — file exists, updating JSON`)
      park.imageUrl = `/parks/${park.id}.webp`
      skipped++
      continue
    }

    console.log(`[fetch] ${park.name} (${park.province})...`)

    // Try progressively broader searches
    const queries = [
      `"${park.name}" Canada landscape`,
      `${park.name} park Canada`,
      `${park.name} Canada`,
    ]

    let imageUrl: string | null = null
    for (const query of queries) {
      imageUrl = await searchWikimediaImage(query)
      if (imageUrl) break
      await sleep(RATE_LIMIT_MS)
    }

    if (!imageUrl) {
      console.log(`  No suitable image found`)
      failed++
      await sleep(RATE_LIMIT_MS)
      continue
    }

    const success = await downloadAndProcess(imageUrl, outputPath)
    if (success) {
      park.imageUrl = `/parks/${park.id}.webp`
      fetched++
      const sizeKB = Math.round(fs.statSync(outputPath).size / 1024)
      console.log(`  Saved (${sizeKB}KB)`)
    } else {
      failed++
    }

    await sleep(RATE_LIMIT_MS)
  }

  // Write updated parks.json
  fs.writeFileSync(PARKS_JSON, JSON.stringify(parks, null, 2) + '\n')

  console.log(`\nDone! Fetched: ${fetched}, Skipped: ${skipped}, Failed: ${failed}`)
}

main().catch(console.error)
