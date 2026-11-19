import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, Play } from 'lucide-react';
import { HERO_LIGHT_MEDIA, heroConnection, prefersLightHeroEffects } from './heroPerformance';
import './hero.css';

const Liquid = lazy(async () => {
  const module = await import('./Liquid');
  await module.prepareAreaLights();
  return module;
});

function HeroPoster() {
  return <>
    <picture className="hero-art-fallback hero-art-waves">
      <source media="(max-width: 767px)" srcSet="/hero-glass-mobile.webp" width="760" height="740" />
      <img src="/hero-glass-desktop.webp" alt="" width="1440" height="899" decoding="async" />
    </picture>
    <img className="hero-art-brand" src="/hero-brand-480.webp" srcSet="/hero-brand-480.webp 480w, /hero-brand-960.webp 960w" sizes="(max-width: 767px) 87vw, 43vw" alt="" width="960" height="307" decoding="async" fetchPriority="high" />
  </>;
}

class HeroArtBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}

export function OriginalLogo() {
  return <a className="original-logo" href="#inicio" aria-label="UNDA Studios — Início">
    <img src="/unda-header-512.webp" srcSet="/unda-header-256.webp 256w, /unda-header-512.webp 512w, /unda-header.webp 768w" sizes="(max-width: 899px) clamp(6.5rem, 24.4vw, 9.28rem), clamp(8.12rem, 13.92vw, 12.76rem)" alt="UNDA Studios" width="1672" height="941" decoding="async" fetchPriority="high" />
  </a>;
}

export default function Hero() {
  const hero = useRef<HTMLElement>(null);
  const [loadArt, setLoadArt] = useState(false);
  const [artReady, setArtReady] = useState(false);
  const [artFailed, setArtFailed] = useState(false);
  const handleArtReady = useCallback(() => setArtReady(true), []);
  const handleArtFailure = useCallback(() => setArtFailed(true), []);

  useEffect(() => {
    const el = hero.current!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const qualityMedia = matchMedia(HERO_LIGHT_MEDIA);
    const connection = heroConnection();
    let lightEffects = prefersLightHeroEffects();
    let visible = false;
    let artActive = false;
    let cancelIdle: (() => void) | undefined;
    let pointerFrame = 0;
    let pointerX = 0, pointerY = 0;
    const cancelArtStart = () => {
      cancelIdle?.();
      cancelIdle = undefined;
    };
    const updateArt = () => {
      const eligible = !reduced.matches && !lightEffects && typeof WebGL2RenderingContext !== 'undefined';
      if (!eligible) {
        cancelArtStart();
        if (artActive) {
          artActive = false;
          setLoadArt(false);
          setArtReady(false);
        }
        return;
      }
      if (!visible || document.hidden || document.body.style.overflow === 'hidden') {
        cancelArtStart();
        return;
      }
      if (artActive || cancelIdle || document.readyState !== 'complete') return;

      const start = () => {
        cancelIdle = undefined;
        artActive = true;
        setLoadArt(true);
      };
      // Keep setup behind the poster and leave the initial paint free for the copy.
      if (typeof requestIdleCallback === 'function') {
        const request = requestIdleCallback(start, { timeout: 1200 });
        cancelIdle = () => cancelIdleCallback(request);
      } else {
        const request = window.setTimeout(start, 250);
        cancelIdle = () => window.clearTimeout(request);
      }
    };
    const reset = () => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      el.style.setProperty('--pointer-x', '0px');
      el.style.setProperty('--pointer-y', '0px');
    };
    const move = (event: PointerEvent) => {
      if (reduced.matches || lightEffects || event.pointerType === 'touch') return;
      pointerX = event.clientX; pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const bounds = el.getBoundingClientRect();
        el.style.setProperty('--pointer-x', `${((pointerX - bounds.left) / bounds.width - .5) * 8}px`);
        el.style.setProperty('--pointer-y', `${((pointerY - bounds.top) / bounds.height - .5) * 4}px`);
      });
    };
    const visibility = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      el.classList.toggle('hero-out-of-view', !visible);
      if (!visible) reset();
      updateArt();
    });
    const tabVisibility = () => {
      const hidden = document.hidden || document.body.style.overflow === 'hidden';
      el.classList.toggle('hero-tab-hidden', hidden);
      if (hidden) reset();
      updateArt();
    };
    const qualityChange = () => {
      lightEffects = prefersLightHeroEffects();
      el.classList.toggle('hero-light-effects', lightEffects);
      reset();
      updateArt();
    };
    qualityChange();
    qualityMedia.addEventListener('change', qualityChange);
    connection?.addEventListener('change', qualityChange);
    visibility.observe(el);
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', reset);
    reduced.addEventListener('change', qualityChange);
    window.addEventListener('load', updateArt);
    document.addEventListener('visibilitychange', tabVisibility);
    const overlays = new MutationObserver(tabVisibility);
    overlays.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    tabVisibility();
    return () => {
      cancelAnimationFrame(pointerFrame);
      cancelArtStart();
      visibility.disconnect();
      overlays.disconnect();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', reset);
      reduced.removeEventListener('change', qualityChange);
      qualityMedia.removeEventListener('change', qualityChange);
      connection?.removeEventListener('change', qualityChange);
      window.removeEventListener('load', updateArt);
      document.removeEventListener('visibilitychange', tabVisibility);
    };
  }, []);

  return <section className="hero unda-hero" id="inicio" aria-labelledby="hero-title" tabIndex={-1} ref={hero}>
    <div className="hero-atmosphere" aria-hidden="true" />
    <div className="hero-audience" aria-hidden="true" />
    <div className="hero-grain" aria-hidden="true" />
    <div className="hero-depth" aria-hidden="true" />
    <div className="hero-art-shadow" aria-hidden="true" />
    <div className="hero-stage-light" aria-hidden="true">
      <i className="stage-light-blue" />
      <i className="stage-light-cyan" />
      <i className="stage-light-green" />
    </div>
    <div className="liquid-art" aria-hidden="true">
      {(!artReady || artFailed) && <HeroPoster />}
      <HeroArtBoundary onError={handleArtFailure}>
        {loadArt && !artFailed && <Suspense fallback={null}><Liquid onReady={handleArtReady} onFailure={handleArtFailure} /></Suspense>}
      </HeroArtBoundary>
    </div>
    <div className="hero-vignette" aria-hidden="true" />
    <span className="hero-cross hero-cross-top" aria-hidden="true" />
    <span className="hero-cross hero-cross-right" aria-hidden="true" />
    <div className="hero-copy">
      <p className="hero-identification"><span />Produtora audiovisual · Belo Horizonte, MG</p>
      <h1 id="hero-title"><span className="hero-line hero-line-first">IMAGENS</span><span className="hero-line hero-line-second">QUE <em>MOVEM.</em></span></h1>
      <p className="hero-description">Criamos filmes para marcas, registramos eventos e damos forma visual à música.</p>
      <div className="hero-actions">
        <a className="hero-briefing" href="#contato">Solicitar orçamento</a>
        <a className="hero-projects" href="#portfolio"><Play size={15} fill="currentColor" aria-hidden="true" />Ver portfólio</a>
      </div>
    </div>
    <div className="hero-bottom">
      <a href="#portfolio" className="hero-scroll" aria-label="Explorar projetos"><span><ArrowDown size={21} aria-hidden="true" /></span></a>
      <div className="hero-bottom-location"><span>UNDA STUDIOS</span><span>19°55′ S &nbsp;43°56′ W</span></div>
      <span className="hero-cross hero-cross-bottom" aria-hidden="true" />
    </div>
  </section>;
}
