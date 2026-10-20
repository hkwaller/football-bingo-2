import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { clubCrestInventory } from './clubCrestInventory'
import { getClubLogo } from '../src/data/clubs'
import manifest from '../src/data/clubCrests.json'

const missing = clubCrestInventory().filter(names => !names.every(name => {
  const file = getClubLogo(name)
  return file && existsSync(join(process.cwd(), 'public', file))
}))
const invalid = Object.values(manifest).filter(file => {
  const path = join(process.cwd(), 'public', file)
  return !existsSync(path) || readFileSync(path).subarray(0, 8).toString('hex') !== '89504e470d0a1a0a'
})
console.log(`${clubCrestInventory().length - missing.length}/${clubCrestInventory().length} club groups have crests; ${invalid.length} invalid assets.`)
for (const names of missing) console.log(`Missing: ${names.join(' / ')}`)
if (missing.length || invalid.length) process.exitCode = 1
