// coupons.js: the coupon rules. These functions are pure (no DOM, no fetch)
// so they are easy to test and reuse on the student and restaurant pages.
import { CURRENCY } from "./config.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// "2026-10-23T09:15:00Z" -> "2026-10-23" (in the user's local time zone)
export function toDateKey(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Whole days from today until the expiry date: 0 on the last valid day,
// negative once the coupon has expired.
export function daysUntil(expiresAt, now = new Date()) {
  const today = new Date(`${toDateKey(now)}T00:00:00`);
  const expiryDay = new Date(`${expiresAt}T00:00:00`);
  return Math.round((expiryDay - today) / DAY_MS);
}

export function mealsLeft(coupon) {
  return Math.max(coupon.mealsTotal - coupon.mealsUsed, 0);
}

// How many of these meals were served on the same day as `now`.
export function countMealsOnDay(meals, now = new Date()) {
  const today = toDateKey(now);
  return meals.filter((meal) => toDateKey(meal.redeemedAt) === today).length;
}

// Decides if a student can get a meal right now.
// Returns { ok: true } or { ok: false, reason: "..." } so the UI can explain why.
export function checkRedemption({ student, coupon, mealsToday, now = new Date() }) {
  if (!student) return { ok: false, reason: "No student found with that ID." };
  if (!student.enrolled) return { ok: false, reason: "Student enrollment is not verified yet." };
  if (!coupon) return { ok: false, reason: "Student has no active coupon this term." };
  if (coupon.status !== "active") return { ok: false, reason: `Coupon is ${coupon.status}.` };
  if (daysUntil(coupon.expiresAt, now) < 0) return { ok: false, reason: "Coupon has expired." };
  if (mealsLeft(coupon) === 0) return { ok: false, reason: "All meals for this term are used." };
  if (mealsToday >= coupon.dailyLimit) {
    return { ok: false, reason: `Daily limit reached (${coupon.dailyLimit} per day).` };
  }
  return { ok: true };
}

// Builds the coupon a newly verified student receives for a term.
export function buildTermCoupon(studentId, { term, valuePerMeal, mealsTotal, dailyLimit, expiresAt }, now = new Date()) {
  return {
    studentId,
    term,
    valuePerMeal: Number(valuePerMeal),
    mealsTotal: Number(mealsTotal),
    mealsUsed: 0,
    dailyLimit: Number(dailyLimit),
    issuedAt: toDateKey(now),
    expiresAt,
    status: "active",
  };
}

// Totals for the government reimbursement report.
export function summarizeMeals(meals) {
  return meals.reduce(
    (summary, meal) => {
      summary.count += 1;
      summary.total += meal.amount;
      if (meal.claimed) summary.claimed += meal.amount;
      else summary.unclaimed += meal.amount;
      return summary;
    },
    { count: 0, total: 0, claimed: 0, unclaimed: 0 }
  );
}

export function formatMoney(amount) {
  return new Intl.NumberFormat("en", { style: "currency", currency: CURRENCY }).format(amount);
}
