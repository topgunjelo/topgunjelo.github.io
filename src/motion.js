import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export function initPortfolioMotion() {
  const portfolio = document.getElementById('portfolio');
  if (!portfolio) return () => {};

  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const seen = new WeakSet();
  const events = new AbortController();
  let lenis;
  let reveals;

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
      context.add('reveal', element => {
        if (seen.has(element)) return;
        seen.add(element);
        gsap.fromTo(element, { y: 15, opacity: 0.76 }, {
          y: 0,
          opacity: 1,
          duration: 0.62,
          ease: 'power3.out',
          clearProps: 'transform,opacity',
        });
      });

      for (const element of portfolio.querySelectorAll('[data-motion]')) {
        if (element.getBoundingClientRect().top <= window.innerHeight * 0.9) {
          seen.add(element);
        }
        if (seen.has(element)) continue;
        ScrollTrigger.create({
          trigger: element,
          start: 'top 90%',
          end: 'top 78%',
          once: true,
          onEnter: () => context.reveal(element),
        });
      }
    }, portfolio);
  }

  function stop() {
    if (!lenis) return;
    gsap.ticker.remove(tick);
    lenis.destroy();
    lenis = undefined;
    reveals?.revert();
    reveals = undefined;
    delete root.dataset.scrollEngine;
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
    if (link.origin === location.origin && link.pathname === location.pathname &&
        link.search === location.search) cancelInertia();
  }, { signal: events.signal });
  window.addEventListener('popstate', cancelInertia, { signal: events.signal });
  window.addEventListener('hashchange', cancelInertia, { signal: events.signal });
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
