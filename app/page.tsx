import type { Metadata } from "next";
import { Barlow_Condensed, Inter } from "next/font/google";
import Link from "next/link";

import { PublicHomeFX } from "@/components/public-home-fx";
import { PublicHomeNav } from "@/components/public-home-nav";
import { PublicPricingPlans } from "@/components/public-pricing-plans";

import "./public-home.css";

const display = Barlow_Condensed({
  subsets: ["latin", "latin-ext"],
  weight: ["700", "800"],
  style: "italic",
  variable: "--font-display",
  display: "swap",
});

const body = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Akademia Sportive | Menaxhim SaaS për akademi sportive",
  description:
    "Një platformë e vetme për sportistët, ekipet, trajnerët, stërvitjet, performancën dhe financat e akademisë. Fillo me 7 ditë PRO falas.",
};

export default function HomePage() {
  return (
    <main className={`ph ${display.variable} ${body.variable}`}>
      <PublicHomeFX />
      <div className="prog"></div><div className="cur"></div>
      <PublicHomeNav />


      <section className="hero" data-hero>
      <div className="hero-bg" data-p=".18"><img data-depth="-14" src="/home/football.webp" alt="" /></div><div className="spot"></div><div className="gl"></div>
      <div className="c hero-g"><div>
      <span className="pill">7 ditë PRO falas për çdo akademi të re</span>
      <h1 className="hl"><span className="w w1"><i>Drejto</i></span> <span className="w w2"><i>akademinë.</i></span><br /><span className="w w3 acc"><i>Zhvillo</i></span> <span className="w w4 acc"><i>sportistët.</i></span></h1>
      <p className="lead">Një platformë e vetme për sportistët, ekipet, trajnerët, stërvitjet, performancën, financat dhe punën e përditshme të akademisë.</p>
      <div className="cta-r"><Link className="btn p mag" href="/apliko?plan=STARTER">Fillo me 7 ditë falas <span data-ic="arrow"></span></Link><a className="btn g mag" href="#platforma">Shiko si funksionon</a></div>
      <div className="ticks"><span><i data-ic="check"></i>Pa kartë pagese</span><span><i data-ic="check"></i>Role &amp; akses të kontrolluar</span><span><i data-ic="check"></i>Për akademi futbolli</span></div>
      </div>
      <div className="stage">
      <div className="lay l1" data-depth="26"><div className="glass fl"><div className="gh"><div><p className="gk">Akademia Sportive</p><p className="gt">Paneli i sotëm</p></div><span className="live">Live</span></div>
      <div className="kp"><div><small>Sportistë</small><b data-count="128">0</b></div><div><small>Ekipe</small><b data-count="12">0</b></div></div>
      <div className="bars" data-bars="46,72,58,88,66,94,82"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></div>
      <div className="lay l2" data-depth="48"><div className="glass fl"><div className="av">AK</div><p className="gt mt">Profili i sportistit</p><p className="gk">U15 · Mesfushor</p>
      <div className="pb" data-pb data-w="87%"><i></i></div><div className="row"><span>Rating</span><b>87</b></div><div className="row"><span>Prezenca</span><b>94%</b></div></div></div>
      <div className="lay l3" data-depth="14"><div className="glass fl"><p className="gk">Seanca e radhës</p><p className="gt">17:30 · U15 · Fusha 2</p><div className="pb" data-pb data-w="68%"><i></i></div><div className="row"><span>Pjesëmarrja</span><b>17 / 22</b></div></div></div>
      <div className="lay l4" data-depth="38"><div className="glass fl tc"><div className="ring" data-ring="94"><b>94%</b></div><p className="gk mt">Prezenca javore</p></div></div>
      </div></div><div className="scroll"></div></section>

      <div className="mq"><div><span>Futboll</span><span>Stërvitje</span><span>Ndeshje</span><span>Taktika</span><span>Skautim</span><span>Prezenca</span><span>Performanca</span><span>Akademi</span></div></div>

      <section className="sec"><div className="c"><div className="stats" data-r>
      <div className="st"><b data-count="7">0</b><span>ditë PRO falas për akademinë e re</span></div>
      <div className="st"><b data-count="9" data-s="+">0</b><span>module sportive dhe administrative</span></div>
      <div className="st"><b data-count="4">0</b><span>plane për çdo fazë të akademisë</span></div>
      <div className="st"><b>1<em>×</em></b><span>platformë për gjithë akademinë</span></div></div></div></section>

      <section className="sec pt0" id="sportet"><div className="c">
      <div data-r><span className="ey">Futboll</span><h2 className="h2">Një platformë.<br /><em>Çdo ekip.</em></h2><p className="lead">Ndërto një rrjedhë pune të qartë për stërvitjet, ndeshjet, sportistët dhe stafin e akademisë së futbollit.</p></div>
      <div className="sports">
      <article className="sc" data-r><img data-p=".12" src="/home/football.webp" alt="Stërvitje futbolli" />
      <div className="sc-m"><p className="gk">Ndeshja e fundit · U15</p><div className="score"><span>Ne</span><b>2</b><i>:</i><b>1</b><span>Kundër</span></div><div className="row"><span>Prezenca</span><b>94%</b></div></div>
      <div className="sc-in"><span className="no">Akademi futbolli</span><h3>Futboll</h3><div className="chips"><span>Formacione</span><span>Ndeshje</span><span>Prezenca</span><span>Skautim</span><span>Performanca</span><span>Kalendari</span></div></div></article>
      </div></div></section>

      <section className="sec" id="platforma"><div className="c">
      <div data-r><span className="ey">Platforma</span><h2 className="h2">Gjithçka që i duhet <em>akademisë.</em></h2><p className="lead">Një sistem i organizuar për punën sportive dhe administrative, nga fusha deri te zyra.</p></div>
      <div className="bento" id="funksionet">
      <div className="f big" data-r><div className="fi" data-tilt data-sp><span className="ic"><i data-ic="users"></i></span><h3>Sportistët &amp; ekipet</h3><p>Menaxho sportistët, ekipet dhe strukturën sportive nga një vend.</p><div className="stack"><i>AK</i><i>LM</i><i>ER</i><i>DB</i><i>+24</i></div></div></div>
      <div className="f" data-r data-d="1"><div className="fi" data-tilt data-sp><span className="ic"><i data-ic="calendar"></i></span><h3>Kalendari &amp; stërvitjet</h3><p>Planifiko seanca, ndeshje, ambiente dhe aktivitetet e akademisë.</p></div></div>
      <div className="f" data-r><div className="fi" data-tilt data-sp><span className="ic"><i data-ic="chart"></i></span><h3>Performanca</h3><p>Ndiq progresin dhe të dhënat sportive me një pamje të qartë.</p><div className="spark" data-bars="30,48,40,66,58,82,96"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div></div>
      <div className="f big" data-r data-d="1"><div className="fi" data-tilt data-sp><span className="ic"><i data-ic="heart"></i></span><h3>Profili fizik &amp; mjekësor</h3><p>Mbaj informacionin fizik dhe mjekësor të lidhur me sportistin.</p><div className="tags"><span>Gjatësia</span><span>Pesha</span><span>Dokumente</span><span>Historiku</span></div></div></div>
      <div className="f big" data-r data-d="2"><div className="fi" data-tilt data-sp><span className="ic"><i data-ic="target"></i></span><h3>Taktika &amp; skautim</h3><p>Organizo vlerësimet, kandidatët dhe punën taktike të stafit.</p><div className="tags"><span>4-3-3</span><span>Skautim</span><span>Vlerësime</span><span>Kandidatë</span></div></div></div>
      <div className="f" data-r><div className="fi" data-tilt data-sp><span className="ic"><i data-ic="building"></i></span><h3>Administrimi</h3><p>Menaxho ambientet, stafin, financat dhe proceset e përditshme.</p></div></div>
      </div></div></section>

      <section className="sec alt" id="taktika"><div className="c tac">
      <div data-r><span className="ey">Taktika</span><h2 className="h2">Taktika që lëviz <em>bashkë me ty.</em></h2><p className="lead">Planifiko formacionin, ndërro skemën me një klikim dhe ndaje me stafin dhe sportistët para çdo ndeshjeje.</p>
      <div className="fm"><button className="a" data-f="4-3-3">4-3-3</button><button data-f="4-4-2">4-4-2</button><button data-f="3-5-2">3-5-2</button></div></div>
      <div data-r data-d="2"><div className="pw" data-tilt><div className="pitch" data-pitch><b className="pm"></b><b className="ph-h"></b><b className="pc"></b><b className="bx1"></b><b className="bx2"></b></div></div></div>
      </div></section>

      <section className="sec"><div className="c">
      <div data-r><span className="ey">Si funksionon</span><h2 className="h2">Gati për <em>3 hapa.</em></h2></div>
      <div className="steps" data-steps>
      <div className="step" data-r><b>1</b><h3>Apliko &amp; provo</h3><p>Krijo llogarinë dhe provo funksionet PRO për 7 ditë, pa kartë pagese.</p></div>
      <div className="step" data-r data-d="2"><b>2</b><h3>Ndërto akademinë</h3><p>Shto ekipet, trajnerët dhe sportistët, pastaj cakto rolet dhe aksesin.</p></div>
      <div className="step" data-r data-d="4"><b>3</b><h3>Menaxho çdo ditë</h3><p>Stërvitje, ndeshje, prezencë, pagesa dhe komunikim në një sistem të vetëm.</p></div>
      </div></div></section>

      <PublicPricingPlans />

      <section className="fin"><img data-p=".1" src="/home/football.webp" alt="" /><div className="c" data-r><span className="ey">Apliko sot</span><h2 className="h2">Gati të <em>fillosh?</em></h2><p className="lead lt">Krijo llogarinë, provo funksionet PRO për 7 ditë dhe menaxho sportistët, ekipet, stërvitjet dhe pagesat në një sistem të vetëm.</p>
      <div className="cta-r"><Link className="btn p mag" href="/apliko">Apliko tani <span data-ic="arrow"></span></Link><a className="btn g mag" href="#planet">Shiko planet</a></div></div></section>

      <footer><div className="c"><div className="ft"><Link className="logo" href="/"><i data-ic="bolt"></i><span><b>Akademia Sportive</b><small>Platforma e menaxhimit</small></span></Link>
      <div className="fl2"><a href="#platforma">Platforma</a><a href="#taktika">Taktika</a><a href="#planet">Planet</a><Link href="/hyrje">Hyr</Link></div></div>
      <p className="cp">© 2026 Akademia Sportive. Të gjitha të drejtat e rezervuara.</p></div></footer>
    </main>
  );
}
