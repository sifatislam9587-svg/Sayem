// Generates the static site (index.html, projects/, receipts/, role/) and compiles Tailwind CSS.
// Usage:  cd _source && npm install && npm run build
// Edit the text/data below (or data/*.json), run the build, push the result to GitHub.

import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const SITE = path.resolve(here, '..')
const read = (p) => fs.readFileSync(path.join(here, p), 'utf8')
const PROJECTS = JSON.parse(read('data/projects.json'))
const RECEIPTS = JSON.parse(read('data/receipts.json'))
const MARKS = JSON.parse(read('data/marks.json'))
const ICONS = JSON.parse(read('data/icons.json'))

/* ------------------------------------------------------------------ helpers */

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const iconCache = new Map()
function icon(name, cls = 'size-4', sw = 2, extra = '') {
  if (!iconCache.has(name) && ICONS[name]) iconCache.set(name, ICONS[name])
  if (!iconCache.has(name)) {
    const raw = fs.readFileSync(path.join(here, 'node_modules/lucide-static/icons', `${name}.svg`), 'utf8')
    iconCache.set(name, raw.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>[\s\S]*$/, '').trim())
  }
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${iconCache.get(name)}</svg>`
}
const brandIcon = (key, cls) =>
  `<svg viewBox="${MARKS.brand[key].viewBox}" fill="currentColor" class="${cls}" aria-hidden="true" focusable="false"><path d="${MARKS.brand[key].d}"/></svg>`
const companyMark = (name, cls) =>
  MARKS.company[name] ? `<svg viewBox="0 0 32 32" class="${cls}" fill="none" aria-hidden="true">${MARKS.company[name]}</svg>` : ''
const techLogo = (name, cls = 'size-6') =>
  MARKS.tech[name]
    ? `<svg viewBox="0 0 32 32" fill="none" class="${cls}" style="color:${MARKS.tech[name].color}" aria-hidden="true">${MARKS.tech[name].inner}</svg>`
    : ''

/* URLs. Everything is relative so the site works at any GitHub Pages path and from a local folder. */
const U = {
  home: (r, hash = '') => `${r}index.html${hash}`,
  projects: (r) => `${r}projects/index.html`,
  project: (r, slug) => `${r}projects/${slug}/index.html`,
  receipts: (r) => `${r}receipts/index.html`,
  role: (r) => `${r}role/index.html`,
}
const fixHref = (r, href) => (href.startsWith('/') ? U.home(r, href.slice(1)) : href)

/* ------------------------------------------------------------------ primitives */

const container = (inner, cls = '') =>
  `<div class="mx-auto w-full max-w-[1104px] px-5 md:px-6 ${cls}">${inner}</div>`

const pillLink = (href, text) =>
  `<a href="${href}" class="pill-link group inline-flex shrink-0 items-center gap-3 rounded-full border bg-card/60 py-1.5 pr-1.5 pl-5 text-sm font-medium transition-colors hover:bg-card">${text}<span class="pill-arrow flex size-9 items-center justify-center rounded-full bg-accent text-primary">${icon('arrow-right', 'size-4')}</span></a>`

const sectionHeading = ({ title, action = '', id = '' }) =>
  `<div class="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between" data-reveal><h2 ${id ? `id="${id}"` : ''} class="max-w-xl text-4xl font-semibold tracking-tight text-balance md:text-5xl">${title}</h2>${action}</div>`

const card = (inner, cls = '', attrs = '') =>
  `<article ${attrs} class="card-glow fx-card flex flex-col rounded-[28px] border bg-card p-7 shadow-[0_1px_2px_rgba(15,19,26,0.04)] hover:shadow-[0_18px_48px_-18px_rgba(232,105,28,0.38)] ${cls}">${inner}</article>`

const cardFooterLink = (href, label) =>
  `<a href="${href}" class="group mt-auto flex items-center justify-between pt-8 text-sm text-muted-foreground"><span class="transition-colors group-hover:text-foreground">${label}</span><span class="flex size-8 items-center justify-center rounded-full border bg-background text-foreground transition-colors group-hover:border-primary group-hover:text-primary">${icon('arrow-up-right', 'arrow-diag size-3.5')}</span></a>`

const companyChip = (name) =>
  `<span class="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5 text-xs font-semibold"><span class="flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-primary">${esc(name.charAt(0))}</span>${esc(name)}</span>`

const checkItem = (text, extra = '') =>
  `<li class="flex items-start gap-3 ${extra}"><span class="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-primary">${icon('check', 'size-3')}</span><span class="leading-relaxed">${esc(text)}</span></li>`

const eyebrow = (t) =>
  `<span class="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">${t}</span>`

const TONES = ['#7a3410', '#1f3a5f', '#14532d', '#4c1d95', '#7f1d1d', '#134e4a']
const projectBanner = (p, cls = '') =>
  `<div class="banner relative flex h-44 overflow-hidden ${cls}" style="background-color:${TONES[p.tone % TONES.length]}"><div class="banner-title flex flex-col justify-end p-5 text-white"><span class="w-fit rounded bg-white/15 px-1.5 py-0.5 text-[10px] font-medium">${esc(p.year)}</span><span class="mt-2 text-2xl leading-none font-semibold whitespace-pre-line">${esc(p.big.replace(' ', '\n'))}</span></div><div class="banner-screen absolute top-5 -right-6 h-48 w-[62%] rotate-[-4deg] rounded-lg bg-white p-4 text-[#0f131a] shadow-xl"><div class="flex gap-1"><span class="size-1.5 rounded-full bg-neutral-300"></span><span class="size-1.5 rounded-full bg-neutral-300"></span><span class="size-1.5 rounded-full bg-neutral-300"></span></div><p class="mt-6 text-lg leading-tight font-medium">${esc(p.screen)}</p><div class="mt-3 space-y-1.5"><div class="h-1.5 w-4/5 rounded bg-neutral-200"></div><div class="h-1.5 w-3/5 rounded bg-neutral-200"></div></div></div></div>`

const projectCard = (r, p) =>
  `<article class="group fx-card relative flex flex-col overflow-hidden rounded-[28px] border bg-card hover:shadow-[0_18px_48px_-18px_rgba(232,105,28,0.45)]" data-tilt="4">${projectBanner(p)}<div class="flex flex-1 flex-col p-6"><span class="text-xs font-semibold text-primary">${esc(p.label)}</span><h3 class="mt-2 leading-snug font-semibold tracking-tight">${esc(p.title)}</h3><p class="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">${esc(p.summary)}</p><div class="mt-auto flex items-center justify-between pt-8 text-sm text-muted-foreground"><a href="${U.project(r, p.slug)}" class="transition-colors group-hover:text-foreground after:absolute after:inset-0 after:content-['']">Case study</a><span class="flex size-8 items-center justify-center rounded-full border bg-background text-foreground transition-colors group-hover:border-primary group-hover:text-primary">${icon('arrow-up-right', 'arrow-diag size-3.5')}</span></div></div></article>`

/* ------------------------------------------------------------------ shell */

function header(r, active) {
  const NAV = [
    { href: U.home(r, '#contact'), label: 'Resume', icon: 'file-text', spy: 'contact' },
    { href: U.projects(r), label: 'Projects', icon: 'folder-open', spy: 'projects', page: 'projects' },
    { href: U.home(r, '#experience'), label: 'Experience', icon: 'briefcase', spy: 'experience' },
    { href: U.home(r, '#leadloop'), label: 'Leadloop', icon: 'puzzle', spy: 'leadloop' },
  ]
  const links = NAV.map(
    (n) =>
      `<li><a href="${n.href}" data-spy="${n.spy}" class="nav-link flex items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition-colors hover:text-primary ${active && active === n.page ? 'is-active' : ''}">${icon(n.icon, 'size-4 text-primary', 2.5)}<span class="hidden sm:inline">${n.label}</span><span class="sr-only sm:hidden">${n.label}</span></a></li>`,
  ).join('')
  return `<header id="site-header" class="header-wrap sticky top-0 z-40 py-4">${container(`<div class="header-box flex items-center justify-between gap-3 rounded-full border border-white/40 bg-white/40 p-1.5 shadow-[0_8px_30px_-12px_rgba(15,19,26,0.25)] backdrop-blur-xl backdrop-saturate-150 dark:border-white/10 dark:bg-white/5"><a href="${U.home(r)}" class="flex items-center gap-2 rounded-full py-1 pr-4 pl-1 text-sm font-bold"><img src="${r}assets/images/sayem.jpg" alt="Sayem Sifat" width="32" height="32" class="size-8 rounded-full object-cover ring-2 ring-primary/60">Sayem Sifat</a><nav aria-label="Primary" data-nav class="relative"><span class="nav-pill" aria-hidden="true"></span><ul class="flex items-center gap-0.5">${links}</ul></nav></div>`)}</header>`
}

const SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com/', key: 'Facebook' },
  { label: 'Instagram', href: 'https://instagram.com/', key: 'Instagram' },
  { label: 'Twitter', href: 'https://twitter.com/', key: 'Twitter' },
  { label: 'LinkedIn', href: 'https://linkedin.com/', key: 'Linkedin' },
]

const footer = () =>
  `<footer class="mt-16 border-t">${container(
    `<div class="flex flex-col gap-2" data-reveal><p class="font-semibold">Sayem Sifat</p><p class="text-sm text-muted-foreground">AI automation engineer and maker of Leadloop Extension.</p></div><ul class="flex items-center gap-3" data-stagger="0.07" data-reveal-as="scale">${SOCIALS.map((s) => `<li><a href="${s.href}" target="_blank" rel="noopener noreferrer" aria-label="${s.label}" title="${s.label}" class="flex size-11 items-center justify-center rounded-full border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:text-primary hover:shadow-[0_12px_24px_-10px_rgba(232,105,28,0.55)]">${brandIcon(s.key, 'size-5')}</a></li>`).join('')}</ul>`,
    'flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between',
  )}<div class="border-t">${container('© 2026 Sayem Sifat. All rights reserved.', 'py-6 text-xs text-muted-foreground')}</div></footer>`

const floating = (r) =>
  `<div class="fixed right-4 bottom-4 z-50 flex flex-col gap-3"><a href="${U.home(r, '#contact')}" aria-label="Contact me" data-magnetic="0.3" class="magnetic fab-ping relative isolate flex size-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">${icon('message-circle', 'size-5')}</a><button type="button" aria-label="Change theme" data-theme-toggle class="theme-btn relative flex size-11 items-center justify-center rounded-full border bg-accent text-primary shadow-lg transition-transform duration-300 hover:scale-110 active:scale-95">${icon('moon', 'ico ico-moon size-5')}${icon('sun', 'ico ico-sun size-5')}</button></div>`

function page({ title, description, depth, active, body, bodyClass = '' }) {
  const r = '../'.repeat(depth)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#f4f5f8">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<link rel="icon" href="${r}favicon.ico" sizes="any">
<link rel="icon" href="${r}assets/images/favicon-32x32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${r}assets/images/apple-icon.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<script>
(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('theme')==='dark'){d.classList.add('dark');}}catch(e){}
// Safety net: if main.js never loads, show everything instead of leaving hidden animation states.
window.__jsGuard=setTimeout(function(){d.classList.remove('js');},4000);})();
</script>
<link rel="stylesheet" href="${r}assets/css/style.css">
<link rel="stylesheet" href="${r}assets/css/premium.css">
<script src="${r}assets/js/main.js" defer></script>
</head>
<body class="${bodyClass}">
<div class="scroll-progress" aria-hidden="true"></div>
<div class="cursor-glow" aria-hidden="true"></div>
${header(r, active)}
<main>${body}</main>
${footer()}
${floating(r)}
</body>
</html>
`
}

/* ------------------------------------------------------------------ HOME */

const WORDS = [['AI'], ['workflows'], ['that'], ['run'], ['while'], ['you', 'sleep.']]


function heroTitle() {
  let n = 0
  return WORDS.map((group) => {
    const words = group.map((w) => `<span class="word"><span style="--w:${n++}">${esc(w)}</span></span>`).join(' ')
    if (group.length === 1) return words
    return `<span class="hl">${words}<svg class="hl-line" viewBox="0 0 300 16" aria-hidden="true"><path pathLength="1" d="M4 11 C 60 3, 120 14, 180 8 S 270 4, 296 8"/></svg></span>`
  }).join(' ')
}

const LOGOS = ['Northwind', 'Acme Cloud', 'Lumen', 'Brightpath', 'Orbital', 'Kestrel', 'Fieldnote']

function workflow() {
  const nd = (x, y, ic, c, t, s, tm, cls = '') => `<div class="n ${cls}" style="--x:${x};--y:${y};--c:${c};--t:${tm}s"><div class="n-box">${icon(ic, '')}<i class="n-ok">${icon('check', '', 3)}</i></div><b class="n-t">${t}</b><span class="n-s">${s}</span></div>`
  const E = [['M133 185 C175 185 190 185 235 185', 0.2], ['M435 185 C480 185 510 185 552 185', 3.3], ['M628 185 C700 185 720 85 792 85', 4.4], ['M628 185 C700 185 720 285 792 285', 4.4]]
  return `<div class="hero-rise wf mt-14 w-full" style="--d:1.45s" role="img" aria-label="n8n-style automation: a webhook receives a new lead, an AI agent qualifies and enriches it, then a condition either creates a deal in the CRM or sends a nurture email."><div class="wf-bar"><span class="wf-dots"><i></i><i></i><i></i></span><b class="wf-title">Lead qualification agent</b><span class="wf-tabs"><u>Editor</u><span>Executions</span></span><span class="wf-active"><i></i>Active</span></div><div class="wf-scroll"><div class="wf-canvas"><svg class="wf-svg" viewBox="0 0 1000 430" aria-hidden="true">${[265, 335, 405].map((x) => `<path class="d" d="M${x} 245 L${x} 318"/>`).join('')}${E.map(([d]) => `<path class="e" d="${d}"/>`).join('')}${E.map(([d, t]) => `<path class="p" pathLength="100" style="--t:${t}s" d="${d}"/>`).join('')}</svg>
${nd(95, 185, 'mouse-pointer-click', '#ff6d5a', 'Webhook', 'New lead', 0.1)}
<div class="n agent" style="--x:335;--y:185;--c:#6366f1;--t:3.3s"><div class="n-box think"><span class="ag-ic">${icon('sparkles', '')}</span><span class="ag-tx"><b class="n-t">AI Agent</b><span class="n-s">Qualify and enrich</span></span><i class="n-ok">${icon('check', '', 3)}</i></div><span class="n-live">Thinking<em>.</em><em>.</em><em>.</em></span></div>
${[['Chat Model', 265, 'message-circle', '#10a37f'], ['Memory', 335, 'database', '#0ea5e9'], ['Tool', 405, 'wrench', '#f59e0b']].map(([t, x, i, c]) => `<div class="n sub" style="--x:${x};--y:350;--c:${c}"><div class="n-box">${icon(i, '')}</div><span class="n-s">${t}</span></div>`).join('')}
${nd(590, 185, 'git-branch', '#14b8a6', 'If', 'Score 70 or more', 4.3)}
${nd(830, 85, 'refresh-cw', '#ff7a59', 'HubSpot', 'Create deal', 5.4)}
${nd(830, 285, 'mail', '#ea4335', 'Gmail', 'Send nurture email', 5.4)}
<span class="lbl" style="--x:712;--y:122">true</span><span class="lbl" style="--x:712;--y:248">false</span>
<span class="wf-exec">${icon('play', '', 2.4)}Execute workflow</span><span class="wf-chip"><i></i>Succeeded in 5.4s</span></div></div></div>`
}

function hero() {
  const marquee = [...LOGOS, ...LOGOS]
    .map(
      (logo, i) =>
        `<li ${i >= LOGOS.length ? 'aria-hidden="true"' : ''} class="flex items-center gap-3 text-2xl font-extrabold tracking-tight whitespace-nowrap text-foreground/75 md:text-3xl">${companyMark(logo, 'size-8 shrink-0 md:size-9')}${esc(logo)}</li>`,
    )
    .join('')
  return `<section id="top" data-hero aria-labelledby="hero-title" class="relative pt-16 pb-20 md:pt-24"><div class="hero-aurora" aria-hidden="true"><div class="aurora-inner"><span class="aurora-blob b1"></span><span class="aurora-blob b2"></span><span class="aurora-blob b3"></span></div></div>${container(
    `<h1 id="hero-title" class="max-w-3xl text-5xl leading-[1.02] font-semibold tracking-tight text-balance md:text-7xl">${heroTitle()}</h1>
<p class="hero-rise mt-6 text-base text-muted-foreground md:text-lg" style="--d:0.95s">AI Automation Engineer · LLM Agents · n8n · RAG · Python · API Integrations</p>
<p class="hero-rise mt-8 flex flex-wrap items-center justify-center gap-3 text-sm" style="--d:1.1s"><span class="font-mono text-base font-semibold tabular-nums" data-count="40" data-suffix=" hrs" data-delay="1000">40 hrs</span><span class="arrow-run text-primary">${icon('arrow-right', 'size-5')}</span><span class="font-mono text-base font-semibold text-primary tabular-nums" data-count="2" data-suffix=" hrs" data-delay="1700" data-duration="1200">2 hrs</span><span class="text-muted-foreground">of manual ops work per week, automated end to end.</span></p>
<div class="hero-rise mt-8 flex flex-wrap items-center justify-center gap-3" style="--d:1.25s"><a href="#work" data-magnetic class="magnetic btn-shine group inline-flex items-center gap-6 rounded-full bg-primary py-1.5 pr-1.5 pl-7 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_rgba(232,105,28,0.7)]">See the work<span class="btn-arrow flex size-9 items-center justify-center rounded-full bg-black/15">${icon('arrow-right', 'size-4')}</span></a><a href="#contact" data-magnetic class="magnetic inline-flex items-center gap-3 rounded-full border bg-card py-3 pr-7 pl-4 text-sm font-semibold hover:bg-muted">${icon('calendar-days', 'size-4 text-primary')}Book a call</a></div>
<p class="hero-rise mt-6 flex items-center gap-2 text-sm text-muted-foreground" style="--d:1.4s"><span class="relative flex size-2"><span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60"></span><span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span></span>Open to remote, on-site and contract work</p>
${workflow()}
<div class="hero-rise mt-16 w-full" style="--d:1.55s"><p class="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">Where I've shipped</p><div class="relative mt-6 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]"><ul class="marquee-track flex w-max animate-marquee items-center gap-14">${marquee}</ul></div></div>`,
    'flex flex-col items-center text-center',
  )}</section>`
}

const SHIPPED = [
  { tag: '40 hrs → 2 hrs', title: 'Ops workflow automation', body: 'Audited a week of manual operations work, then rebuilt it as trigger-based workflows with LLM reading and writing steps, failure alerts and a human review queue.', link: 'Read the case study', slug: 'ops-time-reduction' },
  { tag: 'Case study', title: 'WhatsApp AI assistant for a regional carrier', body: 'Built the assistant end to end: approved templates, qualification flows, CRM lookups and live handoff to agents, so every customer message gets a useful reply in seconds.', link: 'Read the case study', slug: 'whatsapp-ai-assistant' },
  { tag: 'Zero unsafe actions', title: 'Agent guardrails starter kit', body: 'Permission checks, output validation and audit logs around AI agents, with tests that deliberately try to push an agent into unsafe actions.', link: 'View the case study', slug: 'agent-guardrails-kit' },
]

const shipped = (r) =>
  `<section id="work" aria-labelledby="work-title" class="py-20">${container(
    `${sectionHeading({ id: 'work-title', title: 'Three automations you can check out today.', action: pillLink(U.receipts(r), 'See all receipts') })}<div class="grid gap-5 md:grid-cols-3" data-stagger="0.12">${SHIPPED.map((i) =>
      card(`<span class="font-mono text-xs text-primary">${esc(i.tag)}</span><h3 class="mt-4 text-xl leading-snug font-semibold tracking-tight">${esc(i.title)}</h3><p class="mt-3 text-sm leading-relaxed text-muted-foreground">${esc(i.body)}</p>${cardFooterLink(U.project(r, i.slug), i.link)}`),
    ).join('')}</div>`,
  )}</section>`

const currentRole = (r) =>
  `<section aria-labelledby="now-title" class="py-20">${container(
    card(
      `<span class="flex items-center gap-2 text-xs font-semibold text-primary"><span class="relative flex size-2"><span class="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60"></span><span class="relative size-2 rounded-full bg-primary"></span></span>Now</span><h2 id="now-title" class="mt-5 text-3xl font-semibold tracking-tight md:text-4xl">Lead AI Automation Engineer at Northwind Labs.</h2><div class="mt-5">${companyChip('Northwind Labs')}</div><p class="mt-5 max-w-2xl leading-relaxed text-muted-foreground">Designing the AI agents and automation systems behind billing, CRM and analytics. Open to a few parallel contract projects.</p><a href="${U.role(r)}" data-magnetic class="magnetic btn-shine group mt-8 inline-flex w-fit items-center gap-6 rounded-full bg-primary py-1.5 pr-1.5 pl-7 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_rgba(232,105,28,0.7)]">See the role<span class="btn-arrow flex size-9 items-center justify-center rounded-full bg-black/15">${icon('arrow-right', 'size-4')}</span></a>`,
      'p-8 md:p-12',
      'data-reveal="scale" data-tilt="2.5"',
    ),
  )}</section>`

const projectsSection = (r) =>
  `<section id="projects" aria-labelledby="projects-title" class="py-20">${container(
    `${sectionHeading({ id: 'projects-title', title: 'Latest projects.', action: pillLink(U.projects(r), 'See all projects') })}<div class="grid gap-5 md:grid-cols-3" data-stagger="0.12">${PROJECTS.slice(0, 3).map((p) => projectCard(r, p)).join('')}</div>`,
  )}</section>`

const ROLES = [
  { company: 'Northwind Labs', mode: 'On-site', title: 'Lead AI Automation Engineer', meta: 'Jan 2026 – Present · Dhaka', body: 'Own the automation architecture for a multi-product suite: LLM agents, RAG assistants, workflow orchestration, and the monitoring that keeps them reliable.' },
  { company: 'Northwind Labs', mode: 'On-site', title: 'Senior Automation Engineer', meta: 'Jun 2025 – Jan 2026 · Dhaka', body: 'Sole automation engineer across three products, building n8n and Python workflows, API integrations, and AI assistants for support and sales.' },
  { company: 'Brightpath', mode: 'Remote', title: 'AI Automation Lead', meta: 'Mar 2024 – Jun 2025 · Remote', body: 'Led automation for a messaging and CRM platform: AI lead qualification, WhatsApp assistants, real-time follow-ups, and document processing.' },
  { company: 'Orbital Studio', mode: 'Hybrid', title: 'Automation Delivery Lead', meta: 'Aug 2023 – Mar 2024 · Dhaka', body: 'Delivered automations for a property marketplace end to end, including AI inquiry handling, booking flows, CRM sync, and multi-channel messaging.' },
]

const rolesSection = (r) =>
  `<section id="experience" aria-labelledby="roles-title" class="py-20">${container(
    `${sectionHeading({ id: 'roles-title', title: 'Recent roles.', action: pillLink(U.role(r), 'See full career') })}<div class="grid gap-5 md:grid-cols-2" data-stagger="0.12">${ROLES.map((x) =>
      card(`<div class="flex items-center justify-between gap-3">${companyChip(x.company)}<span class="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">${esc(x.mode)}</span></div><h3 class="mt-5 text-2xl font-semibold tracking-tight">${esc(x.title)}</h3><p class="mt-2 text-sm text-muted-foreground">${esc(x.meta)}</p><p class="mt-5 line-clamp-3 leading-relaxed text-muted-foreground">${esc(x.body)}</p>${cardFooterLink(U.role(r), 'Read role')}`),
    ).join('')}</div>`,
  )}</section>`

const STACK = ['Python', 'Node.js', 'TypeScript', 'n8n', 'Make', 'OpenAI', 'Claude', 'LangChain', 'Pinecone', 'PostgreSQL', 'Redis', 'Docker', 'AWS', 'Next.js', 'Zapier', 'Chrome Extensions']


const stackSection = () =>
  `<section aria-labelledby="stack-title" class="py-20">${container(
    `${sectionHeading({ id: 'stack-title', title: 'The tools I automate with.' })}<ul class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4" data-stagger="0.05" data-reveal-as="scale">${STACK.map((t) => `<li class="tech-tile group relative flex items-center gap-3 overflow-hidden rounded-2xl border bg-card px-4 py-3.5 text-sm font-semibold"><span class="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:scale-110 group-hover:-rotate-6">${techLogo(t, 'size-6') || `<span class="font-mono text-sm font-bold text-primary">${esc(t.charAt(0))}</span>`}</span><span class="relative">${esc(t)}</span></li>`).join('')}</ul>`,
  )}</section>`

const FEATURES = [
  { icon: 'mouse-pointer-click', title: 'One-click lead capture', body: 'Save a prospect from any profile, directory, or company page straight from your browser toolbar.' },
  { icon: 'sparkles', title: 'AI enrichment', body: 'An LLM fills in role, company, and context so every lead is ready to work the moment you save it.' },
  { icon: 'refresh-cw', title: 'Real-time CRM sync', body: 'Pushes new leads and updates to your CRM automatically. No exports, no copy and paste.' },
  { icon: 'bell-ring', title: 'Automated follow-up loops', body: 'AI-drafted reminders and sequences so no warm lead goes cold in your pipeline.' },
  { icon: 'gauge', title: 'AI lead scoring', body: 'Ranks prospects by fit and activity so you always know who to contact next.' },
  { icon: 'shield-check', title: 'Private by design', body: 'Runs with minimal permissions and keeps your data in your own workspace.' },
]

const BENEFITS = [
  'Save hours each week on manual data entry',
  'Reply to warm leads faster, while interest is high',
  'Keep one clean, AI-updated source of truth in your CRM',
  'Run a repeatable outreach process your whole team can follow',
]

const spine = () =>
  `<div class="spine relative mt-14" data-spine style="--p:1"><span aria-hidden="true" class="spine-track left-[15px] md:left-1/2"></span><span aria-hidden="true" class="spine-fill left-[15px] md:left-1/2"></span><span aria-hidden="true" class="absolute top-0 bottom-0 left-[15px] w-0 md:left-1/2"><span class="spine-head"></span></span><ul class="relative space-y-6 md:space-y-0">${FEATURES.map((f, i) => {
    const left = i % 2 === 0
    return `<li data-side="${left ? 'left' : 'right'}" class="spine-row relative grid grid-cols-[32px_1fr] items-center gap-x-5 md:grid-cols-[1fr_32px_1fr] md:gap-x-8 md:py-4"><span aria-hidden="true" class="spine-node z-10 flex size-8 items-center justify-center rounded-full border bg-card text-primary md:col-start-2 md:row-start-1">${icon(f.icon, 'size-4')}</span><div class="spine-item min-w-0 ${left ? 'md:col-start-1 md:row-start-1 md:text-right' : 'md:col-start-3 md:row-start-1'}"><div class="flex items-center gap-3 ${left ? 'md:flex-row-reverse' : ''}"><h4 class="text-base font-semibold tracking-tight">${esc(f.title)}</h4><span aria-hidden="true" class="spine-tick hidden h-px flex-1 bg-border md:block"></span></div><p class="mt-1 text-sm leading-relaxed text-muted-foreground">${esc(f.body)}</p></div></li>`
  }).join('')}</ul></div>`

const leadloop = (r) =>
  `<section id="leadloop" aria-labelledby="leadloop-title" class="py-20">${container(
    `${sectionHeading({ id: 'leadloop-title', title: 'Leadloop Extension.', action: pillLink('#contact', 'Get early access') })}<div class="overflow-hidden rounded-[28px] border bg-card" data-reveal="scale"><div data-video="oEEKHK-aCCE" data-title="Leadloop Extension product video" class="video-wrap relative aspect-video w-full overflow-hidden bg-[#2a160a]"><img src="${r}assets/images/leadloop-poster.webp" alt="Leadloop Extension side panel showing a captured lead with an AI score and a sync to CRM button" width="1376" height="768" loading="lazy" decoding="async" class="poster-img absolute inset-0 size-full object-cover"><div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div><button type="button" data-video-play aria-label="Play Leadloop Extension product video" class="group absolute inset-0 flex flex-col items-center justify-center gap-4 text-white focus-visible:outline-none"><span class="play-ring flex size-20 items-center justify-center rounded-full bg-primary shadow-[0_10px_40px_-6px_rgba(232,105,28,0.8)] ring-8 ring-white/15 transition-transform duration-500 group-hover:scale-110 group-focus-visible:ring-white/60">${icon('play', 'size-8 translate-x-0.5 fill-current')}</span><span class="rounded-full bg-black/40 px-3 py-1 text-sm font-medium backdrop-blur">Watch the demo video</span></button></div><div class="grid gap-10 p-7 md:grid-cols-[1.1fr_1fr] md:p-10"><div><span class="text-xs font-semibold text-primary">Browser extension</span><h3 class="mt-2 text-2xl leading-snug font-semibold tracking-tight text-balance md:text-3xl">AI that captures, enriches and follows up on leads, all from your browser.</h3><p class="mt-4 leading-relaxed text-muted-foreground">Leadloop sits in your toolbar and turns any page you browse into a source of qualified leads. Save a prospect in one click, let the AI fill in and score the details, and keep every conversation moving until it closes.</p></div><div><h4 class="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">Why teams use it</h4><ul class="mt-4 space-y-3" data-stagger="0.1">${BENEFITS.map((b) => checkItem(b)).join('')}</ul></div></div></div>${spine()}`,
  )}</section>`

const STATS = [
  { to: 6, suffix: '+', label: 'years building production automation' },
  { to: 4, suffix: '', label: 'countries worked with remotely' },
  { to: 1, suffix: '', label: 'AI product of my own: Leadloop Extension' },
  { to: 100, suffix: '%', label: 'remote-ready, async-friendly' },
]

const stats = () =>
  `<section aria-labelledby="stats-title" class="py-20">${container(
    `${sectionHeading({ id: 'stats-title', title: 'Six years, four countries, one AI product.' })}<dl class="grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-stagger="0.1">${STATS.map((s) => `<div class="card-glow fx-card rounded-[28px] border bg-card p-7" data-tilt="6"><dt class="sr-only">${esc(s.label)}</dt><dd class="text-5xl font-semibold tracking-tight"><span class="stat-num tabular-nums" data-count="${s.to}" data-suffix="${s.suffix}" aria-label="${s.to}${s.suffix}">${s.to}${s.suffix}</span></dd><dd class="mt-3 text-sm leading-relaxed text-muted-foreground">${esc(s.label)}</dd></div>`).join('')}</dl>`,
  )}</section>`

const LANGUAGES = [
  { name: 'English', native: 'English', level: 'Full professional', lang: 'en' },
  { name: 'Bangla', native: 'বাংলা', level: 'Native', lang: 'bn' },
  { name: 'Hindi', native: 'हिन्दी', level: 'Professional working', lang: 'hi' },
]

const languages = () =>
  `<section aria-labelledby="lang-title" class="py-20">${container(
    `${sectionHeading({ id: 'lang-title', title: 'Three languages,<br>one conversation.' })}<ul class="grid gap-4 sm:grid-cols-3" data-stagger="0.12">${LANGUAGES.map((l) => `<li class="fx-card rounded-[28px] border bg-card px-4 py-8 text-center" data-tilt="6"><p class="text-3xl font-semibold tracking-tight md:text-4xl">${l.name}</p><p lang="${l.lang}" class="mt-2 text-lg text-primary">${l.native}</p><p class="mt-2 text-sm text-muted-foreground">${l.level}</p></li>`).join('')}</ul>`,
  )}</section>`

const CONTACTS = [
  { label: 'WhatsApp', detail: '01861602773', href: 'https://wa.me/8801861602773', icon: 'message-circle' },
  { label: 'Telegram', detail: '01861602773', href: 'https://t.me/+8801861602773', icon: 'send' },
  { label: 'Phone', detail: '01861602773', href: 'tel:+8801861602773', icon: 'phone' },
  { label: 'Email', detail: 'sifatislam9587@gmail.com', href: 'mailto:sifatislam9587@gmail.com', icon: 'mail' },
]

const contact = () =>
  `<section id="contact" aria-labelledby="contact-title" class="py-20">${container(
    `<div class="card-glow grid gap-10 rounded-[28px] border bg-card p-8 md:grid-cols-[1.6fr_1fr] md:items-center md:p-16" data-reveal="scale"><div><h2 id="contact-title" class="text-4xl font-semibold tracking-tight text-balance md:text-5xl">Drowning in manual work an AI agent could do?</h2><p class="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">I take on a handful of automation projects each year. If your team is stuck in repetitive work, or you want an AI assistant that actually fits your process, let's talk.</p><p class="mt-6 text-sm text-muted-foreground">Usually replies within 24h · Dhaka, Bangladesh (GMT+6)</p></div><ul class="flex flex-col gap-4" data-stagger="0.1">${CONTACTS.map((c) => `<li><a href="${c.href}" data-magnetic="0.12" class="magnetic group flex items-center justify-between rounded-full border bg-background py-2 pr-2 pl-3 hover:border-primary"><span class="flex items-center gap-3 font-medium"><span class="flex size-9 items-center justify-center rounded-full bg-accent text-primary">${icon(c.icon, 'size-4')}</span><span class="flex flex-col leading-tight">${c.label}<span class="text-xs font-normal text-muted-foreground">${esc(c.detail)}</span></span></span><span class="flex size-9 items-center justify-center rounded-full border bg-card transition-colors group-hover:bg-primary group-hover:text-primary-foreground">${icon('arrow-up-right', 'arrow-diag size-4')}</span></a></li>`).join('')}</ul></div>`,
  )}</section>`

/* ------------------------------------------------------------------ SUB-PAGES */

function projectsPage() {
  const r = '../'
  const body = `<section aria-labelledby="all-projects-title" class="pt-12 pb-20 md:pt-16">${container(
    `${sectionHeading({ id: 'all-projects-title', title: 'All projects.' })}<p class="-mt-6 mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground" data-reveal style="--d:.1s">${PROJECTS.length} AI automation projects across products, client work, open source and internal systems. Open any card to read the full case study.</p><div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-stagger="0.07">${PROJECTS.map((p) => projectCard(r, p)).join('')}</div>`,
  )}</section>`
  return page({ title: 'All projects | Sayem Sifat', description: 'Twenty AI automation projects: products, client work, open source and internal systems.', depth: 1, active: 'projects', body })
}

function projectPage(p, i) {
  const r = '../../'
  const prev = PROJECTS[i > 0 ? i - 1 : PROJECTS.length - 1]
  const next = PROJECTS[i < PROJECTS.length - 1 ? i + 1 : 0]
  const h2 = (id, t) => `<h2 id="${id}" class="text-2xl font-semibold tracking-tight">${t}</h2>`
  const body = `<article class="pt-8 pb-20 md:pt-12">${container(
    `<a href="${U.projects(r)}" class="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">${icon('arrow-left', 'size-4 transition-transform duration-300 group-hover:-translate-x-1')}All projects</a>
<header class="mt-8 max-w-3xl"><span class="text-xs font-semibold text-primary" data-reveal>${esc(p.label)}</span><h1 class="mt-3 text-4xl leading-[1.08] font-semibold tracking-tight text-balance md:text-6xl" data-reveal style="--d:.08s">${esc(p.title)}</h1><p class="mt-5 text-lg leading-relaxed text-muted-foreground" data-reveal style="--d:.16s">${esc(p.summary)}</p></header>
<div class="mt-10 overflow-hidden rounded-[28px] border" data-reveal="scale">${projectBanner(p, 'h-56 md:h-80')}</div>
<dl class="mt-8 grid grid-cols-2 gap-4 rounded-[28px] border bg-card p-6 md:grid-cols-4" data-reveal>${[['Role', p.role], ['Year', p.year], ['Duration', p.duration], ['Type', p.label]].map(([k, v]) => `<div><dt class="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">${k}</dt><dd class="mt-1 font-semibold">${esc(v)}</dd></div>`).join('')}</dl>
<div class="mt-16 grid gap-12 md:grid-cols-[1.4fr_1fr]"><div class="space-y-12"><section aria-labelledby="challenge" data-reveal>${h2('challenge', 'The challenge')}<p class="mt-3 leading-relaxed text-muted-foreground">${esc(p.challenge)}</p></section><section aria-labelledby="solution" data-reveal>${h2('solution', 'The solution')}<p class="mt-3 leading-relaxed text-muted-foreground">${esc(p.solution)}</p></section><section aria-labelledby="features" data-reveal>${h2('features', 'Key features')}<ul class="mt-4 space-y-3" data-stagger="0.1">${p.features.map((f) => checkItem(f)).join('')}</ul></section></div><aside class="space-y-8" data-reveal="right"><section aria-labelledby="stack"><h2 id="stack" class="font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">Tech stack</h2><ul class="mt-4 flex flex-wrap gap-2" data-stagger="0.05" data-reveal-as="scale">${p.stack.map((t) => `<li class="rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary hover:text-primary">${esc(t)}</li>`).join('')}</ul></section>${p.link ? `<a href="${fixHref(r, p.link.href)}" data-magnetic class="magnetic btn-shine group inline-flex items-center gap-3 rounded-full bg-primary py-1.5 pr-1.5 pl-6 text-sm font-semibold text-primary-foreground">${esc(p.link.label)}<span class="flex size-9 items-center justify-center rounded-full bg-black/15">${icon('arrow-up-right', 'arrow-diag size-4')}</span></a>` : ''}</aside></div>
<section aria-labelledby="results" class="mt-16"><h2 id="results" class="text-2xl font-semibold tracking-tight" data-reveal>Results</h2><dl class="mt-5 grid gap-5 sm:grid-cols-3" data-stagger="0.12">${p.results.map((x) => `<div class="card-glow fx-card rounded-[28px] border bg-card p-7" data-tilt="6"><dd class="stat-num text-4xl font-semibold tracking-tight">${esc(x.value)}</dd><dt class="mt-2 text-sm text-muted-foreground">${esc(x.label)}</dt></div>`).join('')}</dl></section>
<nav aria-label="More projects" class="mt-16 grid gap-5 sm:grid-cols-2" data-stagger="0.12"><a href="${U.project(r, prev.slug)}" class="group block">${card(`<span class="flex items-center gap-2 text-xs font-semibold text-muted-foreground">${icon('arrow-left', 'size-3.5 transition-transform duration-300 group-hover:-translate-x-1')} Previous</span><span class="mt-3 font-semibold tracking-tight group-hover:text-primary">${esc(prev.title)}</span>`, 'h-full')}</a><a href="${U.project(r, next.slug)}" class="group block">${card(`<span class="flex items-center gap-2 text-xs font-semibold text-muted-foreground">Next ${icon('arrow-right', 'size-3.5 transition-transform duration-300 group-hover:translate-x-1')}</span><span class="mt-3 font-semibold tracking-tight group-hover:text-primary">${esc(next.title)}</span>`, 'h-full sm:items-end sm:text-right')}</a></nav>`,
  )}</article>`
  return page({ title: `${p.name} | Sayem Sifat`, description: p.summary, depth: 2, active: 'projects', body })
}

function receiptsPage() {
  const r = '../'
  const body = `<section aria-labelledby="receipts-title" class="pt-8 pb-20 md:pt-12">${container(
    `<a href="${U.home(r, '#work')}" class="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">${icon('arrow-left', 'size-4 transition-transform duration-300 group-hover:-translate-x-1')}Back to home</a><div class="mt-8">${sectionHeading({ id: 'receipts-title', title: 'Three receipts.' })}<p class="-mt-6 mb-12 max-w-2xl text-lg leading-relaxed text-muted-foreground" data-reveal style="--d:.1s">Three automations I shipped, what I did in each, and where to check the proof. Open any one for the full case study.</p></div><div class="space-y-6">${RECEIPTS.map((x) =>
      card(`<div class="grid gap-8 md:grid-cols-[1.2fr_1fr]"><div><span class="font-mono text-xs text-primary">${esc(x.tag)}</span><h2 class="mt-3 text-2xl font-semibold tracking-tight md:text-3xl">${esc(x.title)}</h2><p class="mt-4 leading-relaxed text-muted-foreground">${esc(x.what)}</p><p class="mt-4 text-sm font-semibold">${esc(x.proof)}</p></div><div><h3 class="text-sm font-semibold">What I did</h3><ul class="mt-3 space-y-3 text-sm" data-stagger="0.1">${x.how.map((h) => checkItem(h)).join('')}</ul></div></div><a href="${U.project(r, x.slug)}" data-magnetic class="magnetic btn-shine group mt-8 inline-flex w-fit items-center gap-5 rounded-full bg-primary py-1.5 pr-1.5 pl-6 text-sm font-semibold text-primary-foreground">${esc(x.cta)}<span class="flex size-9 items-center justify-center rounded-full bg-black/15">${icon('arrow-up-right', 'arrow-diag size-4')}</span></a>`, 'p-7 md:p-10', 'data-reveal data-tilt="2.5"'),
    ).join('')}</div>`,
  )}</section>`
  return page({ title: 'Receipts | Sayem Sifat', description: 'Three shipped AI automations with public proof: ops workflows, a WhatsApp assistant, and an agent guardrails kit.', depth: 1, body })
}

const WORKING_ON = [
  { name: 'Billing reconciliation agent', status: 'In progress', progress: 70, note: 'Matching payments to invoices with LLM-assisted rules, anomaly flags and drafted reminders.' },
  { name: 'CRM autopilot', status: 'In review', progress: 90, note: 'Auto-logged emails and calls, deal updates and follow-up tasks. Final evals this week.' },
  { name: 'Reporting pipeline', status: 'Planning', progress: 25, note: 'Designing data collection and AI-written weekly summaries for the next roadmap quarter.' },
]
const RESPONSIBILITIES = [
  'Own the automation and AI architecture across billing, CRM and analytics',
  'Review workflows and prompts and set quality standards for the team',
  'Design agents, retrieval systems and integration layers',
  'Run evals, monitoring and cost controls for production AI workflows',
  'Plan the roadmap with product and break it into shipped automations',
]
const TIMELINE = [
  { period: 'Jan 2026 – now', title: 'Lead AI Automation Engineer', company: 'Northwind Labs', current: true },
  { period: 'Jun 2025 – Jan 2026', title: 'Senior Automation Engineer', company: 'Northwind Labs' },
  { period: 'Mar 2024 – Jun 2025', title: 'AI Automation Lead', company: 'Brightpath' },
  { period: 'Aug 2023 – Mar 2024', title: 'Automation Delivery Lead', company: 'Orbital Studio' },
]
const ROLE_STACK = ['Python', 'Node.js', 'n8n', 'OpenAI', 'PostgreSQL', 'Redis', 'Docker']

function rolePage() {
  const r = '../'
  const body = `<section aria-labelledby="role-title" class="pt-8 pb-20 md:pt-12">${container(
    `<a href="${U.home(r, '#experience')}" class="group inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary">${icon('arrow-left', 'size-4 transition-transform duration-300 group-hover:-translate-x-1')}Back to home</a>
<header class="mt-8 max-w-3xl"><span class="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold" data-reveal><span class="relative flex size-2"><span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60"></span><span class="relative inline-flex size-2 rounded-full bg-emerald-500"></span></span>Current role · since Jan 2026</span><h1 id="role-title" class="mt-5 text-4xl leading-[1.08] font-semibold tracking-tight text-balance md:text-6xl" data-reveal style="--d:.08s">Lead AI Automation Engineer at Northwind Labs.</h1><div class="mt-5" data-reveal style="--d:.14s">${companyChip('Northwind Labs')}</div><p class="mt-5 text-lg leading-relaxed text-muted-foreground" data-reveal style="--d:.2s">I lead the AI and automation architecture across a multi-product roadmap: billing, CRM and analytics. Here is where things stand right now.</p></header>
<section aria-labelledby="now-working" class="mt-16"><h2 id="now-working" class="text-2xl font-semibold tracking-tight" data-reveal>What I'm working on now</h2><div class="mt-6 grid gap-5 md:grid-cols-3" data-stagger="0.12">${WORKING_ON.map((w, i) =>
      card(`<div class="flex items-center justify-between gap-3"><h3 class="font-semibold tracking-tight">${esc(w.name)}</h3><span class="shrink-0 rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">${esc(w.status)}</span></div><p class="mt-3 text-sm leading-relaxed text-muted-foreground">${esc(w.note)}</p><div class="mt-auto pt-6"><div role="progressbar" aria-label="${esc(w.name)} progress" aria-valuenow="${w.progress}" aria-valuemin="0" aria-valuemax="100" class="bar h-1.5 overflow-hidden rounded-full bg-muted" style="--w:${w.progress}%;--d:${(0.3 + i * 0.15).toFixed(2)}s"><div class="progress-fill h-full rounded-full bg-primary"></div></div><p class="mt-2 text-xs text-muted-foreground"><span data-count="${w.progress}" data-suffix="% done" data-duration="1600">${w.progress}% done</span></p></div>`),
    ).join('')}</div></section>
<div class="mt-16 grid gap-12 md:grid-cols-[1.2fr_1fr]"><section aria-labelledby="responsibilities"><h2 id="responsibilities" class="text-2xl font-semibold tracking-tight" data-reveal>What I'm responsible for</h2><ul class="mt-5 space-y-3" data-stagger="0.1">${RESPONSIBILITIES.map((x) => checkItem(x)).join('')}</ul><h2 class="mt-12 text-2xl font-semibold tracking-tight" data-reveal>Tools I use daily</h2><ul class="mt-5 flex flex-wrap gap-2" data-stagger="0.05" data-reveal-as="scale">${ROLE_STACK.map((t) => `<li class="flex items-center gap-2 rounded-full border bg-card py-1.5 pr-4 pl-2 text-sm font-medium transition-colors hover:border-primary">${techLogo(t, 'size-5') || ''}${esc(t)}</li>`).join('')}</ul></section><section aria-labelledby="path"><h2 id="path" class="text-2xl font-semibold tracking-tight" data-reveal>How I got here</h2><ol class="timeline mt-6 space-y-6 pl-6">${TIMELINE.map((t, i) => `<li class="relative"><span aria-hidden="true" style="--d:${(0.4 + i * 0.25).toFixed(2)}s" class="t-dot absolute top-1.5 -left-[29.5px] size-2.5 rounded-full border-2 border-background ${t.current ? 'is-current bg-primary' : 'bg-border'}"></span><p class="text-xs text-muted-foreground">${esc(t.period)}</p><p class="mt-1 font-semibold">${esc(t.title)}</p><p class="text-sm text-muted-foreground">${esc(t.company)}</p></li>`).join('')}</ol></section></div>
${card(`<h2 class="text-2xl font-semibold tracking-tight">Availability</h2><p class="mt-3 max-w-2xl leading-relaxed text-muted-foreground">Full-time at Northwind Labs, with room for a few parallel contract projects. If your team needs an AI automation partner, get in touch.</p><a href="${U.home(r, '#contact')}" data-magnetic class="magnetic btn-shine mt-6 inline-flex w-fit items-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground">Get in touch</a>`, 'mt-16 p-8 md:p-10', 'data-reveal="scale" data-tilt="2.5"')}`,
  )}</section>`
  return page({ title: 'My role | Sayem Sifat', description: 'What I do as Lead AI Automation Engineer at Northwind Labs, what I am working on now, and how I got here.', depth: 1, body })
}

function homePage() {
  const r = ''
  const body = [hero(), shipped(r), currentRole(r), projectsSection(r), rolesSection(r), stackSection(), leadloop(r), stats(), languages(), contact()].join('\n')
  return page({
    title: 'Sayem Sifat | AI Automation Engineer & Maker of Leadloop Extension',
    description: 'AI automation engineer building agents and workflows that remove manual work, and the maker of Leadloop Extension, an AI browser extension for capturing and following up on leads.',
    depth: 0,
    active: '',
    body,
  })
}

/* ------------------------------------------------------------------ write files */

const write = (rel, html) => {
  const file = path.join(SITE, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, html)
}

write('index.html', homePage())
write('projects/index.html', projectsPage())
PROJECTS.forEach((p, i) => write(`projects/${p.slug}/index.html`, projectPage(p, i)))
write('receipts/index.html', receiptsPage())
write('role/index.html', rolePage())
console.log(`HTML: ${4 + PROJECTS.length} pages written`)

fs.mkdirSync(path.join(SITE, 'assets/css'), { recursive: true })
// CSS: assets/css/style.css (Tailwind output) + assets/css/premium.css (hand-written layer). No Tailwind rebuild needed.
