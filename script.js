/* ==========================================================================
   HortiGo — script.js
   Vanilla JS only. No build step, no dependencies.
   ========================================================================== */

/* --------------------------------------------------------------------------
   GOOGLE FORM CONFIGURATION
   --------------------------------------------------------------------------
   Centralized configuration object for Google Forms integration.
   All entry IDs and URLs are defined here.
   URLSearchParams automatically handles special characters, spaces, Hindi text.
-------------------------------------------------------------------------- */
const FORM_CONFIG = {
  farmer: {
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSfPi_VdyjSsqbRE29vk625EI3OXPhrhIK5eEZO6Har9556aUw/viewform",
    fields: {
      name: "2005620554",
      phone: "1166974658",
      email: "1045781291",
      location: "1065046570",
      farmName: "638734931",
      polyhouseArea: "839337160",
      productionStage: "226093879",
      crops: "720150919",
      buyerInterest: "161799916",
      consent: "1223456335",
    },
  },
  buyer: {
    baseUrl: "https://docs.google.com/forms/d/e/1FAIpQLSf_UETLjiJ6xk7LqLh9192-yr8PEdjZ6GsBUIv99hjlqHb79A/viewform",
    fields: {
      name: "2005620554",
      organization: "1003471167",
      organizationType: "1204867441",
      email: "1045781291",
      phone: "1166974658",
      location: "1065046570",
      interest: "839337160",
      message: "851211234",
    },
  },
};

/* --------------------------------------------------------------------------
   FORM DATA PERSISTENCE (sessionStorage)
   Stores form values during the session so users don't lose data on reload.
-------------------------------------------------------------------------- */
function saveFormData(formId, formEl) {
  const data = new FormData(formEl);
  const values = {};
  for (let [key, value] of data) {
    values[key] = value;
  }
  sessionStorage.setItem(`hortigo_form_${formId}`, JSON.stringify(values));
}

function loadFormData(formId, formEl) {
  const stored = sessionStorage.getItem(`hortigo_form_${formId}`);
  if (!stored) return;
  
  try {
    const values = JSON.parse(stored);
    Object.entries(values).forEach(([key, value]) => {
      const field = formEl.querySelector(`[name="${key}"]`);
      if (field) {
        if (field.type === "checkbox") {
          field.checked = value === "on" || value === true;
        } else {
          field.value = value;
        }
      }
    });
  } catch (e) {
    console.error("Failed to restore form data:", e);
  }
}

function clearFormData(formId) {
  sessionStorage.removeItem(`hortigo_form_${formId}`);
}

/**
 * Builds a Google Forms prefilled URL from config and form values.
 * Uses URLSearchParams to automatically handle special characters, spaces, Hindi text, etc.
 * 
 * @param {string} configKey - "farmer" or "buyer"
 * @param {Object} values - form field values
 * @returns {string|null} prefilled URL or null if not configured
 */
function buildPrefilledUrl(configKey, values) {
  const config = FORM_CONFIG[configKey];
  if (!config || !config.baseUrl) {
    console.warn(`[HortiGo] Google Form URL for "${configKey}" is not configured.`);
    return null;
  }

  const url = new URL(config.baseUrl);
  const params = new URLSearchParams();

  Object.entries(config.fields).forEach(([fieldKey, entryId]) => {
    const value = values[fieldKey];
    
    // Only set params for non-empty values
    if (value !== undefined && value !== null && value !== "" && value !== false) {
      // Entry ID needs the "entry." prefix
      params.set(`entry.${entryId}`, String(value).trim());
    }
  });

  // Build final URL with usp=pp_url parameter for prefill mode
  const finalUrl = `${config.baseUrl}?usp=pp_url&${params.toString()}`;
  return finalUrl;
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
  mobileMenu.querySelectorAll("a.nav-item").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });
  mobileMenu.querySelectorAll("[data-open-modal]").forEach((button) => {
    button.addEventListener("click", closeMobileMenu);
  });
  document.addEventListener("click", (event) => {
    if (!mobileMenu.classList.contains("open")) return;
    if (
      !mobileMenu.contains(event.target) &&
      !navToggle.contains(event.target)
    ) {
      closeMobileMenu();
    }
  });
  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 1120) closeMobileMenu();
    },
    { passive: true },
  );

  /* ------------------------------------------------------------------ */
  /* Active nav link tracking (single-active, based on section in view) */
  /* ------------------------------------------------------------------ */
  const navAnchors = Array.from(
    document.querySelectorAll("nav a.nav-item, .mobile-menu a.nav-item"),
  );
  const sectionIds = navAnchors
    .map((a) => a.getAttribute("href"))
    .filter((href) => href && href.startsWith("#"))
    .map((href) => href.slice(1));
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  function setActiveNav(id) {
    navAnchors.forEach((a) => {
      const isMatch = a.getAttribute("href") === `#${id}`;
      a.classList.toggle("active", isMatch);
    });
  }

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        // Pick the entry closest to the top of the viewport that is intersecting.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveNav(visible[0].target.id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );
    sections.forEach((sec) => navObserver.observe(sec));
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

  openers.forEach((btn) => {
    btn.addEventListener("click", () => {
      closeMobileMenu();
      openModal(btn.getAttribute("data-open-modal"));
    });
  });
  closers.forEach((btn) => {
    btn.addEventListener("click", () =>
      closeModal(btn.closest(".modal-overlay")),
    );
  });
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeModal(overlay);
    });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeMobileMenu();
      document.querySelectorAll(".modal-overlay.open").forEach(closeModal);
    }
  });

  /* ------------------------------------------------------------------ */
  /* Form submit -> build Google Forms prefill URL -> redirect          */
  /* ------------------------------------------------------------------ */
  
  /**
   * Creates a form submission handler.
   * - Validates required fields and consent
   * - Saves form data to sessionStorage
   * - Shows loading state
   * - Generates prefilled Google Forms URL
   * - Redirects to Google Form
   */
  function handleFormSubmit(formId, formEl, configKey, fieldMap) {
    // Load any saved data when form loads
    loadFormData(formId, formEl);

    // Auto-save form data as user fills it
    formEl.addEventListener("input", () => {
      saveFormData(formId, formEl);
    });
    formEl.addEventListener("change", () => {
      saveFormData(formId, formEl);
    });

    formEl.addEventListener("submit", (e) => {
      e.preventDefault();

      // Standard HTML5 validation first
      if (!formEl.checkValidity()) {
        formEl.reportValidity();
        return;
      }

      // Validate consent checkbox explicitly
      const consentCheckbox = formEl.querySelector('[name="consent"]');
      if (consentCheckbox && !consentCheckbox.checked) {
        consentCheckbox.focus();
        alert("Please agree to the consent statement to continue.");
        return;
      }

      // Collect form values
      const data = new FormData(formEl);
      const values = {};
      
      Object.entries(fieldMap).forEach(([key]) => {
        const fieldName = fieldMap[key];
        let value = (data.get(fieldName) || "").toString().trim();
        values[key] = value;
      });

      // For FARMER form: include the full consent text for Google Forms
      // For BUYER form: only include consent if needed (currently no consent entry ID for buyer)
      if (configKey === "farmer" && consentCheckbox && consentCheckbox.checked) {
        values.consent = "I agree to be contacted by HortiGo regarding farmer registration and buyer connections. | मैं HortiGo को किसान पंजीकरण और खरीदारों से जुड़ने के संबंध में मुझसे संपर्क करने की सहमति देता/देती हूँ।";
      }

      // Build the prefilled URL
      const prefillUrl = buildPrefilledUrl(configKey, values);

      if (prefillUrl) {
        // Show loading state
        const submitBtn = formEl.querySelector('[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = "Opening secure registration form...";

        // Brief delay for UX, then redirect
        setTimeout(() => {
          clearFormData(formId);
          window.open(prefillUrl, "_blank", "noopener");
          
          // Restore button after opening
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }, 500);
      } else {
        console.error(`Google Form not configured for ${configKey}`);
        alert(
          "Registration form is being finalized. Please try again shortly."
        );
      }
    });
  }

  const farmerForm = document.getElementById("farmerForm");
  if (farmerForm) {
    handleFormSubmit("farmer", farmerForm, "farmer", {
      name: "name",
      phone: "phone",
      email: "email",
      location: "location",
      farmName: "farmName",
      polyhouseArea: "polyhouseArea",
      crops: "crops",
      productionStage: "productionStage",
      buyerInterest: "buyerInterest",
      consent: "consent",
    });
  }

  const buyerForm = document.getElementById("buyerForm");
  if (buyerForm) {
    handleFormSubmit("buyer", buyerForm, "buyer", {
      name: "name",
      organization: "organization",
      organizationType: "organizationType",
      email: "email",
      phone: "phone",
      location: "location",
      interest: "interest",
      message: "message",
      consent: "consent",
    });
  }

  /* ------------------------------------------------------------------ */
  /* Roadmap tabs                                                       */
  /* ------------------------------------------------------------------ */
  const rmTabs = document.querySelectorAll(".rm-tab");
  const rmPanels = document.querySelectorAll(".rm-panel");
  rmTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      rmTabs.forEach((t) => {
        t.classList.toggle("active", t === tab);
        t.setAttribute("aria-selected", t === tab ? "true" : "false");
      });
      rmPanels.forEach((p) => p.classList.toggle("active", p.id === target));
    });
  });

  /* ------------------------------------------------------------------ */
  /* Scroll reveal (IntersectionObserver, lightweight)                  */
  /* ------------------------------------------------------------------ */
  const revealEls = document.querySelectorAll(".reveal, .hiw-step");
  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -60px 0px" },
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("in-view"));
  }
});
