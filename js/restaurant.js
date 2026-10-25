// Restaurant page: check a student's coupon, redeem a meal, and track meals for reimbursement.
import * as api from "./api.js";
import { checkRedemption, countMealsOnDay, formatMoney, mealsLeft, summarizeMeals } from "./coupons.js";
import { validatePartnerLogin, isValidStudentCode, isBlank, hasErrors } from "./validation.js";
import {
  el, showToast, setLoading, showFieldErrors, clearFieldErrors, readForm,
  formatDateTime, renderRows, showOnly,
} from "./ui.js";

const SESSION_KEY = "fairplate.partnerCode";
const VIEWS = ["login-view", "dashboard-view"];

// What the page remembers between clicks.
const state = {
  restaurant: null,
  student: null, // student currently being served
  coupon: null,
};

export function renderSummary(meals) {
  const summary = summarizeMeals(meals);
  document.querySelector("#sum-count").textContent = summary.count;
  document.querySelector("#sum-total").textContent = formatMoney(summary.total);
  document.querySelector("#sum-unclaimed").textContent = formatMoney(summary.unclaimed);
}

export function renderServed(tbody, meals) {
  renderRows(tbody, meals, (meal) => {
    const claimCell = meal.claimed
      ? el("span", { className: "badge badge--ok" }, "Claimed")
      : el("button", { className: "button button--small", type: "button", dataset: { claimId: meal.id } }, "Mark claimed");
    return el("tr", {},
      el("td", {}, formatDateTime(meal.redeemedAt)),
      el("td", {}, meal.student ? `${meal.student.firstName} ${meal.student.lastName}` : "Removed student"),
      el("td", {}, meal.meal),
      el("td", {}, formatMoney(meal.amount)),
      el("td", {}, claimCell));
  }, "No meals served yet.");
}

export function renderCheckResult(container, { student, coupon, verdict }) {
  container.hidden = false;
  container.className = `check-result ${verdict.ok ? "check-result--ok" : "check-result--fail"}`;
  const details = student
    ? el("p", {}, `${student.firstName} ${student.lastName} · ${student.school?.name || ""}`)
    : null;
  const left = coupon ? el("p", { className: "muted" }, `${mealsLeft(coupon)} meals left · ${formatMoney(coupon.valuePerMeal)} per meal`) : null;
  const lines = [
    el("p", { className: "check-result__title" }, verdict.ok ? "Coupon is valid" : "Cannot redeem"),
    details,
    left,
    verdict.ok ? null : el("p", {}, verdict.reason),
  ];
  container.replaceChildren(...lines.filter(Boolean));
}

async function refreshServed() {
  const meals = await api.getRestaurantMeals(state.restaurant.id);
  renderSummary(meals);
  renderServed(document.querySelector("#served-body"), meals);
}

async function showDashboard(restaurant) {
  state.restaurant = restaurant;
  document.querySelector("#restaurant-name").textContent = restaurant.name;
  await refreshServed();
  showOnly("dashboard-view", VIEWS);
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.target;
  const data = readForm(form);
  const errors = validatePartnerLogin(data);
  if (hasErrors(errors)) return showFieldErrors(form, errors);
  clearFieldErrors(form);

  const button = form.querySelector("button[type=submit]");
  setLoading(button, true, "Signing in...");
  try {
    const restaurant = await api.findRestaurantByCode(data.partnerCode);
    if (!restaurant || !restaurant.active) {
      showToast("That partner code is not registered or not active.", "error");
      return;
    }
    sessionStorage.setItem(SESSION_KEY, restaurant.partnerCode);
    await showDashboard(restaurant);
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(button, false);
  }
}

async function handleCheck(event) {
  event.preventDefault();
  const form = event.target;
  const { studentCode } = readForm(form);
  const redeemForm = document.querySelector("#redeem-form");
  redeemForm.hidden = true;

  if (!isValidStudentCode(studentCode)) {
    return showFieldErrors(form, { studentCode: "Enter a student ID like STU-1001." });
  }
  clearFieldErrors(form);

  const button = form.querySelector("button[type=submit]");
  setLoading(button, true, "Checking...");
  try {
    const student = await api.findStudentByCode(studentCode);
    const coupon = student ? await api.getActiveCoupon(student.id) : null;
    const couponMeals = coupon ? await api.getCouponMeals(coupon.id) : [];
    const verdict = checkRedemption({ student, coupon, mealsToday: countMealsOnDay(couponMeals) });

    state.student = verdict.ok ? student : null;
    state.coupon = verdict.ok ? coupon : null;
    renderCheckResult(document.querySelector("#check-result"), { student, coupon, verdict });
    redeemForm.hidden = !verdict.ok;
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(button, false);
  }
}

async function handleRedeem(event) {
  event.preventDefault();
  const form = event.target;
  const { meal } = readForm(form);
  if (isBlank(meal)) return showFieldErrors(form, { meal: "Describe the meal you served." });
  clearFieldErrors(form);

  const { student, coupon, restaurant } = state;
  const button = form.querySelector("button[type=submit]");
  setLoading(button, true, "Redeeming...");
  try {
    // 1. Record the meal (POST), 2. use up one meal on the coupon (PATCH).
    await api.createRedemption({
      couponId: coupon.id,
      studentId: student.id,
      restaurantId: restaurant.id,
      amount: coupon.valuePerMeal,
      meal,
      redeemedAt: new Date().toISOString(),
      claimed: false,
    });
    await api.updateCoupon(coupon.id, { mealsUsed: coupon.mealsUsed + 1 });

    showToast(`Meal redeemed for ${student.firstName}.`, "success");
    form.reset();
    form.hidden = true;
    document.querySelector("#check-form").reset();
    document.querySelector("#check-result").hidden = true;
    state.student = null;
    state.coupon = null;
    await refreshServed();
  } catch (error) {
    showToast(error.message, "error");
  } finally {
    setLoading(button, false);
  }
}

// One listener on the table handles every "Mark claimed" button.
async function handleClaimClick(event) {
  const button = event.target.closest("[data-claim-id]");
  if (!button) return;
  setLoading(button, true, "Saving...");
  try {
    await api.markClaimed(button.dataset.claimId);
    showToast("Meal marked as claimed for reimbursement.", "success");
    await refreshServed();
  } catch (error) {
    showToast(error.message, "error");
    setLoading(button, false);
  }
}

function handleLogout() {
  sessionStorage.removeItem(SESSION_KEY);
  state.restaurant = null;
  document.querySelector("#login-form").reset();
  showOnly("login-view", VIEWS);
}

export async function init() {
  document.querySelector("#login-form").addEventListener("submit", handleLogin);
  document.querySelector("#check-form").addEventListener("submit", handleCheck);
  document.querySelector("#redeem-form").addEventListener("submit", handleRedeem);
  document.querySelector("#served-body").addEventListener("click", handleClaimClick);
  document.querySelector("#logout-button").addEventListener("click", handleLogout);

  const savedCode = sessionStorage.getItem(SESSION_KEY);
  if (!savedCode) return;
  try {
    const restaurant = await api.findRestaurantByCode(savedCode);
    if (restaurant) await showDashboard(restaurant);
  } catch (error) {
    showToast(error.message, "error");
  }
}

if (document.body?.dataset.page === "restaurant") init();
