/** 寬螢幕把目錄固定在左側；窄螢幕用 popover 抽屜。沒有 popover 時改用 class。 */
export function initCourseNav() {
  const nav = document.getElementById("course-nav");
  if (!nav) return;

  const query = window.matchMedia("(min-width: 960px)");
  const toggle = document.querySelector("[data-nav-toggle]");
  const closeButton = nav.querySelector("[data-nav-close]");
  const nativePopover = Object.hasOwn(HTMLElement.prototype, "popover");
  const root = document.documentElement;
  let returnFocus = false;

  const docked = () => root.classList.contains("nav-docked");

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    if (!docked()) toggle?.setAttribute("aria-expanded", String(open));
  };

  const hideDrawer = () => {
    if (docked()) return;
    setOpen(false);
    if (nativePopover && nav.hasAttribute("popover")) {
      if (nav.matches(":popover-open")) nav.hidePopover();
      else returnFocus = false;
      return;
    }
    root.classList.remove("nav-open");
    if (returnFocus) {
      returnFocus = false;
      toggle?.focus({ preventScroll: true });
    }
  };

  const requestClose = (event) => {
    event.preventDefault();
    event.stopPropagation();
    returnFocus = true;
    hideDrawer();
  };

  const sync = () => {
    const wide = query.matches;
    if (wide) {
      root.classList.add("nav-docked");
      root.classList.remove("nav-open");
      setOpen(false);
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
      const open = event.newState === "open";
      if (docked()) return;
      setOpen(open);
      if (!open && returnFocus) {
        returnFocus = false;
        toggle?.focus({ preventScroll: true });
      }
    });
  } else {
    toggle?.addEventListener("click", () => {
      if (docked()) return;
      const open = !root.classList.contains("nav-open");
      root.classList.toggle("nav-open", open);
      setOpen(open);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key !== "Escape" || !root.classList.contains("nav-open")) return;
      returnFocus = true;
      hideDrawer();
    });
    document.addEventListener("click", (event) => {
      if (!root.classList.contains("nav-open")) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (nav.contains(target) || toggle?.contains(target) || closeButton?.contains(target)) return;
      hideDrawer();
    });
  }

  // 關閉鈕在抽屜裡面。手機瀏覽器會忽略抽屜內的 popovertarget，點了沒反應。
  // touchend 先關，並取消接著產生的 click，避免那一下點到抽屜後面的按鈕。
  closeButton?.addEventListener("touchend", (event) => {
    if (event.changedTouches.length !== 1) return;
    requestClose(event);
  }, { passive: false });
  closeButton?.addEventListener("click", requestClose);
}
