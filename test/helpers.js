// Shared test helpers for the page tests.
import fs from "fs";
import path from "path";

// Puts the <body> of one of our real HTML pages into the jsdom document.
export function loadPage(fileName) {
  const html = fs.readFileSync(path.join(__dirname, "..", fileName), "utf8");
  document.body.innerHTML = html.match(/<body[^>]*>([\s\S]*)<\/body>/)[1];
}

// Waits for pending promises (API calls and re-renders) to finish.
export const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

export function submit(selector) {
  document.querySelector(selector).dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
  return flush();
}

export function fill(selector, value) {
  document.querySelector(selector).value = value;
}
