import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(useGSAP, ScrollTrigger);

// Motion owns presentation only. Never key the audio host to navigation.
export function useEditorialMotion(key = '') {
  const root = useRef(null);
  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add({ motion: '(prefers-reduced-motion: no-preference)', desktop: '(min-width: 768px)' }, context => {
      if (!context.conditions.motion) return;
      const select = gsap.utils.selector(root);
      const intro = gsap.timeline({ defaults: { duration: .75, ease: 'power3.out' } });
      intro.from(select('[data-reveal-image]'), { scale: 1.045, opacity: .65 }, 0)
        .from(select('[data-reveal]'), { y: 28, stagger: .09, clearProps: 'transform' }, .12);
      select('[data-editorial-section]').forEach((section, index) => {
        const image = section.querySelector('[data-parallax]');
        if (image && context.conditions.desktop) gsap.fromTo(image, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { id: `editorial-parallax-${index}`, trigger: section, start: 'clamp(top bottom)', end: 'clamp(bottom top)', scrub: .5 } });
        const elements = section.querySelectorAll('[data-scroll-reveal]');
        if (elements.length) gsap.from(elements, { y: 38, stagger: .12, duration: .8, ease: 'power2.out', scrollTrigger: { id: `editorial-reveal-${index}`, trigger: section, start: 'top 88%', once: true } });
      });
    }, root);
    // Search, personal-space retrieval and fonts may change document height.
    let timer;
    const observer = new ResizeObserver(() => { clearTimeout(timer); timer = setTimeout(() => ScrollTrigger.refresh(), 120); });
    if (root.current) observer.observe(root.current);
    return () => { clearTimeout(timer); observer.disconnect(); media.revert(); };
  }, { scope: root, dependencies: [key], revertOnUpdate: true });
  return root;
}
