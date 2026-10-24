// App-wide settings. Change these in one place instead of across files.

// After deploying the API to Render, paste its URL here (no trailing slash).
export const DEPLOYED_API_URL = "https://SMeS-api.onrender.com";
export const LOCAL_API_URL = "http://localhost:3000";

const isLocal = ["localhost", "127.0.0.1"].includes(globalThis.location?.hostname);

export const API_BASE_URL = isLocal ? LOCAL_API_URL : DEPLOYED_API_URL;

// Currency used when showing coupon values.
export const CURRENCY = "KES";

// Default values used when the admin issues coupons for a new term.
export const DEFAULT_COUPON = {
  valuePerMeal: 150,
  mealsTotal: 60,
  dailyLimit: 1,
};
