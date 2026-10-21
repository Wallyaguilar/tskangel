'use client';

import { useRef } from 'react';

const links = [
  ['Our Story', '#story'],
  ['Our Mission', '#mission'],
  ['Outreach', '#outreach'],
  ['Vision & Values', '#vision'],
  ['Calendar', '/calendar'],
] as const;

export default function Navigation({home=true}:{home?:boolean}) {
  const menu = useRef<HTMLDetailsElement>(null);
  return <>
    <nav aria-label="Main navigation" className="desktop-nav">
      {links.map(([label, href]) => <a key={href} href={href.startsWith('#')&&!home?'/'+href:href}>{label}</a>)}
    </nav>
    <a className="button yellow header-cta" href="/give">Give <span aria-hidden="true">→</span></a>
    <details className="mobile-nav" ref={menu}>
      <summary>Menu</summary>
      <nav aria-label="Mobile navigation" onClick={(event) => {
        if ((event.target as HTMLElement).closest('a') && menu.current) menu.current.open = false;
      }}>
        {links.map(([label, href]) => <a key={href} href={href.startsWith('#')&&!home?'/'+href:href}>{label}</a>)}
        <a href="/volunteer">Volunteer</a>
        <a href="/give">Give</a>
      </nav>
    </details>
  </>;
}
