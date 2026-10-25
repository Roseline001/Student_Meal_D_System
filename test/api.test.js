import * as api from "../js/api.js";
import { API_BASE_URL } from "../js/config.js";

// Replaces the browser's fetch with a fake that returns `body` with `status`.
function mockFetch(body, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  });
}

const lastCall = () => {
  const [url, options] = global.fetch.mock.calls.at(-1);
  return { url, ...options, body: options.body && JSON.parse(options.body) };
};

afterEach(() => {
  delete global.fetch;
});

describe("request", () => {
  test("GET returns parsed JSON from the API base URL", async () => {
    mockFetch([{ id: 1 }]);
    await expect(api.getSchools()).resolves.toEqual([{ id: 1 }]);
    expect(lastCall()).toMatchObject({ url: `${API_BASE_URL}/schools`, method: "GET" });
  });

  test("throws a friendly ApiError for a 404", async () => {
    mockFetch({}, 404);
    await expect(api.get("/students/99")).rejects.toMatchObject({ name: "ApiError", status: 404, message: "Record not found." });
  });

  test("throws an ApiError for other failing statuses", async () => {
    mockFetch({}, 500);
    await expect(api.get("/students")).rejects.toThrow("Request failed (500).");
  });

  test("throws an ApiError when the network is down", async () => {
    global.fetch = jest.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(api.getCoupons()).rejects.toThrow("Cannot reach the server");
  });

  test("returns null for a 204 response", async () => {
    mockFetch(null, 204);
    await expect(api.remove("/schools/1")).resolves.toBeNull();
  });
});

describe("HTTP methods", () => {
  test("POST sends a JSON body", async () => {
    mockFetch({ id: 5 });
    await api.createSchool({ name: "Lake School" });
    expect(lastCall()).toMatchObject({
      method: "POST", body: { name: "Lake School" }, headers: { "Content-Type": "application/json" },
    });
  });

  test("PUT replaces a student", async () => {
    mockFetch({});
    await api.replaceStudent(3, { firstName: "Ann" });
    expect(lastCall()).toMatchObject({ url: `${API_BASE_URL}/students/3`, method: "PUT", body: { firstName: "Ann" } });
  });

  test("PATCH verifies enrollment with a timestamp", async () => {
    mockFetch({});
    await api.setEnrollment(3, true);
    const call = lastCall();
    expect(call.method).toBe("PATCH");
    expect(call.body.enrolled).toBe(true);
    expect(typeof call.body.verifiedAt).toBe("string");
  });

  test("PATCH clears the timestamp when unverifying", async () => {
    mockFetch({});
    await api.setEnrollment(3, false);
    expect(lastCall().body).toEqual({ enrolled: false, verifiedAt: null });
  });

  test("DELETE removes a record", async () => {
    mockFetch({});
    await api.deleteRestaurant(2);
    expect(lastCall()).toMatchObject({ url: `${API_BASE_URL}/restaurants/2`, method: "DELETE" });
  });
});

describe("lookups", () => {
  test("findStudentByCode normalises the code and returns the first match", async () => {
    mockFetch([{ id: 1, studentCode: "STU-1001" }]);
    await expect(api.findStudentByCode(" stu-1001 ")).resolves.toEqual({ id: 1, studentCode: "STU-1001" });
    expect(lastCall().url).toContain("studentCode=STU-1001");
  });

  test("findStudentByCode returns null when nothing matches", async () => {
    mockFetch([]);
    await expect(api.findStudentByCode("STU-0000")).resolves.toBeNull();
  });

  test("findRestaurantByCode and getActiveCoupon return null when empty", async () => {
    mockFetch([]);
    await expect(api.findRestaurantByCode("RES-999")).resolves.toBeNull();
    await expect(api.getActiveCoupon(1)).resolves.toBeNull();
  });

  test("meal history requests are sorted newest first", async () => {
    mockFetch([]);
    await api.getStudentMeals(1);
    expect(lastCall().url).toContain("studentId=1&_expand=restaurant&_sort=redeemedAt&_order=desc");
    await api.getRestaurantMeals(2);
    expect(lastCall().url).toContain("restaurantId=2&_expand=student");
  });
});
