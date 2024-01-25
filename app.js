/* eslint-disable prefer-const */
/* eslint-disable indent */
/* eslint-disable semi */
/* eslint-disable quotes */
let csrf = require("tiny-csrf");
let cookieParser = require("cookie-parser");
const express = require("express");
const app = express();
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: false }))

// after the express.urlencoded the below 2 lines should there
app.use(cookieParser("Something is there"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

app.use(session({
  secret: "my_secret_key1332141",
  cookie: {
    maxAge: 24 * 60 * 60 * 1000
  }
}));
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
}, (username, password, done) => {
  User.findOne({
    where: {
      email: username
    }
  }).then(async (user) => {
    const result = await bcrypt.compare(password, user.password)
    if (result) {
      return done(null, user);
    } else {
      return done("Invalid Password");
    }
  }).catch((error) => {
    return (error);
  })
}))

passport.serializeUser((user, done) => {
  console.log("serializing User in sesson ", user.id);
  done(null, user.id)
})

passport.deserializeUser((id, done) => {
  User.findByPk(id)
  .then(user => {
    done(null, user);
  }).catch(error => {
    done(error, null);
  })
})

app.get("/", async (request, response) => {
    response.render('index', { title: "Todo-Application", csrfToken: request.csrfToken() });
})
app.get("/signup", (request, response) => {
  response.render("signup", { title: "Signup", csrfToken: request.csrfToken() })
})

app.post("/users", async (request, response) => {
  try {
    const hashpwd = await bcrypt.hash(request.body.password, 10);
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastName,
      email: request.body.email,
      password: hashpwd
    });
    console.log(user);
    // Assuming you want to use Passport for authentication
    request.login(user, (err) => {
      if (err) {
        console.error(err);
        return response.status(500).json({ error: 'Internal Server Error' });
      }
      // Redirect to "/todos" after successful login
      return response.redirect("/todos");
    });
  } catch (err) {
    console.error(err);
    // Handle errors appropriately, e.g., redirect to a signup error page
    response.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get("/login", (request, response) => {
  response.render("login", { title: "login", csrfToken: request.csrfToken() });
})

app.post("/session", passport.authenticate('local', { failureRedirect: '/' }), (request, response) => {
  console.log(request.user);
  response.redirect("/todos");
})

app.get("/signout", (request, response) => {
  request.logout((err) => {
    if (err) {
      // eslint-disable-next-line no-undef
      return next(err);
    }
    return response.redirect("/");
  })
})

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  const loggedInUser = request.user.id;
  const overDue = await Todo.overDue(loggedInUser);
  const dueToday = await Todo.dueToday(loggedInUser);
  const dueLater = await Todo.dueLater(loggedInUser);
  const completedItems = await Todo.completedItems(loggedInUser);
  if (request.accepts("html")) {
    response.render('todos', { overDue, dueToday, dueLater, completedItems, csrfToken: request.csrfToken() });
  } else {
    response.json({ overDue, dueToday, dueLater, completedItems });
  }
});

app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("post method..");
  try {
    await Todo.create({
      title: request.body.title,
      dueDate: request.body.dueDate,
      completed: false,
      userId: request.user.id
    });
    response.redirect("/todos");
  } catch (error) {
    console.error(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
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

app.delete("/todos/:id", connectEnsureLogin.ensureLoggedIn(), async (request, response) => {
  console.log("Deleted id: ", request.params.id);
  try {
      const loggedInUser = request.user.id;
      const todo = await Todo.findByPk(request.params.id);
      if (!todo) {
          return response.status(404).json({ error: "Todo not found" });
      }
      if (todo.completed) {
          await Todo.create({
              title: todo.title,
              dueDate: todo.dueDate,
              completed: false
          });
      }
      await Todo.remove(request.params.id, loggedInUser);
      return response.json({ success: true });
  } catch (error) {
      console.error(error);
      return response.status(500).json({ error: 'Internal Server Error' });
  }
});
module.exports = app;
