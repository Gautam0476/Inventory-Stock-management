import { useEffect, useRef } from 'react';

const particlesConfig = {
  particles: {
    number: { value: 170, density: { enable: true, value_area: 900 } },
    color: { value: '#94a3b8' },
    shape: { type: 'circle' },
    opacity: { value: 0.8, random: true },
    size: { value: 4, random: true },
    line_linked: {
      enable: true,
      distance: 135,
      color: '#64748b',
      opacity: 0.22,
      width: 1,
    },
    move: {
      enable: true,
      speed: 6,
      direction: 'none',
      random: false,
      straight: false,
      out_mode: 'out',
    },
  },
  interactivity: {
    detect_on: 'window',
    events: {
      onhover: { enable: true, mode: 'grab' },
      onclick: { enable: true, mode: 'push' },
      resize: true,
    },
    modes: {
      grab: { distance: 150, line_linked: { opacity: 0.5 } },
      push: { particles_nb: 3 },
    },
  },
  retina_detect: true,
};

export default function PortfolioParticles() {
  const idRef = useRef(`auth-particles-${Math.random().toString(36).slice(2)}`);

  useEffect(() => {
    if (process.env.NODE_ENV === 'test' || typeof window === 'undefined') {
      return undefined;
    }

    const particleRootId = idRef.current;
    require('particles.js');

    if (!Array.isArray(window.pJSDom)) {
      window.pJSDom = [];
    }

    const instanceIndex = window.pJSDom?.length || 0;
    window.particlesJS(particleRootId, particlesConfig);
    const instance = window.pJSDom?.[instanceIndex] || window.pJSDom?.[window.pJSDom.length - 1];

    return () => {
      if (instance?.pJS?.fn?.drawAnimFrame) {
        cancelAnimationFrame(instance.pJS.fn.drawAnimFrame);
      }

      const canvas = document.querySelector(`#${particleRootId} > .particles-js-canvas-el`);
      canvas?.remove();

      if (Array.isArray(window.pJSDom)) {
        window.pJSDom = window.pJSDom.filter((entry) => entry !== instance);
      }
    };
  }, []);

  return <div id={idRef.current} className="h-full w-full" aria-hidden="true" />;
}
