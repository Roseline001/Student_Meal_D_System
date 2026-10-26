// ui.js: small DOM helpers shared by every page (messages, loading states,
// form errors, building elements). No API calls happen here.

// Creates an element: el("p", { className: "note" }, "Hello")
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.entries(props).forEach(([key, value]) => {
    if (key === "dataset") Object.assign(node.dataset, value);
    else if (key in node) node[key] = value;
    else node.setAttribute(key, value);
  });
  children.flat().forEach((child) => {
    if (child !== null && child !== undefined && child !== false) {
      node.append(child instanceof Node ? child : String(child));
    }
  });
  return node;
}

// Shows a short message in the page's toast area. type: "success" | "error" | "info"
export function showToast(message, type = "info") {
  const region = document.querySelector("#toast-region");
  if (!region) return null;
  const toast = el("p", { className: `toast toast--${type}`, role: type === "error" ? "alert" : "status" }, message);
  region.append(toast);
  setTimeout(() => toast.remove(), 4000);
  return toast;
}

// Disables a button and swaps its label while a request is running.
export function setLoading(button, isLoading, loadingText = "Please wait...") {
  if (!button) return;
  if (isLoading) {
    button.dataset.label = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
  } else {
    button.textContent = button.dataset.label || button.textContent;
    button.disabled = false;
    button.removeAttribute("aria-busy");
  }
}

// Writes validation messages under each field. Expects <small data-error-for="field">.
export function showFieldErrors(form, errors) {
  form.querySelectorAll("[data-error-for]").forEach((slot) => {
    const field = slot.dataset.errorFor;
    const input = form.elements[field];
    slot.textContent = errors[field] || "";
    if (input && typeof input.setAttribute === "function") {
      input.setAttribute("aria-invalid", errors[field] ? "true" : "false");
    }
  });
  const firstField = Object.keys(errors)[0];
  const firstInput = firstField && form.elements[firstField];
  if (firstInput && typeof firstInput.focus === "function") firstInput.focus();
}

export const clearFieldErrors = (form) => showFieldErrors(form, {});

// Reads a form into a plain object, trimming text values.
export function readForm(form) {
  const data = {};
  new FormData(form).forEach((value, key) => {
    data[key] = typeof value === "string" ? value.trim() : value;
  });
  return data;
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateTime(value) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Fills a <tbody> with rows, or one "empty" row when there is nothing to show.
export function renderRows(tbody, items, buildRow, emptyText = "Nothing here yet.") {
  const columns = tbody.closest("table")?.querySelectorAll("thead th").length || 1;
  if (items.length === 0) {
    tbody.replaceChildren(el("tr", {}, el("td", { colSpan: columns, className: "empty" }, emptyText)));
    return;
  }
  tbody.replaceChildren(...items.map(buildRow));
}

// Shows one section and hides the others in a list of element ids.
export function showOnly(visibleId, ids) {
  ids.forEach((id) => {
    const section = document.getElementById(id);
    if (section) section.hidden = id !== visibleId;
  });
}
