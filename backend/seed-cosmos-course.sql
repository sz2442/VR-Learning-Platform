-- Idempotent seed: "The Grand Tour of the Cosmos" (Course Id=4)
-- Safe to run multiple times — uses ON CONFLICT (Id) DO NOTHING.
-- Run with:
--   docker compose exec -T postgres psql -U vrcourses_user -d vrcourses_db < backend/seed-cosmos-course.sql

SET client_min_messages TO WARNING;

-- ── Course ────────────────────────────────────────────────────────────────────
INSERT INTO public."Courses" ("Id","Title","ShortDescription","Description","ImageUrl","DurationMinutes","Difficulty","IsPublished","CreatedAt")
VALUES (4,'The Grand Tour of the Cosmos',
  'A cinematic journey through the Solar System, black holes, and the future of humanity in space — powered by Melodysheep visuals.',
  'Embark on an immersive journey across space and time using the breathtaking cinematic visuals of Melodysheep. This course explores our immediate cosmic neighborhood, the catastrophic life cycle of stars, and the ultimate destiny of human civilization among the stars. Through data-driven insights and interactive scenarios, you will master the fundamental physics governing our universe.',
  'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=800',
  120,'Intermediate',true,'2026-05-17 14:09:15.388438+00')
ON CONFLICT ("Id") DO NOTHING;

-- ── Modules ───────────────────────────────────────────────────────────────────
INSERT INTO public."Modules" ("Id","CourseId","Title","Description","OrderIndex") VALUES
(4,4,'Module 1 — The Solar System & Alien Worlds',
  'Explore the diverse celestial bodies within our solar system, from the scarred terrain of inner terrestrial planets to the violent atmospheres of the outer gas giants. This module breaks down planetary composition, gravitational dynamics, and extreme environments.',1),
(5,4,'Module 2 — Stars and Black Holes',
  'Investigate the lifecycle of stars, from slow-burning red dwarfs to catastrophic supernova explosions, culminating in the physics of black holes. Learn about spacetime curvature, horizons, and the ultimate Black Hole Era.',2),
(6,4,'Module 3 — Life Beyond',
  'Examine the technical hurdles and physical realities of human expansion beyond Earth. This module covers life support engineering, interplanetary transit physics, cosmic radiation protection, and planet-scale colonization.',3)
ON CONFLICT ("Id") DO NOTHING;

-- ── MiniQuizzes ───────────────────────────────────────────────────────────────
INSERT INTO public."MiniQuizzes" ("Id","ModuleId","PassingScore","IsRequired") VALUES
(4,4,70,true),(5,5,70,true),(6,6,70,true)
ON CONFLICT ("Id") DO NOTHING;

-- ── Lessons ───────────────────────────────────────────────────────────────────
INSERT INTO public."Lessons" ("Id","ModuleId","Title","ContentText","VideoUrl","OrderIndex") VALUES (7,4,'Terrestrial Worlds: Mars Canyons and Volcanic Io','## The Inner Frontiers of the Solar System

When examining the architecture of our solar system, a clear line of demarcation separates the inner rocky worlds from the massive gas giants of the outer realm. Terrestrial worlds are defined by their solid, silicate rock surfaces, metallic cores, and dynamic geological histories. Among these, **Mars** stands out as the ultimate destination for human exploration, boasting a surface scarred by ancient tectonic and hydrologic activity. The defining geological feature of the Red Planet is **Valles Marineris**, an immense canyon system stretching over 4,000 kilometers long, 200 kilometers wide, and up to 7 kilometers deep. To put this into perspective, Valles Marineris is nearly ten times longer and four times deeper than Earth''s Grand Canyon, formed primarily by crustal rifting and volcanic tectonics associated with the nearby Tharsis bulge.

### Extreme Volcanism on Io

Moving further out toward the Jovian system, we encounter **Io**, the innermost of the four Galilean moons of Jupiter. Io is the most geologically active body in the entire solar system, featuring over 400 active volcanoes that continuously reshape its surface with basaltic lava and sulfur compounds. This hyperactive volcanism is not driven by internal radioactive decay like Earth''s core, but by **tidal heating**. As Io orbits Jupiter in an eccentric path, it is caught in a gravitational tug-of-war between the immense mass of Jupiter and the neighboring moons Europa and Ganymede. This gravitational interaction causes Io''s crust to flex up and down by as much as 100 meters during its orbital cycle, generating enormous internal frictional heat that melts its mantle and powers continuous, spectacular eruptions.

### Comparing Rocky and Active Terrestrial Bodies

| Celestial Body | Primary Geological Feature | Dominant Surface Material | Atmosphere Composition | Driving Heat Source |
| :--- | :--- | :--- | :--- | :--- |
| **Mars** | Valles Marineris (Canyons) | Iron-rich Basalt, Regolith | 95% Carbon Dioxide | Ancient primordial heat |
| **Io (Moon)** | Loki Patera (Volcanic Plains) | Sulfur, Sulfur Dioxide, Basalt | Sulfur Dioxide (Tenuous) | Gravitational tidal heating |

Studying these environments provides critical insights into planetary evolution, showing how different energy inputs can completely transform solid rocky bodies.','https://www.youtube.com/watch?v=HTHj_pvEYYE',1) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO public."Lessons" ("Id","ModuleId","Title","ContentText","VideoUrl","OrderIndex") VALUES (8,4,'Gas Giants: Saturn''s Rings and Jupiter''s Storms','## Giants of Gas and Ice

Beyond the asteroid belt lie the true monsters of our stellar neighborhood: the gas giants **Jupiter** and **Saturn**. Unlike the solid terrestrial planets, these worlds lack a well-defined physical surface; instead, they transition smoothly from thick, hyper-pressurized hydrogen and helium atmospheres down into exotic states of liquid metallic hydrogen cores. **Jupiter**, the largest planet in our solar system, is a chaotic world dominated by high-velocity jet streams and ancient cyclonic storms. The most famous of these is the **Great Red Spot**, a gargantuan anticyclonic storm that has been raging for at least 300 years. Measuring wider than the entire planet Earth, this storm features winds clocking in at over 430 kilometers per hour, driven by internal heat rising from Jupiter''s core colliding with the rapid rotational forces of the planet.

### The Majestic Ring System of Saturn

Saturn, while similar to Jupiter in fluid composition, presents a vastly different visual profile due to its majestic **ring system**. Extending up to 282,000 kilometers from the planet but averaging an astonishingly thin 10 meters in thickness, these rings are composed of billions of individual particles. These particles range in size from microscopic dust grains to mountain-sized ice boulders, consisting of 99% pure water ice with trace amounts of rocky tholins. The structural integrity and gaps within the rings are maintained by **shepherd moons** like Prometheus and Pandora, which use their delicate gravitational influence to herd ring particles and clear paths, creating distinct divisions like the Cassini Division.

### Structural Differences of Jovian Worlds

- **Jupiter**: Boasts a massive gravitational well that shields the inner solar system by deflecting comets. Its intense magnetic field is 14 times stronger than Earth''s.
- **Saturn**: The least dense planet in the solar system; its average density is lower than water, meaning it would theoretically float in a giant ocean.
- **Atmospheric Banding**: Driven by rapid rotation (a Jovian day is only ~10 hours), creating powerful Coriolis forces that separate atmospheric gases into distinct dark belts and light zones.','https://www.youtube.com/watch?v=HTHj_pvEYYE',2) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO public."Lessons" ("Id","ModuleId","Title","ContentText","VideoUrl","OrderIndex") VALUES (9,4,'Planetary Demarcation: Terrestrial vs. Gas Giants','## Principles of Planetary Classification

The fundamental architectural split of our solar system into inner terrestrial planets and outer gas giants is a direct consequence of the **nebular hypothesis** and the mechanics of star formation. When our solar system formed 4.6 billion years ago from a rotating disk of gas and dust, temperature gradients determined what materials could condense where. Near the young Sun, temperatures were too high for volatile gases and ices to remain stable, leaving only heavy metals and silicates to coalesce into dense, rocky terrestrial worlds. Beyond the **frost line** — the boundary where water, ammonia, and methane could freeze — ices solidified, allowing proto-planets to rapidly grow massive enough to gravitationally capture huge envelopes of hydrogen and helium gas.

### Core Compositional Differences

Terrestrial planets possess a high bulk density because they are composed of heavy elements like iron, nickel, magnesium, and silicon. In contrast, gas giants have immense volumes but very low bulk densities, being composed almost entirely of the primordial light elements of the universe.

### Comparative Planetary Metrics

| Structural Metric | Terrestrial Planets (e.g., Earth, Mars) | Gas Giants (e.g., Jupiter, Saturn) |
| :--- | :--- | :--- |
| **Average Bulk Density** | High (3.9 – 5.5 g/cm³) | Low (0.7 – 1.3 g/cm³) |
| **Atmospheric Composition** | Secondary atmospheres (N₂, CO₂, O₂) | Primordial atmospheres (H₂, He) |
| **Moons & Rings** | Few or no moons, completely lack rings | Massive satellite systems, extensive rings |
| **Magnetic Fields** | Weak to moderate, generated by liquid metal cores | Extremely powerful, generated by metallic hydrogen |

This grand architectural split shows that planetary characteristics are deeply tied to their birth location relative to their parent star.','https://www.youtube.com/watch?v=HTHj_pvEYYE',3) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO public."Lessons" ("Id","ModuleId","Title","ContentText","VideoUrl","OrderIndex") VALUES (10,5,'Stellar Evolution: From Red Dwarfs to Supernovae','## The Lifecycle of Stars

A star''s destiny is entirely determined by its mass at the moment of its birth. Stars exist in a delicate state of **hydrostatic equilibrium**, where the inward crush of gravitational force is perfectly balanced by the outward thermal pressure generated by nuclear fusion in the star''s core. Low-mass stars, known as **red dwarfs**, are the ultra-marathon runners of the universe. Possessing between 8% and 50% of the Sun''s mass, these stars burn through their hydrogen fuel via nuclear fusion at an incredibly slow rate. Because they are fully convective — meaning hydrogen from the outer layers is continuously cycled into the core — they can maintain fusion for trillions of years, outliving every other class of celestial object in the cosmos.

### The Catastrophic Deaths of Massive Stars

In stark contrast, high-mass stars (those with more than 8 times the mass of our Sun) live fast and die spectacularly. These massive stars burn through their core hydrogen at an exponential rate, transitioning to fusing heavier elements like helium, carbon, neon, oxygen, and silicon. This process forms an elemental structure resembling the layers of an onion. The line of death for a massive star is reached when its core fuses silicon into **iron-56**. Fusing iron does not release energy; instead, it consumes energy. The moment iron fusion begins, the outward radiation pressure drops to zero instantly, causing the star''s core to collapse in less than a second and triggering a violent cosmic explosion known as a **Type II Supernova**.

### Comparing Stellar Lifecycle Pathways

| Stellar Classification | Initial Mass | Primary Fusion Product | Lifespan | Ultimate Remnant |
| :--- | :--- | :--- | :--- | :--- |
| **Red Dwarf** | 0.08 – 0.5 M☉ | Helium | Trillions of years | Helium White Dwarf |
| **Sun-like Star** | 0.5 – 8.0 M☉ | Carbon, Oxygen | ~10 billion years | Carbon-Oxygen White Dwarf |
| **Supermassive Star** | > 8.0 M☉ | Iron Core (Terminal) | Millions of years | Neutron Star or Black Hole |

These stellar deaths recycle heavy elements back into the interstellar medium, forming the raw materials for future generations of planets.','https://www.youtube.com/watch?v=uD4izuDMUQA',1) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO public."Lessons" ("Id","ModuleId","Title","ContentText","VideoUrl","OrderIndex") VALUES (11,5,'Black Holes: Event Horizons and Spacetime Curvature','## Understanding General Relativity

When a supermassive star undergoes a supernova explosion, if the remaining mass of the collapsed core exceeds approximately 3 solar masses (the **Tolman-Oppenheimer-Volkoff limit**), no force in the known universe can stop its collapse. The core compresses down to an infinitely small point of infinite density, warping the fabric of space and time to create a **black hole**. To understand the physics of a black hole, we must look to Albert Einstein''s **General Theory of Relativity**. Einstein demonstrated that gravity is not a traditional pulling force, but rather a geometric distortion. Mass warps the fabric of **spacetime**, much like a heavy bowling ball sinking into a flexible rubber sheet. A black hole represents a localized region where spacetime has been warped so severely that the exit pathways out of that space are completely closed.

### Anatomy of a Black Hole

The physical boundary surrounding a black hole is known as the **event horizon** — not a solid physical shell, but a mathematical threshold defined as the point where the required escape velocity exactly equals the speed of light. Because nothing can travel faster than light, any matter, radiation, or information that crosses this threshold is permanently cut off from the rest of the universe. The radius of this event horizon is directly proportional to its mass and is known as the **Schwarzschild radius**.

At the very center lies the **singularity**, the point where our current mathematical models of physics completely break down as volume approaches zero and density approaches infinity.

### Key Anatomic Boundaries

- **Singularity**: Infinitely dense point where spacetime curvature is infinite.
- **Event Horizon**: The point of no return; escape velocity exceeds the speed of light.
- **Photon Sphere**: A region outside the horizon where gravity forces photons to travel in circular orbits.
- **Ergosphere**: An asymmetrical region outside the horizon of a *rotating* black hole where spacetime itself is dragged along with the rotation.','https://www.youtube.com/watch?v=uD4izuDMUQA',2) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO public."Lessons" ("Id","ModuleId","Title","ContentText","VideoUrl","OrderIndex") VALUES (12,5,'The Deep Future: The Black Hole Era','## The Evolution of the Long-Term Universe

As the universe marches forward in time, it passes through distinct cosmological epochs. Currently, we live in the **Stelliferous Era**, an age where stars are continuously born, shine, and die. However, within approximately 100 trillion years, the universe will exhaust its supply of interstellar hydrogen gas, bringing an end to all star formation. The long-running red dwarf stars will slowly cool down into dark white dwarfs, leaving the cosmos completely dark. This transition marks the beginning of the **Degenerate Era**. Over immense stretches of time, all remaining cosmic matter will undergo radioactive proton decay, dissolving planets, cold stellar remnants, and dust into basic subatomic particles, leaving only one class of cosmic macroscopic structures intact: **black holes**.

### The Mechanics of Cosmic Evaporation

By the time the universe reaches 10^40 years into the future, it will enter the **Black Hole Era**. During this epoch, black holes will be the primary source of energy and matter concentration in the cosmos. Yet even these monstrous structures are not completely eternal. According to quantum field theory in curved spacetime, black holes slowly lose mass through a process discovered by Stephen Hawking called **Hawking radiation**. Quantum fluctuations continuously create virtual particle-antiparticle pairs near the event horizon. Occasionally, one particle falls in while the other escapes as real radiation, causing the black hole to slowly lose mass — eventually ending in a colossal final flash of gamma-ray radiation.

### Timeline of Cosmic Decline

1. **10^14 Years** — The final red dwarf exhausts its hydrogen fuel and goes dark.
2. **10^40 Years** — Proton decay completely disintegrates all atomic matter.
3. **10^67 Years** — Stellar-mass black holes evaporate via Hawking radiation.
4. **10^100 Years** — The largest supermassive black holes evaporate; the Dark Era begins.','https://www.youtube.com/watch?v=uD4izuDMUQA',3) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO public."Lessons" ("Id","ModuleId","Title","ContentText","VideoUrl","OrderIndex") VALUES (13,6,'Interplanetary Colonization: Mars Life Support Systems','## Engineering a Multiplanetary Species

Expanding human civilization to other worlds requires solving unprecedented engineering challenges to preserve life in environments that are actively hostile to terrestrial biology. **Mars** is the primary candidate for initial colonization, yet its environment presents severe survival hazards. The Martian atmosphere has an average surface pressure of only 0.61 kilopascals — less than 1% of Earth''s sea-level atmospheric pressure. This means humans cannot survive without a pressurized suit; without it, the boiling point of bodily fluids drops below normal body temperature, a threshold known as the **Armstrong Limit**. Furthermore, the Martian atmosphere is composed of 95% carbon dioxide, requiring advanced closed-loop life support systems to manufacture breathable air.

### Closed-Loop Life Support Engineering

To establish a permanent settlement, engineers must move away from open-loop configurations that require continuous resupply missions from Earth. A critical technology is the **Sabatier reactor**, which combines carbon dioxide extracted from the Martian atmosphere with hydrogen gas at high temperatures (400°C) over a nickel catalyst. This chemical reaction yields methane (CH₄) and water (H₂O). The water can then be split via electrolysis into hydrogen (fed back into the reactor) and pure oxygen (O₂) for the habitat''s life support.

### Critical Environmental Challenges on Mars

| Environmental Parameter | Earth Baseline | Mars Baseline | Human Hazard | Engineering Solution |
| :--- | :--- | :--- | :--- | :--- |
| **Atmospheric Pressure** | 101.3 kPa | 0.61 kPa | Tissue fluid boiling | Hermetically sealed habitats |
| **Atmospheric Composition** | 78% N₂, 21% O₂ | 95% CO₂ | Asphyxiation | MOXIE + Sabatier systems |
| **Surface Temperature** | +15°C average | −62°C average | Hypothermia | Nuclear RTGs, insulation |

Mastering these recycling loops is essential for ensuring early colonies can survive independently of Earth.','https://www.youtube.com/watch?v=SUelbSa-OkA',1) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO public."Lessons" ("Id","ModuleId","Title","ContentText","VideoUrl","OrderIndex") VALUES (14,6,'The Physics of Interstellar Travel','## Breaking Beyond the Heliopause

While settling Mars represents a monumental achievement, the long-term survival of humanity requires leaving our solar system entirely. The distances involved in **interstellar travel** are difficult to comprehend. The nearest stellar system, **Alpha Centauri**, is located 4.24 light-years away — roughly 40 trillion kilometers. Using current chemical rocket propulsion systems, it would take over 70,000 years to reach Alpha Centauri. To complete interstellar journeys within a single human lifetime, propulsion systems must achieve significant fractions of the speed of light (c).

### Next-Generation Deep Space Propulsion Concepts

Because traditional chemical fuels are far too heavy to be accelerated to relativistic speeds, scientists are designing alternative propulsion methods:

- **Nuclear Pulse Propulsion** — Detonating a series of small atomic charges behind a heavily shielded pusher plate to drive a massive spacecraft forward at high velocity.
- **Directed-Energy Laser Sails** — Instead of carrying fuel onboard, the spacecraft deploys an ultra-light, highly reflective graphene sail. A massive array of ground-based lasers shoots a high-powered beam at the sail, accelerating a micro-probe to 20% of the speed of light in just a few days.

### Relativistic Challenges

Traveling at high speeds through the interstellar medium introduces severe physical hazards:

- **Time Dilation**: According to special relativity, time slows down for travelers moving near the speed of light relative to observers on Earth, creating a stark age gap between astronauts and their home planet.
- **Interstellar Dust Erosion**: At 10–20% of the speed of light, colliding with a microscopic dust grain releases kinetic energy equivalent to an exploding artillery shell, requiring heavy forward shielding.
- **Cosmic Ray Hardening**: Deep space lacks solar wind protection, exposing electronics and human tissues to highly damaging galactic cosmic rays requiring thick hydrogen-rich shield walls.','https://www.youtube.com/watch?v=SUelbSa-OkA',2) ON CONFLICT ("Id") DO NOTHING;

INSERT INTO public."Lessons" ("Id","ModuleId","Title","ContentText","VideoUrl","OrderIndex") VALUES (15,6,'The Biology of Deep Space: Radiation and Gravity','## The Human Body in Deep Space

Space exploration is not merely an engineering challenge — it is an intense challenge of human biology. Leaving the protective magnetic field and thick atmosphere of Earth exposes the human body to two primary physiological disruptors: **ionizing space radiation** and **microgravity**. Earth''s magnetosphere deflects the vast majority of **Galactic Cosmic Rays (GCRs)** — high-energy protons and atomic nuclei traveling from deep space at near-light speeds. In deep space or on the surface of Mars (which lacks a global magnetic field), an astronaut receives a radiation dose up to hundreds of times higher than on Earth, significantly increasing lifetime cancer risk and damaging central nervous system functions.

### The Physiological Effects of Altered Gravity

Human physiology evolved to operate within a 1.0-g gravitational field. In microgravity environments, or low-gravity environments like the Moon (0.16-g) and Mars (0.38-g), the human body undergoes rapid structural degradation. Without the constant downward pull of gravity, bones lose calcium and density at a rate of 1–1.5% per month, a condition known as **space-induced osteopenia**. Concurrently, muscles undergo significant atrophy, and internal bodily fluids shift upward toward the chest and head, causing increased intracranial pressure and vision impairment.

### Physiological Changes and Countermeasures

To combat these severe biological degradation pathways, spacecraft designers must implement active countermeasures:

1. **Artificial Gravity** — Spinning a spacecraft along a central axis to generate a constant centrifugal force that mimics natural Earth gravity.
2. **Active Hydrogen Shielding** — Surrounding habitat walls with thick layers of water, liquid fuel, or specialized polyethylene plastic to absorb and deflect high-energy GCR protons.
3. **Resistive Exercise Protocols** — Enforcing rigorous daily training routines using high-resistance machines to simulate weight-bearing forces and slow bone loss.','https://www.youtube.com/watch?v=SUelbSa-OkA',3) ON CONFLICT ("Id") DO NOTHING;

-- ── Questions (mini quiz — per module) ───────────────────────────────────────
INSERT INTO public."Questions" ("Id","CourseId","Text","DifficultyLevel","Category","CreatedAt","QuestionType","DragDropDataJson","ModuleId","QuizType") VALUES
(82,4,'What physical mechanism is primarily responsible for powering the extreme volcanic eruptions observed on Jupiter''s moon Io?',4,'Solar System','2026-05-17 14:09:15.388438+00','mcq',NULL,4,'miniquiz'),
(83,4,'How does the massive canyon system Valles Marineris on Mars compare to Earth''s Grand Canyon?',3,'Solar System','2026-05-17 14:09:15.388438+00','mcq',NULL,4,'miniquiz'),
(84,4,'What rare physical state of matter inside Jupiter''s deep interior generates its immense magnetic field?',5,'Solar System','2026-05-17 14:09:15.388438+00','mcq',NULL,4,'miniquiz'),
(85,4,'Which chemical component makes up roughly 99% of the material found within Saturn''s ring system?',3,'Solar System','2026-05-17 14:09:15.388438+00','mcq',NULL,4,'miniquiz'),
(86,4,'Why did gas giants form exclusively beyond the solar system''s frost line according to the nebular hypothesis?',5,'Solar System','2026-05-17 14:09:15.388438+00','mcq',NULL,4,'miniquiz'),
(87,4,'Why do low-mass red dwarf stars possess lifespans extending for trillions of years compared to massive stars?',4,'Stars','2026-05-17 14:09:15.388438+00','mcq',NULL,5,'miniquiz'),
(88,4,'What elemental core threshold causes the catastrophic drop in radiation pressure that triggers a Type II Supernova?',5,'Stars','2026-05-17 14:09:15.388438+00','mcq',NULL,5,'miniquiz'),
(89,4,'According to Einstein''s General Theory of Relativity, what fundamentally causes the phenomenon we experience as gravity?',4,'Black Holes','2026-05-17 14:09:15.388438+00','mcq',NULL,5,'miniquiz'),
(90,4,'What mathematical relationship defines the size of a black hole''s event horizon (Schwarzschild radius)?',6,'Black Holes','2026-05-17 14:09:15.388438+00','mcq',NULL,5,'miniquiz'),
(91,4,'By what physical process do black holes slowly lose mass and eventually evaporate during the Black Hole Era?',5,'Black Holes','2026-05-17 14:09:15.388438+00','mcq',NULL,5,'miniquiz'),
(92,4,'What does the Armstrong Limit represent in aerospace medicine and planetary colonization?',4,'Colonization','2026-05-17 14:09:15.388438+00','mcq',NULL,6,'miniquiz'),
(93,4,'How does a closed-loop Sabatier reactor manufacture water and fuel using resources found on Mars?',5,'Colonization','2026-05-17 14:09:15.388438+00','mcq',NULL,6,'miniquiz'),
(94,4,'What is the primary engineering advantage of using a Directed-Energy Laser Sail over a traditional chemical rocket for interstellar travel?',4,'Interstellar Travel','2026-05-17 14:09:15.388438+00','mcq',NULL,6,'miniquiz'),
(95,4,'Which biological hazard is caused by long-term human exposure to microgravity or low-gravity space environments?',3,'Space Biology','2026-05-17 14:09:15.388438+00','mcq',NULL,6,'miniquiz'),
(96,4,'Which shielding material is most effective at absorbing high-energy Galactic Cosmic Ray (GCR) protons in deep space?',5,'Space Biology','2026-05-17 14:09:15.388438+00','mcq',NULL,6,'miniquiz')
ON CONFLICT ("Id") DO NOTHING;

-- ── Questions (final quiz — no module) ───────────────────────────────────────
INSERT INTO public."Questions" ("Id","CourseId","Text","DifficultyLevel","Category","CreatedAt","QuestionType","DragDropDataJson","ModuleId","QuizType") VALUES
(97,4,'What is the primary driving energy source behind the violent volcanic eruptions on Jupiter''s moon Io?',3,'Solar System','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz'),
(98,4,'How does Valles Marineris on Mars compare to Earth''s Grand Canyon?',3,'Solar System','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz'),
(99,4,'Why did gas giants form exclusively beyond the solar system''s frost line during planetary accretion?',5,'Solar System','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz'),
(100,4,'What physical threshold causes a massive star''s radiation pressure to drop to zero, triggering a Type II Supernova?',5,'Stars','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz'),
(101,4,'What mathematical boundary defines the point where a black hole''s escape velocity equals the speed of light?',4,'Black Holes','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz'),
(102,4,'By what quantum physical process do black holes slowly lose mass and eventually evaporate over time?',6,'Black Holes','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz'),
(103,4,'What happens to a human body exposed to atmospheric pressure below the Armstrong Limit without a pressurized suit?',4,'Colonization','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz'),
(104,4,'What chemical conversion occurs inside a closed-loop Sabatier reactor on Mars?',5,'Colonization','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz'),
(105,4,'Why are hydrogen-rich compounds preferred over lead for shielding astronauts from Galactic Cosmic Rays?',6,'Space Biology','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz'),
(106,4,'Which cosmological milestone marks the definitive end of the Stelliferous Era in our universe''s timeline?',7,'Cosmology','2026-05-17 14:09:15.388438+00','mcq',NULL,NULL,'finalquiz')
ON CONFLICT ("Id") DO NOTHING;

-- ── Answers ───────────────────────────────────────────────────────────────────
INSERT INTO public."Answers" ("Id","QuestionId","Text","IsCorrect") VALUES
(217,82,'Radioactive decay of unstable isotopes in its heavy metallic core',false),
(218,82,'Frictional tidal heating caused by gravitational interactions with Jupiter and nearby moons',true),
(219,82,'Solar radiation interacting with its volatile atmospheric sulfur dioxide layers',false),
(220,82,'Residual primordial heat trapped during the initial formation of the Jovian system',false),
(221,83,'It is roughly equal in length but twice as deep due to glacial erosion',false),
(222,83,'It is nearly ten times longer and four times deeper, formed by crustal rifting',true),
(223,83,'It is shorter but significantly wider, carved entirely by ancient massive flash floods',false),
(224,83,'It is a microscopic feature compared to the deep oceanic trenches of Earth',false),
(225,84,'Superheated molten iron-nickel alloys circulating in the outer mantle',false),
(226,84,'Highly compressed gaseous nitrogen ions operating under extreme Coriolis forces',false),
(227,84,'Liquid metallic hydrogen capable of conducting electrical currents',true),
(228,84,'Supercritical carbon dioxide acting as a hyper-dense planetary fluid',false),
(229,85,'Pure water ice particles with minor traces of rocky material',true),
(230,85,'Vaporized silicate crystals reflecting solar ultraviolet light',false),
(231,85,'Solidified carbon dioxide blocks formed past the solar frost line',false),
(232,85,'Metallic iron-nickel dust gathered from disrupted asteroid collisions',false),
(233,86,'The solar wind pushed all solid silicate rocks to the outer edges of the disk',false),
(234,86,'Temperatures were low enough for volatile compounds to freeze, allowing rapid gravitational capture of hydrogen gas',true),
(235,86,'Jupiter''s early magnetic field repelled all light elements away from the inner planets',false),
(236,86,'Heavy metals could only solidify in the cold outer regions far from the Sun',false),
(237,87,'They operate under a quantum mechanics principle that skips helium production entirely',false),
(238,87,'They are fully convective, slowly cycling hydrogen from outer layers into the core at an exceptionally slow burn rate',true),
(239,87,'Their massive gravitational pressure forces rapid fusion reactions that generate cooling dark matter',false),
(240,87,'They absorb heat from the surrounding interstellar medium to power their internal balance',false),
(241,88,'The fusion of carbon into heavy oxygen crystals',false),
(242,88,'The accumulation of iron-56 in the core, which consumes energy rather than releasing it during fusion',true),
(243,88,'The complete exhaustion of all radioactive uranium isotopes in the lower mantle',false),
(244,88,'A sudden expansion of superheated hydrogen gas into the outer stellar atmosphere',false),
(245,89,'An attractive magnetic force generated by spinning metallic atomic cores',false),
(246,89,'The geometric distortion and warping of the fabric of spacetime caused by mass and energy',true),
(247,89,'The exchange of theoretical subatomic graviton particles across an open electrical field',false),
(248,89,'Atmospheric pressure pushing solid objects down onto the planet''s surface',false),
(249,90,'It is inversely proportional to the speed of light cubed',false),
(250,90,'It is directly proportional to its mass, representing the boundary where escape velocity equals the speed of light',true),
(251,90,'It is determined by multiplying angular spin velocity by core temperature',false),
(252,90,'It shrinks exponentially as more matter crosses the photon sphere',false),
(253,91,'Frictional rubbing against surrounding dark matter structures',false),
(254,91,'Hawking radiation caused by quantum particle-antiparticle fluctuations near the event horizon',true),
(255,91,'Continuous gravitational leaking into higher unobservable cosmic dimensions',false),
(256,91,'Thermodynamic conduction of core thermal energy into the deep vacuum of space',false),
(257,92,'The maximum radiation dose a human body can absorb before acute organ failure',false),
(258,92,'The critical atmospheric pressure threshold below which bodily fluids boil at normal body temperature',true),
(259,92,'The exact speed fraction required to trigger noticeable relativistic time dilation',false),
(260,92,'The minimum gravitational force needed to prevent rapid bone calcium loss',false),
(261,93,'It crushes surface regolith rocks to release trapped liquid nitrogen molecules',false),
(262,93,'It combines atmospheric carbon dioxide with hydrogen at high temperatures over a catalyst to produce methane and water',true),
(263,93,'It uses solar ultraviolet rays to directly fuse nitrogen and oxygen gas bubbles',false),
(264,93,'It burns liquid iron dust inside an enclosed vacuum chamber to release oxygen',false),
(265,94,'It allows the spacecraft to completely ignore time dilation effects',false),
(266,94,'The propulsion energy source remains near Earth, removing the need to carry heavy fuel onboard',true),
(267,94,'It creates a protective anti-matter bubble that deflects high-energy cosmic rays',false),
(268,94,'It runs completely cold, avoiding detection by hostile deep space objects',false),
(269,95,'Rapid loss of bone density and calcium alongside significant muscle atrophy',true),
(270,95,'Sudden freezing of fluid layers inside the inner ear canals',false),
(271,95,'Exponential increase in blood iron levels causing liver failure',false),
(272,95,'Complete loss of skin pigmentation due to lack of direct sunlight',false),
(273,96,'Heavy solid lead plating, because of its dense atomic number',false),
(274,96,'Hydrogen-rich compounds such as water, polyethylene plastic, or liquid rocket fuels',true),
(275,96,'Thin sheets of pure copper alloy grounded to an electrical circuit',false),
(276,96,'Polished titanium panels reflecting solar ultraviolet wavelengths',false),
(277,97,'Solar radiation heating up its core sulfur deposits',false),
(278,97,'Frictional tidal heating caused by gravitational squeezing from Jupiter and nearby moons',true),
(279,97,'Radioactive breakdown of heavy uranium inside its lower crust',false),
(280,97,'Chemical interactions between surface methane and the atmosphere',false),
(281,98,'It is roughly equal in scale but carved entirely by glacial sheets',false),
(282,98,'It is nearly ten times longer and four times deeper, formed by tectonic rifting',true),
(283,98,'It is shorter but significantly wider due to constant dust storms',false),
(284,98,'It is a minor feature compared to Earth''s deep ocean trenches',false),
(285,99,'Solar winds pushed all solid metals out to the far edges of space',false),
(286,99,'Temperatures were cool enough for volatile ices to freeze, allowing rapid gravitational capture of hydrogen gas',true),
(287,99,'The Sun''s early magnetic field repelled light elements toward the inner core',false),
(288,99,'Heavy metals could only condense in freezing environments far from stars',false),
(289,100,'The complete exhaustion of all liquid helium layers in its upper core',false),
(290,100,'The fusion of silicon into iron-56, a process that consumes energy instead of releasing it',true),
(291,100,'A massive carbon explosion that blows away the outer stellar atmosphere',false),
(292,100,'The sudden formation of an icy outer shell blocking all internal heat',false),
(293,101,'The outer boundary of the photon sphere',false),
(294,101,'The Event Horizon, which is directly proportional to the black hole''s mass',true),
(295,101,'The center point of the infinitely compressed singularity',false),
(296,101,'The inner margin of the asymmetrical spinning ergosphere',false),
(297,102,'Thermodynamic conduction across dark matter clouds',false),
(298,102,'Hawking radiation caused by particle-antiparticle fluctuations near the event horizon',true),
(299,102,'Gravitational leaking into hidden macro-dimensions of space',false),
(300,102,'Continuous frictional interaction with cosmic background microwaves',false),
(301,103,'The skin undergoes instant freezing due to lack of direct sunlight',false),
(302,103,'Bodily fluids begin to boil at normal human body temperature',true),
(303,103,'The blood iron content solidifies because of high radiation levels',false),
(304,103,'Bones immediately lose all calcium and fracture under internal strain',false),
(305,104,'It crushes iron-rich basalt rock to extract pure liquid nitrogen gas',false),
(306,104,'It combines carbon dioxide with hydrogen at high temperatures to manufacture methane and water',true),
(307,104,'It uses solar UV radiation to break down carbon molecules into heavy silicon',false),
(308,104,'It mixes atmospheric nitrogen with surface ice to create rocket fuel',false),
(309,105,'Lead reacts chemically with oxygen to produce toxic habitat vapors',false),
(310,105,'Light hydrogen atoms absorb high-energy cosmic protons cleanly without generating dangerous secondary radiation',true),
(311,105,'Lead blocks the magnetic fields needed to run artificial gravity systems',false),
(312,105,'Polyethylene plastic creates an anti-gravity field that repels incoming dust',false),
(313,106,'The collapse of the Milky Way into a supermassive central black hole',false),
(314,106,'The complete exhaustion of interstellar hydrogen gas, causing the final red dwarf stars to go dark',true),
(315,106,'The onset of proton decay disintegrating all atomic matter structures',false),
(316,106,'The sudden evaporation of the final stellar-mass black hole via Hawking radiation',false)
ON CONFLICT ("Id") DO NOTHING;

-- ── Reset sequences so new rows don't collide ─────────────────────────────────
SELECT setval(pg_get_serial_sequence('"Courses"',  'Id'), GREATEST(nextval(pg_get_serial_sequence('"Courses"',  'Id')), 5));
SELECT setval(pg_get_serial_sequence('"Modules"',  'Id'), GREATEST(nextval(pg_get_serial_sequence('"Modules"',  'Id')), 7));
SELECT setval(pg_get_serial_sequence('"Lessons"',  'Id'), GREATEST(nextval(pg_get_serial_sequence('"Lessons"',  'Id')), 16));
SELECT setval(pg_get_serial_sequence('"MiniQuizzes"','Id'),GREATEST(nextval(pg_get_serial_sequence('"MiniQuizzes"','Id')), 7));
SELECT setval(pg_get_serial_sequence('"Questions"','Id'), GREATEST(nextval(pg_get_serial_sequence('"Questions"','Id')), 117));
SELECT setval(pg_get_serial_sequence('"Answers"',  'Id'), GREATEST(nextval(pg_get_serial_sequence('"Answers"',  'Id')), 317));
