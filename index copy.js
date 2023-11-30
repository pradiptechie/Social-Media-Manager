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
app.get('/fb', (req, res) => {
  res.render('fb', { title: 'Social Media Manager' });
});

app.get('/connect/facebook', (req, res) => {
    res.send('Connecting with Facebook...');
});

app.get('/connect/instagram', (req, res) => {
    res.send('Connecting with Instagram...');
});

app.get('/connect/x', (req, res) => {
    res.send('Connecting with X...');
});

app.get('/connect/tiktok', (req, res) => {
    res.send('Connecting with tiktok...');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
