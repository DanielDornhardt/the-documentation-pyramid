#!/usr/bin/env node
// refresh-pyramid: keeps the routing table of a documentation pyramid in step with the documents.
//
// One file, no dependencies, stable Node APIs only (Node 20.11 or newer). It does not import anything from the
// pyramid viewer, so it can be copied into any project's docs folder on its own. See tools/refresh-pyramid.md.
//
//   node tools/refresh-pyramid.js [docs-folder] [options]
//
// The pure functions are exported for tests. The command line runs only when the file is started directly.
import {
  readFileSync, writeFileSync, readdirSync, lstatSync, statSync, realpathSync, renameSync, unlinkSync, mkdirSync,
} from 'node:fs';
import { join, dirname, basename, resolve, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const DEFAULTS = Object.freeze({ maxSectionLines: 100, maxByline: 140 });
const NO_MODULES = '_No modules yet._';
const ROUTING_HEADING = 'Routing table';

class UsageError extends Error {}

// ---------------------------------------------------------------------------------------------------------------
// Text basics

/** Split text (without BOM) into lines that remember their own terminator: '\n', '\r\n' or '' for the last line. */
export function splitLines(raw) {
  const out = [];
  let pos = 0;
  while (pos < raw.length) {
    const nl = raw.indexOf('\n', pos);
    if (nl < 0) { out.push({ t: raw.slice(pos), e: '' }); break; }
    const crlf = nl > pos && raw.charCodeAt(nl - 1) === 13;
    out.push({ t: raw.slice(pos, crlf ? nl - 1 : nl), e: crlf ? '\r\n' : '\n' });
    pos = nl + 1;
  }
  return out;
}

export const joinLines = (lines) => lines.map((l) => l.t + l.e).join('');

/** The line ending that dominates in a list of lines ('\n' when there is no line ending at all). */
function dominantEol(lines) {
  let crlf = 0;
  let lf = 0;
  for (const l of lines) { if (l.e === '\r\n') crlf++; else if (l.e === '\n') lf++; }
  return crlf > lf ? '\r\n' : '\n';
}

/** Decode bytes: strips a BOM and tells whether the bytes round-trip as UTF-8 (so writing back is lossless). */
export function decodeBuffer(buf) {
  const text = buf.toString('utf8');
  const validUtf8 = Buffer.from(text, 'utf8').equals(buf);
  const bom = text.charCodeAt(0) === 0xfeff;
  return { raw: bom ? text.slice(1) : text, bom, validUtf8 };
}

/** Number of characters (code points), counted in linear time. */
export function charLength(s) {
  let n = 0;
  for (const _ of s) n++; // eslint-disable-line no-unused-vars
  return n;
}

const ENTITY = /&(#x[0-9a-f]{1,6}|#\d{1,7}|amp|lt|gt|quot|apos|nbsp);/gi;
export function decodeEntities(s) {
  return s.replace(ENTITY, (m, name) => {
    const n = name.toLowerCase();
    if (n[0] === '#') {
      const code = n[1] === 'x' ? parseInt(n.slice(2), 16) : parseInt(n.slice(1), 10);
      return code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : m;
    }
    return { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }[n];
  });
}

function trimHyphens(s) {
  let a = 0;
  let b = s.length;
  while (a < b && s.charCodeAt(a) === 45) a++;
  while (b > a && s.charCodeAt(b - 1) === 45) b--;
  return s.slice(a, b);
}

/** Slug of a heading title: lowercase, entities decoded, punctuation removed, spaces to hyphens, Unicode kept. */
export function slugBase(text) {
  return trimHyphens(
    decodeEntities(text).normalize('NFC').toLowerCase().replace(/[^\p{L}\p{M}\p{N}_\-\s]/gu, '').replace(/\s+/g, '-'),
  );
}

/** Give every heading its anchor; duplicates get -1, -2 ... in document order. Sets .slugBase and .anchor. */
export function assignAnchors(headings) {
  for (const h of headings) h.slugBase = slugBase(h.titleRaw ?? h.title) || 'section';
  const reserved = new Set(headings.map((h) => h.slugBase));
  const used = new Set();
  const next = new Map();
  for (const h of headings) {
    let slug = h.slugBase;
    if (used.has(slug)) {
      let n = next.get(h.slugBase) || 1;
      while (used.has(`${h.slugBase}-${n}`) || reserved.has(`${h.slugBase}-${n}`)) n++;
      slug = `${h.slugBase}-${n}`;
      next.set(h.slugBase, n + 1);
    }
    used.add(slug);
    h.anchor = slug;
  }
  return headings;
}

// ---------------------------------------------------------------------------------------------------------------
// Inline markdown, reduced to plain text. Every loop here moves forward only, so the cost is linear.

/** Code spans of one text: matching backtick runs of equal length. Returns {open, cs, ce, close} offsets. */
export function inlineCodeSpans(s) {
  const runs = [];
  for (let i = 0; i < s.length;) {
    if (s.charCodeAt(i) === 96) {
      let j = i;
      while (j < s.length && s.charCodeAt(j) === 96) j++;
      runs.push({ pos: i, len: j - i });
      i = j;
    } else {
      i = s.indexOf('`', i);
      if (i < 0) break;
    }
  }
  const nextSame = new Array(runs.length).fill(-1);
  const last = new Map();
  for (let k = runs.length - 1; k >= 0; k--) {
    nextSame[k] = last.has(runs[k].len) ? last.get(runs[k].len) : -1;
    last.set(runs[k].len, k);
  }
  const spans = [];
  for (let k = 0; k < runs.length;) {
    const j = nextSame[k];
    if (j < 0) { k++; continue; }
    spans.push({ open: runs[k].pos, cs: runs[k].pos + runs[k].len, ce: runs[j].pos, close: runs[j].pos + runs[j].len });
    k = j + 1;
  }
  return spans;
}

function removeComments(s) {
  if (!s.includes('<!--')) return s;
  let out = '';
  let pos = 0;
  for (;;) {
    const a = s.indexOf('<!--', pos);
    if (a < 0) break;
    out += s.slice(pos, a);
    const b = s.indexOf('-->', a + 4);
    if (b < 0) { pos = s.length; break; }
    pos = b + 3;
  }
  return out + s.slice(pos);
}

const isWordChar = (ch) => ch !== undefined && /[\p{L}\p{N}]/u.test(ch);
const SPECIAL = /[`\\[\]*_~<]/g;

/** Index of the ')' that closes a link destination starting at `from` (balanced parentheses), or -1. */
function destinationEnd(s, from) {
  let depth = 0;
  const limit = Math.min(s.length, from + 2000);
  for (let k = from; k < limit; k++) {
    const c = s.charCodeAt(k);
    if (c === 92) k++;
    else if (c === 40) depth++;
    else if (c === 41) { if (depth === 0) return k; depth--; }
  }
  return -1;
}

/** Index of the ']' that closes a reference label starting at `from` (no nested brackets), or -1. */
function referenceLabelEnd(s, from) {
  const limit = Math.min(s.length, from + 200);
  for (let k = from; k < limit; k++) {
    const c = s.charCodeAt(k);
    if (c === 93) return k;
    if (c === 91) return -1;
  }
  return -1;
}

const INLINE_TAG = /<\/?(?:span|a|em|strong|b|i|u|s|code|kbd|sup|sub|small|abbr|mark|br|cite|q|var|samp|time|del|ins)(?:[ \t][^<>]{0,200})?\/?>/iy;

/** Plain text of inline markdown: links keep their text, emphasis and code marks go, comments go, spaces collapse. */
export function stripInline(input) {
  const s = removeComments(input);
  const spans = inlineCodeSpans(s);
  const spanAt = new Map(spans.map((sp) => [sp.open, sp]));
  const out = [];
  const stack = [];
  let i = 0;
  while (i < s.length) {
    SPECIAL.lastIndex = i;
    const m = SPECIAL.exec(s);
    const at = m ? m.index : s.length;
    if (at > i) { out.push(s.slice(i, at)); i = at; }
    if (i >= s.length) break;
    const ch = s[i];
    if (ch === '`') {
      const sp = spanAt.get(i);
      if (sp) {
        let c = s.slice(sp.cs, sp.ce);
        if (c.length > 1 && c[0] === ' ' && c[c.length - 1] === ' ' && c.trim() !== '') c = c.slice(1, -1);
        out.push(c);
        i = sp.close;
      } else {
        let j = i;
        while (j < s.length && s[j] === '`') j++;
        out.push(s.slice(i, j));
        i = j;
      }
    } else if (ch === '<') {
      INLINE_TAG.lastIndex = i;
      const tag = INLINE_TAG.exec(s);
      if (tag) { if (/^<br/i.test(tag[0])) out.push(' '); i += tag[0].length; } else { out.push('<'); i++; }
    } else if (ch === '\\') {
      if (i + 1 < s.length && /[!-/:-@[-`{-~]/.test(s[i + 1])) { out.push(s[i + 1]); i += 2; } else { out.push(ch); i++; }
    } else if (ch === '[') {
      stack.push(out.length);
      out.push('\u0001');
      i++;
    } else if (ch === ']') {
      if (stack.length) {
        const idx = stack.pop();
        if (s[i + 1] === '(') {
          const close = destinationEnd(s, i + 2);
          if (close >= 0) {
            out[idx] = '';
            if (idx > 0 && out[idx - 1].endsWith('!')) { // an image: the alt text is not prose
              out[idx - 1] = out[idx - 1].slice(0, -1);
              out.length = idx;
            }
            i = close + 1;
            continue;
          }
        } else if (s[i + 1] === '[') { // reference link: keep the text, drop the label
          const close = referenceLabelEnd(s, i + 2);
          if (close >= 0) { out[idx] = ''; i = close + 1; continue; }
        } else if (out[idx + 1] !== undefined && out[idx + 1].startsWith('^') && out.length === idx + 2) { // footnote mark
          out.length = idx;
          i++;
          continue;
        }
        out[idx] = '[';
      }
      out.push(']');
      i++;
    } else { // '*', '_' or '~'
      let j = i;
      while (j < s.length && s[j] === ch) j++;
      const prev = s[i - 1];
      const nextCh = s[j];
      let remove;
      if (ch === '*') remove = !((prev === undefined || /\s/.test(prev)) && (nextCh === undefined || /\s/.test(nextCh)));
      else if (ch === '_') remove = isWordChar(prev) !== isWordChar(nextCh);
      else remove = j - i === 2;
      if (!remove) out.push(s.slice(i, j));
      i = j;
    }
  }
  return out.join('').replace(/\u0001/g, '[').replace(/\s+/g, ' ').trim();
}

/** The first sentence: up to and including the first '. ', or the whole text. */
export function firstSentence(text) {
  const idx = text.indexOf('. ');
  return idx < 0 ? text : text.slice(0, idx + 1);
}

export function humanise(fileName) {
  const stem = fileName.replace(/\.md$/i, '').replace(/[-_]+/g, ' ').trim();
  return stem ? stem[0].toUpperCase() + stem.slice(1) : fileName;
}

// ---------------------------------------------------------------------------------------------------------------
// Document scanning

/** Parse an ATX heading line ('## text ##'). Returns {level, text} or null. No backtracking regex on purpose. */
export function parseHeading(t) {
  let i = 0;
  while (i < 3 && t.charCodeAt(i) === 32) i++;
  let j = i;
  while (j < t.length && t.charCodeAt(j) === 35) j++;
  const level = j - i;
  if (level < 1 || level > 6) return null;
  if (j < t.length && t[j] !== ' ' && t[j] !== '\t') return null;
  let text = t.slice(j).trim();
  let k = text.length;
  while (k > 0 && text.charCodeAt(k - 1) === 35) k--;
  if (k < text.length && (k === 0 || text[k - 1] === ' ' || text[k - 1] === '\t')) text = text.slice(0, k).trim();
  return { level, text, indent: i };
}

const FENCE_OPEN = /^ {0,3}(`{3,}|~{3,})/;
const HTML_COMMENT_START = /^ {0,3}<!--/;
const HTML_BLOCK_START = /^ {0,3}<\/?(?:address|article|aside|blockquote|body|center|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|head|header|hr|html|iframe|legend|li|main|menu|nav|ol|p|pre|script|section|style|summary|table|tbody|td|tfoot|th|thead|tr|ul)(?:[ \t]|\/?>|$)/i;
const FENCE_CLOSE = /^ {0,3}(`{3,}|~{3,})[ \t]*$/;

/**
 * One pass over the lines: which lines are front matter or fenced code (mark 1 and 2), and the headings outside.
 * @returns {{mark: Uint8Array, frontEnd: number, headings: object[]}}
 */
export function analyzeLines(lines) {
  const n = lines.length;
  const mark = new Uint8Array(n);
  let frontEnd = -1;
  if (n && /^---[ \t]*$/.test(lines[0].t)) {
    for (let j = 1; j < n; j++) {
      if (/^(---|\.\.\.)[ \t]*$/.test(lines[j].t)) { frontEnd = j; break; }
    }
    for (let j = 0; j <= frontEnd; j++) mark[j] = 1;
  }
  const headings = [];
  let fence = null;
  let html = null; // an open HTML block: 'comment' ends at a line with '-->', 'block' ends at a blank line
  for (let i = frontEnd + 1; i < n; i++) {
    const t = lines[i].t;
    if (html) {
      if (html === 'comment' ? t.includes('-->') : t.trim() === '') html = null;
      continue;
    }
    if (fence) {
      mark[i] = 2;
      const m = FENCE_CLOSE.exec(t);
      if (m && m[1][0] === fence.ch && m[1].length >= fence.len) fence = null;
      continue;
    }
    const f = FENCE_OPEN.exec(t);
    if (f && !(f[1][0] === '`' && t.indexOf('`', f[0].length) >= 0)) {
      fence = { ch: f[1][0], len: f[1].length, line: i + 1 };
      mark[i] = 2;
      continue;
    }
    const c = HTML_COMMENT_START.exec(t);
    if (c) {
      if (!t.includes('-->', c[0].length)) html = 'comment';
      continue;
    }
    if (HTML_BLOCK_START.test(t)) { html = 'block'; continue; }
    const h = parseHeading(t);
    if (h) {
      const titleRaw = stripInline(h.text);
      headings.push({ idx: i, line: i + 1, level: h.level, text: h.text, indent: h.indent, titleRaw, title: decodeEntities(titleRaw) });
    }
  }
  assignAnchors(headings);
  return { mark, frontEnd, headings, openFence: fence ? fence.line : 0 };
}

const LIST_START = /^ {0,3}(?:[-*+]|\d{1,9}[.)])(?:[ \t]|$)/;
const THEMATIC = /^ {0,3}([-*_])(?: *\1){2,} *$/;
const TABLE_SEP = /^ {0,3}\|?[ \t]*:?-+:?[ \t]*(?:\|[ \t]*:?-+:?[ \t]*)*\|?[ \t]*$/;

const BLOCK_TAG = /^ {0,3}<\/?(?:address|article|aside|blockquote|body|center|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|head|header|hr|html|iframe|legend|li|main|menu|nav|ol|p|pre|script|section|style|summary|table|tbody|td|tfoot|th|thead|tr|ul)(?:[ \t]|\/?>|$)/i;
// A list can interrupt a paragraph only when it is a bullet or starts with 1 (CommonMark).
const LIST_INTERRUPT = /^ {0,3}(?:[-*+]|1[.)])(?:[ \t]+\S)/;

/**
 * The first paragraph in lines[start, end): {text, next} where next is the index after it, or null when there is
 * none or it is not prose (list, table, code block, quote or html block first).
 */
export function firstParagraphAt(lines, start, end) {
  let i = start;
  while (i < end) {
    const s = lines[i].t.trim();
    if (s === '') { i++; continue; }
    if (s.startsWith('<!--')) {
      let j = i;
      while (j < end && !lines[j].t.includes('-->')) j++;
      const after = j < end ? lines[j].t.slice(lines[j].t.indexOf('-->') + 3).trim() : '';
      if (after === '') { i = j + 1; continue; }
    }
    break;
  }
  if (i >= end) return null;
  const first = lines[i].t;
  if (/^(\t| {4})/.test(first) || FENCE_OPEN.test(first) || LIST_START.test(first) || THEMATIC.test(first)) return null;
  if (/^ {0,3}>/.test(first) || BLOCK_TAG.test(first) || /^ {0,3}<!/.test(first) || /^ {0,3}\|/.test(first)) return null;
  if (first.includes('|') && i + 1 < end && lines[i + 1].t.length < 1000 && TABLE_SEP.test(lines[i + 1].t)) return null;
  const parts = [];
  let j = i;
  for (; j < end; j++) {
    const t = lines[j].t;
    if (t.trim() === '') break;
    if (j > i && (FENCE_OPEN.test(t) || THEMATIC.test(t) || LIST_INTERRUPT.test(t) || /^ {0,3}>/.test(t) || DEF_LINE.test(t))) break;
    parts.push(t.trim());
  }
  return { text: parts.join(' '), next: j };
}

/** Text of the first paragraph in lines[start, end), or null when there is none or it is not prose. */
export function firstParagraph(lines, start, end) {
  const p = firstParagraphAt(lines, start, end);
  return p ? p.text : null;
}

const META_LINE = /^(?:status|date|deciders?|decision date|supersedes|superseded by)[ \t]*:/i;
const LABEL_WORDS = '(?:purpose|summary|overview|role|scope|context|description|responsibilit(?:y|ies)|goal|goals|intent|decision|problem|background|note|notes|definition|abstract|tl;dr)';
const BOLD_LABEL = /^(?:\*\*|__)([^*_]{1,40}?)(?:\.|:)(?:\*\*|__)[ \t]*|^(?:\*\*|__)([^*_]{1,40}?)(?:\*\*|__)(?:\.|:)[ \t]+/;
const PLAIN_LABEL = new RegExp(`^${LABEL_WORDS}[ \\t]*[.:][ \\t]+`, 'i');

/** The byline of the prose that starts at lines[start]: skips metadata lines, drops a leading label, gives '' for a lead-in. */
export function bylineFrom(lines, start, end) {
  let at = start;
  for (let guard = 0; guard < 8; guard++) {
    const p = firstParagraphAt(lines, at, end);
    if (!p) return '';
    let raw = p.text;
    if (META_LINE.test(raw.replace(/^[*_]+/, ''))) { at = p.next; continue; }
    const bold = BOLD_LABEL.exec(raw);
    if (bold && bold[0].length <= 60 && /^[\p{L}\p{N} ,/&-]+$/u.test((bold[1] ?? bold[2]).trim())) raw = raw.slice(bold[0].length);
    else raw = raw.replace(PLAIN_LABEL, '');
    const sentence = firstSentence(stripInline(raw));
    // a lead-in that ends in a colon introduces something else and does not describe the module
    return sentence.endsWith(':') ? '' : sentence;
  }
  return '';
}

/** Read the 'summary:' value of a front matter block (single line, or a folded or literal block). */
export function frontMatterSummary(lines, frontEnd) {
  if (frontEnd < 1) return null;
  for (let i = 1; i < frontEnd; i++) {
    const m = /^summary:[ \t]*(.*)$/.exec(lines[i].t);
    if (!m) continue;
    let v = m[1].trim();
    if (/^[>|][-+]?$/.test(v)) {
      const parts = [];
      for (let j = i + 1; j < frontEnd && /^[ \t]+\S/.test(lines[j].t); j++) parts.push(lines[j].t.trim());
      v = parts.join(' ');
    } else if ((v.startsWith('"') && v.endsWith('"') && v.length > 1) || (v.startsWith("'") && v.endsWith("'") && v.length > 1)) {
      v = v.slice(1, -1);
    }
    v = stripInline(v);
    return v === '' ? null : v;
  }
  return null;
}

/** Parse bytes into a document model. */
export function parseDocument(buf) {
  const { raw, bom, validUtf8 } = decodeBuffer(buf);
  const lines = splitLines(raw);
  const analysis = analyzeLines(lines);
  return { raw, bom, validUtf8, lines, analysis, eol: dominantEol(lines) };
}

/** Sections of a layer file: level-2 headings with their span, length and byline. */
export function sectionsOf(doc) {
  const { lines, analysis } = doc;
  const hs = analysis.headings;
  const out = [];
  for (let k = 0; k < hs.length; k++) {
    const h = hs[k];
    if (h.level !== 2) continue;
    let endIdx = lines.length;
    for (let m = k + 1; m < hs.length; m++) if (hs[m].level === 2) { endIdx = hs[m].idx; break; }
    const nextAny = k + 1 < hs.length ? hs[k + 1].idx : lines.length;
    const byline = bylineFrom(lines, h.idx + 1, nextAny);
    out.push({
      title: h.title, line: h.line, idx: h.idx, endIdx, lineCount: endIdx - h.idx, anchor: h.anchor, slugBase: h.slugBase,
      byline,
    });
  }
  return out;
}

/** Title and byline of a broken-out file (or a decision record). */
export function moduleOfFile(doc, fileName) {
  const { lines, analysis } = doc;
  const hs = analysis.headings;
  const k = hs.findIndex((h) => h.level === 1);
  const h1 = k >= 0 ? hs[k] : null;
  const title = (h1 && h1.title) || humanise(fileName);
  const start = h1 ? h1.idx + 1 : analysis.frontEnd + 1;
  const nextH = h1 ? hs[k + 1] : hs[0];
  const fromBody = bylineFrom(lines, start, nextH ? nextH.idx : lines.length);
  const summary = frontMatterSummary(lines, analysis.frontEnd);
  return { title, line: h1 ? h1.line : 1, slugBase: slugBase((h1 && h1.titleRaw) || title), byline: summary ?? fromBody };
}

// ---------------------------------------------------------------------------------------------------------------
// File access, always through an object that knows the docs root and refuses to leave it

const insideRoot = (root, real) => real === root || real.startsWith(root.endsWith(sep) ? root : root + sep);

/**
 * File access for one docs folder. `overlay` maps a relative path to new text (or null for deleted) and lets the
 * dry-run modes look at the state after a change without writing it.
 */
export function makeIo(root, overlay = new Map()) {
  const abs = (rel) => (rel ? join(root, ...rel.split('/')) : root);
  const cache = new Map();

  /** {type: 'file'|'dir'|'escape'|'other', size, link} or null when nothing is there. */
  function stat(rel) {
    if (overlay.has(rel)) {
      const v = overlay.get(rel);
      return v === null ? null : { type: 'file', size: Buffer.byteLength(v), link: false };
    }
    const a = abs(rel);
    let st;
    try { st = lstatSync(a); } catch { return virtualDir(rel) ? { type: 'dir', size: 0, link: false } : null; }
    let link = false;
    if (st.isSymbolicLink()) {
      link = true;
      try {
        const real = realpathSync(a);
        if (!insideRoot(root, real)) return { type: 'escape', size: 0, link };
        st = statSync(real);
      } catch { return { type: 'escape', size: 0, link }; }
    }
    if (st.isFile()) return { type: 'file', size: st.size, link };
    if (st.isDirectory()) return { type: 'dir', size: 0, link };
    return { type: 'other', size: 0, link };
  }

  function virtualDir(rel) {
    const prefix = rel ? `${rel}/` : '';
    for (const [k, v] of overlay) if (v !== null && k.startsWith(prefix) && k.length > prefix.length) return true;
    return false;
  }

  /** Entries of a folder: [{name, type, link}]; folders that only exist in the overlay are included. */
  function entries(rel) {
    const names = new Map();
    let real = [];
    try { real = readdirSync(abs(rel)); } catch (e) { if (!virtualDir(rel)) throw e; }
    for (const name of real) {
      const childRel = rel ? `${rel}/${name}` : name;
      if (overlay.get(childRel) === null) continue;
      names.set(name, stat(childRel));
    }
    const prefix = rel ? `${rel}/` : '';
    for (const [k, v] of overlay) {
      if (v === null || !k.startsWith(prefix)) continue;
      const rest = k.slice(prefix.length);
      const first = rest.split('/')[0];
      if (!names.has(first) || rest.includes('/')) names.set(first, rest.includes('/') ? { type: 'dir', size: 0, link: false } : stat(k));
    }
    return [...names].filter(([, st]) => st).map(([name, st]) => ({ name, ...st }));
  }

  function read(rel) {
    if (overlay.has(rel) && overlay.get(rel) !== null) return Buffer.from(overlay.get(rel), 'utf8');
    return readFileSync(abs(rel));
  }

  /** Load and parse a document once. Never throws. */
  function load(rel) {
    if (cache.has(rel)) return cache.get(rel);
    let result;
    const st = stat(rel);
    if (!st) result = { status: 'missing' };
    else if (st.type === 'escape') result = { status: 'escape' };
    else if (st.type !== 'file') result = { status: 'notfile' };
    else if (st.size > MAX_FILE_BYTES) result = { status: 'toolarge', size: st.size };
    else {
      try { result = { status: 'ok', doc: parseDocument(read(rel)), link: st.link }; } catch (e) {
        result = { status: 'unreadable', error: e.code || e.message };
      }
    }
    cache.set(rel, result);
    return result;
  }

  return { root, overlay, abs, stat, entries, read, load };
}

/** Write a file atomically: temp file in the same folder, then rename. Keeps the file mode of an existing file. */
export function writeAtomic(path, content) {
  let mode = 0o644;
  try { mode = statSync(path).mode & 0o7777; } catch { /* new file */ }
  const tmp = join(dirname(path), `.${basename(path)}.${process.pid}.${Math.random().toString(36).slice(2, 8)}.tmp`);
  try {
    writeFileSync(tmp, content, { flag: 'wx', mode });
    renameSync(tmp, path);
  } catch (e) {
    try { unlinkSync(tmp); } catch { /* nothing to clean up */ }
    throw e;
  }
}

// ---------------------------------------------------------------------------------------------------------------
// The model: layers, modules, findings, and the planned rewrite of index.md

const MARKER = /^[ \t]*<!--[ \t]*pyramid:(begin|end)[ \t]+([A-Za-z0-9_.-]+)[ \t]*-->[ \t]*$/;
const LAYER_FILE = /^L(\d+)-.+\.md$/;
const LAYER_DIR = /^L(\d+)-/;
const PATH_REF = /^([A-Za-z0-9_@.\-/]+\.md)(?:#(\S*))?$/;
const skippedName = (name) => name.startsWith('.') || name === 'node_modules';

const escCell = (s) => s.replace(/\|/g, '\\|');

export function renderBlockLines(modules) {
  if (!modules.length) return [NO_MODULES];
  const rows = ['| Module | Where | What |', '| --- | --- | --- |'];
  for (const m of modules) rows.push(`| ${escCell(m.title)} | ${escCell(m.where)} | ${escCell(m.byline)} |`);
  return rows;
}

const byName = (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0);

export function buildModel(io, options = {}) {
  const opts = { ...DEFAULTS, ...options };
  const findings = [];
  const add = (severity, code, file, line, message, fix) => findings.push({ severity, code, file, line: line ?? null, message, fix: fix ?? null });
  const quote = (a) => `"${a}"`;

  // 1. find the layers
  const layers = new Map();
  const layer = (id, num) => {
    if (!layers.has(id)) layers.set(id, { id, num, file: null, dir: null, isAdr: id === 'adr', incomplete: false, sections: [], brokenOut: [], modules: [] });
    return layers.get(id);
  };
  const top = io.entries('').filter((e) => !skippedName(e.name)).sort(byName);
  let rootIndexType = null;
  for (const e of top) {
    const fileMatch = LAYER_FILE.exec(e.name);
    const isDir = e.type === 'dir';
    const dirMatch = isDir && LAYER_DIR.exec(e.name);
    const relevant = e.name === 'index.md' || (!isDir && fileMatch) || dirMatch || (isDir && e.name === 'adr') || (e.type === 'escape' && (fileMatch || LAYER_DIR.test(e.name) || e.name === 'adr'));
    if (!relevant) continue;
    if (e.type === 'escape') { add('error', 'E8', e.name, null, 'path is a symlink that leaves the docs folder; it was not read', 'replace the symlink with a real file or folder inside the docs folder'); continue; }
    if (e.name === 'index.md') { rootIndexType = e.type; continue; }
    if (!isDir && fileMatch) layer(e.name.slice(0, -3), Number(fileMatch[1])).file = e.name;
    else if (dirMatch) layer(e.name, Number(dirMatch[1])).dir = e.name;
    else if (isDir && e.name === 'adr') layer('adr', Infinity).dir = 'adr';
  }
  const ordered = [...layers.values()].sort((a, b) => (a.num - b.num) || (a.id < b.id ? -1 : 1));

  let current = null; // the layer being read: any file that cannot be read makes the layer incomplete
  const unreadable = (rel, res) => {
    if (current) current.incomplete = true;
    if (res.status === 'toolarge') add('warning', 'W7', rel, null, `file is larger than 5 MB (${res.size} bytes); it was skipped`, 'split the file or leave it out of the pyramid');
    else if (res.status === 'unreadable') add('error', 'E9', rel, null, `file cannot be read (${res.error})`, 'fix the permissions of the file');
    else if (res.status === 'escape') add('error', 'E8', rel, null, 'path is a symlink that leaves the docs folder; it was not read', 'replace the symlink with a real file inside the docs folder');
  };

  // 2. read every layer
  for (const L of ordered) {
    current = L;
    const fileModules = [];
    if (L.file) {
      const res = io.load(L.file);
      if (res.status !== 'ok') unreadable(L.file, res);
      else {
        const doc = res.doc;
        L.sections = sectionsOf(doc);
        const seen = new Map();
        for (const s of L.sections) {
          const where = `\`${L.file}${s.anchor ? `#${s.anchor}` : ''}\` (line ${s.line})`;
          fileModules.push({ title: s.title || humanise(L.file), where, byline: s.byline, kind: 'section', file: L.file, line: s.line });
          if (s.lineCount > opts.maxSectionLines) {
            add('warning', 'W1', L.file, s.line, `section "${s.title}" has ${s.lineCount} lines (limit ${opts.maxSectionLines})`, `--split ${quote(`${L.file}#${s.anchor}`)}`);
          }
          if (seen.has(s.slugBase)) add('error', 'E2', L.file, s.line, `section title "${s.title}" appears twice in ${L.file} (first at line ${seen.get(s.slugBase)})`, 'rename or merge the sections: a module lives in exactly one place');
          else seen.set(s.slugBase, s.line);
          bylineFindings(add, opts, L.file, s.line, s.title, s.byline);
        }
        if (!L.sections.length && !(L.dir && L.id)) add('warning', 'W6', L.file, 1, 'layer file has no "##" sections', 'add a "##" section per module');
      }
    }
    if (L.dir) {
      let list = [];
      try { list = io.entries(L.dir).filter((e) => !skippedName(e.name)).sort(byName); } catch (e) {
        L.incomplete = true;
        add('error', 'E9', L.dir, null, `folder cannot be read (${e.code || e.message})`, 'fix the permissions of the folder');
      }
      const folderModules = [];
      for (const e of list) {
        const rel = `${L.dir}/${e.name}`;
        if (e.type === 'escape') { unreadable(rel, { status: 'escape' }); continue; }
        if (e.type === 'dir') {
          add('warning', 'W4', rel, null, `nested folder inside ${L.dir} is not scanned`, 'move its modules up into the layer folder, or into the layer file');
          continue;
        }
        if (e.type !== 'file' || !e.name.endsWith('.md')) continue;
        if (!L.isAdr && e.name === 'index.md') {
          add('error', 'E1', rel, 1, 'index.md inside a layer folder: all routing lives in the root index.md', L.file
            ? `merge the content into ${L.file} by hand (the automatic migration refuses when the layer file exists), keep only modules that are long as files, then delete ${rel}`
            : '--fix-layout, or move the content into the layer file and break out only what is long');
          continue;
        }
        if (L.isAdr && (e.name === 'index.md' || e.name === 'README.md')) continue;
        if (!L.isAdr && !L.file && e.name === 'README.md') {
          add('warning', 'W5', rel, 1, 'layer folder without a layer file and with a README.md as entry point (legacy layout)', `create ${L.id}.md and move the README.md content into it`);
          continue;
        }
        const res = io.load(rel);
        if (res.status !== 'ok') { unreadable(rel, res); continue; }
        const m = moduleOfFile(res.doc, e.name);
        const stemSlug = slugBase(e.name.slice(0, -3));
        folderModules.push({ title: m.title, where: `\`${rel}\``, byline: m.byline, kind: 'file', file: rel, line: m.line, slugBase: m.slugBase, stemSlug, name: e.name });
        bylineFindings(add, opts, rel, m.line, m.title, m.byline);
      }
      L.brokenOut = folderModules;
      for (const s of L.sections) {
        const twin = folderModules.find((f) => f.slugBase === s.slugBase || f.stemSlug === s.slugBase);
        if (twin) add('error', 'E2', L.file, s.line, `module "${s.title}" is a section of ${L.file} and also a file (${twin.file})`, `the file is the module: delete the section "${s.title}" (lines ${s.line}-${s.endIdx}) from ${L.file} if it only summarises ${twin.file}, otherwise merge its text into ${twin.file} first`);
      }
      L.modules = [...fileModules, ...folderModules];
    } else L.modules = fileModules;
    if (L.incomplete) add('error', 'E10', L.file || L.dir, null, `${L.id} could not be read completely; its block in index.md is left unchanged`, 'fix the file named above, then run again');
    const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const count = L.isAdr ? plural(L.brokenOut.length, 'decision', 'decisions') : `${plural(L.sections.length, 'section', 'sections')}, ${L.brokenOut.length} broken out`;
    add('info', 'I1', L.file || L.dir, null, `${L.id}: ${count}`, null);
  }
  current = null;

  // 3. the root index
  const index = analyzeIndex(io, ordered, add, rootIndexType);

  const report = {
    stale: index.stale,
    changes: index.changes,
    findings,
    layers: ordered.map((L) => ({ id: L.id, file: L.file, dir: L.dir, sections: L.sections.length, brokenOut: L.brokenOut.length })),
  };
  return { layers: ordered, findings, index, report, options: opts };
}

function bylineFindings(add, opts, file, line, title, byline) {
  if (byline === '') { add('warning', 'W2', file, line, `"${title}" has no byline`, 'add a one-sentence description as the first paragraph under the heading'); return; }
  const len = charLength(byline);
  if (len > opts.maxByline * 2) add('error', 'E5', file, line, `byline of "${title}" has ${len} characters (limit ${opts.maxByline}, error over ${opts.maxByline * 2})`, 'shorten the first sentence');
  else if (len > opts.maxByline) add('warning', 'W3', file, line, `byline of "${title}" has ${len} characters (limit ${opts.maxByline})`, 'shorten the first sentence');
}

const anchorSets = new WeakMap();
function anchorSet(doc) {
  if (!anchorSets.has(doc)) anchorSets.set(doc, new Set(doc.analysis.headings.map((h) => h.anchor)));
  return anchorSets.get(doc);
}

function analyzeIndex(io, layers, add, rootIndexType) {
  const result = { exists: false, canWrite: false, blocked: false, stale: false, changes: [], oldRaw: '', newRaw: '', missing: [] };
  const st = io.stat('index.md');
  if (!st) {
    add('error', 'E4', 'index.md', null, 'root index.md is missing', 'create index.md with a pair of marker lines per layer (see tools/refresh-pyramid.md), then run again');
    result.blocked = true;
    return result;
  }
  const res = io.load('index.md');
  if (res.status !== 'ok') {
    if (res.status === 'escape' || st.type === 'escape') add('error', 'E8', 'index.md', null, 'index.md is a symlink that leaves the docs folder; it was not read', 'replace the symlink with a real file');
    else if (res.status === 'toolarge') add('warning', 'W7', 'index.md', null, `index.md is larger than 5 MB (${res.size} bytes); it was skipped`, null);
    else if (res.status === 'unreadable') add('error', 'E9', 'index.md', null, `index.md cannot be read (${res.error})`, 'fix the permissions of the file');
    else add('error', 'E4', 'index.md', null, 'root index.md is not a file', 'create index.md');
    result.blocked = true;
    return result;
  }
  const doc = res.doc;
  result.exists = true;
  if (res.link) { add('error', 'E8', 'index.md', null, 'index.md is a symlink; it is not rewritten', 'replace the symlink with a real file'); result.blocked = true; }
  if (!doc.validUtf8) { add('error', 'E9', 'index.md', null, 'index.md is not valid UTF-8; it is not rewritten', 'convert the file to UTF-8'); result.blocked = true; }
  const lines = doc.lines;
  const { mark } = doc.analysis;
  result.oldRaw = (doc.bom ? '﻿' : '') + doc.raw;

  // markers
  const blocks = new Map();
  const beginSeen = new Set();
  let open = null;
  let markerError = false;
  const e3 = (line, message, fix) => { markerError = true; add('error', 'E3', 'index.md', line, message, fix ?? 'keep exactly one begin line and one end line per layer, never nested; nothing is written until this is fixed'); };
  if (doc.analysis.openFence) e3(doc.analysis.openFence, 'the code fence opened here is never closed, so markers and new blocks after it would not work', 'close the fence; nothing is written until this is fixed');
  for (let i = 0; i < lines.length; i++) {
    if (mark[i]) continue;
    const m = MARKER.exec(lines[i].t);
    if (!m) continue;
    const [, kind, id] = m;
    if (kind === 'begin') {
      if (open) { e3(i + 1, `begin marker for ${id} inside the block of ${open.id} (opened at line ${open.idx + 1})`); continue; }
      if (beginSeen.has(id)) { e3(i + 1, `duplicate begin marker for ${id}`); continue; }
      beginSeen.add(id);
      open = { id, idx: i };
    } else if (!open) e3(i + 1, `end marker for ${id} without a begin marker`);
    else if (open.id !== id) { e3(i + 1, `end marker for ${id} does not match the open block ${open.id} (line ${open.idx + 1})`); open = null; } else { blocks.set(id, { begin: open.idx, end: i }); open = null; }
  }
  if (open) e3(open.idx + 1, `begin marker for ${open.id} is never closed`);
  if (markerError) result.blocked = true;

  const layerIds = new Set(layers.map((L) => L.id));
  const incompleteIds = new Set(layers.filter((L) => L.incomplete).map((L) => L.id));
  for (const [id, b] of blocks) if (!layerIds.has(id)) add('warning', 'W8', 'index.md', b.begin + 1, `block for ${id} has no layer in the docs folder; it is left alone`, 'remove the block or restore the layer');

  // hand-written pointers (E6)
  let baseNames = null;
  const byBaseName = (name) => {
    if (!baseNames) {
      baseNames = new Map();
      for (const f of listMarkdown(io)) {
        const key = posix.basename(f);
        if (!baseNames.has(key)) baseNames.set(key, []);
        baseNames.get(key).push(f);
      }
    }
    return baseNames.get(name) || [];
  };
  const inBlock = new Uint8Array(lines.length);
  for (const b of blocks.values()) for (let i = b.begin; i <= b.end; i++) inBlock[i] = 1;
  for (let i = 0; i < lines.length; i++) {
    if (mark[i] || inBlock[i] || !lines[i].t.includes('`')) continue;
    const t = lines[i].t;
    for (const sp of inlineCodeSpans(t)) {
      const m = PATH_REF.exec(t.slice(sp.cs, sp.ce).trim());
      if (!m) continue;
      let rel = posix.normalize(m[1]);
      const own = `${basename(io.root)}/`;
      if (rel.startsWith(own) && io.load(rel).status === 'missing') rel = rel.slice(own.length); // written from the repository root
      if (rel.startsWith('..') || rel.startsWith('/')) continue;
      // a bare name (no folder) may sit in any layer folder: accept it when it exists anywhere in the pyramid
      let candidates = [rel];
      if (!m[1].includes('/') && io.load(rel).status === 'missing') candidates = byBaseName(rel);
      const found = candidates.filter((c) => io.load(c).status !== 'missing');
      if (!found.length) {
        if (!m[1].includes('/') && !m[2]) add('warning', 'W9', 'index.md', i + 1, `name \`${m[1]}\` was not found anywhere in the docs folder`, 'ignore it if it names a file outside the docs folder, otherwise correct the name');
        else add('error', 'E6', 'index.md', i + 1, `pointer \`${m[1]}${m[2] ? `#${m[2]}` : ''}\` does not exist`, 'correct the path or remove the pointer');
        continue;
      }
      if (!m[2]) continue;
      const docs = found.map((c) => io.load(c)).filter((r) => r.status === 'ok');
      if (!docs.length) continue;
      let frag = m[2];
      try { frag = decodeURIComponent(frag); } catch { /* keep as written */ }
      if (!docs.some((r) => anchorSet(r.doc).has(frag))) add('error', 'E6', 'index.md', i + 1, `pointer \`${m[1]}#${m[2]}\` does not exist: no such heading in ${found[0]}`, 'correct the anchor or remove the pointer');
    }
  }

  // planned rewrite
  const eol = doc.eol;
  const out = [];
  let cursor = 0;
  const existing = [...blocks].filter(([id]) => layerIds.has(id) && !incompleteIds.has(id)).sort((a, b) => a[1].begin - b[1].begin);
  const byId = new Map(layers.map((L) => [L.id, L]));
  for (const [id, b] of existing) {
    const interior = lines.slice(b.begin + 1, b.end).map((l) => l.t);
    const fresh = ['', ...renderBlockLines(byId.get(id).modules), ''];
    for (let i = cursor; i <= b.begin; i++) out.push(lines[i]);
    const lineEol = lines[b.begin].e || eol;
    if (interior.length === fresh.length && interior.every((t, i) => t === fresh[i])) {
      for (let i = b.begin + 1; i < b.end; i++) out.push(lines[i]);
    } else {
      for (const t of fresh) out.push({ t, e: lineEol });
      result.changes.push({ file: 'index.md', layer: id, action: 'update' });
    }
    cursor = b.end;
  }
  for (let i = cursor; i < lines.length; i++) out.push(lines[i]);

  result.missing = layers.filter((L) => !blocks.has(L.id) && !L.incomplete);
  for (const L of result.missing) {
    add('error', 'E7', 'index.md', null, `layer ${L.id} has no marker block in index.md`, `add the lines "<!-- pyramid:begin ${L.id} -->" and "<!-- pyramid:end ${L.id} -->" to index.md, or run without --check to append the block`);
  }
  if (result.missing.length) {
    const rows = [];
    for (let i = 0; i < lines.length; i++) if (!mark[i] && !inBlock[i] && /^ {0,3}\|/.test(lines[i].t)) rows.push(i + 1);
    if (rows.length) add('info', 'I2', 'index.md', rows[0], `hand-written table rows at lines ${rows[0]}-${rows[rows.length - 1]} may duplicate the routing table that is appended; review them and remove what is now generated`, null);
  }
  if (result.missing.length) appendMissing(out, result.missing, eol, result.changes);

  result.newRaw = (doc.bom ? '﻿' : '') + joinLines(out);
  result.stale = result.newRaw !== result.oldRaw;
  if (result.stale && Buffer.byteLength(result.newRaw) > MAX_FILE_BYTES) {
    add('error', 'E11', 'index.md', null, 'the rewritten index.md would be larger than 5 MB, which this tool cannot read back; it is not written', 'split the pyramid into fewer or shorter modules');
    result.blocked = true;
  }
  if (result.changes.some((c) => c.action === 'update') && !markerError) {
    const n = result.changes.filter((c) => c.action === 'update').length;
    add('error', 'S1', 'index.md', null, `index.md is stale: ${n} generated block${n === 1 ? '' : 's'} differ${n === 1 ? 's' : ''} from the documents`, 'run refresh-pyramid without --check');
  }
  result.canWrite = !result.blocked;
  return result;
}

/** Append marker blocks for layers that have none, under the "Routing table" heading (created when absent). */
function appendMissing(out, missing, eol, changes) {
  const nl = (t) => ({ t, e: eol });
  const blockLines = [];
  for (const L of missing) {
    blockLines.push(nl(''), nl(`### ${L.id}`), nl(''), nl(`<!-- pyramid:begin ${L.id} -->`), nl(''));
    for (const t of renderBlockLines(L.modules)) blockLines.push(nl(t));
    blockLines.push(nl(''), nl(`<!-- pyramid:end ${L.id} -->`));
    changes.push({ file: 'index.md', layer: L.id, action: 'add' });
  }
  const scan = analyzeLines(out);
  const k = scan.headings.findIndex((h) => h.level === 2 && h.title.toLowerCase() === ROUTING_HEADING.toLowerCase());
  let at = out.length;
  let insert = blockLines;
  if (k >= 0) {
    const after = scan.headings.slice(k + 1).find((h) => h.level <= 2);
    if (after) { at = after.idx; insert = [...blockLines, nl('')]; }
  } else {
    insert = [nl(''), nl(`## ${ROUTING_HEADING}`), ...blockLines];
    changes.push({ file: 'index.md', layer: null, action: 'add-heading' });
  }
  if (at > 0 && out[at - 1].e === '') out[at - 1] = { t: out[at - 1].t, e: eol };
  if (at === out.length && out.length === 0) insert = insert.slice(1);
  out.splice(at, 0, ...insert);
  if (at === out.length - insert.length && out[out.length - 1].e === '') out[out.length - 1].e = eol;
}

// ---------------------------------------------------------------------------------------------------------------
// Diff

/** Unified-style diff of two line lists. Linear for large inputs by falling back to "replace the middle". */
export function unifiedDiff(oldLines, newLines, label, { oldLabel = `a/${label}`, newLabel = `b/${label}`, context = 2 } = {}) {
  let a = 0;
  while (a < oldLines.length && a < newLines.length && oldLines[a] === newLines[a]) a++;
  let b = 0;
  while (b < oldLines.length - a && b < newLines.length - a && oldLines[oldLines.length - 1 - b] === newLines[newLines.length - 1 - b]) b++;
  const mid1 = oldLines.slice(a, oldLines.length - b);
  const mid2 = newLines.slice(a, newLines.length - b);
  if (!mid1.length && !mid2.length) return '';
  const ops = [];
  for (let i = 0; i < a; i++) ops.push([' ', oldLines[i]]);
  if (mid1.length * mid2.length <= 4_000_000) {
    const n = mid1.length;
    const m = mid2.length;
    const w = m + 1;
    const dp = new Uint32Array((n + 1) * w);
    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) dp[i * w + j] = mid1[i] === mid2[j] ? dp[(i + 1) * w + j + 1] + 1 : Math.max(dp[(i + 1) * w + j], dp[i * w + j + 1]);
    }
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
      if (mid1[i] === mid2[j]) { ops.push([' ', mid1[i]]); i++; j++; } else if (dp[(i + 1) * w + j] >= dp[i * w + j + 1]) ops.push(['-', mid1[i++]]);
      else ops.push(['+', mid2[j++]]);
    }
    while (i < n) ops.push(['-', mid1[i++]]);
    while (j < m) ops.push(['+', mid2[j++]]);
  } else {
    for (const l of mid1) ops.push(['-', l]);
    for (const l of mid2) ops.push(['+', l]);
  }
  for (let i = oldLines.length - b; i < oldLines.length; i++) ops.push([' ', oldLines[i]]);
  const out = [`--- ${oldLabel}`, `+++ ${newLabel}`];
  const changed = ops.map(([t]) => t !== ' ');
  let i = 0;
  let oldNo = 1;
  let newNo = 1;
  const pos = ops.map(([t]) => { const p = [oldNo, newNo]; if (t !== '+') oldNo++; if (t !== '-') newNo++; return p; });
  while (i < ops.length) {
    if (!changed[i]) { i++; continue; }
    let start = Math.max(0, i - context);
    let end = i;
    let j = i;
    while (j < ops.length) {
      if (changed[j]) { end = j; j++; } else if (j - end > context * 2) break; else j++;
    }
    end = Math.min(ops.length - 1, end + context);
    const slice = ops.slice(start, end + 1);
    const oc = slice.filter(([t]) => t !== '+').length;
    const nc = slice.filter(([t]) => t !== '-').length;
    out.push(`@@ -${oc === 0 ? pos[start][0] - 1 : pos[start][0]},${oc} +${nc === 0 ? pos[start][1] - 1 : pos[start][1]},${nc} @@`);
    for (const [t, l] of slice) out.push(t + l);
    i = end + 1;
    start = 0;
  }
  return out.join('\n');
}

// ---------------------------------------------------------------------------------------------------------------
// Links and pointers in documents (used by --split and --fix-layout)

const DEF_LINE = /^ {0,3}\[[^\]]{1,200}\]:[ \t]*(<[^>]*>|\S+)/;
const SCHEME = /^[a-zA-Z][a-zA-Z0-9+.-]*:/;

/** Path references in one document: markdown links, reference definitions and backticked .md paths. */
export function findPathRefs(doc) {
  const refs = [];
  const { lines, analysis } = doc;
  for (let i = 0; i < lines.length; i++) {
    if (analysis.mark[i]) continue;
    const t = lines[i].t;
    const spans = t.includes('`') ? inlineCodeSpans(t) : [];
    for (const sp of spans) {
      const content = t.slice(sp.cs, sp.ce);
      const trimmed = content.trim();
      if (!PATH_REF.test(trimmed)) continue;
      const start = sp.cs + content.indexOf(trimmed);
      refs.push({ idx: i, start, end: start + trimmed.length, target: trimmed, kind: 'code' });
    }
    let spanPtr = 0;
    const inSpan = (p) => { // positions arrive in increasing order, so one forward pointer is enough
      while (spanPtr < spans.length && spans[spanPtr].close <= p) spanPtr++;
      return spanPtr < spans.length && p >= spans[spanPtr].open;
    };
    const def = DEF_LINE.exec(t);
    if (def) {
      let target = def[1];
      let start = t.indexOf(target, def[0].length - target.length);
      if (target.startsWith('<') && target.endsWith('>')) { target = target.slice(1, -1); start++; }
      refs.push({ idx: i, start, end: start + target.length, target, kind: 'def' });
    }
    let p = t.indexOf('](');
    while (p >= 0) {
      if (!inSpan(p)) {
        let s = p + 2;
        while (s < t.length && (t[s] === ' ' || t[s] === '\t')) s++;
        let e = s;
        if (t[s] === '<') {
          const close = t.indexOf('>', s + 1);
          if (close > 0 && close - s < 2000) { refs.push({ idx: i, start: s + 1, end: close, target: t.slice(s + 1, close), kind: 'link' }); p = t.indexOf('](', close); continue; }
        } else {
          let depth = 0;
          while (e < t.length && e - s < 2000) {
            const c = t[e];
            if (c === ' ' || c === '\t') break;
            if (c === '(') depth++;
            else if (c === ')') { if (depth === 0) break; depth--; }
            e++;
          }
          if (e > s && e < t.length && e - s < 2000) refs.push({ idx: i, start: s, end: e, target: t.slice(s, e), kind: 'link' });
        }
      }
      p = t.indexOf('](', p + 2);
    }
    for (let a = t.indexOf('<'); a >= 0; a = t.indexOf('<', a + 1)) { // <path/to/file.md> autolinks
      if (inSpanFree(spans, a)) continue;
      const close = t.indexOf('>', a + 1);
      if (close < 0) break;
      const target = t.slice(a + 1, close);
      if (target.length > 500 || /[\s<]/.test(target) || SCHEME.test(target) || !/\.md(?:#[^\s<>]*)?$/i.test(target)) continue;
      refs.push({ idx: i, start: a + 1, end: close, target, kind: 'autolink' });
    }
  }
  return refs;
}

const inSpanFree = (spans, p) => spans.some((sp) => p >= sp.open && p < sp.close);

/** Split a link target into path and suffix ('#frag' or '?query'); returns null for anything that is not a local path. */
export function splitTarget(target) {
  if (!target || SCHEME.test(target) || target.startsWith('//') || target.startsWith('/') || target.includes('{{')) return null;
  const cut = target.search(/[#?]/);
  const path = cut < 0 ? target : target.slice(0, cut);
  if (!path) return null;
  let decoded = path;
  if (path.includes('%')) { try { decoded = decodeURIComponent(path); } catch { return { invalid: true }; } }
  return { path, decoded, suffix: cut < 0 ? '' : target.slice(cut), encoded: path.includes('%') };
}

/** All markdown files below the docs folder (not hidden, no symlinks). Relative paths with '/' separators. */
export function listMarkdown(io, rel = '', out = []) {
  let list;
  try { list = io.entries(rel); } catch { return out; }
  for (const e of list.sort(byName)) {
    if (skippedName(e.name) || e.link) continue;
    const childRel = rel ? `${rel}/${e.name}` : e.name;
    if (e.type === 'dir') listMarkdown(io, childRel, out);
    else if (e.type === 'file' && e.name.endsWith('.md')) out.push(childRel);
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// git

function git(args, cwd) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, GIT_OPTIONAL_LOCKS: '0' } });
}

function gitTop(root) {
  try { return git(['rev-parse', '--show-toplevel'], root).trim() || null; } catch { return null; }
}

/** Refuse unless the docs folder is in a git work tree and the touched files have no uncommitted changes. */
function guardGit(root, touchedRel, force, what) {
  const top = gitTop(root);
  if (!top) {
    if (force) return { inGit: false };
    throw new UsageError(`${what} refused: ${root} is not inside a git work tree, so a mistake could not be undone (use --force to override)`);
  }
  if (!force) {
    let dirty = '';
    try {
      dirty = git(['status', '--porcelain', '--untracked-files=all', '--', ...touchedRel.map((r) => join(root, ...r.split('/')))], root);
    } catch (e) { throw new UsageError(`${what} refused: git status failed (${(e.stderr || e.message).toString().trim()})`); }
    if (dirty.trim()) {
      const files = dirty.split('\n').filter(Boolean).map((l) => l.slice(3)).join(', ');
      throw new UsageError(`${what} refused: uncommitted changes in files it would touch: ${files} (commit or stash them, or use --force)`);
    }
  }
  return { inGit: true };
}

// ---------------------------------------------------------------------------------------------------------------
// --split

function removeOneHash(line) {
  return line.t.replace(/^( {0,3})#/, '$1');
}

/** Plan moving one section into its own file. Pure: returns the new texts. */
export function planSplit(io, fileRel, slug) {
  if (!LAYER_FILE.test(fileRel) || fileRel.includes('/')) throw new UsageError(`--split needs a layer file at the top of the docs folder (like L3-modules.md#slug), got ${fileRel}`);
  const res = io.load(fileRel);
  if (res.status === 'missing') throw new UsageError(`--split: ${fileRel} does not exist`);
  if (res.status !== 'ok') throw new UsageError(`--split: ${fileRel} cannot be used (${res.status})`);
  if (res.link) throw new UsageError(`--split: ${fileRel} is a symlink`);
  const doc = res.doc;
  if (!doc.validUtf8) throw new UsageError(`--split: ${fileRel} is not valid UTF-8`);
  const sections = sectionsOf(doc);
  const sec = sections.find((s) => s.anchor === slug);
  if (!sec) {
    const known = sections.slice(0, 12).map((s) => s.anchor).join(', ');
    throw new UsageError(`--split: no section with the anchor "${slug}" in ${fileRel}${known ? ` (sections: ${known}${sections.length > 12 ? ', ...' : ''})` : ''}`);
  }
  if (!/^[\p{L}\p{M}\p{N}_-]{1,200}$/u.test(slug)) throw new UsageError(`--split: the anchor "${slug}" cannot be used as a file name`);
  const layerId = fileRel.slice(0, -3);
  const targetRel = `${layerId}/${slug}.md`;
  const folder = io.stat(layerId);
  if (folder && folder.type !== 'dir') throw new UsageError(`--split refused: ${layerId} exists and is not a folder`);
  if (io.stat(targetRel)) throw new UsageError(`--split refused: ${targetRel} already exists`);
  const eol = doc.lines[sec.idx].e || doc.eol;
  const { mark } = doc.analysis;
  const moved = [];
  for (let i = sec.idx; i < sec.endIdx; i++) {
    const l = doc.lines[i];
    const h = !mark[i] ? parseHeading(l.t) : null;
    moved.push(h && (i === sec.idx || h.level > 2) ? { t: removeOneHash(l), e: l.e } : l);
  }
  while (moved.length && moved[moved.length - 1].t.trim() === '') moved.pop();
  const movedLines = moved.map((l, i) => ({ t: l.t, e: l.e || (i === moved.length - 1 ? eol : l.e) }));
  movedLines[movedLines.length - 1].e = eol;
  let before = doc.lines.slice(0, sec.idx);
  let after = doc.lines.slice(sec.endIdx);
  while (before.length && before[before.length - 1].t.trim() === '') before.pop();
  let a = 0;
  while (a < after.length && after[a].t.trim() === '') a++;
  after = after.slice(a);
  const rest = before.length && after.length ? [...before, { t: '', e: eol }, ...after] : [...before, ...after];
  if (rest.length && rest[rest.length - 1].e === '') rest[rest.length - 1] = { t: rest[rest.length - 1].t, e: eol };
  return {
    fileRel, targetRel, section: sec, layerId,
    newLayerText: (doc.bom ? '﻿' : '') + joinLines(rest),
    oldLayerText: (doc.bom ? '﻿' : '') + doc.raw,
    movedText: joinLines(movedLines),
  };
}

/** Links and pointers (outside code fences) that still use the old anchor `file#slug`. */
export function findAnchorReferences(io, fileRel, slug) {
  const found = [];
  const seen = new Set();
  for (const rel of listMarkdown(io)) {
    const res = io.load(rel);
    if (res.status !== 'ok') continue;
    const dir = posix.dirname(rel);
    for (const ref of findPathRefs(res.doc)) {
      const hash = ref.target.indexOf('#');
      if (hash < 0) continue;
      let frag = ref.target.slice(hash + 1);
      try { frag = decodeURIComponent(frag); } catch { /* as written */ }
      if (frag !== slug) continue;
      const pathPart = ref.target.slice(0, hash);
      const resolved = pathPart === '' ? rel : posix.normalize(posix.join(dir, pathPart));
      const key = `${rel}\u0000${ref.idx}\u0000${ref.start}`;
      if (resolved === fileRel && !seen.has(key)) { seen.add(key); found.push({ file: rel, line: ref.idx + 1, target: ref.target }); }
    }
  }
  return found;
}

// ---------------------------------------------------------------------------------------------------------------
// --fix-layout

/** Plan the migration of legacy layer folders (a folder with index.md and no layer file). Pure. */
export function planFixLayout(io) {
  const model = buildModel(io);
  const legacy = [];
  const conflicts = [];
  for (const L of model.layers) {
    if (L.isAdr || !L.dir) continue;
    const idx = io.stat(`${L.dir}/index.md`);
    if (!idx || idx.type !== 'file') continue;
    if (L.file) conflicts.push(L);
    else legacy.push({ layer: L.id, oldRel: `${L.dir}/index.md`, newRel: `${L.id}.md`, dirRel: L.dir });
  }
  const plan = { moves: legacy, conflicts, writes: new Map(), rewrites: [], unresolved: [] };
  if (!legacy.length || conflicts.length) return plan;
  const moveMap = new Map(legacy.map((m) => [m.oldRel, m.newRel]));
  const folderMap = new Map(legacy.map((m) => [m.dirRel, m.newRel]));
  for (const rel of listMarkdown(io)) {
    const res = io.load(rel);
    if (res.status !== 'ok' || !res.doc.validUtf8) continue;
    const move = legacy.find((m) => m.oldRel === rel);
    const oldDir = posix.dirname(rel) === '.' ? '' : posix.dirname(rel);
    const newDir = move ? '' : oldDir;
    const doc = res.doc;
    const edits = new Map();
    for (const ref of findPathRefs(doc)) {
      const parts = splitTarget(ref.target);
      if (!parts) continue;
      if (parts.invalid) {
        if (move) plan.unresolved.push({ file: move.newRel, line: ref.idx + 1, target: ref.target, reason: 'target cannot be decoded' });
        continue;
      }
      const trailing = parts.decoded.endsWith('/');
      const resolved = posix.normalize(posix.join(oldDir || '.', parts.decoded)).replace(/\/$/, '');
      const mapped = moveMap.get(resolved) ?? folderMap.get(resolved) ?? null;
      if (!mapped && !move) continue;
      const outside = resolved === '..' || resolved.startsWith('../');
      if (!mapped && !outside) {
        const st = io.stat(resolved);
        if (!st || st.type === 'escape') {
          plan.unresolved.push({ file: move ? move.newRel : rel, line: ref.idx + 1, target: ref.target, reason: 'target not found' });
          continue;
        }
      }
      const to = mapped ?? resolved;
      let text = posix.relative(posix.join('/r', newDir), posix.join('/r', to)) || '.';
      if (!mapped && trailing && !text.endsWith('/')) text += '/';
      if (parts.encoded) text = encodeURI(text);
      const next = text + parts.suffix;
      if (next === ref.target) continue;
      if (!edits.has(ref.idx)) edits.set(ref.idx, []);
      edits.get(ref.idx).push({ start: ref.start, end: ref.end, text: next });
      plan.rewrites.push({ file: move ? move.newRel : rel, line: ref.idx + 1, from: ref.target, to: next, unverified: outside && !mapped });
    }
    if (!edits.size && !move) continue;
    const lines = doc.lines.map((l, i) => {
      const list = edits.get(i);
      if (!list) return l;
      let t = l.t;
      for (const e of list.sort((a, b) => b.start - a.start)) t = t.slice(0, e.start) + e.text + t.slice(e.end);
      return { t, e: l.e };
    });
    plan.writes.set(move ? move.newRel : rel, { from: rel, text: (doc.bom ? '﻿' : '') + joinLines(lines), old: (doc.bom ? '﻿' : '') + doc.raw });
  }
  return plan;
}

// ---------------------------------------------------------------------------------------------------------------
// Command line

const HELP = `refresh-pyramid: keep the routing table of a documentation pyramid in step with its documents.

Usage: node tools/refresh-pyramid.js [docs-folder] [options]     (default folder: ./docs)

Modes (default: write, rewrite the generated blocks in the root index.md)
  --dry-run              print what would change as a diff; write nothing
  --check                write nothing; exit 1 when the index is stale or errors exist

Options
  --json                 machine-readable report on stdout
  --strict               warnings count as failures for the exit code
  --max-section-lines N  a section longer than N lines is a warning (default 100)
  --max-byline N         a byline longer than N characters is a warning, over 2N an error (default 140)
  --split "<file>#<slug>"  move one section of a layer file into its own file in the layer folder
  --fix-layout           migrate a legacy layer folder (index.md, no layer file) to a layer file
  --force                allow --split and --fix-layout on a dirty git tree or outside git
  --help                 this text

Exit codes: 0 fine, 1 findings or a stale index (per mode), 2 usage or I/O error.
`;

export function parseArgs(argv) {
  const o = { docs: null, dryRun: false, check: false, json: false, strict: false, force: false, fixLayout: false, split: null, help: false, maxSectionLines: DEFAULTS.maxSectionLines, maxByline: DEFAULTS.maxByline };
  const flags = { '--dry-run': 'dryRun', '--check': 'check', '--json': 'json', '--strict': 'strict', '--force': 'force', '--fix-layout': 'fixLayout', '--help': 'help', '-h': 'help' };
  const values = { '--max-section-lines': 'maxSectionLines', '--max-byline': 'maxByline', '--split': 'split' };
  let rest = false;
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (rest || !arg.startsWith('-') || arg === '-') {
      if (o.docs !== null) throw new UsageError(`unexpected extra argument: ${arg}`);
      o.docs = arg;
      continue;
    }
    if (arg === '--') { rest = true; continue; }
    const eq = arg.indexOf('=');
    const name = eq > 0 ? arg.slice(0, eq) : arg;
    if (flags[name]) {
      if (eq > 0) throw new UsageError(`option ${name} takes no value`);
      o[flags[name]] = true;
    } else if (values[name]) {
      let v = eq > 0 ? arg.slice(eq + 1) : argv[++i];
      if (v === undefined) throw new UsageError(`option ${name} needs a value`);
      if (name !== '--split') {
        if (!/^\d+$/.test(v) || Number(v) < 1 || !Number.isSafeInteger(Number(v))) throw new UsageError(`option ${name} needs a positive whole number, got "${v}"`);
        v = Number(v);
      }
      o[values[name]] = v;
    } else throw new UsageError(`unknown option: ${arg} (see --help)`);
  }
  if (o.split !== null && o.fixLayout) throw new UsageError('--split and --fix-layout cannot be combined');
  if (o.check && o.dryRun) throw new UsageError('--check and --dry-run cannot be combined');
  if (o.check && (o.split !== null || o.fixLayout)) throw new UsageError('--check cannot be combined with --split or --fix-layout');
  return o;
}

const formatFinding = (f) => `${f.severity} ${f.code} ${f.file ?? '-'}${f.line ? `:${f.line}` : ''} ${f.message}${f.fix ? ` (fix: ${f.fix})` : ''}`;

const countBy = (findings, severity) => findings.filter((f) => f.severity === severity).length;

/** Run the command line. Returns the exit code; output goes to the given writers. */
export function run(argv, { out = (s) => process.stdout.write(s), err = (s) => process.stderr.write(s), cwd = process.cwd() } = {}) {
  try {
    const o = parseArgs(argv);
    if (o.help) { out(HELP); return 0; }
    const docsArg = resolve(cwd, o.docs ?? 'docs');
    let root;
    try { root = realpathSync(docsArg); } catch { throw new UsageError(`docs folder not found: ${o.docs ?? 'docs'}`); }
    if (!statSync(root).isDirectory()) throw new UsageError(`not a folder: ${o.docs ?? 'docs'}`);
    if (o.split !== null) return runSplit(root, o, out);
    if (o.fixLayout) return runFixLayout(root, o, out);
    return runModel(root, o, out);
  } catch (e) {
    if (e instanceof UsageError) { err(`refresh-pyramid: ${e.message}\n`); return 2; }
    if (e && (e.code === 'EACCES' || e.code === 'EPERM' || e.code === 'ENOENT' || e.code === 'EROFS' || e.code === 'ENOTDIR' || e.code === 'EEXIST')) {
      err(`refresh-pyramid: file system error (${e.code}${e.path ? ` ${basename(e.path)}` : ''}): ${e.message.split('\n')[0]}\n`);
      return 2;
    }
    err(`refresh-pyramid: unexpected error: ${e && e.message ? e.message : e}\n`);
    if (process.env.REFRESH_PYRAMID_DEBUG && e && e.stack) err(`${e.stack}\n`);
    return 2;
  }
}

function indexDiff(model) {
  const ix = model.index;
  return unifiedDiff(splitLines(ix.oldRaw).map((l) => l.t), splitLines(ix.newRaw).map((l) => l.t), 'index.md');
}

function exitCode(findings, strict) {
  if (countBy(findings, 'error')) return 1;
  if (strict && countBy(findings, 'warning')) return 1;
  return 0;
}

function runModel(root, o, out) {
  const io = makeIo(root);
  const model = buildModel(io, { maxSectionLines: o.maxSectionLines, maxByline: o.maxByline });
  const ix = model.index;
  const willWrite = !o.check && !o.dryRun && ix.canWrite && ix.newRaw !== ix.oldRaw;
  let written = false;
  if (willWrite) { writeAtomic(io.abs('index.md'), ix.newRaw); written = true; }
  // After a write (or in a dry run) the stale state and the missing blocks are resolved; the exit code reflects the rest.
  const resolves = !o.check && ix.canWrite;
  const remaining = resolves ? model.findings.filter((f) => f.code !== 'S1' && f.code !== 'E7') : model.findings;
  const code = exitCode(remaining, o.strict);
  if (o.json) {
    out(`${JSON.stringify({ ...model.report, findings: remaining.length === model.findings.length ? model.findings : remaining, mode: o.check ? 'check' : o.dryRun ? 'dry-run' : 'write', written, ...(o.dryRun ? { diff: indexDiff(model) } : {}) }, null, 2)}\n`);
    return code;
  }
  for (const f of remaining) out(`${formatFinding(f)}\n`);
  const errors = countBy(remaining, 'error');
  const warnings = countBy(remaining, 'warning');
  if (o.dryRun) {
    const diff = ix.canWrite ? indexDiff(model) : '';
    out(diff ? `${diff}\n` : 'dry-run: index.md would not change\n');
  } else if (written) out(`wrote index.md (${ix.changes.length} block${ix.changes.length === 1 ? '' : 's'} changed)\n`);
  else if (o.check) out(ix.exists ? (ix.stale ? 'check: index.md is stale\n' : 'check: index.md is up to date\n') : 'check: index.md is missing\n');
  else if (ix.canWrite) out('index.md is up to date, nothing written\n');
  else out('index.md was not written\n');
  out(`${errors} error${errors === 1 ? '' : 's'}, ${warnings} warning${warnings === 1 ? '' : 's'}\n`);
  return code;
}

function fileDiffs(entries) {
  return entries.map(({ label, oldText, newText }) => {
    const oldLines = oldText === null ? [] : splitLines(oldText).map((l) => l.t);
    const newLines = splitLines(newText).map((l) => l.t);
    return unifiedDiff(oldLines, newLines, label, oldText === null ? { oldLabel: '/dev/null', newLabel: `b/${label}` } : {});
  }).filter(Boolean).join('\n');
}

const REF_LABEL = /\]\[([^\][]{1,200})\]|\[([^\][]{1,200})\]\[\]/g;
const normLabel = (l) => l.trim().replace(/\s+/g, ' ').toLowerCase();

/** Reference-style link labels: which are defined, and where each is used, in the lines outside code. */
function referenceLabels(doc) {
  const defs = new Set();
  const uses = [];
  doc.lines.forEach((l, i) => {
    if (doc.analysis.mark[i]) return;
    const d = /^ {0,3}\[([^\][]{1,200})\]:/.exec(l.t);
    if (d) { defs.add(normLabel(d[1])); return; }
    if (!l.t.includes('][') && !l.t.includes('[]')) return;
    REF_LABEL.lastIndex = 0;
    for (let m = REF_LABEL.exec(l.t); m; m = REF_LABEL.exec(l.t)) uses.push({ label: normLabel(m[1] ?? m[2]), line: i + 1 });
  });
  return { defs, uses };
}

/** Reference definitions that a split put on the other side of the links that use them. */
export function findSplitDefinitionGaps(plan) {
  const kept = referenceLabels(parseDocument(Buffer.from(plan.newLayerText)));
  const moved = referenceLabels(parseDocument(Buffer.from(plan.movedText)));
  const gaps = [];
  const seen = new Set();
  for (const u of kept.uses) if (!kept.defs.has(u.label) && moved.defs.has(u.label) && !seen.has(`k${u.label}`)) { seen.add(`k${u.label}`); gaps.push({ label: u.label, use: `${plan.fileRel}:${u.line}`, now: plan.targetRel }); }
  for (const u of moved.uses) if (!moved.defs.has(u.label) && kept.defs.has(u.label) && !seen.has(`m${u.label}`)) { seen.add(`m${u.label}`); gaps.push({ label: u.label, use: `${plan.targetRel}:${u.line}`, now: plan.fileRel }); }
  return gaps;
}

/** A compact stand-in for the diff of a new file: the line count and the first and last lines. */
function newFileSummary(label, text) {
  const lines = splitLines(text).map((l) => l.t);
  const shown = lines.length <= 12 ? lines.map((l) => `+${l}`) : [...lines.slice(0, 5).map((l) => `+${l}`), `... ${lines.length - 10} more lines ...`, ...lines.slice(-5).map((l) => `+${l}`)];
  return [`new file ${label}: ${lines.length} lines`, ...shown].join('\n');
}

function runSplit(root, o, out) {
  const hash = o.split.lastIndexOf('#');
  if (hash <= 0 || hash === o.split.length - 1) throw new UsageError('--split needs the form "<file>#<section-slug>", for example "L3-modules.md#sync-system"');
  const fileRel = posix.normalize(o.split.slice(0, hash).replace(/\\/g, '/'));
  const slug = o.split.slice(hash + 1);
  const io = makeIo(root);
  const plan = planSplit(io, fileRel, slug);
  const overlay = new Map([[plan.fileRel, plan.newLayerText], [plan.targetRel, plan.movedText]]);
  const model = buildModel(makeIo(root, overlay), { maxSectionLines: o.maxSectionLines, maxByline: o.maxByline });
  const ix = model.index;
  let indexNote = 'index.md refreshed';
  if (ix.canWrite) overlay.set('index.md', ix.newRaw);
  else indexNote = 'index.md could not be refreshed (see the findings of a normal run)';
  const refs = findAnchorReferences(makeIo(root, overlay), plan.fileRel, slug);
  const touched = [plan.fileRel, ...(ix.canWrite && ix.newRaw !== ix.oldRaw ? ['index.md'] : [])];
  const gaps = findSplitDefinitionGaps(plan);
  const diffs = fileDiffs([
    ...(ix.canWrite ? [{ label: 'index.md', oldText: ix.oldRaw, newText: ix.newRaw }] : []),
  ]);
  if (!o.dryRun) {
    guardGit(root, touched, o.force, '--split');
    mkdirSync(io.abs(plan.layerId), { recursive: true });
    writeFileSync(io.abs(plan.targetRel), plan.movedText, { flag: 'wx' });
    writeAtomic(io.abs(plan.fileRel), plan.newLayerText);
    if (touched.includes('index.md')) writeAtomic(io.abs('index.md'), ix.newRaw);
  }
  if (o.json) {
    out(`${JSON.stringify({ operation: 'split', dryRun: o.dryRun, moved: { section: plan.section.title, lines: plan.movedText.split('\n').length - 1, from: plan.fileRel, to: plan.targetRel }, writes: [plan.targetRel, ...touched], references: refs, definitions: gaps, indexRefreshed: ix.canWrite }, null, 2)}\n`);
    return 0;
  }
  if (o.dryRun) {
    out(`remove lines ${plan.section.line}-${plan.section.endIdx} (the section) from ${plan.fileRel}\n`);
    out(`${newFileSummary(plan.targetRel, plan.movedText)}\n`);
    if (diffs) out(`${diffs}\n`);
  }
  out(`${o.dryRun ? 'dry-run: would move' : 'moved'} section "${plan.section.title}" from ${plan.fileRel} to ${plan.targetRel}; ${indexNote}\n`);
  for (const r of refs) out(`reference ${r.file}:${r.line} still points to the old anchor ${r.target}\n`);
  for (const g of gaps) out(`definition [${g.label}] used at ${g.use} now lives in ${g.now}\n`);
  if (gaps.length) out(`${gaps.length} reference definition${gaps.length === 1 ? '' : 's'} on the other side of their links, to fix by hand\n`);
  if (refs.length) out(`${refs.length} reference${refs.length === 1 ? '' : 's'} to the old anchor ${plan.fileRel}#${slug} to fix by hand\n`);
  return 0;
}

function runFixLayout(root, o, out) {
  const io = makeIo(root);
  const plan = planFixLayout(io);
  if (plan.conflicts.length) {
    throw new UsageError(`--fix-layout refused: ${plan.conflicts.map((L) => `${L.dir}/index.md exists next to ${L.file}`).join('; ')}. Merge by hand: move the content of the folder index into the layer file (a module lives in one place), delete the folder index, then run again`);
  }
  if (!plan.moves.length) {
    if (o.json) out(`${JSON.stringify({ operation: 'fix-layout', dryRun: o.dryRun, renames: [], rewrites: [], unresolved: [] }, null, 2)}\n`);
    else out('nothing to migrate: no layer folder with an index.md and without a layer file\n');
    return 0;
  }
  const touched = [...plan.moves.map((m) => m.oldRel), ...plan.moves.map((m) => m.newRel), ...[...plan.writes.values()].map((w) => w.from)];
  for (const m of plan.moves) if (io.stat(m.newRel)) throw new UsageError(`--fix-layout refused: ${m.newRel} already exists`);
  if (!o.dryRun) {
    const g = guardGit(root, [...new Set(touched)], o.force, '--fix-layout');
    for (const m of plan.moves) {
      let moved = false;
      if (g.inGit) { try { git(['mv', '--', io.abs(m.oldRel), io.abs(m.newRel)], root); moved = true; } catch { /* fall back to a plain rename */ } }
      if (!moved) renameSync(io.abs(m.oldRel), io.abs(m.newRel));
    }
    for (const [rel, w] of plan.writes) if (w.text !== w.old) writeAtomic(io.abs(rel), w.text);
  }
  if (o.json) {
    out(`${JSON.stringify({ operation: 'fix-layout', dryRun: o.dryRun, renames: plan.moves.map((m) => ({ from: m.oldRel, to: m.newRel })), rewrites: plan.rewrites, unresolved: plan.unresolved }, null, 2)}\n`);
    return 0;
  }
  const verb = o.dryRun ? 'dry-run: would rename' : 'renamed';
  for (const m of plan.moves) out(`${verb} ${m.oldRel} -> ${m.newRel}\n`);
  for (const r of plan.rewrites) out(`${o.dryRun ? 'would rewrite' : 'rewrote'} ${r.file}:${r.line} ${r.from} -> ${r.to}${r.unverified ? ' (target outside the docs folder, not verified)' : ''}\n`);
  for (const u of plan.unresolved) out(`unresolved ${u.file}:${u.line} ${u.target} (${u.reason}); left as written\n`);
  out(`${plan.moves.length} layer file${plan.moves.length === 1 ? '' : 's'}, ${plan.rewrites.length} link${plan.rewrites.length === 1 ? '' : 's'} rewritten, ${plan.unresolved.length} unresolved\n`);
  if (!o.dryRun) out('next: run refresh-pyramid again (write mode) to refresh the routing table\n');
  return 0;
}

// Run the command line only when this file is started directly.
const entry = process.argv[1];
let isMain = false;
try { isMain = !!entry && realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url)); } catch { isMain = false; }
if (isMain) process.exitCode = run(process.argv.slice(2));
