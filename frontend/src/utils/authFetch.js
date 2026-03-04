import API_BASE_URL from "../config/api";

export default async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = new Headers(options.headers || {});

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Keep cookies for legacy session endpoints too
  const mergedOptions = {
    credentials: "include",
    ...options,
    headers,
  };

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  return fetch(url, mergedOptions);
}

