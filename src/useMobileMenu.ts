import { useEffect, type RefObject } from 'react';

export function useMobileMenu(
  open: boolean,
  close: () => void,
  toggle: RefObject<HTMLButtonElement | null>,
  panel: RefObject<HTMLElement | null>,
) {
  useEffect(() => {
    if (!open) return;
    const menu = panel.current;
    if (!menu) return;
    const sections = [document.querySelector('main'), document.querySelector('footer')];
    const previous = sections.map(section => (section as HTMLElement | null)?.inert ?? false);
    sections.forEach(section => { if (section) (section as HTMLElement).inert = true; });
    const links = () => [...menu.querySelectorAll<HTMLAnchorElement>('a[href]')];
    links()[0]?.focus({ preventScroll: true });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab') return;
      const items: HTMLElement[] = [...(toggle.current ? [toggle.current] : []), ...links()];
      const position = items.indexOf(document.activeElement as HTMLElement);
      if (event.shiftKey && position <= 0) {
        event.preventDefault(); items.at(-1)?.focus();
      } else if (!event.shiftKey && (position === items.length - 1 || position < 0)) {
        event.preventDefault(); items[0]?.focus();
      }
    };
    const desktop = matchMedia('(min-width: 900px)');
    const resize = () => { if (desktop.matches) close(); };
    document.addEventListener('keydown', keydown);
    desktop.addEventListener('change', resize);
    resize();
    return () => {
      document.removeEventListener('keydown', keydown);
      desktop.removeEventListener('change', resize);
      sections.forEach((section, index) => { if (section) (section as HTMLElement).inert = previous[index]; });
      if (toggle.current && getComputedStyle(toggle.current).display !== 'none') toggle.current.focus({ preventScroll: true });
    };
  }, [open, close, toggle, panel]);
}
