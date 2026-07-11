// Builds the hero marquee and the filterable results gallery from MATERIALS
// (static/materials/materials.js). Sprite sheets are fetched only on first
// hover; page load costs only the stills.

(function () {
  const STILL = (m) => `./static/materials/stills/${m.slug}.webp`;
  const SPRITE = (m) => `./static/materials/sprites/${m.slug}.webp`;

  // README-designated hero picks, shown first in the marquee.
  const HERO_SLUGS = [
    "purple_crystal_stone",
    "stained_glass_with_dark_lead_cames",
    "glacier_ice_deep_blue_with_internal_fractures",
    "iridescent_keeled_snake_scales",
    "red_volcanic_crust_dark_basalt_with_glowing_oran",
    "photovoltaic_solar_panel_dark_blue_silicon_cells",
    "golden_waffle_with_deep_square_pockets",
    "crinkled_gold_leaf_imperfect_and_torn",
    "rough_oak_bark_with_deep_vertical_fissures",
    "perforated_anodized_speaker_grille",
  ];

  const CATEGORY_LABELS = {
    rock_mineral: "Rock & Mineral",
    metal: "Metal",
    fabric: "Fabric",
    food: "Food",
    fruit_vegetable: "Fruit & Vegetable",
    organic_bio: "Organic",
    ice_snow: "Ice & Snow",
    glass_liquid: "Glass & Liquid",
    ceramic_plaster: "Ceramic & Plaster",
    tech_scifi: "Tech & Sci-Fi",
    wood: "Wood",
    paper: "Paper",
    ground_terrain: "Ground & Terrain",
    paving_masonry: "Paving & Masonry",
    leather_hide: "Leather & Hide",
  };

  const INITIAL_COUNT = 24;

  // Lazy sprite loading: the sheet is fetched once, on first hover/tap, then
  // swapped in. On leave the still comes back.
  function armSpin(el, m) {
    let armed = false;

    const start = () => {
      const go = () => {
        el.style.backgroundImage = `url("${SPRITE(m)}")`;
        el.classList.add("spin");
      };
      if (!armed) {
        armed = true;
        const pre = new Image();
        pre.onload = go;
        pre.src = SPRITE(m);
      } else {
        go();
      }
    };

    const stop = () => {
      el.classList.remove("spin");
      el.style.backgroundImage = `url("${STILL(m)}")`;
    };

    const holder = el.parentElement;
    holder.addEventListener("mouseenter", start);
    holder.addEventListener("mouseleave", stop);
    // Touch devices have no hover: tap toggles the spin.
    holder.addEventListener("touchstart", () => {
      el.classList.contains("spin") ? stop() : start();
    }, { passive: true });
  }

  function makeArt(m) {
    const art = document.createElement("div");
    art.className = "art";
    art.style.setProperty("--n", m.frames);
    art.style.backgroundImage = `url("${STILL(m)}")`;
    return art;
  }

  /* ---------------- Marquee ---------------- */

  // 2 rows x 20 keeps the hero compact — the full catalog lives in the
  // gallery — and each track well under GPU layer size limits (the doubled
  // track is ~8k px; >16k px layers glitch on many devices).
  const MARQUEE_ROWS = 2;
  const MARQUEE_PER_ROW = 20;

  function buildMarquee() {
    const host = document.getElementById("marquee-rows");
    if (!host) return;

    // Heroes first, then an even spread of the rest, dealt round-robin.
    const heroSet = new Set(HERO_SLUGS);
    const heroes = HERO_SLUGS
      .map((s) => MATERIALS.find((m) => m.slug === s))
      .filter(Boolean);
    const rest = MATERIALS.filter((m) => !heroSet.has(m.slug));
    const budget = MARQUEE_ROWS * MARQUEE_PER_ROW - heroes.length;
    const stride = Math.max(1, Math.floor(rest.length / budget));
    const spread = [];
    for (let i = 0; i < rest.length && spread.length < budget; i += stride) {
      spread.push(rest[i]);
    }
    const ordered = heroes.concat(spread);

    const rows = Array.from({ length: MARQUEE_ROWS }, () => []);
    ordered.forEach((m, i) => rows[i % MARQUEE_ROWS].push(m));

    rows.forEach((mats) => {
      const row = document.createElement("div");
      row.className = "row";
      // ~2.6 s per item keeps every row at the same apparent speed.
      row.style.setProperty("--dur", `${Math.round(mats.length * 2.6)}s`);

      const track = document.createElement("div");
      track.className = "track";

      // Two copies of the content; the track translates by exactly -50%, so
      // the loop is seamless. The duplicate is decoration only.
      for (let copy = 0; copy < 2; copy++) {
        for (const m of mats) {
          const ball = document.createElement("div");
          ball.className = "ball";
          if (copy === 1) ball.setAttribute("aria-hidden", "true");

          const art = makeArt(m);
          const name = document.createElement("div");
          name.className = "name";
          name.textContent = m.title;

          ball.appendChild(art);
          ball.appendChild(name);
          track.appendChild(ball);
          armSpin(art, m);
        }
      }

      row.appendChild(track);
      host.appendChild(row);
    });
  }

  /* ---------------- Gallery ---------------- */

  let activeCategory = "all";
  let expanded = false;

  function visibleMaterials() {
    const mats = activeCategory === "all"
      ? MATERIALS
      : MATERIALS.filter((m) => m.category === activeCategory);
    return expanded || activeCategory !== "all"
      ? mats
      : mats.slice(0, INITIAL_COUNT);
  }

  function renderGrid() {
    const grid = document.getElementById("material-grid");
    grid.innerHTML = "";

    for (const m of visibleMaterials()) {
      const card = document.createElement("div");
      card.className = "mat-card";
      card.title = `prompt: ${m.prompt}`;

      const art = makeArt(m);
      const name = document.createElement("div");
      name.className = "name";
      name.textContent = m.title;

      card.appendChild(art);
      card.appendChild(name);
      grid.appendChild(card);
      armSpin(art, m);
    }

    const more = document.getElementById("gallery-more");
    more.style.display =
      activeCategory === "all" && !expanded ? "" : "none";
  }

  function buildChips() {
    const host = document.getElementById("filter-chips");
    if (!host) return;

    const counts = {};
    for (const m of MATERIALS) counts[m.category] = (counts[m.category] || 0) + 1;

    const chips = [["all", `All (${MATERIALS.length})`]];
    for (const [key, label] of Object.entries(CATEGORY_LABELS)) {
      if (counts[key]) chips.push([key, `${label} (${counts[key]})`]);
    }

    for (const [key, label] of chips) {
      const btn = document.createElement("button");
      btn.className = "chip" + (key === "all" ? " active" : "");
      btn.textContent = label;
      btn.addEventListener("click", () => {
        activeCategory = key;
        host.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        renderGrid();
      });
      host.appendChild(btn);
    }
  }

  function buildGallery() {
    if (!document.getElementById("material-grid")) return;
    buildChips();
    renderGrid();

    document.getElementById("show-all-btn").addEventListener("click", () => {
      expanded = true;
      renderGrid();
    });
  }

  if (typeof MATERIALS !== "undefined") {
    buildMarquee();
    buildGallery();
  }
})();
