/* eslint-disable prefer-const */
/* eslint-disable indent */
/* eslint-disable semi */
/* eslint-disable quotes */
let csrf = require("csurf");
let cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());
app.use(cookieParser("Neeku enduku ra!.."));
app.use(csrf({ cookie: true }));

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }))

app.get("/", async (request, response) => {
    const overDue = await Todo.overDue();
    const dueToday = await Todo.dueToday();
    const dueLater = await Todo.dueLater();
    if (request.accepts("html")) {
      response.render('index', { overDue, dueToday, dueLater, csrfToken: request.csrfToken() });
    } else {
      response.json({ overDue, dueToday, dueLater });
    }
})

app.get("/todos", async (request, response) => {
    try {
        const todos = await Todo.findAll();
        return response.json(todos);
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
});

app.post("/todos", async (request, response) => {
  console.log("post method..");
  try {
    await Todo.create({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false
    });
    return response.redirect("/");
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async (request, response) => {
  console.log("we have id: ", request.params.id);
  try {
    const todo = await Todo.findByPk(request.params.id);

    if (!todo) {
      return response.status(404).json({ error: "Todo not found" });
    }
    await todo.markAsCompleted();
    return response.json(todo);
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async (request, response) => {
    console.log("Deleted id: ", request.params.id);
    try {
        await Todo.remove(request.params.id);
        return response.json({ success: true });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
});
module.exports = app;
