// Tests for js/coupons.js: the coupon rules.
import { mealsLeft, daysUntil, checkRedemption, summarizeMeals } from "../js/coupons.js";

const today = new Date("2026-10-23T10:00:00");
const student = { id: 1, enrolled: true };
const coupon = { status: "active", expiresAt: "2026-12-04", mealsTotal: 60, mealsUsed: 2, dailyLimit: 1 };

test("mealsLeft subtracts the meals already used", () => {
  expect(mealsLeft(coupon)).toBe(58);
});

test("daysUntil counts the days left before expiry", () => {
  expect(daysUntil("2026-10-25", today)).toBe(2);
});

test("a verified student with an active coupon can get a meal", () => {
  const result = checkRedemption({ student, coupon, mealsToday: 0, now: today });
  expect(result.ok).toBe(true);
});

test("a student who already ate today is refused", () => {
  const result = checkRedemption({ student, coupon, mealsToday: 1, now: today });
  expect(result.ok).toBe(false);
  expect(result.reason).toContain("Daily limit");
});

test("an expired coupon is refused", () => {
  const oldCoupon = { ...coupon, expiresAt: "2026-10-01" };
  const result = checkRedemption({ student, coupon: oldCoupon, mealsToday: 0, now: today });
  expect(result.ok).toBe(false);
});

test("summarizeMeals adds up claimed and unclaimed money", () => {
  const meals = [{ amount: 150, claimed: true }, { amount: 150, claimed: false }];
  expect(summarizeMeals(meals)).toEqual({ count: 2, total: 300, claimed: 150, unclaimed: 150 });
});
