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

let server, agent;

describe("Todo test suite", () => {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    await db.sequelize.close();
    server.close();
  });

  test("responds with json at /todos", async () => {
    const response = await agent.post("/todos").send({
      title: 'Buy milk',
      dueDate: new Date().toISOString(),
      completed: false
    });

    expect(response.statusCode).toBe(302);
  });

  // test("Mark a todo as complete", async () => {
  //   const response = await agent.post("/todos").send({
  //     title: "Buy milk",
  //     dueDate: new Date().toISOString(),
  //     completed: false
  //   });

  //   const parsedResponse = JSON.parse(response.text);
  //   const todoID = parsedResponse.id;
  //   expect(parsedResponse.completed).toBe(false);

  //   // Fix the template string and variable name
  //   const markCompleteResponse = await agent.put(`/todos/${todoID}/markAsCompleted`).send();
  //   const parsedUpdateResponse = JSON.parse(markCompleteResponse.text);
  //   expect(parsedUpdateResponse.completed).toBe(true);
  // });
});
