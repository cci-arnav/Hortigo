/* ==========================================================================
   HortiGo — script.js
   Vanilla JS only. No build step, no dependencies.
   ========================================================================== */

/* --------------------------------------------------------------------------
   GOOGLE FORM CONFIGURATION
   --------------------------------------------------------------------------
   Fill in the real Google Form URL and entry IDs here once available.
   Everything that talks to Google Forms reads from this single object —
   no URLs or entry IDs are hardcoded anywhere else in the codebase.

   To find entry IDs: open your Google Form, click "Get pre-filled link",
   fill in dummy values, click "Get link", and inspect the generated URL —
   each field appears as entry.XXXXXXXXX=value.
-------------------------------------------------------------------------- */
const FORM_CONFIG = {
  farmer: {
    baseUrl: "GOOGLE_FORM_URL_HERE", // e.g. https://docs.google.com/forms/d/e/XXXXXXX/viewform
    fields: {
      name: "ENTRY_ID_NAME",
      phone: "ENTRY_ID_PHONE",
      email: "ENTRY_ID_EMAIL",
      location: "ENTRY_ID_LOCATION",
      farmName: "ENTRY_ID_FARM_NAME",
      polyhouseArea: "ENTRY_ID_POLYHOUSE_AREA",
      crops: "ENTRY_ID_CROPS",
      productionStage: "ENTRY_ID_PRODUCTION_STAGE",
      buyerInterest: "ENTRY_ID_BUYER_INTEREST"
    }
  },
  buyer: {
    baseUrl: "GOOGLE_FORM_URL_HERE",
    fields: {
      name: "ENTRY_ID_NAME",
      organization: "ENTRY_ID_ORGANIZATION",
      organizationType: "ENTRY_ID_ORG_TYPE",
      email: "ENTRY_ID_EMAIL",
      phone: "ENTRY_ID_PHONE",
      location: "ENTRY_ID_LOCATION",
      interest: "ENTRY_ID_INTEREST",
      message: "ENTRY_ID_MESSAGE"
    }
  }
};

/**
 * Builds a Google Forms "prefilled" URL from a config entry and a plain
 * object of form values. Falls back gracefully (logs + returns null) if
 * the config hasn't been filled in yet, so the site never breaks before
 * the real form is wired up.
 */
function buildPrefilledUrl(configKey, values) {
  const config = FORM_CONFIG[configKey];
  if (!config || !config.baseUrl || config.baseUrl === "GOOGLE_FORM_URL_HERE") {
    console.warn(`[HortiGo] Google Form URL for "${configKey}" is not configured yet.`);
    return null;
  }
  const url = new URL(config.baseUrl);
  Object.entries(config.fields).forEach(([fieldKey, entryId]) => {
    if (!entryId || entryId.startsWith("ENTRY_ID_")) return;
    const value = values[fieldKey];
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(`entry.${entryId}`, value);
    }
  });
  return url.toString();
}

document.addEventListener("DOMContentLoaded", () => {
  /* ------------------------------------------------------------------ */
  /* Footer year                                                        */
  /* ------------------------------------------------------------------ */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ------------------------------------------------------------------ */
  /* Sticky navbar shadow on scroll                                     */
  /* ------------------------------------------------------------------ */
  const navbar = document.getElementById("navbar");
  const onScroll = () => {
    if (window.scrollY > 12) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ------------------------------------------------------------------ */
  /* Mobile menu                                                        */
  /* ------------------------------------------------------------------ */
  const navToggle = document.getElementById("navToggle");
  const mobileMenu = document.getElementById("mobileMenu");

  function closeMobileMenu() {
    navToggle.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    mobileMenu.classList.remove("open");
    document.body.style.overflow = "";
  }
  function openMobileMenu() {
    navToggle.classList.add("open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    mobileMenu.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  function toggleMobileMenu() {
    const isOpen = mobileMenu.classList.contains("open");
    isOpen ? closeMobileMenu() : openMobileMenu();
  }
  navToggle.addEventListener("click", () => {
    toggleMobileMenu();
  });
  mobileMenu.querySelectorAll("a.nav-item").forEach(link => {
    link.addEventListener("click", closeMobileMenu);
  });
  mobileMenu.querySelectorAll("[data-open-modal]").forEach(button => {
    button.addEventListener("click", closeMobileMenu);
  });
  document.addEventListener("click", event => {
    if (!mobileMenu.classList.contains("open")) return;
    if (!mobileMenu.contains(event.target) && !navToggle.contains(event.target)) {
      closeMobileMenu();
    }
  });
  window.addEventListener("resize", () => {
    if (window.innerWidth > 1120) closeMobileMenu();
  }, { passive: true });

  /* ------------------------------------------------------------------ */
  /* Active nav link tracking (single-active, based on section in view) */
  /* ------------------------------------------------------------------ */
  const navAnchors = Array.from(document.querySelectorAll("nav a.nav-item, .mobile-menu a.nav-item"));
  const sectionIds = navAnchors
    .map(a => a.getAttribute("href"))
    .filter(href => href && href.startsWith("#"))
    .map(href => href.slice(1));
  const sections = sectionIds
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function setActiveNav(id) {
    navAnchors.forEach(a => {
      const isMatch = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("active", isMatch);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(
      entries => {
        // Pick the entry closest to the top of the viewport that is intersecting.
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveNav(visible[0].target.id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(sec => navObserver.observe(sec));
  }

  /* ------------------------------------------------------------------ */
  /* Modals (Farmer registration / Buyer & Partner registration)        */
  /* ------------------------------------------------------------------ */
  const openers = document.querySelectorAll("[data-open-modal]");
  const closers = document.querySelectorAll("[data-close-modal]");
  let lastFocusedEl = null;

  function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return;
    lastFocusedEl = document.activeElement;
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    const firstInput = modal.querySelector("input, select, textarea, button");
    if (firstInput) firstInput.focus({ preventScroll: true });
  }
  function closeModal(modal) {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    if (lastFocusedEl) lastFocusedEl.focus({ preventScroll: true });
  }

  openers.forEach(btn => {
    btn.addEventListener("click", () => {
      closeMobileMenu();
      openModal(btn.getAttribute("data-open-modal"));
    });
  });
  closers.forEach(btn => {
    btn.addEventListener("click", () => closeModal(btn.closest(".modal-overlay")));
  });
  document.querySelectorAll(".modal-overlay").forEach(overlay => {
    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeModal(overlay);
    });
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      closeMobileMenu();
      document.querySelectorAll(".modal-overlay.open").forEach(closeModal);
    }
  });

  /* ------------------------------------------------------------------ */
  /* Form submit -> build Google Forms prefill URL -> redirect          */
  /* ------------------------------------------------------------------ */
  function handleFormSubmit(formEl, configKey, fieldMap) {
    formEl.addEventListener("submit", e => {
      e.preventDefault();

      if (!formEl.checkValidity()) {
        formEl.reportValidity();
        return;
      }

      const data = new FormData(formEl);
      const values = {};
      Object.keys(fieldMap).forEach(key => {
        values[key] = (data.get(fieldMap[key]) || "").toString().trim();
      });

      const prefillUrl = buildPrefilledUrl(configKey, values);

      if (prefillUrl) {
        window.open(prefillUrl, "_blank", "noopener");
      } else {
        // Google Form not configured yet — don't dead-end the user.
        alert(
          "Thanks! Registration is being finalized — this form will connect to our Google Form shortly. " +
          "Your details have not been saved yet."
        );
      }
    });
  }

  const farmerForm = document.getElementById("farmerForm");
  if (farmerForm) {
    handleFormSubmit(farmerForm, "farmer", {
      name: "name",
      phone: "phone",
      email: "email",
      location: "location",
      farmName: "farmName",
      polyhouseArea: "polyhouseArea",
      crops: "crops",
      productionStage: "productionStage",
      buyerInterest: "buyerInterest"
    });
  }

  const buyerForm = document.getElementById("buyerForm");
  if (buyerForm) {
    handleFormSubmit(buyerForm, "buyer", {
      name: "name",
      organization: "organization",
      organizationType: "organizationType",
      email: "email",
      phone: "phone",
      location: "location",
      interest: "interest",
      message: "message"
    });
  }

  /* ------------------------------------------------------------------ */
  /* Roadmap tabs                                                       */
  /* ------------------------------------------------------------------ */
  const rmTabs = document.querySelectorAll(".rm-tab");
  const rmPanels = document.querySelectorAll(".rm-panel");
  rmTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      rmTabs.forEach(t => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      rmPanels.forEach(p => p.classList.toggle("active", p.id === target));
    });
  });

  /* ------------------------------------------------------------------ */
  /* Scroll reveal (IntersectionObserver, lightweight)                  */
  /* ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll(".reveal, .hiw-step");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
    );
    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("in-view"));
  }
});
