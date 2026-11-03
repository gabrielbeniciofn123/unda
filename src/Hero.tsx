import { lazy, Suspense } from 'react';
import { ArrowDown, ArrowUpRight, Play } from 'lucide-react';
import './hero.css';

const Liquid = lazy(() => import('./Liquid'));

export function OriginalLogo() {
  return <a className="original-logo" href="#inicio" aria-label="UNDA Studios — Início">
    <img src="/logounda.jpg" alt="UNDA Studios" />
  </a>;
}

export default function Hero({ onReel }: { onReel: () => void }) {
  return <section className="hero unda-hero" id="inicio" aria-labelledby="hero-title">
    <div className="hero-atmosphere" aria-hidden="true" />
    <div className="hero-grain" aria-hidden="true" />
    <div className="liquid-art" aria-hidden="true">
      <Suspense fallback={<div className="wave-fallback" />}><Liquid /></Suspense>
    </div>
    <div className="hero-vignette" aria-hidden="true" />
    <div className="hero-copy">
      <p className="hero-identification"><span />PRODUTORA AUDIOVISUAL • BELO HORIZONTE, MG.</p>
      <h1 id="hero-title">IMAGENS<br />QUE <span>MOVEM.</span></h1>
      <p className="hero-description">Transformamos momentos, ideias e experiências em narrativas audiovisuais que permanecem.</p>
      <div className="hero-actions">
        <a className="hero-projects" href="#portfolio">EXPLORE OS PROJETOS <ArrowUpRight size={18} /></a>
        <button className="hero-reel" onClick={onReel}><span><Play size={12} fill="currentColor" /></span>ENTRE NO NOSSO UNIVERSO</button>
      </div>
    </div>
    <div className="hero-bottom">
      <span>IDEIAS EM CONSTANTE MOVIMENTO.</span>
      <a href="#portfolio" className="hero-scroll" aria-label="Rolar para os projetos">EXPLORE <ArrowDown size={15} /></a>
      <span className="hero-bottom-location">BELO HORIZONTE · BRASIL</span>
    </div>
  </section>;
}
