import "./styles.css";

const nav = document.querySelector("#nav");
const toggle = document.querySelector("#nav-toggle");
const progress = document.querySelector("#progress");
const menu = document.querySelector("#nav-menu");

const onScroll = () => {
  nav.classList.toggle("is-solid", window.scrollY > 12);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const ratio = max > 0 ? window.scrollY / max : 0;
  progress.style.transform = `scaleX(${ratio})`;
};

document.addEventListener("scroll", onScroll, { passive: true });
onScroll();

const setMenu = (open) => {
  nav.classList.toggle("is-open", open);
  toggle.setAttribute("aria-expanded", String(open));
  document.body.classList.toggle("nav-lock", open);
};

toggle.addEventListener("click", () => {
  setMenu(!nav.classList.contains("is-open"));
});

menu.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

const project = document.querySelector("#project");
document.querySelectorAll("[data-choose]").forEach((link) => {
  link.addEventListener("click", () => {
    if (project) project.value = link.dataset.choose;
  });
});

document.querySelectorAll(".faq button").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    const willOpen = button.getAttribute("aria-expanded") !== "true";

    document.querySelectorAll(".faq button").forEach((other) => {
      other.setAttribute("aria-expanded", "false");
      document.getElementById(other.getAttribute("aria-controls")).hidden = true;
    });

    if (willOpen) {
      button.setAttribute("aria-expanded", "true");
      panel.hidden = false;
    }
  });
});

const scroller = document.querySelector("#story-row");
const prev = document.querySelector("#stories-prev");
const next = document.querySelector("#stories-next");

const updateStoryButtons = () => {
  if (!scroller) return;
  const max = scroller.scrollWidth - scroller.clientWidth;
  prev.disabled = scroller.scrollLeft <= 8;
  next.disabled = scroller.scrollLeft >= max - 8;
};

const scrollStories = (direction) => {
  const card = scroller.querySelector(".story");
  const distance = card ? card.getBoundingClientRect().width + 18 : scroller.clientWidth * 0.8;
  scroller.scrollBy({ left: distance * direction, behavior: "smooth" });
};

prev.addEventListener("click", () => scrollStories(-1));
next.addEventListener("click", () => scrollStories(1));
scroller.addEventListener("scroll", updateStoryButtons, { passive: true });
window.addEventListener("resize", updateStoryButtons);
updateStoryButtons();

const form = document.querySelector("#lead-form");
const success = document.querySelector("#lead-success");
const successText = document.querySelector("#lead-success-text");
const errorBanner = document.querySelector("#form-error");

const fields = {
  name: {
    test: (value) => value.trim().length >= 2,
    message: "Add your name.",
  },
  phone: {
    test: (value) => value.replace(/\D/g, "").length >= 10,
    message: "Use a 10-digit phone number.",
  },
  email: {
    test: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()),
    message: "Add a real email so we can send the next step.",
  },
  city: {
    test: (value) => value.trim().length >= 2,
    message: "Tell us the city.",
  },
  project: {
    test: (value) => value.trim().length > 0,
    message: "Choose what you want to build.",
  },
};

const setFieldError = (input, message) => {
  const field = input.closest(".field");
  const slot = field.querySelector(".err");
  input.setAttribute("aria-invalid", message ? "true" : "false");
  field.classList.toggle("is-invalid", Boolean(message));
  slot.textContent = message || "";
};

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBanner.hidden = true;

  const data = new FormData(form);
  if ((data.get("_honey") || "").toString().trim()) {
    form.hidden = true;
    success.hidden = false;
    return;
  }

  let firstInvalid = null;
  for (const [name, rule] of Object.entries(fields)) {
    const input = form.elements[name];
    const message = rule.test(input.value) ? "" : rule.message;
    setFieldError(input, message);
    if (message && !firstInvalid) firstInvalid = input;
  }
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const payload = {
    name: data.get("name").toString().trim(),
    phone: data.get("phone").toString().trim(),
    email: data.get("email").toString().trim(),
    city: data.get("city").toString().trim(),
    project: data.get("project").toString().trim(),
    notes: data.get("notes").toString().trim(),
    _subject: "Free property analysis — ADU America website",
    _template: "table",
    _captcha: "false",
    _replyto: data.get("email").toString().trim(),
  };

  const submit = form.querySelector("[type='submit']");
  submit.disabled = true;
  submit.textContent = "Sending";

  const body = [
    `Name: ${payload.name}`,
    `Phone: ${payload.phone}`,
    `Email: ${payload.email}`,
    `City: ${payload.city}`,
    `Project: ${payload.project}`,
    `Notes: ${payload.notes || "None"}`,
  ].join("\n");

  try {
    const response = await fetch("https://formsubmit.co/ajax/admin@adu-america.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error("Request failed");
    successText.textContent =
      "Request received. An ADU America specialist will follow up about a free look at your property.";
    form.hidden = true;
    success.hidden = false;
  } catch {
    const mailto = `mailto:admin@adu-america.com?subject=${encodeURIComponent(
      "Free property analysis"
    )}&body=${encodeURIComponent(body)}`;
    successText.textContent =
      "We opened an email to admin@adu-america.com with your details. Send it, or call and we'll take it from there.";
    form.hidden = true;
    success.hidden = false;
    window.location.href = mailto;
  } finally {
    submit.disabled = false;
    submit.textContent = "Request my property analysis";
  }
});

form.querySelectorAll("input, select, textarea").forEach((input) => {
  input.addEventListener("input", () => {
    if (input.getAttribute("aria-invalid") === "true" && fields[input.name]) {
      const rule = fields[input.name];
      setFieldError(input, rule.test(input.value) ? "" : rule.message);
    }
  });
});
