// Yinchun Pang — CV, the formal PDF. Build with `make cv` (writes public/cv.pdf,
// served at /cv.pdf). Content lives in src/data/cv.yaml, shared with /cv.

#let cv = yaml("/src/data/cv.yaml")
#let p = cv.profile

#let accent = rgb("#137a7f")
#let ink = luma(30)
#let muted = luma(100)

#set document(title: p.name + " — CV", author: p.name)
#set page(
  paper: "a4",
  margin: (x: 1.8cm, top: 1.6cm, bottom: 1.6cm),
  footer: context text(size: 8pt, fill: muted)[
    #p.name · CV #h(1fr) Last updated #p.updated #h(1fr)
    #counter(page).display("1 / 1", both: true)
  ],
)
#set text(font: "Libertinus Serif", size: 10pt, fill: ink)
#set par(justify: false, leading: 0.62em, spacing: 0.9em)
#set list(indent: 0.2em, body-indent: 0.55em, spacing: 0.7em, marker: text(fill: accent)[•])

#show heading.where(level: 1): it => block(above: 1.35em, below: 0.75em, sticky: true)[
  #set text(size: 10pt, weight: "bold", fill: accent, tracking: 0.08em)
  #upper(it.body)
  #v(-0.55em)
  #line(length: 100%, stroke: 0.5pt + accent.lighten(40%))
]

// A bullet is a string, or (text, link: (text, href)) with link.text inside text.
#let rich(b) = {
  if type(b) == str { b } else {
    let parts = b.text.split(b.link.text)
    [#parts.at(0)#link(b.link.href)[#underline(stroke: 0.4pt + accent, offset: 2pt)[#b.link.text]]#parts.slice(1).join(b.link.text)]
  }
}

#let role(r) = block(above: 1.1em, below: 0.6em, sticky: true)[
  #grid(
    columns: (1fr, auto),
    row-gutter: 0.3em,
    text(size: 10.5pt, weight: "bold")[#r.org], align(right, text(size: 9pt, fill: muted)[#r.period]),
    text(style: "italic", fill: muted)[#r.title], [],
  )
]

#let project(pr) = block(breakable: false)[
  #if "href" in pr { link(pr.href)[*#pr.name*] } else { [*#pr.name*] }
  #h(0.35em) #text(size: 8.5pt, fill: muted)[#pr.tag]
  #v(-0.35em)
  #text(size: 9.5pt)[#pr.text]
]

#let projects(list) = grid(
  columns: (1fr, 1fr),
  column-gutter: 1.4em,
  row-gutter: 1em,
  ..list.map(project),
)

// ── Header: name and role left, contact right ─────────────────────────────

#grid(
  columns: (1fr, auto),
  align: (left + bottom, right + bottom),
  [
    #text(size: 22pt, weight: "bold")[#p.name] \
    #v(0.1em)
    #text(size: 10.5pt, fill: accent)[#p.headline]
  ],
  text(size: 9pt, fill: muted)[
    #set par(leading: 0.5em)
    #link("mailto:" + p.email)[#p.email] \
    #p.phones.join(" · ") \
    #link(p.github)[#p.github.trim("https://", at: start)] ·
    #link(p.linkedin)[#p.linkedin.trim("https://www.", at: start).trim("/", at: end)] \
    Born #p.born
  ],
)
#v(0.3em)
#line(length: 100%, stroke: 0.8pt + accent)

#v(0.4em)
#p.summary

= #cv.experience.title

#for r in cv.experience.roles [
  #role(r)
  #for b in r.bullets [- #rich(b)]
]

= #cv.agents.title

#projects(cv.agents.projects)

= #cv.systems.title

#projects(cv.systems.projects)

= #cv.skills.title

#block(breakable: false, grid(
  columns: (auto, 1fr),
  column-gutter: 1.2em,
  row-gutter: 0.55em,
  ..cv.skills.rows.map(r => (
    text(weight: "bold", size: 9.5pt)[#r.label],
    text(size: 9.5pt)[#if "href" in r { link(r.href)[#r.value] } else { r.value }],
  )).flatten(),
))
