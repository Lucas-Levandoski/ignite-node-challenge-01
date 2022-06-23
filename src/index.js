const express = require('express');
const cors = require('cors');
const { v4: uuidv4, validate } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.filter(user => user.username === username)[0];

  if(!username)
    return response.status(400).json({ error: 'no username present on header' });

  if (!users.length)
    return response.status(401).json({ error: 'user not found' });

  if (!user)
    return response.status(401).json({ error: 'user not found' });

  request.body.user = user;
  next();
}

function checkExistsTodoItem(request, response, next) {
  const { user } = request.body;
  const { id } = request.params;

  if (!validate(id))
    return response.status(404).json({ error: 'id not valid' })

  const todoIndex = user.todos.map(todo => todo.id).indexOf(id);

  if (todoIndex < 0)
    return response.status(400).json({ error: 'todo does not exist'});

  request.body.todoIndex = todoIndex;

  next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;
  
  if(users.filter(user => user.username === username).length)
    return response.status(400).json({ error: 'username already exists' });

  const user = {
    id: uuidv4(),
    name,
    username,
    todos: []
  }

  users.push(user);

  return response.status(201).json(user);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request.body;

  return response.status(200).json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user, title, deadline } = request.body;

  const todo = {
    id: uuidv4(),
    title,
    deadline: new Date(deadline),
    done: false,
    created_at: new Date(),
  }

  user.todos.push(todo);

  return response.status(201).json(todo);
});

app.put('/todos/:id', checksExistsUserAccount, checkExistsTodoItem, (request, response) => {
  const { user, title, deadline, todoIndex } = request.body;

  user.todos[todoIndex].title = title;
  user.todos[todoIndex].deadline = new Date(deadline);

  return response.status(201).json(user.todos[todoIndex]);
});

app.patch('/todos/:id/done', checksExistsUserAccount, checkExistsTodoItem, (request, response) => {
  const { user, todoIndex } = request.body;

  user.todos[todoIndex].done = true;

  return response.status(201).json(user.todos[todoIndex]);
});

app.delete('/todos/:id', checksExistsUserAccount, checkExistsTodoItem, (request, response) => {
  const { user, todoIndex } = request.body;

  user.todos.splice(todoIndex, 1);

  return response.status(204).send('todo deleted')
});

module.exports = app;