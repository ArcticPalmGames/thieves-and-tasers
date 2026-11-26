/* Landing page behavior */
document.addEventListener("DOMContentLoaded", () => {
  wireLightbox();
  wireWishbar();
  wireReveal();
  wireParallax();
  wireSlideshow();
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
});

/* Screenshot lightbox with prev/next ------------------------------------ */
function wireLightbox() {
  const box = document.getElementById("lightbox");
  const img = document.getElementById("lightboxImg");
  const imgs = [...document.querySelectorAll("[data-shot] img")];
  const shots = imgs.map((i) => i.src);
  let idx = 0;
  let closeTimer;

  const show = (i) => {
    clearTimeout(closeTimer);
    idx = (i + shots.length) % shots.length;
    img.src = shots[idx];
    box.hidden = false;
    // next frame so the opacity/scale transition actually runs from the hidden state
    requestAnimationFrame(() => box.classList.add("is-open"));
    document.body.style.overflow = "hidden";
    img.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 180, easing: "ease" });
  };
  const close = () => {
    box.classList.remove("is-open");
    document.body.style.overflow = "";
    closeTimer = setTimeout(() => { box.hidden = true; img.src = ""; }, 260);
  };

  // A slideshow frame holds several images: open the one currently showing.
  document.querySelectorAll("[data-shot]").forEach((btn) => btn.addEventListener("click", () => {
    const current = btn.querySelector("img.is-active") || btn.querySelector("img");
    show(imgs.indexOf(current));
  }));
  document.querySelector("[data-close-lightbox]")?.addEventListener("click", close);
  document.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => show(idx - 1));
  document.querySelector("[data-lightbox-next]")?.addEventListener("click", () => show(idx + 1));
  document.querySelector(".lightbox__backdrop")?.addEventListener("click", close);
  document.addEventListener("keydown", (e) => {
    if (box.hidden) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
}

/* Contained parallax — foreground art travels within its own window: it sits at
   the top as the window scrolls into view and drifts down to the bottom as you
   scroll past, then stops (clamped to the window's slack). Text stays static for
   readability. Off for reduced-motion and on small screens (there the character
   sits beside the text instead, so there is no window to travel in). */
function wireParallax() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  const small = window.matchMedia("(max-width: 760px)");
  const imgs = [...document.querySelectorAll("[data-parallax]")];
  if (!imgs.length) return;

  // Keep the art's outline clear of the clipped window edges at either extreme.
  const PAD = 14;
  let ticking = false;
  const update = () => {
    if (small.matches) { imgs.forEach((img) => (img.style.transform = "")); ticking = false; return; }
    const vh = window.innerHeight;
    imgs.forEach((img) => {
      const box = img.closest(".row__media--character") || img.parentElement;
      // Vertical room the art can travel inside its window (0 → no parallax).
      const slack = box.clientHeight - img.offsetHeight;
      if (slack <= 1) { img.style.transform = ""; return; }
      const travel = Math.max(0, slack - 2 * PAD);
      const rect = box.getBoundingClientRect();
      // Progress tied to the viewport centre crossing the window: 0 when the
      // window's top reaches the centre (art at the top of the box), 1 when its
      // bottom reaches the centre (art at the bottom) — so the full sweep plays
      // out while the row is prominently in view, not half off-screen.
      let p = (vh / 2 - rect.top) / rect.height;
      p = Math.max(0, Math.min(1, p));
      img.style.transform = `translate3d(0, ${(PAD + p * travel).toFixed(1)}px, 0)`;
    });
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}

/* Sticky wishlist bar — reveals once the hero scrolls out of view --------- */
function wireWishbar() {
  const bar = document.getElementById("wishbar");
  if (!bar) return;
  bar.hidden = false;

  // Reveal after a short scroll, not only once the whole hero leaves view.
  const onScroll = () => bar.classList.toggle("is-visible", window.scrollY > 320);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* Reveal-on-scroll ------------------------------------------------------ */
function wireReveal() {
  const targets = document.querySelectorAll(".row, .strip .shot, .cta");
  targets.forEach((t) => t.classList.add("reveal"));
  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }),
    { threshold: 0.12 }
  );
  targets.forEach((t) => io.observe(t));
}

/* Gameplay slideshow — crossfades to the next screenshot every 5 seconds.
   Pauses while hovered or focused, while the lightbox is open, when the frame
   is off-screen or the tab is hidden. Stays on the first image for visitors
   who prefer reduced motion. */
function wireSlideshow() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-slideshow]").forEach((frame) => {
    const slides = [...frame.querySelectorAll("img")];
    if (slides.length < 2 || reduce) return;

    const lightbox = document.getElementById("lightbox");
    let idx = Math.max(0, slides.findIndex((s) => s.classList.contains("is-active")));
    let hovered = false;
    let onScreen = true;

    const advance = () => {
      if (hovered || !onScreen || document.hidden || (lightbox && !lightbox.hidden)) return;
      slides[idx].classList.remove("is-active");
      idx = (idx + 1) % slides.length;
      slides[idx].classList.add("is-active");
    };

    // Load every slide once the frame is near view, so each fade-in is ready.
    const preload = () => slides.forEach((s) => { s.loading = "eager"; });

    frame.addEventListener("mouseenter", () => (hovered = true));
    frame.addEventListener("mouseleave", () => (hovered = false));
    frame.addEventListener("focus", () => (hovered = true));
    frame.addEventListener("blur", () => (hovered = false));

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => entries.forEach((e) => {
        onScreen = e.isIntersecting;
        if (onScreen) preload();
      }), { rootMargin: "200px" }).observe(frame);
    } else {
      preload();
    }

    setInterval(advance, 5000);
  });
}
