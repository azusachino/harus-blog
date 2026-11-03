// Yinchun Pang — CV, the formal PDF. Build with `make cv` (writes public/cv.pdf,
// served at /cv.pdf). Content lives in src/data/cv.yaml, shared with /cv.

#let cv = yaml("/src/data/cv.yaml")
#let p = cv.profile

#set document(title: p.name + " — CV", author: p.name)
#set page(
  paper: "a4",
  margin: (x: 1.7cm, y: 1.5cm),
  footer: context text(size: 8.5pt, fill: luma(110))[
    Last updated #p.updated #h(1fr) #counter(page).display("1 / 1", both: true)
  ],
)
#set text(font: "Libertinus Serif", size: 10.5pt)
#set par(justify: false, leading: 0.6em)
#set list(indent: 0.4em, body-indent: 0.5em, spacing: 0.55em)

#let accent = rgb("#137a7f")
#let muted = luma(90)

#show heading.where(level: 1): it => block(above: 1.1em, below: 0.6em, sticky: true)[
  #set text(size: 11.5pt, weight: "bold", fill: accent)
  #upper(it.body)
  #v(-0.6em)
  #line(length: 100%, stroke: 0.5pt + accent)
]

// A bullet is a string, or (text, link: (text, href)) with link.text inside text.
#let rich(b) = {
  if type(b) == str { b } else {
    let parts = b.text.split(b.link.text)
    [#parts.at(0)#link(b.link.href)[#b.link.text]#parts.slice(1).join(b.link.text)]
  }
}

#let entry(r) = block(above: 0.9em, below: 0.5em, sticky: true)[
  #grid(
    columns: (1fr, auto),
    [*#r.title* #h(0.3em) · #h(0.3em) #r.org], align(right, text(fill: muted)[#r.period]),
  )
]

#let project(pr) = block(above: 0.8em, below: 0.35em, sticky: true)[
  #if "href" in pr { link(pr.href)[*#pr.name*] } else { [*#pr.name*] }
  #h(0.4em) #text(size: 9.5pt, fill: muted)[#pr.tag]
]

// ── Header ───────────────────────────────────────────────────────────────

#align(center)[
  #text(size: 21pt, weight: "bold")[#p.name] \
  #v(0.2em)
  #text(size: 10pt)[
    #p.headline \
    #link("mailto:" + p.email)[#p.email] · #p.phones.join(" · ") · Born #p.born \
    #link(p.github)[#p.github.trim("https://", at: start)] ·
    #link(p.linkedin)[#p.linkedin.trim("https://www.", at: start).trim("/", at: end)]
  ]
]

= Summary

#p.summary

= #cv.experience.title

#for r in cv.experience.roles [
  #entry(r)
  #for b in r.bullets [- #rich(b)]
]

= #cv.agents.title

#for pr in cv.agents.projects [
  #project(pr)
  - #pr.text
]

= #cv.systems.title

#for pr in cv.systems.projects [
  #project(pr)
  - #pr.text
]

= #cv.skills.title

#block(breakable: false, grid(
  columns: (auto, 1fr),
  column-gutter: 1em,
  row-gutter: 0.6em,
  ..cv.skills.rows.map(r => (
    [*#r.label*],
    if "href" in r { link(r.href)[#r.value] } else { r.value },
  )).flatten(),
))
