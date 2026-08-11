"use client";

import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { calibrateDirect, buildTruthTable, intermediateSolution } from "@openqca/engine";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLocale, type Locale } from "@/i18n/locale";
import { t, type DictKey } from "@/i18n/dict";
import { DEMO } from "@/lib/demo";

const DISPLAY_FONT = 'Charter, "Bitstream Charter", "Sitka Text", Cambria, Georgia, serif';
const MONO_FONT = 'ui-monospace, "SF Mono", Menlo, Consolas, monospace';
const HERO_CONDS = ["wohlstand", "urban", "bildung", "stabil"] as const;
const HERO_OUTCOME = "demo_ueberleben";

function computeHeroData() {
  const cases = DEMO.rows.map((row) => {
    const values: Record<string, number> = {};
    for (const column of [...HERO_CONDS, HERO_OUTCOME]) {
      const [fullOut, crossover, fullIn] = DEMO.anchors[column];
      values[column] = calibrateDirect(Number(row[column]), fullOut, crossover, fullIn);
    }
    return { label: String(row[DEMO.caseCol]), values };
  });
  const truthTable = buildTruthTable({ cases, conditions: [...HERO_CONDS], outcome: HERO_OUTCOME, freqCut: 1, consCut: 0.8 });
  const solution = intermediateSolution(truthTable, cases, { wohlstand: "present", urban: "present", bildung: "present", stabil: "present" });
  return {
    model: solution.models[0] ?? null,
    shown: truthTable.rows.filter((row) => row.n > 0).sort((a, b) => b.consistency - a.consistency).slice(0, 3),
    raw: DEMO.rows.map((row) => Number(row.wohlstand)),
    calibrated: cases.map((item) => item.values.wohlstand),
    anchors: DEMO.anchors.wohlstand,
  };
}

const HERO = computeHeroData();
const HERO_FORMULA = HERO.model
  ? `${HERO.model.paths.map((path) => path.expression.replace(/fs_/g, "").toUpperCase()).join("  +  ")} → ${HERO_OUTCOME.toUpperCase()}`
  : "";

function fmt3(locale: Locale, value: number) {
  return value.toLocaleString(locale === "de" ? "de-DE" : "en-US", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
}

export function Landing() {
  return <div className="oq-landing"><LandingStyles /><LandingNav /><main><Hero /><Reveal><LiveProof /></Reveal><Reveal><Workflow /></Reveal><Reveal><Validation /></Reveal><Reveal><Compare /></Reveal><Reveal><PricingBoundary /></Reveal><CtaBand /></main></div>;
}

function LandingStyles() {
  return <style>{`
    .oq-landing { --land-max:1080px; --land-display:${DISPLAY_FONT}; --land-mono:${MONO_FONT}; --land-y:clamp(var(--space-6),7vw,calc(var(--space-6) * 2)); --land-ease:cubic-bezier(.16,1,.3,1); }
    .oq-landing *, .oq-landing *::before, .oq-landing *::after { box-sizing:border-box; }
    .oq-land-section { width:min(100%,var(--land-max)); margin-inline:auto; padding:var(--land-y) clamp(var(--space-4),4vw,var(--space-6)); }
    .oq-land-kicker { margin:0 0 var(--space-3); color:var(--accent-deep); font-size:12px; font-weight:750; letter-spacing:.08em; text-transform:uppercase; }
    .oq-land-heading { max-width:25ch; margin:0; font-family:var(--land-display); font-size:clamp(28px,4vw,40px); letter-spacing:-.015em; line-height:1.12; }
    .oq-land-intro { max-width:68ch; margin:var(--space-3) 0 0; color:var(--ink-2); font-size:16px; line-height:1.65; }
    .oq-land-link { color:var(--accent-deep); font-weight:650; text-underline-offset:.2em; }
    .oq-land-actions { display:flex; flex-wrap:wrap; gap:var(--space-3); margin-top:var(--space-5); }
    .oq-landing .oq-btn { text-decoration:none; } .oq-landing .oq-btn--large { min-height:48px; padding-inline:var(--space-5); }
    .oq-land-nav { position:sticky; z-index:20; top:0; border-bottom:1px solid var(--line); background:color-mix(in oklch,var(--bg) 92%,transparent); backdrop-filter:saturate(150%) blur(12px); }
    .oq-land-nav__inner { display:flex; width:min(100%,var(--land-max)); min-height:var(--header-height); align-items:center; gap:var(--space-4); margin-inline:auto; padding:var(--space-2) clamp(var(--space-4),4vw,var(--space-6)); }
    .oq-land-logo { color:var(--ink); font-size:20px; font-weight:750; letter-spacing:-.02em; text-decoration:none; } .oq-land-logo span { color:var(--accent-deep); }
    .oq-land-nav__links { display:flex; align-items:center; gap:var(--space-4); margin-left:auto; } .oq-land-nav__link { color:var(--ink-2); font-size:14px; font-weight:600; text-decoration:none; }
    .oq-land-nav__link:hover { color:var(--ink); text-decoration:underline; text-underline-offset:var(--space-2); } .oq-land-nav__actions { display:flex; align-items:center; gap:var(--space-3); }
    .oq-land-hero { padding-top:clamp(var(--space-6),6vw,calc(var(--space-6) * 2)); }
    .oq-land-hero__grid { display:grid; grid-template-columns:minmax(0,1.5fr) minmax(280px,.8fr); gap:clamp(var(--space-5),5vw,calc(var(--space-6) * 2)); align-items:center; }
    .oq-land-hero__title { max-width:18ch; margin:0; font-family:var(--land-display); font-size:clamp(38px,6vw,62px); letter-spacing:-.025em; line-height:1.02; }
    .oq-land-hero__sub { max-width:62ch; margin:var(--space-4) 0 0; color:var(--ink-2); font-size:clamp(16px,2vw,18px); line-height:1.65; }
    .oq-land-local { display:flex; gap:var(--space-2); margin:var(--space-4) 0 0; font-size:14px; font-weight:650; } .oq-land-check { flex:none; color:var(--good-text); font-weight:750; }
    .oq-land-fit { padding-block:var(--space-5); border-block:1px solid var(--line); } .oq-land-fit h2 { margin:0 0 var(--space-4); font-size:15px; }
    .oq-land-fit ul,.oq-land-pack { display:grid; gap:var(--space-3); margin:0; padding:0; list-style:none; } .oq-land-fit li,.oq-land-pack li { display:flex; gap:var(--space-2); color:var(--ink-2); font-size:14px; line-height:1.45; }
    .oq-land-proof { margin:var(--space-5) 0 0; overflow:hidden; border:1px solid var(--line); border-radius:var(--radius-surface); background:var(--panel); box-shadow:var(--shadow-raised); }
    .oq-land-proof__grid { display:grid; grid-template-columns:.9fr 1.2fr .9fr; } .oq-land-stage { min-width:0; padding:var(--space-5); } .oq-land-stage + .oq-land-stage { border-left:1px solid var(--line); }
    .oq-land-stage__head { display:flex; align-items:baseline; gap:var(--space-3); margin-bottom:var(--space-4); } .oq-land-stage__number { color:var(--accent-deep); font-family:var(--land-mono); font-size:12px; font-weight:750; }
    .oq-land-stage h3 { margin:0; font-size:16px; } .oq-land-stage__body { margin:0 0 var(--space-4); color:var(--ink-2); font-size:13.5px; line-height:1.55; }
    .oq-land-formats { margin-bottom:var(--space-3); font-family:var(--land-mono); font-size:12px; font-weight:700; } .oq-land-charts { display:grid; grid-template-columns:1fr 1fr; gap:var(--space-3); }
    .oq-land-chart-label { color:var(--muted); font-size:11px; } .oq-land-svg { display:block; width:100%; height:auto; }
    .oq-land-result { display:grid; gap:var(--space-3); padding:var(--space-4); border:1px solid var(--line); border-radius:var(--radius-surface); background:var(--panel-2); }
    .oq-land-formula { overflow-wrap:anywhere; font-family:var(--land-mono); font-size:clamp(14px,2vw,17px); font-weight:700; line-height:1.5; } .oq-land-kpis { color:var(--muted); font-family:var(--land-mono); font-size:12px; }
    .oq-land-truth { width:100%; border-collapse:collapse; font-family:var(--land-mono); font-size:11px; } .oq-land-truth th,.oq-land-truth td { padding:var(--space-1); color:var(--ink-2); font-weight:400; text-align:right; }
    .oq-land-truth th:first-child,.oq-land-truth td:first-child { text-align:left; } .oq-land-truth th:last-child,.oq-land-truth td:last-child { text-align:center; } .oq-land-truth thead th,.oq-land-cutoff { color:var(--muted); font-size:10px; } .oq-land-cutoff { margin-top:var(--space-1); }
    .oq-land-workflow { margin:var(--space-5) 0 0; padding:0; border-top:1px solid var(--line); list-style:none; } .oq-land-workflow li { display:grid; grid-template-columns:56px minmax(180px,.55fr) minmax(0,1fr); gap:var(--space-4); align-items:baseline; padding:var(--space-4) 0; border-bottom:1px solid var(--line); }
    .oq-land-workflow__num { color:var(--accent-deep); font-family:var(--land-mono); font-size:12px; font-weight:750; } .oq-land-workflow h3 { margin:0; font-size:15px; } .oq-land-workflow p { margin:0; color:var(--ink-2); font-size:14px; line-height:1.55; }
    .oq-land-validation { border-block:1px solid var(--line); background:var(--panel-2); } .oq-land-record { margin-top:var(--space-5); border-top:1px solid var(--line); }
    .oq-land-record__row { display:grid; grid-template-columns:minmax(120px,.24fr) minmax(180px,.45fr) minmax(0,1fr); gap:var(--space-4); align-items:baseline; padding:var(--space-4) 0; border-bottom:1px solid var(--line); }
    .oq-land-record__value { color:var(--accent-deep); font-family:var(--land-mono); font-size:16px; font-weight:750; } .oq-land-record__title { font-size:14px; font-weight:750; }
    .oq-land-record p,.oq-land-scope { margin:0; color:var(--ink-2); font-size:13.5px; line-height:1.6; } .oq-land-scope { max-width:68ch; margin-top:var(--space-4); } .oq-land-links { display:flex; flex-wrap:wrap; gap:var(--space-3) var(--space-5); margin-top:var(--space-4); }
    .oq-land-table { margin-top:var(--space-5); overflow-x:auto; border:1px solid var(--line); border-radius:var(--radius-surface); background:var(--panel); } .oq-land-table table { width:100%; min-width:720px; border-collapse:collapse; }
    .oq-land-table th,.oq-land-table td { padding:var(--space-3) var(--space-4); border-bottom:1px solid var(--line); color:var(--ink-2); font-size:13.5px; line-height:1.5; text-align:left; vertical-align:top; }
    .oq-land-table thead th { color:var(--ink); background:var(--panel-2); } .oq-land-table tbody th,.oq-land-table td:nth-child(2) { color:var(--ink); font-weight:650; } .oq-land-note { max-width:68ch; margin:var(--space-4) 0 0; color:var(--muted); font-size:13.5px; line-height:1.6; }
    .oq-land-pricing { display:grid; grid-template-columns:1fr 1fr; margin-top:var(--space-5); border-block:1px solid var(--line); } .oq-land-tier { padding:var(--space-5) 0; } .oq-land-tier + .oq-land-tier { margin-left:var(--space-6); padding-left:var(--space-6); border-left:1px solid var(--line); }
    .oq-land-tier__label { margin:0 0 var(--space-2); color:var(--accent-deep); font-size:12px; font-weight:750; letter-spacing:.05em; text-transform:uppercase; } .oq-land-tier h3 { margin:0; font-size:18px; } .oq-land-tier__desc { max-width:48ch; margin:var(--space-2) 0 0; color:var(--ink-2); font-size:14px; line-height:1.6; }
    .oq-land-final { margin-top:var(--space-6); border-block:1px solid var(--line); background:var(--accent-wash); } .oq-land-final h2 { max-width:24ch; margin:0; font-family:var(--land-display); font-size:clamp(30px,5vw,46px); letter-spacing:-.02em; line-height:1.08; }
    @keyframes oq-land-rise { from { opacity:0; transform:translateY(var(--space-2)); } to { opacity:1; transform:none; } } .oq-land-hero__copy,.oq-land-fit { animation:oq-land-rise 520ms var(--land-ease) both; } .oq-land-fit { animation-delay:80ms; }
    .oq-land-reveal.is-armed { opacity:0; transform:translateY(var(--space-3)); } .oq-land-reveal.is-armed.is-visible { opacity:1; transform:none; transition:opacity 480ms var(--land-ease),transform 480ms var(--land-ease); }
    @media(max-width:860px){ .oq-land-nav__links{display:none}.oq-land-nav__actions{margin-left:auto}.oq-land-hero__grid,.oq-land-proof__grid{grid-template-columns:1fr}.oq-land-fit{display:grid;grid-template-columns:minmax(160px,.45fr) 1fr;gap:var(--space-5)}.oq-land-stage + .oq-land-stage{border-top:1px solid var(--line);border-left:0} }
    @media(max-width:640px){ .oq-land-nav__cta .oq-btn{min-height:44px;padding-inline:12px;font-size:13px}.oq-land-hero__title{font-size:clamp(36px,11vw,48px)}.oq-land-actions{display:grid}.oq-land-actions .oq-btn{width:100%}.oq-land-fit{display:block}.oq-land-workflow li{grid-template-columns:40px 1fr}.oq-land-workflow p{grid-column:2}.oq-land-record__row{grid-template-columns:88px 1fr}.oq-land-record__row p{grid-column:2}.oq-land-table{box-shadow:none} }
    @media(prefers-reduced-motion:reduce){ .oq-land-hero__copy,.oq-land-fit{animation:none}.oq-land-reveal.is-armed,.oq-land-reveal.is-armed.is-visible{opacity:1;transform:none;transition:none} }
  `}</style>;
}

function Reveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    element.classList.add("is-armed");
    let observer: IntersectionObserver;
    try { observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { element.classList.add("is-visible"); observer.disconnect(); } }, { threshold: 0.12 }); }
    catch { element.classList.remove("is-armed"); return; }
    observer.observe(element); return () => observer.disconnect();
  }, []);
  return <div ref={ref} className="oq-land-reveal">{children}</div>;
}

function LandingNav() {
  const [locale] = useLocale();
  return <nav className="oq-land-nav" aria-label={t(locale,"landing.nav.ariaPrimary")}><div className="oq-land-nav__inner"><Link href="/" className="oq-land-logo" aria-label="openQCA">open<span>QCA</span></Link><div className="oq-land-nav__links"><Link className="oq-land-nav__link" href="#proof">{t(locale,"landing.nav.proof")}</Link><Link className="oq-land-nav__link" href="#validation">{t(locale,"landing.nav.validation")}</Link><Link className="oq-land-nav__link" href="/methodik">{t(locale,"landing.nav.methodik")}</Link><Link className="oq-land-nav__link" href="/preise">{t(locale,"landing.nav.pricing")}</Link></div><div className="oq-land-nav__actions"><LanguageToggle /><span className="oq-land-nav__cta"><Cta href="/app" primary>{t(locale,"landing.hero.ctaOwn")}</Cta></span></div></div></nav>;
}

function Hero() {
  const [locale] = useLocale(); const fit:DictKey[]=["landing.fit.i1","landing.fit.i2","landing.fit.i3","landing.fit.i4"];
  return <section className="oq-land-section oq-land-hero"><div className="oq-land-hero__grid"><div className="oq-land-hero__copy"><p className="oq-land-kicker">{t(locale,"landing.hero.eyebrow")}</p><h1 className="oq-land-hero__title">{t(locale,"landing.hero.title")}</h1><p className="oq-land-hero__sub">{t(locale,"landing.hero.sub")}</p><p className="oq-land-local"><span className="oq-land-check" aria-hidden>✓</span>{t(locale,"landing.hero.local")}</p><div className="oq-land-actions"><Cta href="/app" primary large>{t(locale,"landing.hero.ctaOwn")}</Cta><Cta href="/app?demo=1" large>{t(locale,"landing.hero.ctaDemo")}</Cta></div></div><aside className="oq-land-fit" aria-label={t(locale,"landing.fit.aria")}><h2>{t(locale,"landing.fit.title")}</h2><ul>{fit.map((key)=><li key={key}><span className="oq-land-check" aria-hidden>✓</span>{t(locale,key)}</li>)}</ul></aside></div></section>;
}

function LiveProof() {
  const [locale] = useLocale(); const items:DictKey[]=["landing.proof.defense.i1","landing.proof.defense.i2","landing.proof.defense.i3","landing.proof.defense.i4"];
  return <section id="proof" className="oq-land-section" data-testid="landing-answer-preview"><p className="oq-land-kicker">{t(locale,"landing.proof.eyebrow")}</p><h2 className="oq-land-heading">{t(locale,"landing.proof.title")}</h2><p className="oq-land-intro">{t(locale,"landing.proof.intro")}</p><figure className="oq-land-proof" aria-label={t(locale,"landing.proof.aria")}><div className="oq-land-proof__grid"><Stage n="01" title={t(locale,"landing.proof.input.title")}><p className="oq-land-stage__body">{t(locale,"landing.proof.input.body")}</p><div className="oq-land-formats">CSV · XLSX · {t(locale,"landing.proof.input.cases")}</div><div className="oq-land-charts"><div><span className="oq-land-chart-label">{t(locale,"landing.proof.raw")}</span><RawDots /></div><div><span className="oq-land-chart-label">{t(locale,"landing.proof.calibrated")}</span><CalibCurve locale={locale} /></div></div></Stage><Stage n="02" title={t(locale,"landing.proof.result.title")}><p className="oq-land-stage__body">{t(locale,"landing.proof.result.body")}</p><div className="oq-land-result"><div data-testid="landing-hero-formula" className="oq-land-formula">{HERO_FORMULA}</div>{HERO.model&&<div data-testid="landing-hero-kpis" className="oq-land-kpis">{t(locale,"landing.proof.consistency")} {fmt3(locale,HERO.model.solutionConsistency)} · {t(locale,"landing.proof.coverage")} {fmt3(locale,HERO.model.solutionCoverage)}</div>}<TruthRows locale={locale}/></div></Stage><Stage n="03" title={t(locale,"landing.proof.defense.title")}><p className="oq-land-stage__body">{t(locale,"landing.proof.defense.body")}</p><ul className="oq-land-pack">{items.map((key)=><li key={key}><span className="oq-land-check" aria-hidden>→</span>{t(locale,key)}</li>)}</ul></Stage></div><figcaption>{t(locale,"landing.proof.caption")}</figcaption></figure></section>;
}

function Stage({n,title,children}:{n:string;title:string;children:ReactNode}){return <div className="oq-land-stage"><div className="oq-land-stage__head"><span className="oq-land-stage__number" aria-hidden>{n}</span><h3>{title}</h3></div>{children}</div>}
function RawDots(){return <svg viewBox="0 0 172 84" className="oq-land-svg" aria-hidden><line x1={6} y1={70} x2={166} y2={70} stroke="var(--line)"/>{HERO.raw.map((value,index)=><circle key={index} cx={6+((value-260)/900)*160} cy={62-(index%4)*11} r={3.4} fill="var(--ink-2)" opacity={.75}/>)}<text x={6} y={82} fontSize={9} fill="var(--muted)" fontFamily={MONO_FONT}>320</text><text x={166} y={82} fontSize={9} fill="var(--muted)" textAnchor="end" fontFamily={MONO_FONT}>1098</text></svg>}
function CalibCurve({locale}:{locale:Locale}){const [a,b,c]=HERO.anchors;const px=(v:number)=>6+((v-260)/900)*160;const py=(m:number)=>70-m*60;let path="";for(let i=0;i<=60;i++){const v=260+(i/60)*900;path+=`${i?"L":"M"}${px(v).toFixed(1)} ${py(calibrateDirect(v,a,b,c)).toFixed(1)}`}return <svg viewBox="0 0 172 84" className="oq-land-svg" aria-hidden><line x1={6} y1={70} x2={166} y2={70} stroke="var(--line)"/><line x1={6} y1={py(.5)} x2={166} y2={py(.5)} stroke="var(--line-soft)" strokeDasharray="3 4"/><text x={166} y={py(.5)-3} fontSize={9} fill="var(--muted)" textAnchor="end" fontFamily={MONO_FONT}>{t(locale,"landing.proof.crossover")}</text><path d={path} fill="none" stroke="var(--accent)" strokeWidth={2.2}/>{HERO.raw.map((v,i)=><circle key={i} cx={px(v)} cy={py(HERO.calibrated[i])} r={3.2} fill={Math.abs(HERO.calibrated[i]-.5)<.1?"var(--warn-text)":"var(--accent)"}/>)}</svg>}
function TruthRows({locale}:{locale:Locale}){return <><table className="oq-land-truth" aria-label={t(locale,"landing.proof.result.title")}><thead><tr><th scope="col">{HERO_CONDS.map((c)=>c[0].toUpperCase()).join(" ")}</th><th scope="col">n</th><th scope="col">incl.</th><th scope="col">{t(locale,"landing.proof.output")}</th></tr></thead><tbody>{HERO.shown.map((row)=><tr key={row.bits}><td>{row.bits}</td><td>{row.n}</td><td>{fmt3(locale,row.consistency)}</td><td><span className="oq-land-check" role="img" aria-label={t(locale,row.output===1?"landing.proof.output.yes":"landing.proof.output.no")}>{row.output===1?"✓":"×"}</span></td></tr>)}</tbody></table><div className="oq-land-cutoff">{t(locale,"landing.proof.cutoff")}</div></>}

function Workflow(){const [locale]=useLocale();const items:[string,DictKey,DictKey][]=[["01","landing.workflow.brief.title","landing.workflow.brief.desc"],["02","landing.workflow.decisions.title","landing.workflow.decisions.desc"],["03","landing.workflow.evidence.title","landing.workflow.evidence.desc"],["04","landing.workflow.pack.title","landing.workflow.pack.desc"]];return <section id="funktionen" className="oq-land-section"><p className="oq-land-kicker">{t(locale,"landing.workflow.eyebrow")}</p><h2 className="oq-land-heading">{t(locale,"landing.workflow.title")}</h2><p className="oq-land-intro">{t(locale,"landing.workflow.intro")}</p><ol className="oq-land-workflow">{items.map(([n,title,desc])=><li key={n}><span className="oq-land-workflow__num" aria-hidden>{n}</span><h3>{t(locale,title)}</h3><p>{t(locale,desc)}</p></li>)}</ol></section>}
function Validation(){const [locale]=useLocale();const rows:[string,DictKey,DictKey][]=[["23/25","landing.validation.matrix.title","landing.validation.matrix.body"],[locale==="de"?"86,3 %":"86.3%","landing.validation.deviations.title","landing.validation.deviations.body"],[locale==="de"?"≤ 0,01":"≤ 0.01","landing.validation.calibration.title","landing.validation.calibration.body"]];return <section id="validation" className="oq-land-validation"><div className="oq-land-section"><p className="oq-land-kicker">{t(locale,"landing.validation.eyebrow")}</p><h2 className="oq-land-heading">{t(locale,"landing.validation.title")}</h2><p className="oq-land-intro">{t(locale,"landing.validation.intro")}</p><div className="oq-land-record">{rows.map(([value,title,body])=><div key={title} className="oq-land-record__row"><span className="oq-land-record__value">{value}</span><span className="oq-land-record__title">{t(locale,title)}</span><p>{t(locale,body)}</p></div>)}</div><p className="oq-land-scope">{t(locale,"landing.validation.scope")}</p><div className="oq-land-links" aria-label={t(locale,"landing.validation.linksAria")}><a className="oq-land-link" href="https://github.com/brandi1409/openqca/blob/main/VALIDATION.md" target="_blank" rel="noreferrer">{t(locale,"landing.validation.linkRecord")}</a><a className="oq-land-link" href="https://github.com/brandi1409/openqca/blob/main/scripts/cross-validate.mjs" target="_blank" rel="noreferrer">{t(locale,"landing.validation.linkScript")}</a><Link className="oq-land-link" href="/methodik">{t(locale,"landing.validation.linkMethods")}</Link></div></div></section>}
function Compare(){const [locale]=useLocale();const rows:[DictKey,DictKey,DictKey,DictKey][]=[["landing.compare.start","landing.compare.start.openqca","landing.compare.start.fsqca","landing.compare.start.r"],["landing.compare.provenance","landing.compare.provenance.openqca","landing.compare.provenance.fsqca","landing.compare.provenance.r"],["landing.compare.evidence","landing.compare.evidence.openqca","landing.compare.evidence.fsqca","landing.compare.evidence.r"],["landing.compare.bridge","landing.compare.bridge.openqca","landing.compare.bridge.fsqca","landing.compare.bridge.r"],["landing.compare.scope","landing.compare.scope.openqca","landing.compare.scope.fsqca","landing.compare.scope.r"]];return <section className="oq-land-section"><p className="oq-land-kicker">{t(locale,"landing.compare.eyebrow")}</p><h2 className="oq-land-heading">{t(locale,"landing.compare.title")}</h2><p className="oq-land-intro">{t(locale,"landing.compare.intro")}</p><div className="oq-land-table" role="region" tabIndex={0} aria-label={t(locale,"landing.compare.tableAria")}><table><thead><tr><th>{t(locale,"landing.compare.dimension")}</th><th>openQCA</th><th>fsQCA 4</th><th>{t(locale,"landing.compare.colR")}</th></tr></thead><tbody>{rows.map(([label,a,b,c])=><tr key={label}><th scope="row">{t(locale,label)}</th><td>{t(locale,a)}</td><td>{t(locale,b)}</td><td>{t(locale,c)}</td></tr>)}</tbody></table></div><p className="oq-land-note">{t(locale,"landing.compare.note")}</p></section>}
function PricingBoundary(){const [locale]=useLocale();return <section className="oq-land-section"><p className="oq-land-kicker">{t(locale,"landing.pricing.eyebrow")}</p><h2 className="oq-land-heading">{t(locale,"landing.pricing.title")}</h2><p className="oq-land-intro">{t(locale,"landing.pricing.intro")}</p><div className="oq-land-pricing"><Tier label={t(locale,"landing.pricing.free.label")} name={t(locale,"landing.pricing.free.name")}>{t(locale,"landing.pricing.free.desc")}</Tier><Tier label={t(locale,"landing.pricing.cloud.label")} name={t(locale,"landing.pricing.cloud.name")}>{t(locale,"landing.pricing.cloud.desc")}</Tier></div><p className="oq-land-note">{t(locale,"landing.pricing.note")}</p><p><Link className="oq-land-link" href="/preise">{t(locale,"landing.pricing.details")}</Link></p></section>}
function Tier({label,name,children}:{label:string;name:string;children:ReactNode}){return <div className="oq-land-tier"><p className="oq-land-tier__label">{label}</p><h3>{name}</h3><p className="oq-land-tier__desc">{children}</p></div>}
function CtaBand(){const [locale]=useLocale();return <section className="oq-land-final"><div className="oq-land-section"><h2>{t(locale,"landing.cta.title")}</h2><p className="oq-land-intro">{t(locale,"landing.cta.sub")}</p><div className="oq-land-actions"><Cta href="/app" primary large>{t(locale,"landing.hero.ctaOwn")}</Cta><Cta href="/app?demo=1" large>{t(locale,"landing.hero.ctaDemo")}</Cta></div></div></section>}
function Cta({href,children,primary,large}:{href:string;children:ReactNode;primary?:boolean;large?:boolean}){return <Link href={href} className={`oq-btn ${primary?"oq-btn--primary":"oq-btn--secondary"}${large?" oq-btn--large":""}`}>{children}</Link>}
