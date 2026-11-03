/* Highfield Egypt — Program Pricing
   Pricing rules:
   - Basic: 2,000 EGP
   - Intermediate: 4,000 EGP
   - Advanced: 8,000 EGP

   Automatic level assignment:
   - Titles containing "Advanced" or "Intensive" => Advanced
   - 5+ training days => Advanced
   - Titles containing "Basic" or "Fundamental(s)" => Basic
   - 3–4 training days => Intermediate
   - Otherwise => Basic
*/
(() => {
  "use strict";

  const programs = window.HIGHFIELD_PROGRAMS || [];
  const prices = {
    Basic: 2000,
    Intermediate: 4000,
    Advanced: 8000
  };

  function getPricing(program) {
    const title = String(program[1] || "").toLowerCase();
    const days = Number(program[4]) || 1;
    let level;

    if (/advanced|intensive/.test(title) || days >= 5) {
      level = "Advanced";
    } else if (/basic|fundamentals?/.test(title)) {
      level = "Basic";
    } else if (days >= 3) {
      level = "Intermediate";
    } else {
      level = "Basic";
    }

    return { level, price: prices[level] };
  }

  // Expose the exact same pricing calculation to the authenticated Learning Portal.
  window.HIGHFIELD_GET_PROGRAM_PRICE = getPricing;

  function addStyles() {
    if (document.getElementById("hf-program-pricing-styles")) return;

    const style = document.createElement("style");
    style.id = "hf-program-pricing-styles";
    style.textContent = `
      .hf-price-row {
        display:flex; align-items:center; justify-content:space-between;
        gap:12px; margin:0 0 18px; padding:13px 15px;
        border:1px solid rgba(97,160,255,.22); border-radius:12px;
        background:rgba(8,28,65,.58);
      }
      .hf-price-level {
        display:inline-flex; align-items:center; justify-content:center;
        padding:6px 11px; border-radius:999px; font-size:10px;
        font-weight:700; letter-spacing:.7px; text-transform:uppercase;
        border:1px solid rgba(120,170,230,.3);
        background:rgba(65,125,195,.14); color:#b9d9ff;
      }
      .hf-price-level.basic {
        color:#a9dfc0; background:rgba(45,150,95,.13);
        border-color:rgba(90,190,130,.3);
      }
      .hf-price-level.intermediate {
        color:#b9d9ff; background:rgba(55,125,210,.16);
        border-color:rgba(90,155,235,.3);
      }
      .hf-price-level.advanced {
        color:#e3c68f; background:rgba(180,130,55,.13);
        border-color:rgba(205,160,85,.3);
      }
      .hf-price-amount { color:#fff; font-size:19px; font-weight:700; white-space:nowrap; }
      .hf-detail-price {
        display:flex; align-items:center; gap:16px; width:max-content;
        max-width:100%; margin:24px 0; padding:17px 20px;
        border:1px solid rgba(97,160,255,.24); border-radius:14px;
        background:rgba(8,28,65,.65);
      }
      .hf-detail-price strong { color:#8fc4ff; font-size:25px; }
      @media(max-width:600px) {
        .hf-detail-price { width:100%; justify-content:space-between; }
        .hf-detail-price strong { font-size:22px; }
      }
    `;
    document.head.appendChild(style);
  }

  function decorateProgramCards() {
    const cards = document.querySelectorAll("#programCards .program-card");
    cards.forEach(card => {
      if (card.querySelector(".hf-price-row")) return;

      const title = card.querySelector("h2")?.textContent?.trim();
      const program = programs.find(item => item[1] === title);
      if (!program) return;

      const pricing = getPricing(program);
      const row = document.createElement("div");
      row.className = "hf-price-row";
      row.innerHTML = `
        <span class="hf-price-level ${pricing.level.toLowerCase()}">${pricing.level}</span>
        <strong class="hf-price-amount">${pricing.price.toLocaleString("en-EG")} EGP</strong>
      `;

      const intake = card.querySelector(".program-intake-mini");
      if (intake) card.insertBefore(row, intake);
      else card.appendChild(row);
    });
  }

  function decorateProgramDetails() {
    const titleElement = document.getElementById("programTitle");
    if (!titleElement) return;

    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    const program = programs.find(item => Number(item[0]) === id);
    if (!program) return;

    const pricing = getPricing(program);
    if (!document.getElementById("hfProgramPrice")) {
      const priceBox = document.createElement("div");
      priceBox.id = "hfProgramPrice";
      priceBox.className = "hf-detail-price";
      priceBox.innerHTML = `
        <span class="hf-price-level ${pricing.level.toLowerCase()}">${pricing.level}</span>
        <strong>${pricing.price.toLocaleString("en-EG")} EGP</strong>
      `;

      const actions = document.querySelector(".hero-actions");
      if (actions) actions.parentNode.insertBefore(priceBox, actions);
    }

    const facts = document.querySelector(".detail-facts");
    if (facts && !document.getElementById("hfDetailPricing")) {
      const detail = document.createElement("div");
      detail.id = "hfDetailPricing";
      detail.innerHTML = `
        <small>Program Level</small>
        <strong>${pricing.level}</strong>
        <small style="display:block;margin-top:12px">Program Fee</small>
        <strong>${pricing.price.toLocaleString("en-EG")} EGP</strong>
      `;
      facts.appendChild(detail);
    }

    const note = document.querySelector(".sticky-register > small");
    if (note) note.textContent = "The displayed fee is the standard program price. Contact our team for registration assistance.";
  }

  function init() {
    addStyles();
    decorateProgramCards();
    decorateProgramDetails();

    const cards = document.getElementById("programCards");
    if (cards) {
      const observer = new MutationObserver(() => decorateProgramCards());
      observer.observe(cards, { childList: true, subtree: true });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
