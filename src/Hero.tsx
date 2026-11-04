import { lazy, Suspense, useEffect, useRef } from 'react';
import { ArrowDown, Play } from 'lucide-react';
import { prefersLightHeroEffects } from './heroPerformance';
import './hero.css';

const Liquid = lazy(() => import('./Liquid'));

export function OriginalLogo() {
  return <a className="original-logo" href="#inicio" aria-label="UNDA Studios — Início">
    <img src="/unda-logo.webp" alt="UNDA Studios" width="1672" height="941" decoding="async" />
  </a>;
}

export default function Hero() {
  const hero = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = hero.current!;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const qualityMedia = matchMedia('(max-width: 700px), (pointer: coarse)');
    let pointerFrame = 0;
    let pointerX = 0, pointerY = 0;
    const reset = () => {
      cancelAnimationFrame(pointerFrame);
      pointerFrame = 0;
      el.style.setProperty('--pointer-x', '0px');
      el.style.setProperty('--pointer-y', '0px');
    };
    const move = (event: PointerEvent) => {
      if (reduced.matches || prefersLightHeroEffects() || event.pointerType === 'touch') return;
      pointerX = event.clientX; pointerY = event.clientY;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(() => {
        pointerFrame = 0;
        const bounds = el.getBoundingClientRect();
        el.style.setProperty('--pointer-x', `${((pointerX - bounds.left) / bounds.width - .5) * 8}px`);
        el.style.setProperty('--pointer-y', `${((pointerY - bounds.top) / bounds.height - .5) * 4}px`);
      });
    };
    const visibility = new IntersectionObserver(([entry]) => {
      el.classList.toggle('hero-out-of-view', !entry.isIntersecting);
      if (!entry.isIntersecting) reset();
    });
    const tabVisibility = () => {
      el.classList.toggle('hero-tab-hidden', document.hidden);
      if (document.hidden) reset();
    };
    const qualityChange = () => {
      el.classList.toggle('hero-light-effects', prefersLightHeroEffects());
      reset();
    };
    qualityChange();
    qualityMedia.addEventListener('change', qualityChange);
    visibility.observe(el);
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', reset);
    reduced.addEventListener('change', reset);
    document.addEventListener('visibilitychange', tabVisibility);
    tabVisibility();
    return () => {
      cancelAnimationFrame(pointerFrame);
      visibility.disconnect();
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', reset);
      reduced.removeEventListener('change', reset);
      qualityMedia.removeEventListener('change', qualityChange);
      document.removeEventListener('visibilitychange', tabVisibility);
    };
  }, []);

  return <section className="hero unda-hero" id="inicio" aria-labelledby="hero-title" ref={hero}>
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
      <Suspense fallback={<div className="wave-fallback" />}><Liquid /></Suspense>
      <div className="hero-brand">
        <div className="hero-brand-float">
          <div className="hero-brand-rim">
            <div className="hero-brand-crop"><img src="/unda-logo.webp" alt="" width="1672" height="941" decoding="async" /></div>
          </div>
          <div className="hero-brand-crop">
            <img src="/unda-logo.webp" alt="" width="1672" height="941" fetchPriority="high" decoding="async" />
          </div>
        </div>
      </div>
    </div>
    <div className="hero-vignette" aria-hidden="true" />
    <span className="hero-cross hero-cross-top" aria-hidden="true" />
    <span className="hero-cross hero-cross-right" aria-hidden="true" />
    <div className="hero-copy">
      <p className="hero-identification"><span />PRODUTORA AUDIOVISUAL • BELO HORIZONTE, MG.</p>
      <h1 id="hero-title"><span className="hero-line hero-line-first">IMAGENS</span><span className="hero-line hero-line-second">QUE <em>MOVEM.</em></span></h1>
      <p className="hero-description">Transformamos momentos, ideias e experiências em narrativas audiovisuais que permanecem.</p>
      <div className="hero-actions">
        <a className="hero-projects" href="#portfolio"><Play size={15} fill="currentColor" />VER PORTFÓLIO</a>
      </div>
    </div>
    <div className="hero-bottom">
      <a href="#portfolio" className="hero-scroll" aria-label="Rolar para os projetos"><span><ArrowDown size={21} /></span>ROLE PARA DESCOBRIR</a>
      <div className="hero-bottom-location"><span>UNDA STUDIOS</span><span>19°55′ S &nbsp;43°56′ W</span></div>
      <span className="hero-cross hero-cross-bottom" aria-hidden="true" />
    </div>
  </section>;
}
