
const session = require('express-session');
const Twit = require('twit');
const fs = require('fs');

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

// -----------------------------

app.use(session({
  secret: 'ZvPv5yEdFPiP9odi77UmmmydGqnyEfcxVnEs3dmxnPhTcDUreb',
  resave: true,
  saveUninitialized: true
}));


const twitterClient = new Twit({
  consumer_key: 'Hqd3ztRQekdAVkADD92aGevim',
  consumer_secret: 'ZvPv5yEdFPiP9odi77UmmmydGqnyEfcxVnEs3dmxnPhTcDUreb',
  access_token: '1337604392548065284-5wcPh4iO3Sf01M4HAMQ8NY4JziwpQF',
  access_token_secret: 'HI8nniUbOsBeZN7Zol3W4mUiYRgahDAPlcXrI8MEwZwxs',
  callback: '/callback' // Update with your callback URL
});

app.get('/connect/x', (req, res) => {
    // res.send('Connecting with X...');
    res.redirect('/login');
});

app.get('/login', (req, res) => {
  twitterClient.get('oauth/request_token', { oauth_callback: '/callback' }, (err, data, response) => {
    if (err) {
      console.error('Error initiating Twitter authentication:', err);
      return res.status(500).send('Error initiating Twitter authentication');
    }

    req.session.oauthToken = data.oauth_token;
    req.session.oauthTokenSecret = data.oauth_token_secret;

    res.redirect(`https://api.twitter.com/oauth/authenticate?oauth_token=${req.session.oauthToken}`);
  });
});

app.get('/callback', (req, res) => {
  const oauthToken = req.session.oauthToken;
  const oauthTokenSecret = req.session.oauthTokenSecret;
  const oauthVerifier = req.query.oauth_verifier;

  twitterClient.post('oauth/access_token', { oauth_token: oauthToken, oauth_token_secret: oauthTokenSecret, oauth_verifier: oauthVerifier }, (err, data, response) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Error getting Twitter access token');
    }

    const accessToken = data.oauth_token;
    const accessTokenSecret = data.oauth_token_secret;

    // Store access token in a file (public/accessToken.txt)
    fs.writeFileSync('public/accessToken.txt', `AccessToken: ${accessToken}\nAccessTokenSecret: ${accessTokenSecret}`);

    // Redirect to the welcome page or render a welcome message
    res.send(`Welcome, ${data.screen_name}! Access token saved.`);
  });
});


// -----------------------------------------------

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
