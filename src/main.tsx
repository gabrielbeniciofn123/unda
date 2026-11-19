import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUp, ArrowUpRight, Check, Copy, Instagram, Menu, Minus, Play, Plus, X } from 'lucide-react';
import './fonts.css';
import './style.css';
import Hero, { OriginalLogo } from './Hero';
import DeferredImage from './DeferredImage';
import { useMobileMenu } from './useMobileMenu';

const instagram = 'https://www.instagram.com/unda.studios/';
const conceptVideo = 'https://videos.pexels.com/video-files/3129957/3129957-sd_960_540_25fps.mp4';
const imageWidths = [480, 960, 1440];
const portfolioSizes = '(max-width: 700px) 88vw, (max-width: 1650px) 48vw, 790px';
const reelSizes = '(max-width: 1650px) 90vw, 1450px';
const dialogSizes = '(max-width: 960px) 92vw, 880px';

const nav = [
  ['Início', '#inicio'],
  ['Projetos', '#portfolio'],
  ['Sobre', '#sobre'],
  ['Serviços', '#servicos'],
  ['Contato', '#contato'],
];

const categories = ['Todos', 'Eventos', 'Música', 'Marcas'];

const projects = [
  { id: '01', title: 'A energia do agora.', category: 'Eventos', kind: 'AFTERMOVIE', desc: 'Luz, som e a intensidade de estar presente. Uma referência visual para filmes que traduzem a atmosfera de um evento.' },
  { id: '02', title: 'Som em movimento.', category: 'Música', kind: 'NARRATIVA MUSICAL', desc: 'A música também se vê. Ritmo e direção criativa dão uma nova dimensão ao som.' },
  { id: '03', title: 'Além do óbvio.', category: 'Marcas', kind: 'FILME DE MARCA', desc: 'Uma referência de linguagem para conectar a identidade de uma marca a quem vive do outro lado da tela.' },
  { id: '04', title: 'Quando a noite pulsa.', category: 'Eventos', kind: 'CULTURA NOTURNA', desc: 'Texturas, encontros e movimento. A atmosfera da noite como ponto de partida para uma narrativa audiovisual.' },
];

const services = [
  { title: 'Filmes & campanhas', description: 'Conceito, roteiro, captação e edição para marcas que querem contar uma história com personalidade.', formats: 'Filmes de marca · Campanhas · Institucionais' },
  { title: 'Eventos & experiências', description: 'Cobertura audiovisual que registra a energia do evento e transforma seus melhores momentos em filme.', formats: 'Aftermovies · Festas · Eventos corporativos' },
  { title: 'Música & videoclipes', description: 'Direção criativa e produção para artistas, performances e lançamentos musicais.', formats: 'Videoclipes · Live sessions · Teasers' },
  { title: 'Conteúdo & fotografia', description: 'Imagens feitas para cada formato, com consistência visual em toda a presença da sua marca.', formats: 'Conteúdo para redes · Fotografia · Pós-produção' },
];

function projectImage(id: string) {
  return {
    src: '/media/project-' + id + '-960.webp',
    srcSet: imageWidths.map(width => '/media/project-' + id + '-' + width + '.webp ' + width + 'w').join(', '),
  };
}

function App() {
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState('Todos');
  const [active, setActive] = useState<(typeof projects)[number] | null>(null);
  const [service, setService] = useState<number | null>(0);
  const [reel, setReel] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const menuToggle = useRef<HTMLButtonElement>(null);
  const mobileMenu = useRef<HTMLElement>(null);
  const reelDialog = useRef<HTMLDialogElement>(null);
  const projectDialog = useRef<HTMLDialogElement>(null);
  const openingButton = useRef<HTMLButtonElement>(null);
  const briefingButton = useRef<HTMLButtonElement>(null);
  const draftHeading = useRef<HTMLHeadingElement>(null);
  const draftText = useRef<HTMLTextAreaElement>(null);
  const closeMenu = useCallback(() => setMenu(false), []);

  useMobileMenu(menu, closeMenu, menuToggle, mobileMenu);

  const dialogOpen = reel || active !== null;
  const draftOpen = draft !== null;

  useEffect(() => {
    const dialog = reel ? reelDialog.current : projectDialog.current;
    if (dialogOpen) dialog?.showModal();
    return () => {
      if (!dialogOpen || !dialog?.open) return;
      dialog.close();
      openingButton.current?.focus({ preventScroll: true });
    };
  }, [dialogOpen, reel]);

  useEffect(() => {
    if (!menu && !dialogOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [menu, dialogOpen]);

  useEffect(() => {
    if (draftOpen) draftHeading.current?.focus();
  }, [draftOpen]);

  function followMenuLink(url: string) {
    closeMenu();
    requestAnimationFrame(() => document.querySelector<HTMLElement>(url)?.focus({ preventScroll: true }));
  }

  function closeDraft() {
    setDraft(null);
    briefingButton.current?.focus();
  }

  function prepareBriefing(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = String(data.get('nome')).trim();
    const email = String(data.get('email')).trim();
    const project = String(data.get('tipo'));
    const details = String(data.get('mensagem')).trim();
    const message = [
      'Olá, UNDA! Sou ' + name + ' e gostaria de conversar sobre um projeto.',
      'Tipo de projeto: ' + project,
      ...(email ? ['Meu e-mail: ' + email] : []),
      '',
      details,
    ].join('\n');

    setCopyStatus('idle');
    setDraft(message);
    if (draftOpen) draftHeading.current?.focus();
  }

  async function copyDraft() {
    if (draft === null) return;
    try {
      await navigator.clipboard.writeText(draft);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
      draftText.current?.focus();
      draftText.current?.select();
    }
  }

  const visibleProjects = filter === 'Todos' ? projects : projects.filter(project => project.category === filter);

  return (
    <>
      <a className="skip-link" href="#main">Ir para o conteúdo</a>
      <header className="header unda-header">
        <OriginalLogo />
        <nav aria-label="Navegação principal">
          {nav.map(([label, url]) => <a key={url} href={url}>{label}</a>)}
        </nav>
        <a className="header-cta" href="#contato">Orçamento</a>
        <button
          className="menu-toggle icon-button"
          type="button"
          aria-label={menu ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menu}
          aria-controls="mobile-menu"
          ref={menuToggle}
          onClick={() => setMenu(!menu)}
        >
          {menu ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </header>
      <nav id="mobile-menu" className="mobile-menu unda-mobile-menu" aria-label="Navegação móvel" hidden={!menu} ref={mobileMenu}>
        {nav.map(([label, url]) => (
          <a key={url} href={url} onClick={() => followMenuLink(url)}>{label}</a>
        ))}
        <a href={instagram} target="_blank" rel="noreferrer">Instagram <Instagram size={20} aria-hidden="true" /></a>
      </nav>

      <main id="main" tabIndex={-1}>
        <Hero />
        <section className="portfolio section" id="portfolio" tabIndex={-1} aria-labelledby="portfolio-title">
          <div className="section-top"><span className="eyebrow">Projetos e referências</span></div>
          <div className="section-heading">
            <h2 id="portfolio-title">PLAY. SINTA.<br /><span className="serif">REPLAY.</span></h2>
            <div className="section-intro">
              <p>Explore referências de linguagem para eventos, música e marcas. Veja as produções da UNDA no Instagram.</p>
              <a className="text-link" href={instagram} target="_blank" rel="noreferrer">Ver produções da UNDA <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <div className="portfolio-toolbar">
            <div className="filters" role="group" aria-label="Filtrar referências">
              {categories.map(category => (
                <button type="button" key={category} aria-pressed={filter === category} onClick={() => setFilter(category)}>
                  {category}
                </button>
              ))}
            </div>
          </div>
          <div className={filter === 'Todos' ? 'project-grid project-grid-featured' : 'project-grid'}>
            {visibleProjects.map(project => (
              <button
                type="button"
                className={'project project-' + project.id}
                key={project.id}
                aria-haspopup="dialog"
                onClick={event => { openingButton.current = event.currentTarget; setActive(project); }}
              >
                <span className="project-image">
                  <DeferredImage {...projectImage(project.id)} sizes={portfolioSizes} alt="" />
                  <span className="project-overlay" />
                  <span className="project-tag">{project.category}</span>
                  <span className="project-play" aria-hidden="true"><ArrowUpRight size={21} /></span>
                  <span className="project-image-title">{project.title}</span>
                </span>
                <span className="project-meta"><span>{project.kind}</span><span>Explorar</span></span>
              </button>
            ))}
          </div>
        </section>

        <section className="about section" id="sobre" tabIndex={-1} aria-labelledby="about-title">
          <div className="section-top"><span className="eyebrow">O estúdio</span></div>
          <div className="about-layout">
            <div className="about-title">
              <h2 id="about-title">NÃO É SÓ<br />SOBRE <span className="outline">VER.</span><br />É SOBRE<br /><span className="accent">SENTIR.</span></h2>
            </div>
            <div className="about-copy">
              <h3>Somos a UNDA.<br />Movimento por natureza.</h3>
              <p>Somos um estúdio audiovisual independente de Belo Horizonte. Criamos imagens para contar histórias e fazer as pessoas sentirem o que torna cada projeto único.</p>
              <p>Unimos direção criativa, captação e pós-produção para cuidar do projeto da primeira ideia à última cena.</p>
            </div>
          </div>
        </section>

        <section className="showreel section" id="showreel" aria-label="Filme conceito">
          <div className="section-top"><span className="eyebrow">Filme conceito</span></div>
          <button
            type="button"
            className="reel-cover"
            aria-label="Assistir ao filme conceito Feel the Frame"
            aria-haspopup="dialog"
            onClick={event => { openingButton.current = event.currentTarget; setVideoError(false); setReel(true); }}
          >
            <DeferredImage {...projectImage('02')} sizes={reelSizes} alt="" />
            <span className="reel-shade" />
            <span className="reel-title">FEEL THE<br /><i>FRAME.</i></span>
            <span className="big-play" aria-hidden="true"><Play size={26} fill="currentColor" /></span>
            <span className="reel-foot">Assistir ao filme conceito</span>
          </button>
        </section>

        <section className="services section" id="servicos" tabIndex={-1} aria-labelledby="services-title">
          <div className="section-top"><span className="eyebrow">Serviços</span></div>
          <div className="service-layout">
            <div>
              <h2 id="services-title">SUA IDEIA.<br />NOSSO <span className="serif">OLHAR.</span></h2>
              <p>Direção criativa e produção audiovisual para cada etapa do seu projeto.</p>
              <a href="#contato" className="text-link">Conversar sobre meu projeto <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
            <div className="service-list">
              {services.map(({ title, description, formats }, index) => (
                <article className="service" key={title}>
                  <h3>
                    <button type="button" aria-expanded={service === index} aria-controls={'service-' + index} onClick={() => setService(service === index ? null : index)}>
                      {title}
                      {service === index ? <Minus size={22} aria-hidden="true" /> : <Plus size={22} aria-hidden="true" />}
                    </button>
                  </h3>
                  <div className="service-content" id={'service-' + index} hidden={service !== index}>
                    <p>{description}</p>
                    <span>{formats}</span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="contact section" id="contato" tabIndex={-1} aria-labelledby="contact-title">
          <div className="section-top"><span className="eyebrow">Contato e orçamento</span></div>
          <div className="contact-layout">
            <div>
              <h2 id="contact-title">O PRÓXIMO<br />MOVIMENTO<br /><span className="serif">É SEU.</span></h2>
              <p>Conte o que você quer criar. Prepare um briefing ou fale com a gente direto pelo Instagram.</p>
              <a className="social-link" href={instagram} target="_blank" rel="noreferrer">
                <Instagram size={20} aria-hidden="true" /> Falar no Instagram <ArrowUpRight size={16} aria-hidden="true" />
              </a>
            </div>
            <form className="contact-form" onSubmit={prepareBriefing}>
              <label>Seu nome ou marca<input name="nome" autoComplete="name" required maxLength={100} pattern=".*\S.*" /></label>
              <label>Seu e-mail <span>(opcional)</span><input name="email" type="email" autoComplete="email" maxLength={160} /></label>
              <label>Tipo de projeto
                <select name="tipo" required defaultValue="">
                  <option value="" disabled>Selecione uma opção</option>
                  <option>Filme ou campanha</option>
                  <option>Evento ou experiência</option>
                  <option>Música ou videoclipe</option>
                  <option>Conteúdo ou fotografia</option>
                  <option>Outra ideia</option>
                </select>
              </label>
              <label>Conte um pouco da sua ideia
                <textarea name="mensagem" placeholder="O que você quer produzir? Se já souber, inclua data e local." rows={3} required maxLength={3000}
                  onInput={event => {
                    const field = event.currentTarget;
                    field.setCustomValidity(field.value && !field.value.trim() ? 'Descreva seu projeto.' : '');
                  }}
                />
              </label>
              <button className="submit" type="submit" ref={briefingButton}>Preparar briefing</button>
              <p className="form-note">Você poderá copiar o briefing e enviar por mensagem no Instagram.</p>
            </form>
          </div>

          {draftOpen && (
            <div className="draft-panel">
              <button className="draft-close icon-button" type="button" aria-label="Fechar briefing" onClick={closeDraft}><X aria-hidden="true" size={20} /></button>
              <h3 ref={draftHeading} tabIndex={-1}>Seu briefing está pronto</h3>
              <p>Revise e copie o texto. Depois, cole na conversa com a UNDA no Instagram.</p>
              <textarea aria-label="Briefing preparado" value={draft ?? ''} ref={draftText} onChange={event => { setDraft(event.target.value); setCopyStatus('idle'); }} rows={5} />
              <div className="draft-actions">
                <button className="button" type="button" onClick={copyDraft}>
                  {copyStatus === 'copied' ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}
                  {copyStatus === 'copied' ? 'Briefing copiado' : 'Copiar briefing'}
                </button>
                <a className="button accent-button" href={instagram} target="_blank" rel="noreferrer">Abrir Instagram <ArrowUpRight size={16} aria-hidden="true" /></a>
              </div>
              <div className="copy-status" role="status">
                {copyStatus === 'copied' && <span className="sr-only">Briefing copiado para a área de transferência.</span>}
                {copyStatus === 'failed' && 'Selecione e copie o texto com os controles do seu dispositivo.'}
              </div>
            </div>
          )}
        </section>
      </main>

      <footer>
        <div className="footer-top">
          <a className="footer-logo" href="#inicio" aria-label="UNDA Studios, início">unda<span>STUDIOS®</span></a>
          <p>IMAGENS QUE MOVEM.<br />HISTÓRIAS QUE FICAM.</p>
          <a className="back-top" href="#inicio" aria-label="Voltar ao início"><ArrowUp size={21} aria-hidden="true" /></a>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} UNDA Studios</span>
          <span>Belo Horizonte, Minas Gerais · Brasil</span>
          <a href={instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14} aria-hidden="true" /></a>
        </div>
      </footer>

      <dialog
        className="video-dialog"
        ref={reelDialog}
        aria-labelledby="reel-dialog-title"
        onCancel={event => { event.preventDefault(); setReel(false); }}
        onClick={event => { if (event.target === event.currentTarget) setReel(false); }}
      >
        <div className="dialog-top">
          <h2 id="reel-dialog-title">Feel the Frame</h2>
          <button className="icon-button" type="button" autoFocus onClick={() => setReel(false)} aria-label="Fechar vídeo"><X aria-hidden="true" /></button>
        </div>
        {reel && !videoError && (
          <video src={conceptVideo} controls autoPlay playsInline preload="metadata" poster="/media/project-01-960.webp" onError={() => setVideoError(true)} />
        )}
        {videoError && <p className="video-error" role="status">O filme conceito está indisponível no momento.</p>}
        <p className="video-note">Referência visual de 30 segundos, sem áudio. <a href={instagram} target="_blank" rel="noreferrer">Veja os filmes da UNDA no Instagram.</a></p>
      </dialog>

      <dialog
        className="project-dialog"
        ref={projectDialog}
        aria-labelledby="project-dialog-title"
        onCancel={event => { event.preventDefault(); setActive(null); }}
        onClick={event => { if (event.target === event.currentTarget) setActive(null); }}
      >
        {active && (
          <>
            <div className="dialog-top">
              <span>Referência visual · {active.category}</span>
              <button className="icon-button" type="button" autoFocus onClick={() => setActive(null)} aria-label="Fechar projeto"><X aria-hidden="true" /></button>
            </div>
            <DeferredImage {...projectImage(active.id)} sizes={dialogSizes} loading="eager" alt="" />
            <div className="project-detail">
              <h2 id="project-dialog-title">{active.title}</h2>
              <p>{active.desc}</p>
              <a className="text-link" href={instagram} target="_blank" rel="noreferrer">Ver produções da UNDA <ArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
