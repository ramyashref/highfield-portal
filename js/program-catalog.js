(() => {
  const data = window.HIGHFIELD_PROGRAMS || [];
  const cards = document.getElementById("programCards");
  const search = document.getElementById("programSearch");
  const specialty = document.getElementById("specialtyFilter");
  const count = document.getElementById("programCount");
  const empty = document.getElementById("noPrograms");

  const slugify = value => value.toLowerCase()
    .replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const getIntakeDate = () => {
    const now = new Date();
    let y = now.getFullYear(), m = now.getMonth();
    if (now.getDate() >= 25) m += 1;
    if (m > 11) { y += Math.floor(m / 12); m %= 12; }
    const base = new Date(2026, 7, 1);
    const candidate = new Date(y, m, 1);
    return candidate < base ? base : candidate;
  };

  const intake = getIntakeDate().toLocaleString("en-US", { month: "long", year: "numeric" });
  document.querySelectorAll("[data-intake-month]").forEach(el => el.textContent = intake);

  [...new Set(data.map(p => p[2]))].sort().forEach(value => {
    const option = document.createElement("option");
    option.value = option.textContent = value;
    specialty.appendChild(option);
  });

  function card(program) {
    const [id, title, category, audience, days] = program;
    const slug = slugify(title);
    return `<article class="program-card glass">
      <div class="program-card-top">
        <span class="program-category">${category}</span>
        <span class="program-number">${String(id).padStart(3, "0")}</span>
      </div>
      <h2>${title}</h2>
      <p>${audience}</p>
      <div class="program-card-meta">
        <span>◉ Online</span><span>⌂ On-site</span><span>${days} ${days === 1 ? "day" : "days"}</span>
      </div>
      <div class="program-intake-mini"><small>Next Intake</small><strong>${intake}</strong></div>
      <div class="program-card-actions">
        <a class="btn" href="program.html?id=${id}&program=${slug}">View Program</a>
        <a class="card-whatsapp" target="_blank" rel="noopener" href="https://wa.me/201101669115?text=${encodeURIComponent(`Hello Highfield Egypt, I would like to inquire about the ${title} program – ${intake} intake.`)}">WhatsApp</a>
      </div>
    </article>`;
  }

  function render() {
    const term = search.value.trim().toLowerCase();
    const selected = specialty.value;
    const filtered = data.filter(p => {
      const haystack = `${p[1]} ${p[2]} ${p[3]}`.toLowerCase();
      return (!selected || p[2] === selected) && (!term || haystack.includes(term));
    });
    count.textContent = filtered.length;
    cards.innerHTML = filtered.map(card).join("");
    empty.hidden = filtered.length !== 0;
  }

  search.addEventListener("input", render);
  specialty.addEventListener("change", render);
  render();
})();