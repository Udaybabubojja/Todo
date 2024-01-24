/* eslint-disable indent */
/* eslint-disable semi */
/* eslint-disable quotes */
const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.get("/", async (request, response) => {
    const allTodos = await Todo.getTodos();
    if (request.accepts("html")) {
      response.render('index', { allTodos });
    } else {
      response.json(allTodos);
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
    const todo = await Todo.create({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false
    });
    return response.json(todo);
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
        const todo = await Todo.findByPk(request.params.id);

        if (!todo) {
            return response.status(404).json({ error: 'Todo not found' });
        }

        await todo.destroy();
        return response.json({ success: true });
    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: 'Internal Server Error' });
    }
});
module.exports = app;
