(() => {
  if (window.__EBH_LOADED__) return; // guard against double-injection
  window.__EBH_LOADED__ = true;

  const APPLIED_ATTR = "data-ebh-applied";
  const PREV_OUTLINE_ATTR = "data-ebh-prev-outline";

  function highlightTags(tags, color = "#000000") {
    const selector = tags.includes("*") ? "*" : tags.join(",");
    const nodes = document.querySelectorAll(selector);
    for (const el of nodes) {
      if (!el.hasAttribute(APPLIED_ATTR)) {
        el.setAttribute(PREV_OUTLINE_ATTR, el.style.outline || "");
      }
      el.style.outline = `2px solid ${color}`;
      el.setAttribute(APPLIED_ATTR, "1");
    }
  }

  function clearTags(tags) {
    const selector = tags.includes("*") ? "*" : tags.join(",");
    const nodes = document.querySelectorAll(selector);
    for (const el of nodes) {
      if (el.hasAttribute(APPLIED_ATTR)) {
        const prev = el.getAttribute(PREV_OUTLINE_ATTR) || "";
        el.style.outline = prev;
        el.removeAttribute(APPLIED_ATTR);
        el.removeAttribute(PREV_OUTLINE_ATTR);
      }
    }
  }

  function resetAll() {
    const nodes = document.querySelectorAll(`[${APPLIED_ATTR}]`);
    for (const el of nodes) {
      const prev = el.getAttribute(PREV_OUTLINE_ATTR) || "";
      el.style.outline = prev;
      el.removeAttribute(APPLIED_ATTR);
      el.removeAttribute(PREV_OUTLINE_ATTR);
    }
  }

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    try {
      if (msg?.type === "EBH_ACTION" && Array.isArray(msg.tags)) {
        if (msg.mode === "clear") {
          clearTags(msg.tags);
        } else {
          // ✅ Pass color from popup
          highlightTags(msg.tags, msg.color || "#000000");
        }
      } else if (msg?.type === "EBH_RESET") {
        resetAll();
      }
    } catch (e) {
      // swallow errors to avoid breaking the page
    }
    sendResponse && sendResponse({ ok: true });
  });
})();
