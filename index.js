require('dotenv').config(); // Load environment variables from .env file
const path = require('path');
const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const axios = require('axios'); 
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const qs = require('querystring');

const app = express();
const port = 3000;

app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: '575adbc59b7a568109f29b8508889c8c86bac83a6eb622649e8e8ed2873f90f7113f152ed3a9053a8a73fb140d8497d5e79395229990b84a40aca9ffa1add786', //this is random hex code for developers security
  resave: true,
  saveUninitialized: true
}));

const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const callbackURL = 'http://localhost:3000/callback';

const oauth = OAuth({
  consumer: { key: consumerKey, secret: consumerSecret },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
});

const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=' + encodeURIComponent(callbackURL);
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const endpointURL = 'https://api.twitter.com/2/tweets';

app.get('/', (req, res) => {
  res.render('home', { title: 'Social Media Manager' });
});



//-------------------working --------------------

app.get('/login', async (req, res) => {
  try {
    const authHeader = oauth.toHeader(oauth.authorize({
      url: requestTokenURL,
      method: 'POST'
    }));

    const requestTokenResponse = await axios.post(requestTokenURL, null, {
      headers: { Authorization: authHeader['Authorization'] }
    });

    const requestTokenData = qs.parse(requestTokenResponse.data);
    req.session.oauth_token_secret = requestTokenData.oauth_token_secret;

    authorizeURL.searchParams.append('oauth_token', requestTokenData.oauth_token);
    console.log("Success Obtaining Access");
    res.redirect(authorizeURL.href);
  } catch (error) {
    console.error('Error obtaining request token:', error.message);
    console.error('Response data:', error.response && error.response.data);
    console.error('Response status:', error.response && error.response.status);
    console.error('Response headers:', error.response && error.response.headers);
    res.status(500).send('Error obtaining request token');
  }
});

// after login done---------------------------------
app.get('/callback', async (req, res) => {
  const oauthToken = req.query.oauth_token;
  const oauthVerifier = req.query.oauth_verifier;

  if (!oauthToken || !oauthVerifier) {
    return res.status(400).send('Invalid callback parameters');
  }

  const token = {
    key: oauthToken,
    secret: req.session.oauth_token_secret
  };

  try {
    const authHeader = oauth.toHeader(oauth.authorize({
      url: accessTokenURL,
      method: 'POST'
    }, token));

    const accessTokenResponse = await axios.post(accessTokenURL, qs.stringify({ oauth_verifier: oauthVerifier }), {
      headers: { Authorization: authHeader['Authorization'] }
    });

    const accessTokenData = qs.parse(accessTokenResponse.data);
    req.session.access_token = accessTokenData.oauth_token;
    req.session.access_token_secret = accessTokenData.oauth_token_secret;

    // Log the user information in console
    console.log('User authenticated:');
    console.log('Screen name:', accessTokenData.screen_name);
    console.log('User ID:', accessTokenData.user_id);

    // Redirect to after successfully obtaining the access token
    res.redirect('/post-tweet');
  } catch (error) {
    console.error('Error obtaining access token:', error);
    res.status(500).send('Error obtaining access token');
  }
});

// making twitt---------------------------------
// TODO: make a input field for twitt text and than submit
app.get('/post-tweet', async (req, res) => {
  if (!req.session.access_token || !req.session.access_token_secret) {
    return res.status(401).send('User not authenticated');
  }

  const token = {
    key: req.session.access_token,
    secret: req.session.access_token_secret
  };

  const authHeader = oauth.toHeader(oauth.authorize({
    url: 'https://api.twitter.com/2/tweets',
    method: 'POST'
  }, token));

  try {
    const tweetText = 'Hello, Twitter! This is final test 3';
    const tweetResponse = await axios.post(
      'https://api.twitter.com/2/tweets',
      { text: tweetText },
      {
        headers: {
          Authorization: authHeader['Authorization'],
          'user-agent': 'v2CreateTweetJS',
          'content-type': 'application/json',
          'accept': 'application/json'
        }
      }
    );

    console.log('Tweet posted successfully:', tweetResponse.data);
    res.status(200).send('Tweet posted successfully!');
  } catch (error) {
    console.error('Error posting tweet:', error);
    res.status(500).send('Error posting tweet');
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
