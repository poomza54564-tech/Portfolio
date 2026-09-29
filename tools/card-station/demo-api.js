// Portfolio demo: stands in for the Flask backend (app.py) so guard.html and
// admin.html run as static pages. Same routes and response shapes as the real
// API, backed by localStorage instead of SQLite. All students are fictional.
(function () {
  const KEY = "card_station_demo_v2", VALID_YEARS = 4;
  const pad = n => String(n).padStart(2, "0");
  const stamp = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  const now = () => stamp(new Date());
  const today = () => now().slice(0, 10);

  function seed() {
    const students = [
      ["0000000101", "DEMO-0001", "Demo Student 01"],
      ["0000000102", "DEMO-0002", "Demo Student 02"],
      ["0000000103", "DEMO-0003", "Demo Student 03"],
      ["0000000104", "DEMO-0004", "Demo Student 04"],
      ["0000000105", "DEMO-0005", "Demo Student 05"],
      ["0000000106", "DEMO-0006", "Demo Student 06"],
      ["0000000107", "DEMO-0007", "Demo Student 07 (deactivated)"],
      ["0000000108", "DEMO-0008", "Demo Student 08 (expired)"],   // registered 2021 -> expired
    ].map(([card_id, student_id, name], i) => ({
      card_id, student_id, name, active: i !== 6,
      registered_at: i === 7 ? "2021-06-14 09:12:00" : `2026-0${6 + (i % 3)}-1${i} 10:0${i}:00`,
    }));
    // ~6 weeks of weekday traffic so the heatmap and log have something to show
    const rooms = ["Room 1", "Room 2", "Room 3"], events = [];
    let r = 7;
    const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    const usable = students.filter(s => s.active && !s.registered_at.startsWith("2021"));
    for (let back = 42; back >= 1; back--) {
      const d = new Date(); d.setDate(d.getDate() - back);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const visits = 12 + Math.floor(rnd() * 16);
      for (let v = 0; v < visits; v++) {
        const s = usable[Math.floor(rnd() * usable.length)], room = rooms[Math.floor(rnd() * 3)];
        const t = new Date(d); t.setHours(8 + Math.floor(rnd() * 8), Math.floor(rnd() * 60), 0);
        events.push({ card_id: s.card_id, room, action: "IN", timestamp: stamp(t) });
        t.setMinutes(t.getMinutes() + 20 + Math.floor(rnd() * 120));
        events.push({ card_id: s.card_id, room, action: "OUT", timestamp: stamp(t) });
      }
    }
    events.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    events.forEach((e, i) => (e.id = i + 1));
    return {
      students, events,
      settings: { dashboard_title: "Card Station (demo)", rooms: [{ n: "Room 1", c: "cyan" }, { n: "Room 2", c: "violet" }, { n: "Room 3", c: "amber" }] },
    };
  }

  let db;
  try { db = JSON.parse(localStorage.getItem(KEY)); } catch (e) { }
  if (!db || !db.students) db = seed();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { } };
  save();
  window.resetCardStationDemo = () => { try { localStorage.removeItem(KEY); } catch (e) { } location.reload(); };

  const expired = reg => { const d = new Date(reg.slice(0, 10) + "T00:00:00"); d.setFullYear(d.getFullYear() + VALID_YEARS); return new Date() >= d; };
  const pub = s => ({ ...s, active: !!s.active, expired: expired(s.registered_at) });
  const student = id => db.students.find(s => s.card_id === id);
  const lastEvent = id => { for (let i = db.events.length - 1; i >= 0; i--) if (db.events[i].card_id === id) return db.events[i]; };
  const inside = id => (lastEvent(id) || {}).action === "IN";
  const addEvent = (card_id, room, action) => { db.events.push({ id: db.events.length + 1, card_id, room, action, timestamp: now() }); save(); };
  const eventsOn = prefix => db.events.filter(e => e.timestamp.startsWith(prefix)).slice().reverse().map(e => {
    const s = student(e.card_id) || {};
    return { time: e.timestamp.slice(11, 16), timestamp: e.timestamp, card_id: e.card_id, student_id: s.student_id || "", name: s.name || "(unknown)", room: e.room, action: e.action };
  });
  const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

  function route(method, path, q, body) {
    let m;
    if (path === "/api/me") return json({ username: "demo", role: "admin" });
    if (path === "/api/logout" || path === "/api/account") return json({ ok: true });
    if (path === "/api/settings" && method === "GET") return json({ ...db.settings, background_url: "" });
    if (path === "/api/settings") {
      if (body.dashboard_title) db.settings.dashboard_title = body.dashboard_title;
      (body.rooms || []).forEach((n, i) => { if (n && db.settings.rooms[i]) db.settings.rooms[i].n = n; });
      save(); return json({ ok: true });
    }
    if (path === "/api/background") return json({ error: "Background upload is turned off in this demo." }, 400);
    if (path === "/api/students") return json(db.students.slice().reverse().map(pub));
    if (path === "/api/student" && method === "POST") {
      const card_id = (body.card_id || "").trim(), student_id = (body.student_id || "").trim(), name = (body.name || "").trim();
      if (!card_id || !student_id || !name) return json({ error: "card_id, student_id and name are required" }, 400);
      if (student(card_id)) return json({ error: "card already registered", card_id }, 409);
      db.students.push({ card_id, student_id, name, active: true, registered_at: now() }); save();
      return json({ card_id, student_id, name }, 201);
    }
    if ((m = path.match(/^\/api\/student\/(.+)$/))) {
      const id = decodeURIComponent(m[1]).trim(), s = student(id);
      if (!s) return json({ error: "not found", card_id: id }, 404);
      if (method === "GET") return json(pub(s));
      if (method === "DELETE") {
        if (inside(id)) addEvent(id, lastEvent(id).room, "OUT");
        db.students = db.students.filter(x => x !== s); save(); return json({ deleted: id });
      }
      if ("student_id" in body) { if (!body.student_id.trim()) return json({ error: "student_id cannot be empty" }, 400); s.student_id = body.student_id.trim(); }
      if ("name" in body) { if (!body.name.trim()) return json({ error: "name cannot be empty" }, 400); s.name = body.name.trim(); }
      if ("active" in body) s.active = !!body.active;
      save(); return json(pub(s));
    }
    if (path === "/api/active") {
      return json(db.students.filter(s => inside(s.card_id)).map(s => {
        const e = lastEvent(s.card_id);
        return { card_id: s.card_id, student_id: s.student_id, name: s.name, room: e.room, time: e.timestamp.slice(11, 16) };
      }));
    }
    if (path === "/api/checkin") {
      const id = (body.card_id || "").trim(), room = (body.room || "").trim(), s = student(id);
      if (!id || !room) return json({ error: "card_id and room are required" }, 400);
      if (!s) return json({ error: "card not registered", card_id: id }, 404);
      if (!s.active) return json({ error: "card deactivated", card_id: id }, 403);
      if (expired(s.registered_at)) return json({ error: "card expired", card_id: id }, 403);
      if (inside(id)) return json({ error: "already checked in", card_id: id }, 409);
      addEvent(id, room, "IN");
      return json({ action: "checkin", card_id: id, room, student_id: s.student_id, name: s.name }, 201);
    }
    if (path === "/api/checkout") {
      const id = (body.card_id || "").trim(), s = student(id);
      if (!s) return json({ error: "card not registered", card_id: id }, 404);
      if (!inside(id)) return json({ error: "not checked in", card_id: id }, 409);
      const room = lastEvent(id).room; addEvent(id, room, "OUT");
      return json({ action: "checkout", card_id: id, room, student_id: s.student_id, name: s.name }, 201);
    }
    if (path === "/api/checkout-all") {
      const list = db.students.filter(s => inside(s.card_id) && (!body.room || lastEvent(s.card_id).room === body.room));
      list.forEach(s => addEvent(s.card_id, lastEvent(s.card_id).room, "OUT"));
      return json({ checked_out: list.length, room: body.room || null }, 201);
    }
    if (path === "/api/events/today") { const ev = eventsOn(today()); return json({ count: ev.length, events: ev }); }
    if (path === "/api/events") { const d = q.get("date") || today(), ev = eventsOn(d); return json({ count: ev.length, events: ev, date: d }); }
    if (path === "/api/activity/summary") {
      const month = q.get("month") || today().slice(0, 7), out = {};
      db.events.forEach(e => { if (e.timestamp.startsWith(month)) { const d = e.timestamp.slice(0, 10); out[d] = (out[d] || 0) + 1; } });
      return json(out);
    }
    if (path === "/api/export/events.csv") {
      const label = q.get("month") || q.get("date") || today();
      const rows = eventsOn(label).reverse().map(e => [e.timestamp, e.action, e.card_id, e.student_id, e.name, e.room].join(","));
      return new Response("﻿" + ["timestamp,action,card_id,student_id,name,room", ...rows].join("\r\n"), { headers: { "Content-Type": "text/csv" } });
    }
    return json({ error: "Not found" }, 404);
  }

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, opts = {}) => {
    const url = new URL(typeof input === "string" ? input : input.url, location.href);
    if (!url.pathname.startsWith("/api/")) return realFetch(input, opts);
    let body = {};
    if (typeof opts.body === "string") { try { body = JSON.parse(opts.body); } catch (e) { } }
    return route((opts.method || "GET").toUpperCase(), url.pathname, url.searchParams, body);
  };
})();
