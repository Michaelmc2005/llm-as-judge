/**
 * Strips OpenAI SDK-appended path segments from a user-supplied base URL.
 *
 * The OpenAI SDK appends "/chat/completions" to whatever baseURL is provided.
 * If a user pastes the full endpoint URL (e.g. https://host/user/chat/completions),
 * the SDK produces a doubled path: /user/chat/completions/chat/completions.
 *
 * This function normalises the input so the SDK always receives a clean base
 * (e.g. https://host/user), regardless of what the user typed.
 */
const TRAILING_SDK_PATHS = ['/chat/completions', '/completions'];

export function normalizeBaseUrl(rawUrl: string): string {
  let url = rawUrl.trim().replace(/\/+$/, '');

  for (const suffix of TRAILING_SDK_PATHS) {
    if (url.endsWith(suffix)) {
      url = url.slice(0, url.length - suffix.length);
      break;
    }
  }

  return url;
}
