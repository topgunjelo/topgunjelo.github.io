import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

function driftSmoke(portfolio, wide) {
  const smoke = document.querySelector('#atmosphere .atmosphere-smoke');
  const story = portfolio.querySelector('main');
  if (!smoke || !story) return;

  const opacity = Number(getComputedStyle(smoke).opacity);
  const range = wide ? 1 : 0.45;
  gsap.timeline({
    defaults: { ease: 'sine.inOut' },
    scrollTrigger: { trigger: story, start: 'top top', end: 'bottom bottom', scrub: wide ? 1.05 : 0.5 },
  })
    .to(smoke, {
      xPercent: -3 * range, yPercent: -2 * range, scale: 1.07,
      opacity: opacity * 0.92, duration: 0.26,
    })
    .to(smoke, {
      xPercent: 3.5 * range, yPercent: 2 * range, scale: 1.13,
      opacity: opacity * 0.68, duration: 0.39,
    })
    .to(smoke, {
      xPercent: -4 * range, yPercent: -3 * range, scale: 1.19,
      opacity: Math.min(1, opacity * 1.18), duration: 0.35,
    });
}

export function initPortfolioMotion() {
  const portfolio = document.getElementById('portfolio');
  if (!portfolio) return () => {};

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet();
  const events = new AbortController();
  let lenis;
  let reveals;
  let scenes;
  let sceneEvents;
  let anchorTimer;
  let refreshFrame;

  function tick() {
    lenis?.raf(performance.now());
  }

  function cancelInertia() {
    if (lenis?.isScrolling !== 'smooth') return;
    lenis.stop();
    lenis.start();
  }

  function start() {
    gsap.registerPlugin(ScrollTrigger);
    sceneEvents = new AbortController();
    lenis = new Lenis({
      autoRaf: false,
      smoothWheel: true,
      syncTouch: false,
      lerp: 0.14,
      stopInertiaOnNavigate: true,
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(tick);
    root.dataset.scrollEngine = 'lenis';

    reveals = gsap.context(context => {
      context.add('reveal', (element, delay) => {
        if (seen.has(element)) return;
        seen.add(element);
        if (element.contains(document.activeElement)) return;

        const tier = element.dataset.motion;
        const panel = tier === 'panel';
        const hero = tier === 'hero';
        const opacity = Number(getComputedStyle(element).opacity);
        gsap.fromTo(element, { y: panel ? 25 : hero ? 20 : 14, opacity: opacity * (panel ? 0.73 : 0.81) }, {
          y: 0,
          opacity,
          delay,
          duration: hero ? 0.92 : panel ? 0.74 : 0.60,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        });
      });

      const panelGroups = new WeakMap();
      for (const element of portfolio.querySelectorAll('[data-motion]')) {
        const tier = element.dataset.motion;
        let delay = 0;
        if (tier === 'panel') {
          const index = panelGroups.get(element.parentElement) || 0;
          panelGroups.set(element.parentElement, index + 1);
          delay = (index % 3) * 0.06;
        }
        if (tier === 'hero' && !location.hash && window.scrollY < 12) {
          context.reveal(element, delay);
          continue;
        }
        const threshold = tier === 'panel' ? 0.86 : 0.92;
        if (element.getBoundingClientRect().top <= window.innerHeight * threshold) {
          seen.add(element);
        }
        if (seen.has(element)) continue;
        ScrollTrigger.create({
          trigger: element,
          start: tier === 'panel' ? 'top 86%' : 'top 92%',
          end: 'top 78%',
          once: true,
          onEnter: () => context.reveal(element, delay),
        });
      }

      // Chapter bats start at the edge of the viewport. The content follows as the flock crosses the middle.
      const linkedSection = document.getElementById(location.hash.slice(1));
      for (const element of portfolio.querySelectorAll('[data-beat], .stack-list, .collection-grid')) {
        if (element.contains(linkedSection) || element.getBoundingClientRect().top <= innerHeight * 0.77) continue;
        const reveal = gsap.fromTo(element, { y: 22, opacity: 0.76 }, {
          y: 0, opacity: 1, ease: 'none',
          scrollTrigger: { trigger: element, start: 'top 75%', end: 'top 51%', scrub: 0.38 },
        });
        element.addEventListener('focusin', () => {
          reveal.progress(1);
          reveal.scrollTrigger?.kill(false);
        }, { once: true, signal: sceneEvents.signal });
      }

      const chapters = portfolio.querySelectorAll('main [data-bat-section][id], main [data-chapter][id]');
      if (chapters[0]) root.dataset.chapter = chapters[0].dataset.chapter || chapters[0].id;
      for (const chapter of chapters) {
        const label = chapter.dataset.chapter || chapter.id;
        const announce = trigger => {
          if (trigger.isActive) root.dataset.chapter = label;
        };
        ScrollTrigger.create({
          trigger: chapter,
          start: 'top 54%',
          end: 'bottom 54%',
          onToggle: announce,
          onRefresh: announce,
        });
      }
    }, portfolio);

    scenes = gsap.matchMedia(portfolio);
    scenes.add({ wide: '(min-width: 960px)', all: 'all' }, ({ conditions }) => {
      driftSmoke(portfolio, conditions.wide);
    });
  }

  function stop() {
    if (!lenis) return;
    clearTimeout(anchorTimer);
    cancelAnimationFrame(refreshFrame);
    sceneEvents?.abort();
    delete root.dataset.anchorScroll;
    gsap.ticker.remove(tick);
    lenis.destroy();
    lenis = undefined;
    scenes?.revert();
    scenes = undefined;
    reveals?.revert();
    reveals = undefined;
    delete root.dataset.scrollEngine;
    delete root.dataset.chapter;
  }

  function sync() {
    if (reduced.matches || root.hasAttribute('data-opening')) stop();
    else if (!lenis) start();
  }

  // Let the browser update the hash, focus, and history for fragment links.
  portfolio.addEventListener('click', event => {
    if (!lenis || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link?.hash || link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    if (link.origin !== location.origin || link.pathname !== location.pathname ||
        link.search !== location.search) return;
    cancelInertia();
    if (link.classList.contains('skip-link')) return;
    // Only intentional navigation should animate. A direct URL fragment must settle before ScrollTrigger measures.
    root.dataset.anchorScroll = '';
    clearTimeout(anchorTimer);
    anchorTimer = setTimeout(() => { delete root.dataset.anchorScroll; }, 1200);
  }, { signal: events.signal });
  window.addEventListener('popstate', cancelInertia, { signal: events.signal });
  window.addEventListener('hashchange', cancelInertia, { signal: events.signal });
  portfolio.addEventListener('toggle', () => {
    if (!lenis) return;
    cancelAnimationFrame(refreshFrame);
    refreshFrame = requestAnimationFrame(() => {
      lenis.resize();
      ScrollTrigger.refresh();
    });
  }, { capture: true, signal: events.signal });
  reduced.addEventListener('change', sync, { signal: events.signal });

  const observer = new MutationObserver(sync);
  observer.observe(root, { attributes: true, attributeFilter: ['data-opening'] });
  sync();

  return () => {
    observer.disconnect();
    events.abort();
    stop();
  };
}
