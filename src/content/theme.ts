export function isDarkMode(): boolean {
  // LinkedIn's modern surfaces (feed/profile/messaging) mark theme via a
  // data attribute on <body>; older Ember-based pages use a class on
  // <html>/<body> instead. Check both since either can apply depending on
  // which surface rendered. Not tied to prefers-color-scheme: LinkedIn's
  // dark mode is an independent in-app setting (Device/Dark/Light).
  if (document.body.getAttribute("data-color-scheme") === "dark") return true;
  if (document.documentElement.classList.contains("theme--dark")) return true;
  if (document.body.classList.contains("theme--dark")) return true;
  return false;
}
