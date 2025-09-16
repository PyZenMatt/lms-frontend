import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

function scanUiImports(root: string) {
  const uiDir = path.join(root, 'src', 'ui')
  const violations: string[] = []
  if (!fs.existsSync(uiDir)) return violations
  const files = fs.readdirSync(uiDir)
  for (const f of files) {
    const fp = path.join(uiDir, f)
    const stat = fs.statSync(fp)
    if (stat.isDirectory()) {
      const sub = fs.readdirSync(fp)
      for (const sf of sub) {
        const sfp = path.join(fp, sf)
        const content = fs.readFileSync(sfp, 'utf8')
        if (/from\s+['"]@\/services|from\s+['"]@\/store|from\s+['"]@\/services\/http/.test(content)) violations.push(sfp)
      }
    } else if (stat.isFile()) {
      const content = fs.readFileSync(fp, 'utf8')
      if (/from\s+['"]@\/services|from\s+['"]@\/store|from\s+['"]@\/services\/http/.test(content)) violations.push(fp)
    }
  }
  return violations
}

describe('UI import boundaries', () => {
  it('ensures presentational `src/ui` files do not import services/store/http', () => {
    const root = path.resolve(__dirname, '..', '..')
    const viol = scanUiImports(root)
    expect(viol).toEqual([])
  })
})
