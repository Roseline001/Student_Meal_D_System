// Student page: sign in with student ID, then see coupon, nearby restaurants and meal history.
import * as api from "./api.js";
import { countMealsOnDay, daysUntil, formatMoney, mealsLeft } from "./coupons.js";
import { validateStudentLogin, hasErrors } from "./validation.js";
import {
  el, showToast, setLoading, showFieldErrors, clearFieldErrors, readForm,
  formatDate, formatDateTime, renderRows, showOnly,
} from "./ui.js";

const SESSION_KEY = "fairplate.studentCode";
const VIEWS = ["login-view", "dashboard-view"];

export function renderCoupon(container, coupon, now = new Date()) {
  if (!coupon) {
    container.className = "ticket ticket--empty";
    container.replaceChildren(
      el("div", { className: "ticket__main" },
        el("p", { className: "ticket__label" }, "No active coupon"),
        el("p", {}, "Coupons are issued after your enrollment is verified at the start of term."))
    );
    return;
  }

  const days = daysUntil(coupon.expiresAt, now);
  container.className = days < 0 ? "ticket ticket--expired" : "ticket";
  container.replaceChildren(
    el("div", { className: "ticket__main" },
      el("p", { className: "ticket__label" }, coupon.term),
      el("p", { className: "ticket__value" }, formatMoney(coupon.valuePerMeal), el("small", {}, " / meal")),
      el("p", { className: "ticket__meta" }, `${coupon.mealsTotal} meals · ${coupon.dailyLimit} per day · ${coupon.status}`)),
    el("div", { className: "ticket__stub" },
      el("p", { className: "ticket__label" }, days < 0 ? "Expired" : "Valid until"),
      el("p", { className: "ticket__date" }, formatDate(coupon.expiresAt)))
  );
}

export function renderStats(coupon, mealsToday, now = new Date()) {
  document.querySelector("#stat-left").textContent = coupon ? mealsLeft(coupon) : "0";
  document.querySelector("#stat-today").textContent = coupon ? `${mealsToday} / ${coupon.dailyLimit}` : "-";
  document.querySelector("#stat-days").textContent = coupon ? Math.max(daysUntil(coupon.expiresAt, now), 0) : "-";
}

export function renderRestaurants(list, restaurants) {
  if (restaurants.length === 0) {
    list.replaceChildren(el("li", { className: "empty" }, "No partner restaurants near your school yet."));
    return;
  }
  list.replaceChildren(...restaurants.map((r) =>
    el("li", { className: "card restaurant-card" },
      el("h3", {}, r.name),
      el("p", {}, r.address),
      el("p", { className: "muted" }, `Open ${r.openingHours}`))
  ));
}

export function renderHistory(tbody, meals) {
  renderRows(tbody, meals, (meal) =>
    el("tr", {},
      el("td", {}, formatDateTime(meal.redeemedAt)),
      el("td", {}, meal.restaurant?.name || "Unknown"),
      el("td", {}, meal.meal),
      el("td", {}, formatMoney(meal.amount))),
  "You have not used any meals yet.");
}

// Loads everything the dashboard needs for one student and draws it.
export async function loadDashboard(student) {
  const coupon = student.enrolled ? await api.getActiveCoupon(student.id) : null;
  const [meals, restaurants] = await Promise.all([api.getStudentMeals(student.id), api.getRestaurants()]);
  const nearby = restaurants.filter((r) => r.active && r.schoolIds.includes(student.schoolId));
  const mealsToday = coupon ? countMealsOnDay(meals.filter((m) => m.couponId === coupon.id)) : 0;

  document.querySelector("#student-name").textContent = `Hello, ${student.firstName}`;
  document.querySelector("#student-school").textContent = `${student.school?.name || "School"} · ${student.grade}`;
  const status = document.querySelector("#student-status");
  status.className = student.enrolled ? "badge badge--ok" : "badge badge--warn";
  status.textContent = student.enrolled ? "Enrollment verified" : "Waiting for enrollment verification";

  renderCoupon(document.querySelector("#coupon-ticket"), coupon);
  renderStats(coupon, mealsToday);
  renderRestaurants(document.querySelector("#restaurant-list"), nearby);
  renderHistory(document.querySelector("#history-body"), meals);
  showOnly("dashboard-view", VIEWS);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const data = readForm(form);
  const errors = validateStudentLogin(data);
  if (hasErrors(errors)) return showFieldErrors(form, errors);
  clearFieldErrors(form);

  const button = form.querySelector("button[type=submit]");
  setLoading(button, true, "Signing in...");
  try {
    const student = await api.findStudentByCode(data.studentCode);
    if (!student || student.dateOfBirth !== data.dateOfBirth) {
      showToast("Student ID and date of birth do not match our records.", "error");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, student.studentCode);
    await loadDashboard(student);
    showToast(`Welcome back, ${student.firstName}!`, "success");
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(button, false);
  }
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  document.querySelector("#login-form").reset();
  showOnly("login-view", VIEWS);
}

export async function init() {
  document.querySelector("#login-form").addEventListener("submit", handleLogin);
  document.querySelector("#logout-button").addEventListener("click", handleLogout);

  // Stay signed in when the page is reloaded.
  const savedCode = sessionStorage.getItem(SESSION_KEY);
  if (!savedCode) return;
  try {
    const student = await api.findStudentByCode(savedCode);
    if (student) await loadDashboard(student);
  } catch (error) {
    showToast(error.message, "error");
  }
}

if (document.body?.dataset.page === "student") init();
