// require('dotenv').config(); // Load environment variables from .env file
// const path = require('path');
// const express = require('express');
// const session = require('express-session');
// const hbs = require('hbs');
// const axios = require('axios');
// const crypto = require('crypto');
// const OAuth = require('oauth-1.0a');
// const qs = require('querystring');
// const fs = require('fs');
// const FormData = require('form-data');

// const { LoginManager, AccessToken } = require('react-native-fbsdk-next');


const app = express();
const port = 3000;

const bodyParser = require('body-parser');

app.use(bodyParser.json());
app.set('debug', true); // Enable debug logging


app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex'), 
  resave: true,
  saveUninitialized: true
}));







// ================================TWITTER API====================================

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

    // // Optional: Log user information in the console
    // console.log('User authenticated:');
    // console.log('Screen name:', accessTokenData.screen_name);
    // console.log('User ID:', accessTokenData.user_id);

    // // Log temporary request token (for debugging purposes)
    // console.log('Temporary Request Token:', oauthToken);
    // console.log('Temporary Request Token Secret:', req.session.oauth_token_secret);

    // // Log permanent access token
    // console.log('Permanent Access Token:', accessTokenData.oauth_token);
    // console.log('Permanent Access Token Secret:', accessTokenData.oauth_token_secret);

    // Step 7: Redirect to a route after successfully obtaining the access token (e.g., /post-tweet)
    res.redirect('/post-tweet');
  } catch (error) {
    // Step 8: Handle errors, log relevant information, and respond with a 500 status
    console.error('Error obtaining access token:', error.message);
    res.status(500).send('Error obtaining access token');
  }
});

//post a tweet after successful login
app.get('/post-tweet', async (req, res) => {
  // Step 1: Check if the user is authenticated by verifying the presence of access token and secret
  if (!req.session.access_token || !req.session.access_token_secret) {
    return res.status(401).send('User not authenticated');
  }

  // Step 2: Prepare the token object with the user's access token and secret
  // const token = {
  //   key: req.session.access_token,
  //   secret: req.session.access_token_secret
  // };

  const token = {
    key: '1337604392548065284-gm1SPo1aTa9lLw3YQMMx7xdXpf006A',
    secret: 'sHlKUFooRloANdZ6cJ1mVjWcVqX2AcBJAUkgsKT6I2VEg'
  };

  // Step 3: Generate OAuth header for authorizing the tweet post request
  const authHeader = oauth.toHeader(oauth.authorize({
    url: 'https://api.twitter.com/2/tweets',
    method: 'POST'
  }, token));

  try {
    // Step 4: Define the tweet text to be posted
    const tweetText = 'Hello, Twitter ! This post is posted form myApp using twitter API Permanent Access Token ';

    // Step 5: Make a POST request to post the tweet to Twitter API
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

    // Step 6: Log success message and respond with a 200 status
    console.log('Tweet posted successfully:', tweetResponse.data);
    res.status(200).send('Tweet posted successfully!');
  } catch (error) {
    // Step 7: Handle errors, log relevant information, and respond with a 500 status
    console.error('Error posting tweet:', error);
    res.status(500).send('Error posting tweet');
  }
});

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


// POST tweet with image is in XpostImage.js file----------
// ----------------------END OF TWITTER-------------------------------------------











// ===============================FACEBOOK API==================================


app.use(session({
  secret: 'your-secret-key',
  resave: true,
  saveUninitialized: true,
}));


app.get('/facebook', (req, res) => {
  res.render('facebook', { title: 'Social Media Manager' });
});


// working- generating long access token  ................
app.get('/facebook/callback', async (req, res) => {
  try {
    const { code } = req.query;

    // Exchange the short-lived code for a long-lived access token
    const exchangeTokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
      params: {
        client_id: process.env.FBAppID,
        client_secret: process.env.FBAppSecret,
        redirect_uri: 'http://localhost:3000/facebook/callback',
        grant_type: 'fb_exchange_token',
        fb_exchange_token: code,
      },
    });

    const longLivedAccessToken = exchangeTokenResponse.data.access_token;
    console.log('Long-Lived Access Token:', longLivedAccessToken);

    // TODO: Use the long-lived access token to get user information or perform other actions
    
    // Use the long-lived access token to get user information
    const userResponse = await axios.get('https://graph.facebook.com/v18.0/me', {
      params: {
        access_token: longLivedAccessToken,
        fields: 'id,name,email, picture.type(large)',
      },
    });

    const userData = userResponse.data;
    console.log('User Information:', userData);
    // Save user data in session
    req.session.user = userData;
  

    res.send(`Welcome! Long-Lived Access Token: ${longLivedAccessToken}`);
  } catch (error) {
    console.error('Error during Facebook login callback:', error);
    res.status(500).send('Internal Server Error');
  }
});












// app.get('/facebook/callback', async (req, res) => {
//   try {
//     const { code } = req.query;

//     // Exchange the short-lived code for a long-lived access token
//     const exchangeTokenResponse = await axios.get('https://graph.facebook.com/v18.0/oauth/access_token', {
//       params: {
//         client_id: process.env.FBAppID,
//         client_secret: process.env.FBAppSecret,
//         redirect_uri: 'http://localhost:3000/facebook/callback',
//         grant_type: 'fb_exchange_token',
//         fb_exchange_token: code, // Use the short-lived code here
//       },
//     });

//     const longLivedAccessToken = exchangeTokenResponse.data.access_token;

//     // Log the long-lived access token
//     console.log('Long-Lived Access Token:', longLivedAccessToken);

//     // Request publish permissions during login
//     const publishPermissionsResult = await axios.post('https://graph.facebook.com/v18.0/me/permissions', null, {
//       params: {
//         access_token: longLivedAccessToken,
//         permissions: 'pages_manage_posts', // Specify the permission you want to request
//       },
//     });

//     // Check if the permission is granted
//     if (publishPermissionsResult.data.data && publishPermissionsResult.data.data[0].status === 'granted') {
//       console.log('Permission granted:', publishPermissionsResult.data.data[0].permission);

//       // TODO: Use the long-lived access token to get user information or perform other actions

//       // Example: Create a test post on the user's Facebook profile
//       const postData = {
//         message: 'Hello, Facebook! This is a test post from the backend.',
//       };

//       const postResponse = await axios.post(
//         `https://graph.facebook.com/v18.0/me/feed?access_token=${longLivedAccessToken}`,
//         postData
//       );

//       // Log the post response
//       console.log('Post created:', postResponse.data);

//       res.send('Post created successfully.');
//     } else {
//       console.log('Permission not granted');
//       res.send('Permission not granted.');
//     }
//   } catch (error) {
//     console.error('Error during Facebook login callback:', error);
//     res.status(500).send('Internal Server Error');
//   }
// });














app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});