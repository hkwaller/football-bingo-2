/**
 * Browser regression tests for the actual autocomplete components, without Next/API setup.
 * Run: node --test scripts/tests/autocomplete-touch.mjs
 * Requires Playwright + Chromium; PLAYWRIGHT_MODULE and PLAYWRIGHT_CHROMIUM_EXECUTABLE
 * can point at an existing installation instead of adding project dependencies.
 */
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import { build } from 'esbuild'

const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const root = fileURLToPath(new URL('../../', import.meta.url))

for (const [component, path] of [
  ['NameAutocomplete', 'tenable/NameAutocomplete'],
  ['Famous11sAutocomplete', 'famous11s/Famous11sAutocomplete'],
]) {
  test(`${component}: touch, blur, cancellation, mouse and keyboard`, async () => {
    const { outputFiles } = await build({
      stdin: {
        contents: `import React from 'react';
          import { createRoot } from 'react-dom/client';
          import { ${component} } from './src/components/${path}';
          window.guesses = [];
          window.fetch = async () => ({ json: async () => ({ suggestions: [
            { name: 'João Pedro' }, { name: 'João Palhinha' }
          ] }) });
          createRoot(document.getElementById('root')).render(
            <${component} onGuess={name => window.guesses.push(name)} />
          );`,
        resolveDir: root,
        loader: 'tsx',
      },
      bundle: true, jsx: 'automatic', write: false,
    })
    const browser = await chromium.launch({
      headless: true,
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
    })
    try {
      const page = await browser.newPage({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
      await page.route('http://autocomplete.test/**', route => route.fulfill({
        contentType: route.request().url().endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/html; charset=utf-8',
        body: route.request().url().endsWith('.js') ? outputFiles[0].text : '<meta charset="utf-8"><div id="root"></div><script src="/bundle.js"></script>',
      }))
      const input = page.getByRole('combobox')
      const option = page.getByRole('button', { name: 'João Palhinha', exact: true })
      const guesses = () => page.evaluate(() => window.guesses)
      async function reset() {
        await page.goto('http://autocomplete.test/')
        await input.fill('Joao P')
        await option.waitFor()
      }
      await reset()
      await option.tap()
      assert.deepEqual(await guesses(), ['João Palhinha'], 'a normal tap submits exactly once')

      await reset()
      const bounds = await option.boundingBox()
      const pointer = { pointerType: 'touch', isPrimary: true, clientX: bounds.x + 5, clientY: bounds.y + 5 }
      await option.dispatchEvent('pointerdown', pointer)
      await input.evaluate(el => el.blur())
      assert.equal(await option.count(), 1, 'input blur must not unmount the touched suggestion')
      await option.dispatchEvent('pointerup', pointer)
      assert.deepEqual(await guesses(), ['João Palhinha'], 'submit the tapped name, not the top search result')
      assert.equal(await input.inputValue(), '')

      await reset()
      await option.dispatchEvent('pointerdown', pointer)
      await option.dispatchEvent('pointercancel', pointer)
      assert.deepEqual(await guesses(), [], 'scroll cancellation never guesses')
      await input.evaluate(el => el.blur())
      assert.equal(await option.count(), 0, 'blur after cancellation still closes the list')

      await reset()
      await option.dispatchEvent('pointerdown', pointer)
      await option.dispatchEvent('pointerup', { ...pointer, clientX: -10, clientY: -10 })
      assert.deepEqual(await guesses(), [], 'releasing outside the suggestion never guesses')

      await reset()
      await option.click()
      assert.deepEqual(await guesses(), ['João Palhinha'], 'mouse selection still works')

      await reset()
      await input.press('ArrowDown')
      await input.press('ArrowDown')
      await input.press('Enter')
      assert.deepEqual(await guesses(), ['João Palhinha'], 'keyboard selection still works')
    } finally {
      await browser.close()
    }
  })
}
