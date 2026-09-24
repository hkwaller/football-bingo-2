/**
 * Scoping for the Adsterra popunder.
 *
 * The popunder script hooks page-wide click listeners (window/document/body)
 * and there is no API to unload it - removing the <script> tag does nothing.
 * In an SPA that means once it has loaded on an end screen, every later click
 * (e.g. on the next game's board) can open another popunder.
 *
 * It also injects a full-screen, max-z-index overlay (black at 1% opacity)
 * directly under <body> to catch clicks, which can be left covering the page.
 *
 * So we route page-wide listeners registered by third-party code through a
 * registry: they are attached only while a popunder "slot" is armed, and
 * detached again when it disarms. Elements third-party code inserts under
 * <html>/<body> are tagged and hidden by CSS while disarmed. The script is
 * injected once per page load; later end screens just re-arm what it already
 * set up.
 */

type Entry = {
  target: EventTarget
  type: string
  listener: EventListenerOrEventListenerObject
  options?: boolean | AddEventListenerOptions
  attached: boolean
}

const entries: Entry[] = []
let installed = false
let injected = false
let armedCount = 0

const ARMED_ATTR = 'data-popunder-armed'
const TAG_ATTR = 'data-third-party'
// The overlay selector is a fallback for elements inserted some way we don't patch.
const HIDE_CSS = `html:not([${ARMED_ATTR}]) [${TAG_ATTR}],
html:not([${ARMED_ATTR}]) body > [style*="2147483647"] { display: none !important; }`

const nativeAdd = typeof EventTarget !== 'undefined' ? EventTarget.prototype.addEventListener : null
const nativeRemove =
  typeof EventTarget !== 'undefined' ? EventTarget.prototype.removeEventListener : null
const nativeOpen = typeof window !== 'undefined' ? window.open : null

function isPageWide(target: EventTarget) {
  return (
    target === window ||
    target === document ||
    target === document.documentElement ||
    target === document.body
  )
}

/**
 * True when the calling code (skipping the patched function's own frame) comes
 * only from third-party scripts - i.e. no frame from our own bundle or Clerk.
 * Frames without a URL (eval'd ad code) count as third-party.
 */
function calledByThirdParty(stack: string | undefined) {
  const urls = (stack ?? '').match(/https?:\/\/[^\s)'"]+/g) ?? []
  for (const url of urls.slice(1)) {
    let host: string
    try {
      host = new URL(url).host
    } catch {
      continue
    }
    if (host === location.host || host.includes('clerk')) return false
  }
  return true
}

function sameEntry(e: Entry, target: EventTarget, type: string, listener: unknown, options: unknown) {
  const capture = (o: unknown) => (typeof o === 'boolean' ? o : !!(o as EventListenerOptions)?.capture)
  return (
    e.target === target &&
    e.type === type &&
    e.listener === listener &&
    capture(e.options) === capture(options)
  )
}

/** Wrap a DOM insertion method so third-party elements put under <html>/<body> get tagged. */
function tagInsertions<K extends 'appendChild' | 'insertBefore' | 'append' | 'prepend'>(
  proto: Node | Element,
  name: K,
) {
  const native = (proto as unknown as Record<K, (...args: unknown[]) => unknown>)[name]
  ;(proto as unknown as Record<K, unknown>)[name] = function (this: Node, ...args: unknown[]) {
    if (
      (this === document.body || this === document.documentElement) &&
      calledByThirdParty(new Error().stack)
    ) {
      for (const node of args) {
        if (node instanceof Element) node.setAttribute(TAG_ATTR, '')
      }
    }
    return native.apply(this, args)
  }
}

function install() {
  if (installed || !nativeAdd || !nativeRemove) return
  installed = true

  const style = document.createElement('style')
  style.textContent = HIDE_CSS
  document.head.appendChild(style)

  tagInsertions(Node.prototype, 'appendChild')
  tagInsertions(Node.prototype, 'insertBefore')
  tagInsertions(Element.prototype, 'append')
  tagInsertions(Element.prototype, 'prepend')

  EventTarget.prototype.addEventListener = function (type, listener, options) {
    if (!listener || !isPageWide(this) || !calledByThirdParty(new Error().stack)) {
      return nativeAdd.call(this, type, listener, options)
    }
    const entry: Entry = { target: this, type, listener, options, attached: armedCount > 0 }
    entries.push(entry)
    if (entry.attached) nativeAdd.call(this, type, listener, options)
  }

  EventTarget.prototype.removeEventListener = function (type, listener, options) {
    const i = entries.findIndex((e) => sameEntry(e, this, type, listener, options))
    if (i !== -1) entries.splice(i, 1)
    return nativeRemove.call(this, type, listener, options)
  }

  // Belt and braces: a disarmed popunder must not open windows even if it
  // found another way to observe clicks.
  if (nativeOpen) {
    window.open = function (...args: Parameters<typeof window.open>) {
      if (armedCount === 0 && calledByThirdParty(new Error().stack)) return null
      return nativeOpen.apply(window, args)
    }
  }
}

function setAttached(attached: boolean) {
  document.documentElement.toggleAttribute(ARMED_ATTR, attached)
  for (const e of entries) {
    if (e.attached === attached) continue
    e.attached = attached
    const fn = attached ? nativeAdd : nativeRemove
    fn?.call(e.target, e.type, e.listener, e.options)
  }
}

/**
 * Enable the popunder for as long as the caller is mounted. Returns the
 * disarm function to call on unmount.
 */
export function armPopunder(src: string) {
  install()
  armedCount++
  if (armedCount === 1) setAttached(true)

  if (!injected) {
    injected = true
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = src
    document.body.appendChild(script)
  }

  let disarmed = false
  return () => {
    if (disarmed) return
    disarmed = true
    armedCount--
    if (armedCount === 0) setAttached(false)
  }
}
