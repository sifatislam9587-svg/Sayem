/* Sayem Sifat portfolio: all interactions in one dependency-free file. */
(() => {
  'use strict'

  const root = document.documentElement
  if (window.__jsGuard) clearTimeout(window.__jsGuard) // JS loaded fine: keep the animated (hidden-until-revealed) state.

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches
  const $ = (s, c = document) => c.querySelector(s)
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s))
  const clamp = (n, a, b) => Math.min(b, Math.max(a, n))

  /* -------------------------------------------------------------
     Theme toggle, with a circular reveal from the button (where supported)
  ------------------------------------------------------------- */
  const themeMeta = $('meta[name="theme-color"]')
  const syncThemeMeta = () => themeMeta && themeMeta.setAttribute('content', root.classList.contains('dark') ? '#07090f' : '#f4f5f8')
  syncThemeMeta()

  const themeBtn = $('[data-theme-toggle]')
  if (themeBtn) {
    themeBtn.addEventListener('click', (e) => {
      const toDark = !root.classList.contains('dark')
      const apply = () => {
        root.classList.toggle('dark', toDark)
        try { localStorage.setItem('theme', toDark ? 'dark' : 'light') } catch (_) {}
        syncThemeMeta()
      }
      if (reduce || !document.startViewTransition) return apply()
      const r = themeBtn.getBoundingClientRect()
      const x = e.clientX || r.left + r.width / 2
      const y = e.clientY || r.top + r.height / 2
      const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
      const t = document.startViewTransition(apply)
      t.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 750, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      }).catch(() => {})
    })
  }

  /* -------------------------------------------------------------
     Reveal on scroll (+ automatic stagger for [data-stagger] groups)
  ------------------------------------------------------------- */
  $$('[data-stagger]').forEach((group) => {
    const step = parseFloat(group.dataset.stagger) || 0.09
    Array.from(group.children).forEach((child, i) => {
      if (!child.hasAttribute('data-reveal')) child.setAttribute('data-reveal', group.dataset.revealAs || '')
      child.style.setProperty('--d', `${(i * step).toFixed(2)}s`)
    })
  })

  const revealTargets = $$('[data-reveal], .bar, .timeline, .spine-row')
  if (reduce || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-in'))
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          const el = entry.target
          el.classList.add('is-in')
          io.unobserve(el)
          // Once the entrance has played, hand the element back to its own hover/tilt transitions.
          if (el.hasAttribute('data-reveal')) {
            const d = parseFloat(el.style.getPropertyValue('--d')) || 0
            setTimeout(() => el.removeAttribute('data-reveal'), (d + 1.05) * 1000)
          }
        })
      },
      { threshold: 0.14, rootMargin: '0px 0px -6% 0px' },
    )
    revealTargets.forEach((el) => io.observe(el))
  }

  /* -------------------------------------------------------------
     Count-up numbers: <span data-count="350" data-suffix=" ms">
  ------------------------------------------------------------- */
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
  const runCount = (el) => {
    const to = parseFloat(el.dataset.count)
    const prefix = el.dataset.prefix || ''
    const suffix = el.dataset.suffix || ''
    const duration = parseInt(el.dataset.duration || '1800', 10)
    const delay = parseInt(el.dataset.delay || '0', 10)
    const start = performance.now() + delay
    const tick = (now) => {
      if (now < start) return requestAnimationFrame(tick)
      const t = clamp((now - start) / duration, 0, 1)
      el.textContent = prefix + Math.round(to * easeOutCubic(t)) + suffix
      if (t < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }
  const counters = $$('[data-count]')
  if (reduce || !('IntersectionObserver' in window)) {
    counters.forEach((el) => (el.textContent = (el.dataset.prefix || '') + el.dataset.count + (el.dataset.suffix || '')))
  } else {
    counters.forEach((el) => (el.textContent = (el.dataset.prefix || '') + '0' + (el.dataset.suffix || '')))
    const cio = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          cio.unobserve(entry.target)
          runCount(entry.target)
        })
      },
      { threshold: 0.4 },
    )
    counters.forEach((el) => cio.observe(el))
  }

  /* -------------------------------------------------------------
     Header: sliding pill, scrolled state, scroll-spy
  ------------------------------------------------------------- */
  const nav = $('[data-nav]')
  const pill = $('.nav-pill')
  const navLinks = nav ? $$('.nav-link', nav) : []

  const movePill = (a) => {
    if (!pill || !nav) return
    if (!a) {
      pill.style.opacity = '0'
      return
    }
    const nr = nav.getBoundingClientRect()
    const r = a.getBoundingClientRect()
    pill.style.opacity = '1'
    pill.style.width = r.width + 'px'
    pill.style.height = r.height + 'px'
    pill.style.transform = `translate(${r.left - nr.left}px, ${r.top - nr.top}px)`
  }
  const activeLink = () => navLinks.find((l) => l.classList.contains('is-active'))
  const restPill = () => movePill(activeLink())

  navLinks.forEach((a) => {
    a.addEventListener('pointerenter', () => movePill(a))
    a.addEventListener('focus', () => movePill(a))
    a.addEventListener('blur', restPill)
  })
  if (nav) nav.addEventListener('pointerleave', restPill)
  addEventListener('resize', restPill)

  const setActive = (link) => {
    navLinks.forEach((l) => l.classList.toggle('is-active', l === link))
    restPill()
  }
  // Pages like /projects mark their own link in the HTML.
  restPill()
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(restPill)

  const spyMap = navLinks
    .map((l) => ({ link: l, id: l.dataset.spy }))
    .filter((x) => x.id && document.getElementById(x.id))
  const spy = () => {
    if (!spyMap.length) return
    const line = innerHeight * 0.38
    let current = null
    spyMap.forEach(({ link, id }) => {
      const r = document.getElementById(id).getBoundingClientRect()
      if (r.top <= line && r.bottom > line) current = link
    })
    if (current !== activeLink()) setActive(current)
  }

  /* -------------------------------------------------------------
     Spine: line + glowing head follow the scroll, nodes light up
  ------------------------------------------------------------- */
  const spines = $$('[data-spine]').map((el) => ({
    el,
    rows: $$('.spine-row', el).map((row) => ({ row, node: $('.spine-node', row) })),
  }))
  const updateSpines = () => {
    const mid = innerHeight * 0.62
    spines.forEach(({ el, rows }) => {
      const r = el.getBoundingClientRect()
      el.style.setProperty('--p', clamp((mid - r.top) / r.height, 0, 1).toFixed(4))
      rows.forEach(({ row, node }) => {
        const n = node.getBoundingClientRect()
        row.classList.toggle('is-active', n.top + n.height / 2 < mid)
      })
    })
  }
  if (reduce) spines.forEach(({ el }) => el.style.setProperty('--p', '1'))

  /* -------------------------------------------------------------
     Scroll loop (single rAF-throttled handler)
  ------------------------------------------------------------- */
  const progress = $('.scroll-progress')
  const aurora = $('.aurora-inner')
  let ticking = false
  const onScroll = () => {
    ticking = false
    const y = scrollY
    const max = Math.max(1, root.scrollHeight - innerHeight)
    if (progress) progress.style.setProperty('--scroll', clamp(y / max, 0, 1).toFixed(4))
    root.classList.toggle('is-scrolled', y > 12)
    if (aurora && y < 1200 && !reduce) aurora.style.setProperty('--sy', (y * 0.22).toFixed(1))
    if (!reduce) updateSpines()
    spy()
  }
  const requestScroll = () => {
    if (ticking) return
    ticking = true
    requestAnimationFrame(onScroll)
  }
  addEventListener('scroll', requestScroll, { passive: true })
  addEventListener('resize', requestScroll)
  onScroll()

  /* -------------------------------------------------------------
     Pointer effects (mouse only)
  ------------------------------------------------------------- */
  if (finePointer && !reduce) {
    // Soft glow that trails the cursor.
    const glow = $('.cursor-glow')
    if (glow) {
      let tx = innerWidth / 2, ty = innerHeight / 3, x = tx, y = ty, running = false
      const loop = () => {
        x += (tx - x) * 0.12
        y += (ty - y) * 0.12
        glow.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`
        if (Math.abs(tx - x) + Math.abs(ty - y) > 0.5) requestAnimationFrame(loop)
        else running = false
      }
      addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return
        tx = e.clientX
        ty = e.clientY
        glow.classList.add('is-on')
        if (!running) {
          running = true
          requestAnimationFrame(loop)
        }
      }, { passive: true })
      document.addEventListener('pointerleave', () => glow.classList.remove('is-on'))
    }

    // Spotlight + 3D tilt on cards.
    $$('.fx-card').forEach((card) => {
      const maxTilt = parseFloat(card.dataset.tilt || '5')
      let raf = 0
      card.addEventListener('pointerenter', () => card.classList.add('is-tilting'))
      card.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return
        const r = card.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          card.style.setProperty('--mx', (px * 100).toFixed(1) + '%')
          card.style.setProperty('--my', (py * 100).toFixed(1) + '%')
          card.style.setProperty('--rx', ((0.5 - py) * maxTilt).toFixed(2) + 'deg')
          card.style.setProperty('--ry', ((px - 0.5) * maxTilt * 1.3).toFixed(2) + 'deg')
        })
      })
      card.addEventListener('pointerleave', () => {
        cancelAnimationFrame(raf)
        card.classList.remove('is-tilting')
        card.style.setProperty('--rx', '0deg')
        card.style.setProperty('--ry', '0deg')
      })
    })

    // Stack tiles: cursor spotlight only.
    $$('.tech-tile').forEach((tile) => {
      tile.addEventListener('pointermove', (e) => {
        const r = tile.getBoundingClientRect()
        tile.style.setProperty('--mx', e.clientX - r.left + 'px')
        tile.style.setProperty('--my', e.clientY - r.top + 'px')
      })
    })

    // Magnetic buttons.
    $$('[data-magnetic]').forEach((el) => {
      const pull = parseFloat(el.dataset.magnetic) || 0.25
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect()
        el.style.setProperty('--tx', ((e.clientX - (r.left + r.width / 2)) * pull).toFixed(1) + 'px')
        el.style.setProperty('--ty', ((e.clientY - (r.top + r.height / 2)) * pull * 1.4).toFixed(1) + 'px')
      })
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--tx', '0px')
        el.style.setProperty('--ty', '0px')
      })
    })

    // Hero aurora follows the mouse a little.
    const hero = $('[data-hero]')
    if (hero && aurora) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect()
        aurora.style.setProperty('--px', (((e.clientX - r.left) / r.width - 0.5) * 2).toFixed(3))
        aurora.style.setProperty('--py', (((e.clientY - r.top) / r.height - 0.5) * 2).toFixed(3))
      })
    }
  }

  /* -------------------------------------------------------------
     Leadloop video: swap the poster for the YouTube player on click
  ------------------------------------------------------------- */
  $$('[data-video]').forEach((wrap) => {
    const btn = $('[data-video-play]', wrap)
    if (!btn) return
    btn.addEventListener('click', () => {
      const iframe = document.createElement('iframe')
      iframe.src = `https://www.youtube-nocookie.com/embed/${wrap.dataset.video}?autoplay=1&rel=0`
      iframe.title = wrap.dataset.title || 'Product video'
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen'
      iframe.allowFullscreen = true
      iframe.className = 'aspect-video w-full bg-black'
      wrap.replaceWith(iframe)
    })
  })

  /* -------------------------------------------------------------
     Page leave transition for internal links
  ------------------------------------------------------------- */
  if (!reduce) {
    document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest && e.target.closest('a[href]')
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      let u
      try { u = new URL(a.href, location.href) } catch (_) { return }
      if (u.protocol !== location.protocol || u.host !== location.host) return
      if (u.pathname === location.pathname) return // same page: let the browser scroll to the anchor
      e.preventDefault()
      root.classList.add('is-leaving')
      setTimeout(() => { location.href = a.href }, 240)
    })
    addEventListener('pageshow', (e) => { if (e.persisted) root.classList.remove('is-leaving') })
  }
})()
