import {
  toDateKey, daysUntil, mealsLeft, countMealsOnDay, checkRedemption, buildTermCoupon, summarizeMeals, formatMoney,
} from "../js/coupons.js";

const now = new Date("2026-10-23T10:00:00");
const student = { id: 1, enrolled: true };
const coupon = { id: 1, status: "active", expiresAt: "2026-12-04", mealsTotal: 60, mealsUsed: 2, dailyLimit: 1, valuePerMeal: 150 };

describe("dates", () => {
  test("toDateKey gives YYYY-MM-DD", () => {
    expect(toDateKey(new Date("2026-03-05T09:00:00"))).toBe("2026-03-05");
  });

  test("daysUntil counts whole days, 0 on the last day, negative after", () => {
    expect(daysUntil("2026-10-25", now)).toBe(2);
    expect(daysUntil("2026-10-23", now)).toBe(0);
    expect(daysUntil("2026-10-22", now)).toBe(-1);
  });
});

test("mealsLeft never goes below zero", () => {
  expect(mealsLeft(coupon)).toBe(58);
  expect(mealsLeft({ mealsTotal: 5, mealsUsed: 9 })).toBe(0);
});

test("countMealsOnDay only counts today's meals", () => {
  const meals = [
    { redeemedAt: "2026-10-23T08:00:00" },
    { redeemedAt: "2026-10-23T13:00:00" },
    { redeemedAt: "2026-10-22T12:00:00" },
  ];
  expect(countMealsOnDay(meals, now)).toBe(2);
});

describe("checkRedemption", () => {
  const check = (overrides) => checkRedemption({ student, coupon, mealsToday: 0, now, ...overrides });

  test("allows a valid coupon", () => {
    expect(check({})).toEqual({ ok: true });
  });

  test.each([
    [{ student: null }, "No student found"],
    [{ student: { enrolled: false } }, "not verified"],
    [{ coupon: null }, "no active coupon"],
    [{ coupon: { ...coupon, status: "suspended" } }, "suspended"],
    [{ coupon: { ...coupon, expiresAt: "2026-10-01" } }, "expired"],
    [{ coupon: { ...coupon, mealsUsed: 60 } }, "All meals"],
    [{ mealsToday: 1 }, "Daily limit"],
  ])("refuses when %o", (overrides, reason) => {
    const result = check(overrides);
    expect(result.ok).toBe(false);
    expect(result.reason).toContain(reason);
  });
});

test("buildTermCoupon creates a fresh, active coupon with numbers", () => {
  const settings = { term: "2027 Term 1", valuePerMeal: "200", mealsTotal: "50", dailyLimit: "2", expiresAt: "2027-04-01" };
  expect(buildTermCoupon(7, settings, now)).toEqual({
    studentId: 7, term: "2027 Term 1", valuePerMeal: 200, mealsTotal: 50, mealsUsed: 0,
    dailyLimit: 2, issuedAt: "2026-10-23", expiresAt: "2027-04-01", status: "active",
  });
});

test("summarizeMeals splits claimed and unclaimed totals", () => {
  const meals = [{ amount: 150, claimed: true }, { amount: 150, claimed: false }, { amount: 100, claimed: false }];
  expect(summarizeMeals(meals)).toEqual({ count: 3, total: 400, claimed: 150, unclaimed: 250 });
});

test("formatMoney shows the currency", () => {
  expect(formatMoney(150)).toMatch(/KES\s?150\.00/);
});
