const UQLOAD_API = "https://uqload.vc/api/file/direct_link";
const UQLOAD_HOST = /(^|\.)uqload\.vc$/i;
const EMBED_RE = /^https?:\/\/(?:www\.)?uqload\.vc\/embed-([^/?#]+)\.html(?:[?#].*)?$/i;

function getFileCode(value) {
  try {
    const match = new URL(value).href.match(EMBED_RE);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

async function resolveUqload(embedUrl) {
  const fileCode = getFileCode(embedUrl);
  if (!fileCode) return null;

  const api = new URL(UQLOAD_API);
  api.searchParams.set("key", "45eo2waz0k7v9x8v5");
  api.searchParams.set("file_code", fileCode);
  api.searchParams.set("q", "h");

  const response = await fetch(api, {
    headers: {
      "Accept": "application/json",
      "User-Agent": "Mozilla/5.0"
    }
  });

  if (!response.ok) return null;

  const data = await response.json();
  const versions = Array.isArray(data?.result?.versions)
    ? data.result.versions
    : [];

  const order = ["h", "n", "l", "o"];
  for (const quality of order) {
    const version = versions.find(item =>
      item?.name === quality &&
      typeof item?.url === "string" &&
      /^https?:\/\//i.test(item.url)
    );
    if (version) return version.url;
  }

  const fallback = versions.find(item =>
    typeof item?.url === "string" &&
    /^https?:\/\//i.test(item.url)
  );

  return fallback?.url || null;
}

function copyMediaHeaders(upstream) {
  const headers = new Headers();

  for (const name of [
    "content-type",
    "content-length",
    "content-range",
    "accept-ranges",
    "etag",
    "last-modified"
  ]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }

  headers.set("Accept-Ranges", "bytes");
  headers.set("Cache-Control", "no-store");
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Cross-Origin-Resource-Policy", "cross-origin");

  return headers;
}

async function handleVideo(request) {
  const requestUrl = new URL(request.url);
  const embedUrl = requestUrl.searchParams.get("url");

  if (!embedUrl) {
    return new Response("Missing video URL", { status: 400 });
  }

  const mediaUrl = await resolveUqload(embedUrl);
  if (!mediaUrl) {
    return new Response("Video source unavailable", { status: 502 });
  }

  const upstreamUrl = new URL(mediaUrl);

  // Never turn this endpoint into an open proxy.
  // Only the URL returned by the UQLoad API is accepted.
  if (upstreamUrl.protocol !== "http:" && upstreamUrl.protocol !== "https:") {
    return new Response("Unsupported video protocol", { status: 502 });
  }

  const headers = new Headers();
  headers.set(
    "User-Agent",
    request.headers.get("User-Agent") || "Mozilla/5.0"
  );
  headers.set("Accept", "*/*");
  headers.set("Referer", embedUrl);

  const range = request.headers.get("Range");
  if (range) headers.set("Range", range);

  const upstream = await fetch(upstreamUrl, {
    method: request.method === "HEAD" ? "HEAD" : "GET",
    headers,
    redirect: "follow"
  });

  return new Response(
    request.method === "HEAD" ? null : upstream.body,
    {
      status: upstream.status,
      headers: copyMediaHeaders(upstream)
    }
  );
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/video") {
      return handleVideo(request);
    }

    return env.ASSETS.fetch(request);
  }
};
