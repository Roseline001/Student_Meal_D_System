// Tests for js/api.js: one test for each of the five HTTP methods.
// fetch is replaced with a fake, so no real server is needed.
import * as api from "../js/api.js";

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([]) });
});

// The method used in the last fetch call.
const lastMethod = () => global.fetch.mock.calls[0][1].method;

test("GET loads the schools", async () => {
  await api.getSchools();
  expect(lastMethod()).toBe("GET");
});

test("POST creates a school", async () => {
  await api.createSchool({ name: "Lake School" });
  expect(lastMethod()).toBe("POST");
});

test("PUT replaces a student", async () => {
  await api.replaceStudent(3, { firstName: "Ann" });
  expect(lastMethod()).toBe("PUT");
});

test("PATCH verifies a student's enrollment", async () => {
  await api.setEnrollment(3, true);
  expect(lastMethod()).toBe("PATCH");
});

test("DELETE removes a restaurant", async () => {
  await api.deleteRestaurant(2);
  expect(lastMethod()).toBe("DELETE");
});

test("a 404 from the server becomes a friendly message", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 404 });
  await expect(api.get("/students/99")).rejects.toThrow("Record not found.");
});
