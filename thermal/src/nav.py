"""Shared mega-nav for oberth.org (home) and /thermal/.

nav_html(page) where page is 'home' or 'thermal'.
"""
import re

ICON = {
    'overview': '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>',
    'ops': '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    'why': '<circle cx="11" cy="11" r="6"/><path d="m20 20-4.2-4.2"/>',
    'faq': '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.6"/><circle cx="12" cy="16.8" r=".6" fill="currentColor"/>',
    'gpu': '<rect x="3.5" y="7" width="17" height="10" rx="2"/><path d="M7 7V5M11 7V5M15 7V5M7 19v-2M11 19v-2M15 19v-2"/><rect x="7" y="10" width="6" height="4" rx="1"/>',
    'match': '<path d="M4 7h10M4 12h16M4 17h7"/><circle cx="17" cy="7" r="2.2"/><circle cx="14" cy="17" r="2.2"/>',
    'steps': '<path d="M5 18h4v-4h4v-4h4V6h2"/>',
    'cube': '<path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8z"/><path d="m4.5 8 7.5 4.5L19.5 8M12 12.5v8"/>',
    'grid': '<rect x="4" y="4" width="16" height="16" rx="2.5"/><path d="M4 10h16M10 10v10"/>',
    'leaf': '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19 13 11"/>',
    'factory': '<path d="M4 20V10l5 3V10l5 3V6h3l1 14z"/><path d="M8 17h2M12 17h2"/>',
    'team': '<circle cx="9" cy="9" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="10" r="2.3"/><path d="M15.5 19a4.5 4.5 0 0 1 5-4.4"/>',
    'dc': '<rect x="5" y="3.5" width="14" height="17" rx="1.5"/><path d="M8 7.5h8M8 11h8M8 14.5h8"/><circle cx="16" cy="17.5" r=".6" fill="currentColor"/>',
    'mail': '<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="m4 7 8 6 8-6"/>',
    'cal': '<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    'send': '<path d="M4 12 20 4l-5 16-3-7z"/><path d="m12 13 8-9"/>',
}


def ico(k):
    return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICON[k]}</svg>'


def groups(page):
    h = '' if page == 'home' else '../'  # home path prefix
    t = 'thermal/' if page == 'home' else ''  # thermal path prefix
    return [
        ('company', 'Company', [
            ('overview', 'Overview', 'Who we are and what we place', f'{h}#top' if h else '#top'),
            ('ops', 'Operators', 'Data center operators we work with', f'{h}#operators'),
            ('why', 'Why a broker', 'Most capacity is never listed', f'{h}#why'),
            ('faq', 'FAQ', 'Terms, timing and pricing', f'{h}#faq'),
        ]),
        ('capacity', 'MW Capacity', [
            ('gpu', 'Capacity', 'H100, H200, B200 and B300 in the US', f'{h}#capacity'),
            ('match', 'Matcher', 'Shape a request in thirty seconds', f'{h}#matcher'),
            ('steps', 'Process', 'Three steps to a signed term', f'{h}#process'),
        ]),
        ('thermal', 'Thermal Infra', [
            ('overview', 'Overview', 'Liquid and air cooling for AI halls', f'{t}#top' if page == 'thermal' else 'thermal/'),
            ('cube', 'System explorer', 'Explode every unit in a live 3D hall', f'{t}#explorer'),
            ('grid', 'Portfolio', 'CDUs to chillers, full spec tables', f'{t}#portfolio'),
            ('leaf', 'Free cooling', 'Compressor-off hours by city', f'{t}#climate'),
            ('factory', 'Manufacturer', 'Built by TONFY', f'{t}#maker'),
        ]),
        ('market', 'Marketplace', [
            ('team', 'For AI teams', 'Reserved and short-term capacity', f'{h}#buyers'),
            ('dc', 'For capacity owners', 'Fill blocks with committed buyers', f'{h}#owners'),
            ('send', 'What a request looks like', 'Ask once, get options', f'{h}#exchange'),
        ]),
        ('contact', 'Contact', [
            ('send', 'Send a request', 'GPU, nodes, term and start date', f'{h}#contact'),
            ('cal', 'Book a call', 'Weekdays 9am–5pm PT', f'{h}book/'),
            ('mail', 'daniel@oberth.org', 'Email Daniel directly', 'mailto:daniel@oberth.org'),
        ]),
    ]


CHEV = '<svg class="chev" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 4.5 6 7.5l3-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'


def nav_html(page, iso_svg=''):
    out = ['<nav class="navlinks" id="navlinks" aria-label="Primary">']
    for gid, label, items in groups(page):
        cur = ' aria-current="true"' if (page == 'thermal' and gid == 'thermal') else ''
        wide = ' dd-wide' if gid == 'thermal' else ''
        links = ''.join(
            f'<a href="{href}" role="menuitem"><span class="di">{ico(ic)}</span><span><b>{name}</b><em>{desc}</em></span></a>'
            for ic, name, desc, href in items)
        feature = ''
        if gid == 'thermal':
            ex = '#explorer' if page == 'thermal' else 'thermal/#explorer'
            feature = (f'<a class="dd-feat" href="{ex}"><div class="dd-iso">{iso_svg}</div>'
                       f'<b>Open the 3D explorer</b><em>Every loop and every part, exploded</em></a>')
        out.append(
            f'<div class="nav-item" data-g="{gid}">'
            f'<button class="nav-trig" aria-expanded="false" aria-haspopup="true"{cur}>{label}{CHEV}</button>'
            f'<div class="dd{wide}" role="menu"><div class="dd-list">{links}</div>{feature}</div></div>')
    out.append('</nav>')
    return '\n      '.join(out)


NAV_CSS = r'''
/* mega nav */
.navlinks{gap:6px}
.nav-item{position:relative}
.nav-trig{display:flex;align-items:center;gap:6px;height:40px;padding:0 12px;border:0;border-radius:999px;background:none;color:var(--mut);font:inherit;font-size:14px;cursor:pointer;transition:color .2s,background .2s}
.nav-trig .chev{width:12px;height:12px;transition:transform .3s cubic-bezier(.2,.8,.2,1);opacity:.7}
.nav-item:hover .nav-trig,.nav-item.open .nav-trig,.nav-trig:focus-visible{color:#fff;background:rgba(255,255,255,.06)}
.nav-trig[aria-current=true]{color:#fff}
.nav-trig[aria-current=true]::after{content:"";position:absolute;left:50%;bottom:-2px;width:4px;height:4px;border-radius:50%;background:#fff;transform:translateX(-50%)}
.nav-item.open .chev{transform:rotate(180deg)}
.dd{position:absolute;top:calc(100% + 12px);left:50%;z-index:60;display:flex;gap:8px;min-width:310px;padding:8px;border:1px solid var(--line2);border-radius:20px;background:rgba(13,13,17,.96);backdrop-filter:blur(18px) saturate(140%);-webkit-backdrop-filter:blur(18px) saturate(140%);box-shadow:0 30px 70px rgba(0,0,0,.55);opacity:0;visibility:hidden;transform:translate(-50%,8px) scale(.98);transform-origin:top center;transition:opacity .22s,transform .3s cubic-bezier(.2,.8,.2,1),visibility 0s .3s}
.dd::before{content:"";position:absolute;left:0;right:0;top:-14px;height:14px}
.nav-item.open .dd{opacity:1;visibility:visible;transform:translate(-50%,0) scale(1);transition:opacity .22s,transform .3s cubic-bezier(.2,.8,.2,1),visibility 0s}
.dd-list{display:flex;flex-direction:column;gap:2px;min-width:290px}
.dd-list a{display:flex;gap:12px;align-items:center;padding:10px 12px;border-radius:14px;transition:background .2s}
.dd-list a:hover,.dd-list a:focus-visible{background:rgba(255,255,255,.06)}
.dd-list a b{display:block;font-size:14px;font-weight:600;color:#fff;line-height:1.3}
.dd-list a em{display:block;font-style:normal;font-size:12.5px;color:var(--mut);line-height:1.35}
.di{flex:none;display:grid;place-items:center;width:36px;height:36px;border-radius:10px;border:1px solid var(--line2);background:rgba(255,255,255,.03);color:#fff;transition:background .2s,color .2s,border-color .2s}
.di svg{width:18px;height:18px}
.dd-list a:hover .di{background:#fff;color:#07070A;border-color:#fff}
.dd-wide{min-width:600px}
.dd-feat{width:250px;flex:none;display:flex;flex-direction:column;justify-content:flex-end;padding:14px;border-radius:14px;border:1px solid var(--line);background:radial-gradient(80% 70% at 70% 20%,rgba(90,169,255,.16),transparent 70%),rgba(255,255,255,.02);transition:border-color .2s}
.dd-feat:hover{border-color:rgba(255,255,255,.35)}
.dd-iso{flex:1;display:grid;place-items:center;margin-bottom:10px}
.dd-iso svg{width:100%;height:auto;max-height:150px}
.dd-iso text{display:none}
.dd-feat b{font-size:14px;color:#fff}
.dd-feat em{font-style:normal;font-size:12.5px;color:var(--mut)}
@media (max-width:1100px){.nav-trig{padding:0 9px;font-size:13.5px}.nav .btn-g.desk{display:none}}
@media (max-width:760px){
  .navlinks{display:none;position:absolute;top:72px;left:12px;right:12px;flex-direction:column;align-items:stretch;gap:2px;padding:10px;max-height:calc(100vh - 90px);overflow:auto;background:#0D0D11;border:1px solid var(--line);border-radius:18px}
  .navlinks.open{display:flex}
  .nav-trig{width:100%;justify-content:space-between;height:48px;font-size:15px;color:#fff}
  .nav-trig[aria-current=true]::after{display:none}
  .dd,.nav-item.open .dd{position:static;transform:none;opacity:1;visibility:visible;box-shadow:none;border:0;background:none;padding:0 0 8px;min-width:0;display:none;backdrop-filter:none;-webkit-backdrop-filter:none}
  .nav-item.open .dd{display:block}
  .dd-list{min-width:0}
  .dd-feat{display:none}
}
'''

NAV_JS = r'''
(()=>{const items=[...document.querySelectorAll('.nav-item')];const mq=matchMedia('(hover:hover) and (min-width:761px)');
const close=(x)=>items.forEach(i=>{if(i!==x){i.classList.remove('open');i.querySelector('.nav-trig').setAttribute('aria-expanded','false')}});
items.forEach(it=>{const t=it.querySelector('.nav-trig');let tm;
 const open=()=>{clearTimeout(tm);close(it);it.classList.add('open');t.setAttribute('aria-expanded','true')};
 const shut=()=>{it.classList.remove('open');t.setAttribute('aria-expanded','false')};
 it.addEventListener('mouseenter',()=>{if(mq.matches)open()});
 it.addEventListener('mouseleave',()=>{if(mq.matches)tm=setTimeout(shut,140)});
 t.addEventListener('click',e=>{e.stopPropagation();it.classList.contains('open')?shut():open()});
 it.addEventListener('keydown',e=>{if(e.key==='Escape'){shut();t.focus()}});
 it.querySelectorAll('.dd a').forEach(a=>a.addEventListener('click',()=>{shut();const nl=document.getElementById('navlinks');nl&&nl.classList.remove('open')}));
});
document.addEventListener('click',e=>{if(!e.target.closest('.nav-item'))close(null)});
const spy=document.querySelectorAll('[data-nav]');
if(spy.length){const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){const g=e.target.dataset.nav;items.forEach(i=>{const t=i.querySelector('.nav-trig');if(i.dataset.g===g)t.setAttribute('aria-current','true');else t.removeAttribute('aria-current')})}})},{rootMargin:'-45% 0px -50% 0px'});spy.forEach(s=>io.observe(s))}
})();
'''


def iso_mini(full_svg):
    return re.sub(r'<text[^>]*>.*?</text>', '', full_svg)
