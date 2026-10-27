import { useId } from 'react';

// Original code-drawn fallback. No claim of a measured waveform.
export function TracePrint({ seed = '', className = '' }) {
  const id = useId().replaceAll(':', '');
  const phase = [...seed].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 17;
  return <svg className={`trace-print ${className}`} viewBox="0 0 600 600" aria-hidden="true"><defs><linearGradient id={id} x2="1" y2="1"><stop stopColor="var(--space-glow, #d7476c)" /><stop offset=".5" stopColor="#f3d6dd" /><stop offset="1" stopColor="#554a72" /></linearGradient></defs><rect width="600" height="600" fill="var(--space-ink, #201923)" /><g fill="none" stroke={`url(#${id})`} strokeWidth="1.4">{Array.from({ length: 38 }, (_, i) => <path key={i} d={`M ${-40 + i * 8} 650 C ${620 - i * 7} ${410 + phase}, ${-210 + i * 18} ${-50 + i * 3}, ${650 - i * 6} -50`} opacity={.3 + i / 60} />)}</g><circle cx="335" cy="270" r="98" fill="none" stroke="#e5d3d750" /><path d="M315 270h40m-20-20v40" stroke="#f3d6dd" /></svg>;
}
