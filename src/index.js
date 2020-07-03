const express = require('express');
require('./db/mongoose');
const usersRouter = require('./routers/User');
const tasksRouter = require('./routers/Task');

// Creating Express Web App
const app = express();
const PORT = process.env.PORT;

// Telling Express app to use Express.json() which helps in parsing incoming json data to JS object types
app.use(express.json());

// Telling Express app to use routers.
app.use(usersRouter, tasksRouter);

// Starting our Server
app.listen(PORT, () => {
    return console.log('Server started and listening on port ' + PORT);
})