// api.js: every call to the JSON Server backend goes through this module.
// It uses all five HTTP methods: GET, POST, PUT, PATCH and DELETE.
import { API_BASE_URL } from "./config.js";

// Thrown when the server answers with an error status or cannot be reached.
export class ApiError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Sends one request and returns the parsed JSON body.
export async function request(path, { method = "GET", body } = {}) {
  const options = { method, headers: {} };
  if (body !== undefined) {
    options.headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, options);
  } catch {
    throw new ApiError("Cannot reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    const message = response.status === 404 ? "Record not found." : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status);
  }

  // DELETE returns an empty object; a 204 has no body at all.
  return response.status === 204 ? null : response.json();
}

export const get = (path) => request(path);
export const post = (path, body) => request(path, { method: "POST", body });
export const put = (path, body) => request(path, { method: "PUT", body });
export const patch = (path, body) => request(path, { method: "PATCH", body });
export const remove = (path) => request(path, { method: "DELETE" });

// ---------- Schools ----------
export const getSchools = () => get("/schools");
export const createSchool = (school) => post("/schools", school);
export const deleteSchool = (id) => remove(`/schools/${id}`);

// ---------- Students ----------
export const getStudents = () => get("/students?_expand=school");

export async function findStudentByCode(studentCode) {
  const code = encodeURIComponent(studentCode.trim().toUpperCase());
  const matches = await get(`/students?studentCode=${code}&_expand=school`);
  return matches[0] || null;
}

export const createStudent = (student) => post("/students", student);
export const replaceStudent = (id, student) => put(`/students/${id}`, student);
export const setEnrollment = (id, enrolled) =>
  patch(`/students/${id}`, { enrolled, verifiedAt: enrolled ? new Date().toISOString() : null });
export const deleteStudent = (id) => remove(`/students/${id}`);

// ---------- Restaurants ----------
export const getRestaurants = () => get("/restaurants");

export async function findRestaurantByCode(partnerCode) {
  const code = encodeURIComponent(partnerCode.trim().toUpperCase());
  const matches = await get(`/restaurants?partnerCode=${code}`);
  return matches[0] || null;
}

export const createRestaurant = (restaurant) => post("/restaurants", restaurant);
export const deleteRestaurant = (id) => remove(`/restaurants/${id}`);

// ---------- Coupons ----------
export const getCoupons = () => get("/coupons");

export async function getActiveCoupon(studentId) {
  const coupons = await get(`/coupons?studentId=${studentId}&status=active`);
  return coupons[0] || null;
}

export const createCoupon = (coupon) => post("/coupons", coupon);
export const updateCoupon = (id, changes) => patch(`/coupons/${id}`, changes);

// ---------- Redemptions (meals served) ----------
export const getStudentMeals = (studentId) =>
  get(`/redemptions?studentId=${studentId}&_expand=restaurant&_sort=redeemedAt&_order=desc`);

export const getRestaurantMeals = (restaurantId) =>
  get(`/redemptions?restaurantId=${restaurantId}&_expand=student&_sort=redeemedAt&_order=desc`);

export const getCouponMeals = (couponId) => get(`/redemptions?couponId=${couponId}`);

export const createRedemption = (redemption) => post("/redemptions", redemption);
export const markClaimed = (id) => patch(`/redemptions/${id}`, { claimed: true });
