import * as api from "../js/api.js";
import { init } from "../js/pages/restaurant.js";
import { loadPage, flush, submit, fill } from "./helpers.js";

jest.mock("../js/api.js");

const restaurant = { id: 1, partnerCode: "RES-501", name: "Mama Oliech Kitchen", active: true };
const student = { id: 1, studentCode: "STU-1001", firstName: "Amina", lastName: "Otieno", enrolled: true, school: { name: "Riverside" } };
const coupon = { id: 1, valuePerMeal: 150, mealsTotal: 60, mealsUsed: 2, dailyLimit: 1, expiresAt: "2099-12-04", status: "active" };
const served = [
  { id: 1, amount: 150, meal: "Rice and beans", redeemedAt: "2026-10-20T12:15:00Z", claimed: false, student },
  { id: 2, amount: 150, meal: "Chapati", redeemedAt: "2026-10-21T12:15:00Z", claimed: true, student },
];

const text = (selector) => document.querySelector(selector).textContent;

async function signIn() {
  fill("#partnerCode", "RES-501");
  await submit("#login-form");
  await flush();
}

async function checkStudent(code = "STU-1001") {
  fill("#checkCode", code);
  await submit("#check-form");
  await flush();
}

beforeEach(async () => {
  sessionStorage.clear();
  jest.resetAllMocks();
  loadPage("restaurant.html");
  api.findRestaurantByCode.mockResolvedValue(restaurant);
  api.getRestaurantMeals.mockResolvedValue(served);
  api.findStudentByCode.mockResolvedValue(student);
  api.getActiveCoupon.mockResolvedValue(coupon);
  api.getCouponMeals.mockResolvedValue([]);
  api.createRedemption.mockResolvedValue({ id: 3 });
  api.updateCoupon.mockResolvedValue({});
  api.markClaimed.mockResolvedValue({});
  await init();
});

test("validates the partner code before calling the API", async () => {
  fill("#partnerCode", "abc");
  await submit("#login-form");
  expect(text('[data-error-for="partnerCode"]')).toContain("RES-501");
  expect(api.findRestaurantByCode).not.toHaveBeenCalled();
});

test("rejects an unknown partner code", async () => {
  api.findRestaurantByCode.mockResolvedValue(null);
  await signIn();
  expect(text("#toast-region")).toContain("not registered");
});

test("signs in and shows the reimbursement summary and meals table", async () => {
  await signIn();
  expect(text("#restaurant-name")).toBe("Mama Oliech Kitchen");
  expect(text("#sum-count")).toBe("2");
  expect(text("#sum-unclaimed")).toMatch(/150\.00/);
  expect(document.querySelectorAll("#served-body tr")).toHaveLength(2);
  expect(document.querySelectorAll("[data-claim-id]")).toHaveLength(1);
});

test("a valid coupon can be redeemed: POST the meal, then PATCH the coupon", async () => {
  await signIn();
  await checkStudent();
  expect(text("#check-result")).toContain("Coupon is valid");
  expect(text("#check-result")).not.toContain("null");
  expect(document.querySelector("#redeem-form").hidden).toBe(false);

  fill("#meal", "Rice and stew");
  await submit("#redeem-form");
  await flush();

  expect(api.createRedemption).toHaveBeenCalledWith(expect.objectContaining({
    couponId: 1, studentId: 1, restaurantId: 1, amount: 150, meal: "Rice and stew", claimed: false,
  }));
  expect(api.updateCoupon).toHaveBeenCalledWith(1, { mealsUsed: 3 });
  expect(text("#toast-region")).toContain("Meal redeemed for Amina");
  expect(document.querySelector("#redeem-form").hidden).toBe(true);
});

test("the redeem form asks for a meal description", async () => {
  await signIn();
  await checkStudent();
  await submit("#redeem-form");
  expect(text('[data-error-for="meal"]')).toContain("Describe the meal");
  expect(api.createRedemption).not.toHaveBeenCalled();
});

test("refuses when the daily limit is reached", async () => {
  api.getCouponMeals.mockResolvedValue([{ redeemedAt: new Date().toISOString() }]);
  await signIn();
  await checkStudent();
  expect(text("#check-result")).toContain("Daily limit reached");
  expect(document.querySelector("#redeem-form").hidden).toBe(true);
});

test("validates the student ID before checking", async () => {
  await signIn();
  await checkStudent("123");
  expect(text('[data-error-for="studentCode"]')).toContain("STU-1001");
  expect(api.findStudentByCode).not.toHaveBeenCalled();
});

test("marks a meal as claimed with PATCH", async () => {
  await signIn();
  document.querySelector("[data-claim-id]").click();
  await flush();
  expect(api.markClaimed).toHaveBeenCalledWith("1");
  expect(text("#toast-region")).toContain("claimed");
});

test("signs out", async () => {
  await signIn();
  document.querySelector("#logout-button").click();
  expect(document.querySelector("#login-view").hidden).toBe(false);
  expect(sessionStorage.getItem("fairplate.partnerCode")).toBeNull();
});
