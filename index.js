const path = require('path');

const express = require('express');
const app = express();
const port = 3000;

const hbs = require('hbs');
app.set("view engine", 'hbs');

// Set up static files directory
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.render('home', { title: 'Social Media Manager' });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
