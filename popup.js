// Check if running in Chrome extension environment
const isExtensionEnvironment =
  typeof chrome !== "undefined" && chrome.tabs && chrome.scripting;

// Chrome extension functions
async function getActiveTab() {
  if (!isExtensionEnvironment) {
    console.log("Not running in Chrome extension environment");
    return null;
  }
  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    return tab;
  } catch (error) {
    console.error("Error getting active tab:", error);
    return null;
  }
}

async function ensureInjected(tabId) {
  if (!isExtensionEnvironment) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } catch (error) {
    console.error("Error injecting script:", error);
  }
}

async function sendToContent(message) {
  if (!isExtensionEnvironment) {
    console.log("Extension function called:", message);
    return;
  }
  try {
    const tab = await getActiveTab();
    if (!tab?.id) return;
    await ensureInjected(tab.id);
    await chrome.tabs.sendMessage(tab.id, message);
  } catch (error) {
    console.error("Error sending message to content:", error);
  }
}

// Toggle switch functionality for all elements and actions
const allCheckboxes = {
  div: document.getElementById("divCheckbox"),
  section: document.getElementById("sectionCheckbox"),
  button: document.getElementById("buttonCheckbox"),
  a: document.getElementById("aCheckbox"),
  p: document.getElementById("pCheckbox"),
  all: document.getElementById("allCheckbox"),
  reset: document.getElementById("resetCheckbox"),
};

const colorInputs = {
  div: document.getElementById("divColor"),
  section: document.getElementById("sectionColor"),
  button: document.getElementById("buttonColor"),
  a: document.getElementById("aColor"),
  p: document.getElementById("pColor"),
  all: document.getElementById("allColor"),
};

function getElementMode(elementName) {
  return allCheckboxes[elementName].checked ? "highlight" : "clear";
}

function getElementColor(elementName) {
  return colorInputs[elementName] ? colorInputs[elementName].value : "#000000";
}

// Add event listeners for color changes
Object.keys(colorInputs).forEach((elementName) => {
  colorInputs[elementName].addEventListener("change", function () {
    // If the element is currently active (toggled on), apply the new color immediately
    if (allCheckboxes[elementName] && allCheckboxes[elementName].checked) {
      const mode = "highlight";
      const color = this.value;
      const tags = elementName === "all" ? ["*"] : [elementName];
      sendToContent({ type: "EBH_ACTION", mode, tags, color });
    }
  });
});

// Add event listeners for all element toggles
Object.keys(allCheckboxes).forEach((elementName) => {
  allCheckboxes[elementName].addEventListener("change", function () {
    if (elementName === "all") {
      const mode = getElementMode("all");
      const color = getElementColor("all");
      sendToContent({ type: "EBH_ACTION", mode, tags: ["*"], color });
    } else if (elementName === "reset") {
      if (this.checked) {
        sendToContent({ type: "EBH_RESET" });
        // Reset all toggles to unchecked after reset
        setTimeout(() => {
          Object.keys(allCheckboxes).forEach((key) => {
            allCheckboxes[key].checked = false;
          });
        }, 100);
      }
    } else {
      const mode = getElementMode(elementName);
      const color = getElementColor(elementName);
      sendToContent({
        type: "EBH_ACTION",
        mode,
        tags: [elementName],
        color,
      });
    }
  });
});

function onElementButtonClick(e) {
  // This function is no longer needed since we're using toggles
  // But keeping it in case there are other buttons
  const tag = e.currentTarget.getAttribute("data-tag");
  const mode = "highlight";
  sendToContent({ type: "EBH_ACTION", mode, tags: [tag] });
}

function onSelectAll() {
  // For select all, always use highlight mode
  const mode = "highlight";
  sendToContent({ type: "EBH_ACTION", mode, tags: ["*"] });
}

function onReset() {
  sendToContent({ type: "EBH_RESET" });
}
