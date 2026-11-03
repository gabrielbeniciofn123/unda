import { lazy, Suspense } from 'react';
import { ArrowDown, Play } from 'lucide-react';
import './hero.css';
import BrandMark from './BrandMark';

const Liquid = lazy(() => import('./Liquid'));

export function OriginalLogo() {
  return <a className="original-logo" href="#inicio" aria-label="UNDA Studios — Início">
    <BrandMark /><span className="brand-divider" aria-hidden="true"/><span className="brand-studios" aria-hidden="true">STUDIOS</span>
  </a>;
}

export default function Hero() {
  return <section className="hero unda-hero" id="inicio" aria-labelledby="hero-title">
    <div className="hero-atmosphere" aria-hidden="true" />
    <div className="hero-audience" aria-hidden="true" />
    <div className="hero-grain" aria-hidden="true" />
    <div className="liquid-art" aria-hidden="true">
      <Suspense fallback={<div className="wave-fallback" />}><Liquid /></Suspense>
    </div>
    <div className="hero-vignette" aria-hidden="true" />
    <div className="hero-brand" aria-hidden="true"><BrandMark /></div>
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
