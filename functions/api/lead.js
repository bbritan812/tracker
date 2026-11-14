const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status) {
  return new Response(JSON.stringify(data), { status: status || 200, headers: JSON_HEADERS });
}

function clean(value, maxLength) {
  return String(value == null ? "" : value)
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, maxLength || 700);
}

function siteName(path) {
  if (path.indexOf("/kedr") === 0) return "КЕДР — демонстрация барбершопа";
  if (path.indexOf("/terra") === 0) return "TERRA — демонстрация ресторана";
  if (path.indexOf("/apex") === 0) return "APEX — демонстрация детейлинга";
  return "NORTH DIGITAL — заявка на разработку сайта";
}

export async function onRequestGet({ env }) {
  return json({
    ok: true,
    configured: Boolean(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID)
  });
}

export async function onRequestPost({ request, env }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  const contentLength = Number(request.headers.get("Content-Length") || 0);

  if (contentLength > 12000) {
    return json({ ok: false, error: "request_too_large" }, 413);
  }

  if (origin) {
    try {
      if (new URL(origin).origin !== requestUrl.origin) {
        return json({ ok: false, error: "origin_not_allowed" }, 403);
      }
    } catch {
      return json({ ok: false, error: "invalid_origin" }, 403);
    }
  }

  if (!(request.headers.get("content-type") || "").toLowerCase().includes("application/json")) {
    return json({ ok: false, error: "json_required" }, 415);
  }

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return json({ ok: false, error: "invalid_payload" }, 400);
  }

  // Honeypot: automated submissions are silently discarded.
  if (clean(data.website, 200)) return json({ ok: true });

  const name = clean(data.name, 120);
  const contact = clean(data.contact, 160);
  if (!name || !contact) {
    return json({ ok: false, error: "name_and_contact_required" }, 400);
  }

  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    return json({ ok: false, error: "notifications_not_configured" }, 503);
  }

  const referer = request.headers.get("Referer") || requestUrl.origin + "/";
  let path = "/";
  try { path = new URL(referer).pathname; } catch {}

  const fieldLabels = {
    business: "Сфера бизнеса",
    task: "Задача",
    service: "Услуга",
    master: "Мастер",
    date: "Дата",
    time: "Время",
    guests: "Количество гостей",
    occasion: "Повод",
    comment: "Комментарий",
    car: "Автомобиль",
    message: "Комментарий"
  };

  const lines = [
    "НОВАЯ ЗАЯВКА — " + siteName(path),
    "",
    "Имя: " + name,
    "Контакт: " + contact
  ];

  for (const [key, label] of Object.entries(fieldLabels)) {
    const value = clean(data[key], 900);
    if (value) lines.push(label + ": " + value);
  }

  lines.push("", "Страница: " + requestUrl.origin + path);
  const message = lines.join("\n").slice(0, 3800);

  try {
    const telegramResponse = await fetch(
      "https://api.telegram.org/bot" + env.TELEGRAM_BOT_TOKEN + "/sendMessage",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: env.TELEGRAM_CHAT_ID,
          text: message,
          disable_web_page_preview: true
        })
      }
    );

    if (!telegramResponse.ok) {
      return json({ ok: false, error: "notification_delivery_failed" }, 502);
    }

    const telegramResult = await telegramResponse.json();
    if (!telegramResult.ok) {
      return json({ ok: false, error: "notification_delivery_failed" }, 502);
    }

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "notification_service_unavailable" }, 502);
  }
}
