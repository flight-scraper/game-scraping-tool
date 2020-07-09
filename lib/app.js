const express = require('express');
const app = express();

app.use(express.json());

require('./utils/twitterBot');

app.use(require('./middleware/not-found'));
app.use(require('./middleware/error'));

module.exports = app;
