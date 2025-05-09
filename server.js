const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json({ extended: false }));
app.use(express.static("public"));
app.set('trust proxy', true);

app.use('/', routes);

app.listen(80, () => {
    console.log("Server running on port 80");
});