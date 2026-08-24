// Whether the sidebar is collapsed, kept in localStorage so the choice
// survives a navigation and a reload.
//
// Same shape as auth-store: an external store read through
// useSyncExternalStore, which keeps it out of an effect (the react compiler
// rejects setState during one) and gives the server render a defined answer.

export const SIDEBAR_KEY = "sidebar_collapsed";
export const SIDEBAR_EVENT = "india-gate-sidebar-change";

export const subscribeSidebar = (callback: () => void) => {
  // storage fires for other tabs, the custom event for this one
  window.addEventListener("storage", callback);
  window.addEventListener(SIDEBAR_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(SIDEBAR_EVENT, callback);
  };
};

export const getSidebarCollapsed = () =>
  localStorage.getItem(SIDEBAR_KEY) === "true";

// the server has no localStorage, and expanded is the safer first paint since
// it matches the wider layout the page is built around
export const getSidebarServerSnapshot = () => false;

export const setSidebarCollapsed = (collapsed: boolean) => {
  localStorage.setItem(SIDEBAR_KEY, String(collapsed));
  window.dispatchEvent(new Event(SIDEBAR_EVENT));
};
