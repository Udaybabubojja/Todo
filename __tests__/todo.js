/* eslint-disable no-template-curly-in-string */
/* eslint-disable func-call-spacing */
/* eslint-disable quote-props */
/* eslint-disable no-whitespace-before-property */
/* eslint-disable eol-last */
/* eslint-disable object-curly-spacing */
/* eslint-disable arrow-spacing */
/* eslint-disable semi */
/* eslint-disable no-multi-spaces */
/* eslint-disable no-unused-vars */
/* eslint-disable indent */
/* eslint-disable no-undef */
/* eslint-disable quotes */

const supertest = require("supertest");
const request = supertest; // Corrected the import name
const db = require("../models/index");
const app = require("../app");
const { describe, beforeAll, afterAll, test, expect } = require("@jest/globals"); // Import describe, beforeAll, afterAll, test, and expect from Jest
const cheerio = require("cheerio");
let server, agent;
function extractCsrfToken (res) {
  const $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}
const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  const csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password,
    _csrf: csrfToken
  })
}
describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });
  test("sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "User A",
      email: "user.a@test.com",
      password: "123456",
      _csrf: csrfToken
    });
    expect(res.statusCode).toBe(302);
  })
  test("Sign Out", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  })
  test("responds with json at /todos", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "123456");
    const res = await agent.get("/todos")
    const csrfToken = extractCsrfToken(res)
    const response = await agent.post("/todos").send({
      title: 'Buy milk',
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken
    });

    expect(response.statusCode).toBe(302);
  });

  test("Mark a todo as complete", async () => {
    const agent = request.agent(server);
    await login(agent, "user.a@test.com", "123456");

    let res = await agent.get("/todos");
    let csrfToken = extractCsrfToken(res);

    // Create a new todo
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken
    });

    // Fetch the grouped todos
    const groupedTodosResponse = await agent.get("/todos").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);

    // Check if there is at least one todo in the dueToday array
    if (parsedGroupedResponse.dueToday.length > 0) {
      const dueTodayCount = parsedGroupedResponse.dueToday.length;
      const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1].id;

      res = await agent.get("/todos");
      csrfToken = extractCsrfToken(res);

      // Fix the template string and variable name
      const markCompleteResponse = await agent.put(`/todos/${latestTodo}`).send({
        _csrf: csrfToken
      });

      const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
      expect(parsedUpdateResponse.completed).toBe(true);
    } else {
      console.error('No todo found in the dueToday array.');
    }
  });

  test("delete a todo", async () => {
    const createResponse = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      _csrf: extractCsrfToken(await agent.get("/todos"))
    });

    const todoId = createResponse.body.id;

    const deleteResponse = await agent.delete(`/todos/${todoId}`).send({
      _csrf: extractCsrfToken(await agent.get("/todos"))
    });
    // Ensure the todo is deleted by fetching it again
    const fetchResponse = await agent.get(`/todos/${todoId}`);
    expect(fetchResponse.statusCode).toBe(404);
  });
});
