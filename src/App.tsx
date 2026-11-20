import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { site } from './content/site';
import { bySlug } from './content/projects';
import { AppContext, type AppActions } from './lib/app-context';
import { clearIntroSeen, markIntroSeen, readIntroContext, shouldPlayIntro } from './lib/intro';
import { About } from './components/About';
import { CaseStudy } from './components/CaseStudy';
import { CommandPalette } from './components/CommandPalette';
import { Contact, Footer } from './components/Contact';
import { Hero } from './components/Hero';
import { Intro } from './components/Intro';
import { Journey } from './components/Journey';
import { Nav } from './components/Nav';
import { Projects } from './components/Projects';
import { Skills } from './components/Skills';
import { OrbLayer, useOrbMode } from './orb/OrbLayer';

type Phase = 'intro' | 'handoff' | 'done';

function projectFromHash() {
  const match = location.hash.match(/^#project-([a-z0-9-]+)$/);
  return match && bySlug(match[1]) ? match[1] : null;
}

export function App() {
  const [phase, setPhase] = useState<Phase>(() => {
    if (!shouldPlayIntro(readIntroContext())) return 'done';
    // The intro always starts at the top; don't let the browser restore an old position underneath it.
    history.scrollRestoration = 'manual';
    scrollTo(0, 0);
    return 'intro';
  });
  const [standalone, setStandalone] = useState(phase === 'done');
  const [introKey, setIntroKey] = useState(0);
  const [caseSlug, setCaseSlug] = useState<string | null>(projectFromHash);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const orbMode = useOrbMode();

  const onHandoff = useCallback(() => setPhase(current => (current === 'intro' ? 'handoff' : current)), []);
  const onDone = useCallback(() => {
    markIntroSeen();
    setPhase('done');
  }, []);

  const notify = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), message });
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const actions = useMemo<AppActions>(
    () => ({
      openProject: slug => {
        setCaseSlug(slug);
        history.replaceState(history.state, '', `#project-${slug}`);
      },
      openPalette: () => setPaletteOpen(true),
      replayIntro: () => {
        clearIntroSeen();
        setCaseSlug(null);
        setPaletteOpen(false);
        setStandalone(false);
        setIntroKey(key => key + 1);
        history.replaceState(history.state, '', location.pathname + location.search);
        scrollTo({ top: 0, behavior: 'instant' });
        setPhase('intro');
      },
      copyEmail: () => {
        copyText(site.email).then(
          ok => notify(ok ? 'Email address copied' : `Couldn’t copy. Email: ${site.email}`),
          () => notify(`Couldn’t copy. Email: ${site.email}`),
        );
      },
      notify,
    }),
    [notify],
  );

  // Deep links to a project, now and on Back/Forward.
  useEffect(() => {
    const onHash = () => setCaseSlug(projectFromHash());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);

  // Land a deep-linked project on its section behind the sheet.
  useEffect(() => {
    if (caseSlug && phase === 'done') document.getElementById('work')?.scrollIntoView({ block: 'start' });
    // Only on first load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ⌘K / Ctrl+K
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        if (phase !== 'done') return;
        event.preventDefault();
        setPaletteOpen(open => !open);
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [phase]);

  const closeCase = useCallback(() => {
    setCaseSlug(null);
    if (location.hash.startsWith('#project-')) history.replaceState(history.state, '', '#work');
  }, []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  return (
    <MotionConfig reducedMotion="user">
      <AppContext.Provider value={actions}>
        <AnimatePresence>
          {phase !== 'done' && <Intro key={introKey} onHandoff={onHandoff} onDone={onDone} />}
        </AnimatePresence>

        {/* The particle orb takes over from the intro's lens once the intro has landed. */}
        {orbMode === 'particles' && phase === 'done' && <OrbLayer />}

        <div className="app" inert={phase !== 'done'}>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <Nav visible={phase !== 'intro'} />
          <main id="main" tabIndex={-1}>
            <Hero revealed={phase !== 'intro'} coreHidden={phase !== 'done'} standalone={standalone} />
            <About />
            <Skills />
            <Projects />
            <Journey />
            <Contact />
          </main>
          <Footer />
        </div>

        <CaseStudy slug={caseSlug} onNavigate={actions.openProject} onClose={closeCase} />
        <CommandPalette open={paletteOpen} onClose={closePalette} />

        <div className="toast-region" role="status" aria-live="polite">
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast.id}
                className="toast"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              >
                <CheckCircle2 aria-hidden="true" />
                {toast.message}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AppContext.Provider>
    </MotionConfig>
  );
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
    document.body.append(field);
    field.select();
    const ok = document.execCommand('copy');
    field.remove();
    return ok;
  }
}
