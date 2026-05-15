// Server-side Plot renderer. Calls @observablehq/plot with a stub
// `document` (no JSDOM) and walks the resulting Element tree into an
// SVG XML string suitable for serving as image/svg+xml.
//
// The stub is a tighter cousin of app/components/Polt/Renderer.js — that
// version converts to Vue hyperscript for client hydration; this one
// serializes straight to XML for <img>-style widget endpoints.

import * as Plot from '@observablehq/plot'

class StyleStub {
  setProperty(): void {}
  removeProperty(): void {}
  getPropertyValue(): string {
 return ''
}

  get cssText(): string {
 return ''
}

  set cssText(_: string) {}
}

class TextNode {
  ownerDocument: FakeDocument
  nodeValue: string
  parentNode: Element | null = null
  nodeType = 3
  constructor(doc: FakeDocument, value: unknown) {
    this.ownerDocument = doc
    this.nodeValue = value == null ? '' : String(value)
  }
}

class Element {
  ownerDocument: FakeDocument
  tagName: string
  namespaceURI: string | null
  attributes: Record<string, string> = {}
  children: (Element | TextNode)[] = []
  parentNode: Element | null = null
  nodeType = 1
  private _style = new StyleStub()

  constructor(doc: FakeDocument, tagName: string, ns: string | null = null) {
    this.ownerDocument = doc
    this.tagName = tagName
    this.namespaceURI = ns
  }

  setAttribute(name: string, value: unknown): void {
    this.attributes[name] = value == null ? '' : String(value)
  }

  setAttributeNS(_ns: unknown, name: string, value: unknown): void {
    this.setAttribute(name, value)
  }

  getAttribute(name: string): string | null {
    return Object.hasOwn(this.attributes, name) ? this.attributes[name]! : null
  }

  getAttributeNS(_ns: unknown, name: string): string | null {
    return this.getAttribute(name)
  }

  hasAttribute(name: string): boolean {
 return name in this.attributes
}

  hasAttributeNS(_ns: unknown, name: string): boolean {
 return this.hasAttribute(name)
}

  removeAttribute(name: string): void {
 delete this.attributes[name]
}

  removeAttributeNS(_ns: unknown, name: string): void {
 this.removeAttribute(name)
}

  getAttributeNames(): string[] {
 return Object.keys(this.attributes)
}

  addEventListener(): void {}
  removeEventListener(): void {}
  dispatchEvent(): boolean {
 return true
}

  append(...nodes: (Element | TextNode | string)[]): void {
    for (const n of nodes) {
      const child = typeof n === 'string' ? new TextNode(this.ownerDocument, n) : n
      this.children.push(child)
      ;(child as { parentNode: Element | null }).parentNode = this
    }
  }

  // Plot calls appendChild on host-spec nodes; keep the API surface intact.
  appendChild<T extends Element | TextNode>(child: T): T {
    this.children.push(child)
    ;(child as { parentNode: Element | null }).parentNode = this
    return child
  }

  insertBefore<T extends Element | TextNode>(child: T, after: Element | TextNode | null): T {
    if (after == null) {
      this.children.push(child)
    }
    else {
      const i = this.children.indexOf(after)
      if (i === -1) {
 throw new Error('insertBefore: reference node not found')
}
      this.children.splice(i, 0, child)
    }
    ;(child as { parentNode: Element | null }).parentNode = this
    return child
  }

  cloneNode(deep?: boolean): Element {
    const c = new Element(this.ownerDocument, this.tagName, this.namespaceURI)
    c.attributes = { ...this.attributes }
    if (deep) {
      c.children = this.children.map(x => x instanceof Element
        ? x.cloneNode(true)
        : new TextNode(this.ownerDocument, x.nodeValue))
    }
    return c
  }

  querySelector(): null {
 return null
}

  querySelectorAll(): never[] {
 return []
}

  get textContent(): string {
    return this.children.map(c => c instanceof TextNode ? c.nodeValue : (c as Element).textContent).join('')
  }

  set textContent(v: string) {
    this.children = [new TextNode(this.ownerDocument, v)]
  }

  set style(v: string) {
 this.attributes.style = v
}

  get style(): StyleStub {
 return this._style
}

  get firstChild(): Element | TextNode | null {
 return this.children[0] ?? null
}

  get lastChild(): Element | TextNode | null {
 return this.children.at(-1) ?? null
}

  get nextSibling(): Element | TextNode | null {
    if (!this.parentNode) {
 return null
}
    const siblings = this.parentNode.children
    const idx = siblings.indexOf(this)
    return idx === -1 ? null : (siblings[idx + 1] ?? null)
  }
}

class FakeDocument {
  documentElement: Element
  defaultView = { Event: class FakeEvent {} }

  constructor() {
 this.documentElement = new Element(this, 'html')
}

  createElementNS(ns: string, tag: string): Element {
 return new Element(this, tag, ns)
}

  createElement(tag: string): Element {
 return new Element(this, tag)
}

  createTextNode(value: unknown): TextNode {
 return new TextNode(this, value)
}

  querySelector(): null {
 return null
}

  querySelectorAll(): never[] {
 return []
}
}

const VOID_TAGS = new Set([
  'path',
'rect',
'circle',
'line',
'ellipse',
'polygon',
'polyline',
  'use',
'image',
'stop',
'meta',
'link',
'input',
'img',
'br',
'hr',
])

function escAttr(v: string): string {
  return v.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
}

function escText(v: string): string {
  return v.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function serializeNode(node: Element | TextNode): string {
  if (node instanceof TextNode) {
 return escText(node.nodeValue)
}
  let out = `<${node.tagName}`
  for (const [k, v] of Object.entries(node.attributes)) out += ` ${k}="${escAttr(v)}"`
  if (node.children.length === 0 && VOID_TAGS.has(node.tagName.toLowerCase())) {
 return `${out}/>`
}
  out += '>'
  for (const c of node.children) out += serializeNode(c)
  out += `</${node.tagName}>`
  return out
}

function findSvg(node: Element | TextNode): Element | null {
  if (!(node instanceof Element)) {
 return null
}
  if (node.tagName === 'svg') {
 return node
}
  for (const c of node.children) {
    const r = findSvg(c)
    if (r) {
 return r
}
  }
  return null
}

export type PlotOptionsInput = Parameters<typeof Plot.plot>[0]

// Render a Plot.plot() call to an SVG XML string. If Plot wraps its output
// in a <figure> (e.g. when legends are configured), the inner <svg> is
// extracted so the result can be served as a standalone image/svg+xml.
export function renderPlotSvg(options: PlotOptionsInput): string {
  const doc = new FakeDocument()
  // Plot's published types omit `document`, but the runtime accepts it
  // (used by Polt/Renderer.js for the same SSR pattern). Cast via unknown
  // to bypass the structural-overlap check without weakening callers.
  const root = (Plot.plot as (o: unknown) => unknown)({
    ...options,
    document: doc,
  }) as Element
  const svg = root.tagName === 'svg' ? root : (findSvg(root) ?? root)
  if (!svg.attributes.xmlns) {
 svg.attributes.xmlns = 'http://www.w3.org/2000/svg'
}
  return serializeNode(svg)
}
