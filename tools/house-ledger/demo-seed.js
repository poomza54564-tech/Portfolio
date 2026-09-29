// Portfolio demo: the real app syncs this blob to a Flask server on the dorm's
// Wi-Fi. Here it lives only in this browser, seeded with obviously fictional roommates.
(function () {
  const KEY = "house_ledger_v1";
  // Keep the saved demo only while every roommate is an obvious "Demo Roommate"; anything else is reseeded.
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && saved.roommates && saved.roommates.length && saved.roommates.every(r => /^Demo Roommate/.test(r.name))) return;
  } catch (e) { }
  const d = new Date(), cur = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
  const people = [{ id: "r1", name: "Demo Roommate A" }, { id: "r2", name: "Demo Roommate B" }, { id: "r3", name: "Demo Roommate C" }, { id: "r4", name: "Demo Roommate D" }];
  const bill = (id, name, category, amount, day, paidBy) => ({
    id, name, category, amount, dueDate: cur + "-" + String(day).padStart(2, "0"), recurring: true,
    shares: people.map(p => ({ personId: p.id, amount: Math.round(amount / 4), paid: paidBy.includes(p.id) })),
  });
  const bills = [
    bill("bhouse", "Housing", "rent", 18000, 1, ["r1", "r2", "r3", "r4"]),
    bill("belect", "Electricity", "utilities", 2360, 5, ["r1", "r3"]),
    bill("bwater", "Water", "water", 420, 5, ["r1", "r2", "r3"]),
    bill("bdrink", "Drinking Water", "water", 240, 5, ["r1"]),
    bill("binter", "Internet", "internet", 699, 8, ["r1", "r2"]),
    bill("byoutu", "Youtube Premium", "other", 299, 10, []),
  ];
  try { localStorage.setItem(KEY, JSON.stringify({ roommates: people, months: { [cur]: bills }, currentMonth: cur })); } catch (e) { }
})();
