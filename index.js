require('dotenv').config(); // Load environment variables from .env file
const path = require('path');
const express = require('express');
const session = require('express-session');
const hbs = require('hbs');
const axios = require('axios');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const qs = require('querystring');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const port = 3000;

app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'), // Use environment variable or generate a random string
  resave: true,
  saveUninitialized: true
}));

const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const callbackURL = 'http://localhost:3000/callback';

// Create OAuth instance
const oauth = OAuth({
  consumer: { key: consumerKey, secret: consumerSecret },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) => crypto.createHmac('sha1', key).update(baseString).digest('base64')
});

// ---------------------------------------------------------------------------------
// Set up permanent access token and secret
const permanentAccessToken = process.env.PERMANENT_ACCESS_TOKEN;
const permanentAccessTokenSecret = process.env.PERMANENT_ACCESS_TOKEN_SECRET;

// Define the token object with permanent access token and secret
const permanentToken = {
  key: permanentAccessToken,
  secret: permanentAccessTokenSecret
};
// ----------------------------------------------------------------------------------


const requestTokenURL = 'https://api.twitter.com/oauth/request_token?oauth_callback=' + encodeURIComponent(callbackURL);
const authorizeURL = new URL('https://api.twitter.com/oauth/authorize');
const accessTokenURL = 'https://api.twitter.com/oauth/access_token';
const endpointURL = 'https://api.twitter.com/2/tweets';

// Render home page
app.get('/', (req, res) => {
  res.render('home', { title: 'Social Media Manager' });
});

// Initiate Twitter login
app.get('/login', async (req, res) => {
  try {
    // Step 1: Generate OAuth header for obtaining a temporary request token
    const authHeader = oauth.toHeader(oauth.authorize({
      url: requestTokenURL,
      method: 'POST'
    }));

    // Step 2: Make a POST request to obtain the temporary request token
    const requestTokenResponse = await axios.post(requestTokenURL, null, {
      headers: { Authorization: authHeader['Authorization'] }
    });

    // Step 3: Parse the response and save temporary request token and secret in the session
    const requestTokenData = qs.parse(requestTokenResponse.data);
    req.session.oauth_token_secret = requestTokenData.oauth_token_secret;

    // Step 4: Build the authorization URL for user authentication
    authorizeURL.searchParams.append('oauth_token', requestTokenData.oauth_token);

    // Optional: Log success message
    console.log("Success Obtaining Access");

    // Step 5: Redirect the user to Twitter for authorization
    res.redirect(authorizeURL.href);
  } catch (error) {
    // Step 6: Handle errors and log relevant information
    console.error('Error obtaining request token:', error.message);
    console.error('Response data:', error.response && error.response.data);
    console.error('Response status:', error.response && error.response.status);
    console.error('Response headers:', error.response && error.response.headers);

    // Step 7: Respond with a 500 status if there's an error obtaining the request token
    res.status(500).send('Error obtaining request token');
  }
});

// Callback after Twitter login
// app.get('/callback', async (req, res) => {
//   // Step 1: Retrieve OAuth parameters from the callback URL
//   const oauthToken = req.query.oauth_token;
//   const oauthVerifier = req.query.oauth_verifier;

//   // Step 2: Validate the presence of required parameters
//   if (!oauthToken || !oauthVerifier) {
//     return res.status(400).send('Invalid callback parameters');
//   }

//   // Step 3: Prepare token object with temporary request token and secret
//   const token = {
//     key: oauthToken,
//     secret: req.session.oauth_token_secret
//   };

//   try {
//     // Step 4: Generate OAuth header for exchanging temporary request token for an access token
//     const authHeader = oauth.toHeader(oauth.authorize({
//       url: accessTokenURL,
//       method: 'POST'
//     }, token));

//     // Step 5: Make a POST request to obtain the access token
//     const accessTokenResponse = await axios.post(accessTokenURL, qs.stringify({ oauth_verifier: oauthVerifier }), {
//       headers: { Authorization: authHeader['Authorization'] }
//     });

//     // Step 6: Parse and save the obtained access token and secret in the session
//     const accessTokenData = qs.parse(accessTokenResponse.data);
//     req.session.access_token = accessTokenData.oauth_token;
//     req.session.access_token_secret = accessTokenData.oauth_token_secret;

//     // Optional: Log user information in the console
//     console.log('User authenticated:');
//     console.log('Screen name:', accessTokenData.screen_name);
//     console.log('User ID:', accessTokenData.user_id);

//     // Step 7: Redirect to a route after successfully obtaining the access token (e.g., /post-tweet)
//     res.redirect('/post-tweet');
//   } catch (error) {
//     // Step 8: Handle errors, log relevant information, and respond with a 500 status
//     console.error('Error obtaining access token:', error);
//     res.status(500).send('Error obtaining access token');
//   }
// });

app.get('/callback', async (req, res) => {
  // Step 1: Retrieve OAuth parameters from the callback URL
  const oauthToken = req.query.oauth_token;
  const oauthVerifier = req.query.oauth_verifier;

  // Step 2: Validate the presence of required parameters
  if (!oauthToken || !oauthVerifier) {
    return res.status(400).send('Invalid callback parameters');
  }

  // Step 3: Prepare token object with temporary request token and secret
  const token = {
    key: oauthToken,
    secret: req.session.oauth_token_secret
  };

  try {
    // Step 4: Generate OAuth header for exchanging temporary request token for an access token
    const authHeader = oauth.toHeader(oauth.authorize({
      url: accessTokenURL,
      method: 'POST'
    }, token));

    // Step 5: Make a POST request to obtain the access token
    const accessTokenResponse = await axios.post(accessTokenURL, qs.stringify({ oauth_verifier: oauthVerifier }), {
      headers: { Authorization: authHeader['Authorization'] }
    });

    // Step 6: Parse and save the obtained access token and secret
    const accessTokenData = qs.parse(accessTokenResponse.data);
    req.session.access_token = accessTokenData.oauth_token;
    req.session.access_token_secret = accessTokenData.oauth_token_secret;

    // Optional: Log user information in the console
    console.log('User authenticated:');
    console.log('Screen name:', accessTokenData.screen_name);
    console.log('User ID:', accessTokenData.user_id);

    // Log temporary request token (for debugging purposes)
    console.log('Temporary Request Token:', oauthToken);
    console.log('Temporary Request Token Secret:', req.session.oauth_token_secret);

    // Log permanent access token
    console.log('Permanent Access Token:', accessTokenData.oauth_token);
    console.log('Permanent Access Token Secret:', accessTokenData.oauth_token_secret);

    // Step 7: Redirect to a route after successfully obtaining the access token (e.g., /post-tweet)
    res.redirect('/post-tweet');
  } catch (error) {
    // Step 8: Handle errors, log relevant information, and respond with a 500 status
    console.error('Error obtaining access token:', error.message);
    res.status(500).send('Error obtaining access token');
  }
});


// Post a tweet
// app.get('/post-tweet', async (req, res) => {
//   // Step 1: Check if the user is authenticated by verifying the presence of access token and secret
//   if (!req.session.access_token || !req.session.access_token_secret) {
//     return res.status(401).send('User not authenticated');
//   }

//   // Step 2: Prepare the token object with the user's access token and secret
//   // const token = {
//   //   key: req.session.access_token,
//   //   secret: req.session.access_token_secret
//   // };

//   const token = {
//     key: '1337604392548065284-gm1SPo1aTa9lLw3YQMMx7xdXpf006A',
//     secret: 'sHlKUFooRloANdZ6cJ1mVjWcVqX2AcBJAUkgsKT6I2VEg'
//   };

//   // Step 3: Generate OAuth header for authorizing the tweet post request
//   const authHeader = oauth.toHeader(oauth.authorize({
//     url: 'https://api.twitter.com/2/tweets',
//     method: 'POST'
//   }, token));

//   try {
//     // Step 4: Define the tweet text to be posted
//     const tweetText = 'Hello, Twitter ! This post is posted form myApp using twitter API Permanent Access Token ';

//     // Step 5: Make a POST request to post the tweet to Twitter API
//     const tweetResponse = await axios.post(
//       'https://api.twitter.com/2/tweets',
//       { text: tweetText },
//       {
//         headers: {
//           Authorization: authHeader['Authorization'],
//           'user-agent': 'v2CreateTweetJS',
//           'content-type': 'application/json',
//           'accept': 'application/json'
//         }
//       }
//     );

//     // Step 6: Log success message and respond with a 200 status
//     console.log('Tweet posted successfully:', tweetResponse.data);
//     res.status(200).send('Tweet posted successfully!');
//   } catch (error) {
//     // Step 7: Handle errors, log relevant information, and respond with a 500 status
//     console.error('Error posting tweet:', error);
//     res.status(500).send('Error posting tweet');
//   }
// });


// -------------------------------------------------------------------------------------------------------


// /post-tweet route using PERMANENT_ACCESS_TOKEN
app.get('/post', async (req, res) => {
  // Step 1: Check if the user is authenticated by verifying the presence of access token and secret
  if (!permanentToken.key || !permanentToken.secret) {
    return res.status(401).send('User not authenticated');
  }

  // Step 2: Generate OAuth header for authorizing the tweet post request
  const authHeader = oauth.toHeader(oauth.authorize({
    url: 'https://api.twitter.com/2/tweets',
    method: 'POST'
  }, permanentToken));

  try {
    // Step 3: Define the tweet text to be posted
    const tweetText = 'Hello, Twitter! This is the next tweet without authentication test:4 ';

    // Step 4: Make a POST request to post the tweet to Twitter API
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

    // Step 5: Log success message and respond with a 200 status
    console.log('Tweet posted successfully:', tweetResponse.data);
    res.status(200).send('Tweet posted successfully!');
  } catch (error) {
    // Step 6: Handle errors, log relevant information, and respond with a 500 status
    console.error('Error posting tweet:', error);
    res.status(500).send('Error posting tweet');
  }
});


// ---------------------------------------------------------------------------------------------------------------

// POST tweet with image-----------------------------------------------------------------




// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
