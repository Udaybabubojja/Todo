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

  test("responds with json at /todos", async () => {
    const res = await agent.get("/")
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
    let res = await agent.get("/")
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf": csrfToken
    });

    const groupedTodosResponse = await agent.get("/").set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday [dueTodayCount - 1];
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);

    // Fix the template string and variable name
    const markCompleteResponse = await agent.put(`/todos/${latestTodo.id}/markAsCompleted`).send({
      _csrf: csrfToken
    });
    const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
    expect(parsedUpdateResponse.completed).toBe(true);
  });
});
