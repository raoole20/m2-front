const SESSION_COOKIE_NAME = "m2_session";

function isBrowser() {
  return typeof document !== "undefined";
}

export function setSessionSentinel() {
  if (!isBrowser()) {
    return;
  }

  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE_NAME}=1; Path=/; SameSite=Lax${secure}`;
}

export function clearSessionSentinel() {
  if (!isBrowser()) {
    return;
  }

  const secure =
    typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${SESSION_COOKIE_NAME}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}
