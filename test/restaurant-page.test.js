// Tests for the restaurant page (restaurant.html + js/restaurant.js).
// The API is replaced with fakes so the page can be tested without a server.
import * as api from "../js/api.js";
import { init } from "../js/restaurant.js";
import { loadPage, flush, submit, fill } from "./helpers.js";

jest.mock("../js/api.js");

const restaurant = { id: 1, partnerCode: "RES-501", name: "Mama Oliech Kitchen", active: true };
const student = { id: 1, studentCode: "STU-1001", firstName: "Amina", lastName: "Otieno", enrolled: true, school: { name: "Riverside" } };
const coupon = { id: 1, valuePerMeal: 150, mealsTotal: 60, mealsUsed: 2, dailyLimit: 1, expiresAt: "2099-12-04", status: "active" };

beforeEach(async () => {
  sessionStorage.clear();
  loadPage("restaurant.html");
  api.findRestaurantByCode.mockResolvedValue(restaurant);
  api.getRestaurantMeals.mockResolvedValue([]);
  api.findStudentByCode.mockResolvedValue(student);
  api.getActiveCoupon.mockResolvedValue(coupon);
  api.getCouponMeals.mockResolvedValue([]);
  api.createRedemption.mockResolvedValue({ id: 3 });
  api.updateCoupon.mockResolvedValue({});
  await init();

  // Every test starts signed in as RES-501.
  fill("#partnerCode", "RES-501");
  await submit("#login-form");
  await flush(); // wait for the meals table to load
});

test("signing in shows the restaurant name", () => {
  expect(document.querySelector("#restaurant-name").textContent).toBe("Mama Oliech Kitchen");
});

test("checking a student with a valid coupon shows the redeem form", async () => {
  fill("#checkCode", "STU-1001");
  await submit("#check-form");
  expect(document.querySelector("#redeem-form").hidden).toBe(false);
});

test("redeeming a meal saves it and updates the coupon", async () => {
  fill("#checkCode", "STU-1001");
  await submit("#check-form");
  fill("#meal", "Rice and stew");
  await submit("#redeem-form");
  await flush();
  expect(api.createRedemption).toHaveBeenCalled();
  expect(api.updateCoupon).toHaveBeenCalledWith(1, { mealsUsed: 3 });
});
