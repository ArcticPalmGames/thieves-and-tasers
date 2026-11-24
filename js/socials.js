/* =========================================================================
   THIEVES & TASERS — /socials page behavior
   (Separate from main.js on purpose: that file expects the landing page's
   lightbox, parallax and wishlist bar, which don't exist here.)
   ========================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  // Links still set to href="#" (e.g. the press kit) show as "coming soon".
  document.querySelectorAll('.link[href="#"]').forEach((a) => {
    a.removeAttribute("href");
    a.setAttribute("aria-disabled", "true");
    a.title = "Coming soon";
  });

  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  const toast = document.getElementById("toast");
  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  // Share: native share sheet where available, otherwise copy the link.
  document.getElementById("share")?.addEventListener("click", async () => {
    const data = { title: "Thieves and Tasers", text: "Sneak, steal, get tased.", url: location.href };
    try {
      if (navigator.share) { await navigator.share(data); return; }
      await navigator.clipboard.writeText(data.url);
      say("Link copied");
    } catch (err) {
      if (err && err.name === "AbortError") return; // person closed the share sheet
      say("Couldn't copy the link");
    }
  });
});
