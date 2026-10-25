import {
  el, showToast, setLoading, showFieldErrors, clearFieldErrors, readForm, renderRows, showOnly, formatDate,
} from "../js/ui.js";

beforeEach(() => {
  document.body.innerHTML = "";
});

describe("el", () => {
  test("builds an element with properties, data and children", () => {
    const node = el("button", { className: "button", type: "button", dataset: { id: "4" }, "aria-label": "Go" },
      "Save", el("span", {}, "!"), null);
    expect(node.outerHTML).toBe('<button class="button" type="button" data-id="4" aria-label="Go">Save<span>!</span></button>');
  });
});

describe("showToast", () => {
  test("adds a message to the toast region and removes it later", () => {
    jest.useFakeTimers();
    document.body.innerHTML = '<div id="toast-region"></div>';
    const toast = showToast("Saved!", "success");
    expect(toast.className).toBe("toast toast--success");
    expect(document.querySelector("#toast-region").textContent).toBe("Saved!");
    jest.advanceTimersByTime(4000);
    expect(document.querySelector("#toast-region").children).toHaveLength(0);
    jest.useRealTimers();
  });

  test("errors use role=alert, and nothing happens without a region", () => {
    document.body.innerHTML = '<div id="toast-region"></div>';
    expect(showToast("Oops", "error").getAttribute("role")).toBe("alert");
    document.body.innerHTML = "";
    expect(showToast("Lost")).toBeNull();
  });
});

describe("setLoading", () => {
  test("disables the button and restores its label", () => {
    const button = el("button", {}, "Save");
    setLoading(button, true, "Saving...");
    expect(button.disabled).toBe(true);
    expect(button.textContent).toBe("Saving...");
    setLoading(button, false);
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe("Save");
    expect(() => setLoading(null, true)).not.toThrow();
  });
});

describe("form helpers", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <form>
        <input name="firstName" value="  Amina ">
        <small data-error-for="firstName"></small>
        <input name="grade" value="Grade 6">
        <small data-error-for="grade"></small>
      </form>`;
  });

  test("readForm trims values", () => {
    expect(readForm(document.querySelector("form"))).toEqual({ firstName: "Amina", grade: "Grade 6" });
  });

  test("showFieldErrors writes messages and marks inputs invalid", () => {
    const form = document.querySelector("form");
    showFieldErrors(form, { grade: "Grade is required." });
    expect(form.querySelector('[data-error-for="grade"]').textContent).toBe("Grade is required.");
    expect(form.elements.grade.getAttribute("aria-invalid")).toBe("true");
    expect(document.activeElement).toBe(form.elements.grade);

    clearFieldErrors(form);
    expect(form.querySelector('[data-error-for="grade"]').textContent).toBe("");
    expect(form.elements.grade.getAttribute("aria-invalid")).toBe("false");
  });
});

describe("renderRows", () => {
  beforeEach(() => {
    document.body.innerHTML = "<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody></tbody></table>";
  });

  test("shows one row per item", () => {
    const tbody = document.querySelector("tbody");
    renderRows(tbody, [1, 2], (n) => el("tr", {}, el("td", {}, n)));
    expect(tbody.querySelectorAll("tr")).toHaveLength(2);
  });

  test("shows an empty message across all columns", () => {
    const tbody = document.querySelector("tbody");
    renderRows(tbody, [], () => null, "Nothing yet");
    const cell = tbody.querySelector("td");
    expect(cell.textContent).toBe("Nothing yet");
    expect(cell.colSpan).toBe(2);
  });
});

test("showOnly hides every other section", () => {
  document.body.innerHTML = '<section id="a"></section><section id="b"></section>';
  showOnly("b", ["a", "b"]);
  expect(document.getElementById("a").hidden).toBe(true);
  expect(document.getElementById("b").hidden).toBe(false);
});

test("formatDate shows day, short month and year", () => {
  expect(formatDate("2026-12-04")).toBe("4 Dec 2026");
});
