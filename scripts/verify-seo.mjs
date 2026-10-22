// Read-only HTTP regression checks against a running production build or deployment.
// Usage: npm run verify:seo -- http://127.0.0.1:3107 [canonical-origin]
import assert from 'node:assert/strict'

const base = process.argv[2] || 'http://127.0.0.1:3000'
const origin = (process.argv[3] || 'https://bingo.playam.app').replace(/\/$/, '')
const modes = ['Bingo', 'Trivia', 'Tenable', 'Famous 11s', 'Careers', 'Connections']
const segments = ['play', 'trivia', 'tenable', 'famous-11s', 'careers', 'connections']
const publicPaths = ['', '/games', '/credits', '/privacy', '/terms']

function tags(html, tag) {
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] || ''
  return [...head.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map(([text]) =>
    Object.fromEntries([...text.matchAll(/([\w:-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])),
  )
}
const meta = (html, key) => tags(html, 'meta').find((tag) => tag.name === key || tag.property === key)?.content
const canonical = (html) => tags(html, 'link').find((tag) => tag.rel === 'canonical')?.href
async function get(path, bot = 'Googlebot') {
  const response = await fetch(new URL(path || '/', base), {
    headers: { 'User-Agent': bot },
    redirect: 'manual',
    signal: AbortSignal.timeout(30000),
  })
  return { response, html: await response.text() }
}

const { html: sitemap, response: sitemapResponse } = await get('/sitemap.xml')
assert.equal(sitemapResponse.status, 200)
assert.deepEqual(
  [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(([, url]) => url).sort(),
  publicPaths.map((path) => origin + path).sort(),
  'Keep exactly the five public sitemap URLs',
)
const { html: robots } = await get('/robots.txt')
const disallows = [...robots.matchAll(/^Disallow:\s*(.+)$/gm)].map(([, path]) => path.trim())
assert.ok(disallows.includes('/api/'))
assert.ok(robots.includes(`Sitemap: ${origin}/sitemap.xml`))
for (const path of [...publicPaths, '/_next/static/test.js', ...segments.map((s) => `/${s}/setup`), '/sign-in', '/room/seo-check']) {
  assert.ok(!disallows.some((rule) => (path || '/').startsWith(rule)), `${path}: crawlers must be able to read page metadata`)
}

let imagePath
for (const path of publicPaths) {
  const { response, html } = await get(path)
  assert.equal(response.status, 200, path)
  assert.ok(/<html[^>]*lang="en"/.test(html), `${path}: English content language`)
  assert.equal(canonical(html), origin + path, `${path}: canonical`)
  assert.match(meta(html, 'robots'), /\bindex\b/, `${path}: indexable`)
  assert.ok(meta(html, 'description'), `${path}: description`)
  assert.equal(meta(html, 'og:url'), origin + path, `${path}: social URL`)
  assert.equal(meta(html, 'og:description'), meta(html, 'description'), `${path}: social copy`)
  assert.equal(meta(html, 'twitter:description'), meta(html, 'description'), `${path}: Twitter copy`)
  const image = new URL(meta(html, 'og:image'))
  imagePath = image.pathname + image.search
  assert.ok(meta(html, 'twitter:image'), `${path}: Twitter image`)
  assert.equal(tags(html, 'link').some((tag) => tag.hreflang), false, 'Do not invent language alternatives')
  if (path === '/credits') {
    for (const text of ['Football data', 'Photo credits', 'Additional portrait sources', 'Transfermarkt', 'Wikimedia Commons']) {
      assert.ok(html.includes(text), `Credits include ${text}`)
    }
    assert.ok(!meta(html, 'description').includes('all Wikimedia'), 'Do not claim every portrait has a Commons licence')
  }
  console.log(`PASS public ${path || '/'}`)
}

for (const bot of ['Googlebot', 'Bingbot', 'OAI-SearchBot', 'PerplexityBot']) {
  const { response, html } = await get('/games', bot)
  assert.equal(response.status, 200)
  assert.ok(meta(html, 'description') && canonical(html), `${bot}: metadata in head`)
  for (const mode of modes) assert.ok(html.includes(mode), `${bot}: ${mode} in initial HTML`)
  for (const segment of segments) {
    assert.ok(html.includes(`href="/${segment}/setup`), `${bot}: ${segment} play link`)
  }
  assert.ok(html.includes('For example:') && html.includes('In a room:'), `${bot}: readable rules`)
  console.log(`PASS guide HTML ${bot}`)
}

const privatePaths = [
  ...segments.flatMap((s) => [`/${s}/setup`, `/${s}/setup?mode=multiplayer`, `/${s}/play`]),
  '/play', '/room/seo-check',
  ...segments.slice(1).map((s) => `/${s}/room/seo-check`),
  '/sign-in', '/sign-up', '/account', '/app',
].filter((path) => path !== '/play/play')
for (const path of privatePaths) {
  const { response, html } = await get(path)
  if (path === '/account' && [301, 302, 303, 307, 308, 404].includes(response.status)) continue
  assert.equal(response.status, 200, path)
  assert.match(meta(html, 'robots'), /\bnoindex\b/, `${path}: excluded from indexing`)
  assert.equal(canonical(html), undefined, `${path}: no inherited public canonical`)
}
console.log('PASS setup, runtime, room and account indexing exclusions')

const imageResponse = await fetch(new URL(imagePath, base))
assert.equal(imageResponse.status, 200)
assert.match(imageResponse.headers.get('content-type'), /image\/png/)
const png = Buffer.from(await imageResponse.arrayBuffer())
assert.equal(png.readUInt32BE(16), 1200)
assert.equal(png.readUInt32BE(20), 630)
console.log('PASS social image: PNG, 1200 × 630')
