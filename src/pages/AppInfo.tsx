export const STORE = {
  appStore: "https://apps.apple.com/us/app/solorift/id6806668813",
  googlePlay: "https://play.google.com/store/apps/details?id=com.hiddenmangoltd.solorift&pcampaignid=web_share",
};

const base = import.meta.env.BASE_URL;
const shot = (name: string) => `${base}app/${name}.jpg`;

const FEATURES = [
  {
    title: "Goldfish",
    text: "One deck, no opponent. Draw, channel runes and play out your opening turns to learn a list's curve.",
    icon: "M6 4l12 6-12 6z",
  },
  {
    title: "Practice both sides",
    text: "Pilot two decks against each other on one board and check your lines against different matchups.",
    icon: "M7 4a3 3 0 110 6 3 3 0 010-6zm10 0a3 3 0 110 6 3 3 0 010-6zM1 18a6 6 0 0112 0zm10 0a6 6 0 0112 0z",
  },
  {
    title: "Full board state",
    text: "Battlefields, base, runes, trash, banish and hidden cards, with Stunned, Empowered, Buffed, Might and Damage markers.",
    icon: "M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z",
  },
  {
    title: "Draw odds",
    text: "See the chance of drawing the cards you need by a given turn, based on the copies left and the cards you've seen.",
    icon: "M12 2a10 10 0 110 20 10 10 0 010-20zm0 4v6l4 2",
  },
  {
    title: "Deck builder & import",
    text: "Build decks in the app or paste a list to import it. Each deck shows its legend, counts and format legality.",
    icon: "M4 6h12v12H4zm4-4h12v12h-2V4H8z",
  },
  {
    title: "Turn log & undo",
    text: "Every action is logged so you can review a turn, step back with undo, or reset the board and go again.",
    icon: "M4 6h16M4 12h16M4 18h10",
  },
];

const SHOTS = [
  { src: shot("home"), alt: "SoloRift home screen with Goldfish and Practice modes", caption: "Pick a mode", portrait: true },
  { src: shot("decks"), alt: "My Decks screen showing an imported Kennen deck marked legal", caption: "Your decks, ready to practise", portrait: true },
  { src: shot("practice"), alt: "Two-player practice board with runes, battlefields and status markers", caption: "Practice on the full board", portrait: false },
  { src: shot("odds"), alt: "Draw odds panel showing per-turn chances and a combined total", caption: "Check your draw odds", portrait: false },
];

const FAQ = [
  {
    q: "Is SoloRift free?",
    a: "Yes. The free tier includes two deck slots and a daily allowance of practice turns. Premium removes the deck limit and raises the daily turn allowance.",
  },
  {
    q: "Which devices are supported?",
    a: "iPhone and iPad through the App Store, and Android phones and tablets through Google Play.",
  },
  {
    q: "Can I import a deck list?",
    a: "Yes. Paste a text deck list into the Import screen and SoloRift builds the deck, checks its card counts and shows whether it's legal.",
  },
  {
    q: "Is this an official Riot Games product?",
    a: "No. SoloRift is an unofficial fan project. It isn't endorsed or sponsored by Riot Games.",
  },
];

export function AppInfo() {
  return (
    <article className="mx-auto max-w-5xl px-1 sm:px-0">
      {/* Hero */}
      <section className="grid items-center gap-10 py-6 sm:py-12 md:grid-cols-[1.15fr_1fr]">
        <div>
          <div className="flex items-center gap-4">
            <img src={`${base}logo-solorift.svg`} alt="" width={72} height={72} className="size-16 rounded-2xl shadow-lg sm:size-[72px]" />
            <div>
              <h1 className="font-display text-4xl font-bold leading-none sm:text-5xl">SoloRift</h1>
              <p className="mt-1 text-lg text-muted">A solo practice tool for Riftbound</p>
            </div>
          </div>
          <p className="mt-6 max-w-prose text-base leading-relaxed text-muted sm:text-lg">
            Test a deck, goldfish an opening, or play both sides of a matchup on a full Riftbound board. SoloRift tracks
            runes, battlefields, status markers and draw odds so you can practise anywhere, no opponent needed.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <AppStoreBadge />
            <GooglePlayBadge />
          </div>
          <p className="mt-4 text-xs text-faint">Free to download · Premium unlocks unlimited decks and more daily turns</p>
        </div>
        <div className="mx-auto w-full max-w-[280px] md:max-w-[300px]">
          <Phone src={shot("home")} alt="SoloRift home screen" priority />
        </div>
      </section>

      {/* Features */}
      <section aria-labelledby="features" className="py-10 sm:py-14">
        <h2 id="features" className="font-display text-2xl font-semibold sm:text-3xl">
          Everything you need to practise
        </h2>
        <p className="mt-2 max-w-prose text-muted">Built for Riftbound players who want reps between league nights.</p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.title} className="rounded-xl border border-app bg-surface p-5">
              <span className="inline-flex size-10 items-center justify-center rounded-lg bg-surface-2 text-accent">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={f.icon} />
                </svg>
              </span>
              <h3 className="mt-3 text-base font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">{f.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Screenshots */}
      <section aria-labelledby="screens" className="py-10 sm:py-14">
        <h2 id="screens" className="font-display text-2xl font-semibold sm:text-3xl">
          See it in action
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 sm:gap-8">
          {SHOTS.map((s) => (
            <figure key={s.src} className={s.portrait ? "" : "sm:col-span-2"}>
              <div className="overflow-hidden rounded-2xl border border-app bg-surface shadow-lg">
                <img src={s.src} alt={s.alt} loading="lazy" className="block w-full" width={s.portrait ? 414 : 900} height={s.portrait ? 900 : 414} />
              </div>
              <figcaption className="mt-2 text-center text-sm text-muted">{s.caption}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section aria-labelledby="pricing" className="py-10 sm:py-14">
        <h2 id="pricing" className="font-display text-2xl font-semibold sm:text-3xl">
          Free to start
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Tier
            name="Free"
            blurb="Everything you need to try it out."
            items={["Goldfish and two-player practice", "2 deck slots", "Deck list import and legality check", "Daily allowance of practice turns"]}
          />
          <Tier
            name="Premium"
            blurb="For players who practise every day."
            highlight
            items={["Everything in Free", "Unlimited decks", "More daily practice turns", "Supports ongoing development"]}
          />
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq" className="py-10 sm:py-14">
        <h2 id="faq" className="font-display text-2xl font-semibold sm:text-3xl">
          Questions
        </h2>
        <dl className="mt-8 divide-y divide-[var(--border)] rounded-xl border border-app bg-surface">
          {FAQ.map((f) => (
            <div key={f.q} className="p-5">
              <dt className="font-semibold">{f.q}</dt>
              <dd className="mt-1 text-sm leading-relaxed text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* CTA */}
      <section className="my-10 rounded-2xl border border-strong bg-surface-2 p-8 text-center sm:my-14 sm:p-12">
        <h2 className="font-display text-2xl font-semibold sm:text-3xl">Get SoloRift</h2>
        <p className="mx-auto mt-2 max-w-md text-muted">Available now on iPhone, iPad and Android.</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <AppStoreBadge />
          <GooglePlayBadge />
        </div>
      </section>

      <p className="mx-auto max-w-2xl pb-6 text-center text-xs leading-relaxed text-faint">
        SoloRift is an unofficial fan project for Riftbound: League of Legends Trading Card Game. It uses Riot Games-owned IP
        under Riot Games' "Legal Jibber Jabber" policy. Riot Games does not endorse or sponsor this project. Apple and the
        App Store are trademarks of Apple Inc. Google Play and the Google Play logo are trademarks of Google LLC.
      </p>
    </article>
  );
}

function Tier({ name, blurb, highlight, items }: { name: string; blurb: string; highlight?: boolean; items: string[] }) {
  return (
    <div className={`rounded-xl border p-6 ${highlight ? "border-[var(--accent)] bg-surface" : "border-app bg-surface"}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{name}</h3>
        {highlight && (
          <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider">Upgrade</span>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{blurb}</p>
      <ul className="mt-4 space-y-2 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 size-4 shrink-0 text-accent" fill="currentColor">
              <path d="M7.6 14.3L3.4 10l1.4-1.4 2.8 2.8 7.6-7.6 1.4 1.4z" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Phone({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="rounded-[2.4rem] border-[6px] border-[#1c2130] bg-black p-1 shadow-2xl ring-1 ring-white/10">
      <img
        src={src}
        alt={alt}
        width={414}
        height={900}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : undefined}
        className="block w-full rounded-[2rem]"
      />
    </div>
  );
}

/* Store badges, drawn to match the standard App Store / Google Play artwork. */

const badgeClass =
  "inline-flex h-[52px] items-center gap-2.5 rounded-lg border border-[#a6a6a6] bg-black px-3.5 text-white transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]";

export function AppStoreBadge() {
  return (
    <a href={STORE.appStore} target="_blank" rel="noopener noreferrer" aria-label="Download on the App Store" className={badgeClass}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7" fill="currentColor">
        <path d="M17.05 12.54c-.03-2.83 2.31-4.19 2.42-4.25-1.32-1.93-3.37-2.19-4.1-2.22-1.75-.18-3.41 1.03-4.3 1.03-.88 0-2.25-1-3.7-.98-1.9.03-3.66 1.1-4.64 2.81-1.98 3.43-.51 8.52 1.42 11.31.95 1.37 2.07 2.9 3.55 2.85 1.42-.06 1.96-.92 3.68-.92s2.21.92 3.71.89c1.53-.03 2.5-1.39 3.44-2.76 1.08-1.59 1.53-3.13 1.55-3.21-.03-.02-2.98-1.14-3.03-4.55zM14.22 4.22c.78-.95 1.31-2.27 1.17-3.58-1.13.05-2.49.75-3.3 1.7-.72.84-1.36 2.18-1.19 3.47 1.26.1 2.54-.64 3.32-1.59z" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[10px] tracking-wide">Download on the</span>
        <span className="mt-0.5 text-[19px] font-medium tracking-tight">App Store</span>
      </span>
    </a>
  );
}

export function GooglePlayBadge() {
  return (
    <a href={STORE.googlePlay} target="_blank" rel="noopener noreferrer" aria-label="Get it on Google Play" className={badgeClass}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-7">
        <defs>
          <linearGradient id="gp-a" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#00d7fe" />
            <stop offset="1" stopColor="#0e63b4" />
          </linearGradient>
          <linearGradient id="gp-b" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#ffd200" />
            <stop offset="1" stopColor="#ff8a00" />
          </linearGradient>
          <linearGradient id="gp-c" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff3a44" />
            <stop offset="1" stopColor="#c31162" />
          </linearGradient>
          <linearGradient id="gp-d" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor="#32a071" />
            <stop offset="1" stopColor="#00f076" />
          </linearGradient>
        </defs>
        <path fill="url(#gp-a)" d="M3.6 1.8a1 1 0 0 0-.6.92v18.56a1 1 0 0 0 .6.92L13.8 12z" />
        <path fill="url(#gp-b)" d="M17.7 8.1 20.5 9.72a1 1 0 0 1 0 1.73L17.7 13.9 15.2 12z" />
        <path fill="url(#gp-c)" d="M3.6 22.2 14.5 12.7l2.3 2.3-11.7 6.8a1 1 0 0 1-1.5-.6z" />
        <path fill="url(#gp-d)" d="M3.6 1.8 5.1 1.2 16.8 7.9l-2.3 2.3z" />
      </svg>
      <span className="flex flex-col leading-none">
        <span className="text-[10px] uppercase tracking-wide">Get it on</span>
        <span className="mt-0.5 text-[19px] font-medium tracking-tight">Google Play</span>
      </span>
    </a>
  );
}
