// Fixed "demo" notice shown inside every portfolio demo app, so nobody mistakes
// the example records for real people. Re-attached on an interval because the
// Bill Tracker bundle replaces the whole document when it unpacks.
(function () {
  var back = document.currentScript && document.currentScript.dataset.back;
  function ensure() {
    if (!document.body || document.getElementById("pf-demo-banner")) return;
    var bar = document.createElement("div");
    bar.id = "pf-demo-banner";
    bar.setAttribute("role", "note");
    bar.style.cssText = "position:fixed;left:0;right:0;bottom:0;z-index:2147483647;" +
      "background:#ef5a24;color:#fff;font:600 " + (innerWidth < 600 ? "12px" : "14px") + "/1.35 system-ui,-apple-system,'Segoe UI',sans-serif;" +
      "padding:" + (innerWidth < 600 ? "7px 12px" : "10px 16px") + " calc(" + (innerWidth < 600 ? "7px" : "10px") + " + env(safe-area-inset-bottom,0px));display:flex;flex-wrap:wrap;" +
      "gap:6px 16px;align-items:center;justify-content:center;text-align:center;box-shadow:0 -2px 10px rgba(0,0,0,.2)";
    bar.innerHTML = '<span style="background:#fff;color:#c2410c;border-radius:4px;padding:1px 7px;font-weight:800;letter-spacing:.06em">DEMO</span>' +
      "<span>Every name, ID, card number and amount here is made up. These are not real people.</span>" +
      (back ? '<a href="' + back + '" style="color:#fff;text-decoration:underline">Back to the project page</a>' : "");
    document.body.appendChild(bar);
    document.body.style.paddingBottom = (bar.offsetHeight + 12) + "px";
  }
  document.addEventListener("DOMContentLoaded", ensure);
  setInterval(ensure, 800);
})();
