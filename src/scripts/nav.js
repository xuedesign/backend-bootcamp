/** 寬螢幕把目錄固定在左側；窄螢幕用 popover 抽屜。沒有 popover 時改用 class。 */
export function initCourseNav() {
  const nav = document.getElementById("course-nav");
  if (!nav) return;

  const query = window.matchMedia("(min-width: 960px)");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nativePopover = Object.hasOwn(HTMLElement.prototype, "popover");

  const sync = () => {
    const wide = query.matches;
    const root = document.documentElement;
    if (wide) {
      root.classList.add("nav-docked");
      root.classList.remove("nav-open");
      if (nativePopover && nav.matches(":popover-open")) nav.hidePopover();
      nav.removeAttribute("popover");
      toggle?.setAttribute("aria-expanded", "false");
      return;
    }

    root.classList.remove("nav-docked");
    if (nativePopover) {
      if (!nav.hasAttribute("popover")) nav.setAttribute("popover", "auto");
    } else {
      nav.removeAttribute("popover");
      root.classList.add("nav-fallback");
    }
  };

  sync();
  query.addEventListener("change", sync);

  if (nativePopover) {
    nav.addEventListener("toggle", (event) => {
      if (document.documentElement.classList.contains("nav-docked")) return;
      const open = event.newState === "open";
      toggle?.setAttribute("aria-expanded", String(open));
      if (open) nav.querySelector(".sidebar__close")?.focus();
      else toggle?.focus();
    });
    return;
  }

  const close = () => {
    document.documentElement.classList.remove("nav-open");
    toggle?.setAttribute("aria-expanded", "false");
    if (!document.documentElement.classList.contains("nav-docked")) toggle?.focus();
  };
  const open = () => {
    if (document.documentElement.classList.contains("nav-docked")) return;
    document.documentElement.classList.add("nav-open");
    toggle?.setAttribute("aria-expanded", "true");
    nav.querySelector(".sidebar__close")?.focus();
  };

  toggle?.addEventListener("click", () => {
    if (document.documentElement.classList.contains("nav-open")) close();
    else open();
  });
  nav.querySelector(".sidebar__close")?.addEventListener("click", (event) => {
    event.preventDefault();
    close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!document.documentElement.classList.contains("nav-open")) return;
    close();
  });
  document.addEventListener("click", (event) => {
    if (!document.documentElement.classList.contains("nav-open")) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (nav.contains(target) || toggle?.contains(target)) return;
    close();
  });
}
