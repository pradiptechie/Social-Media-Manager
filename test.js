require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const OAuth = require('oauth-1.0a');
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const app = express();
const port = 3001;

// Use environment variables for Twitter API credentials
const consumerKey = process.env.CONSUMER_KEY;
const consumerSecret = process.env.CONSUMER_SECRET;
const accessToken = process.env.PERMANENT_ACCESS_TOKEN;
const accessTokenSecret = process.env.PERMANENT_ACCESS_TOKEN_SECRET;

// Create OAuth instance
const oauth = OAuth({
  consumer: { key: consumerKey, secret: consumerSecret },
  signature_method: 'HMAC-SHA1',
  hash_function: (baseString, key) =>
    crypto.createHmac('sha1', key).update(baseString).digest('base64'),
});

// Define the token object with permanent access token and secret
const permanentToken = {
  key: accessToken,
  secret: accessTokenSecret,
};

// Middleware for authentication
app.use((req, res, next) => {
  // Check if the user is authenticated
  if (!consumerKey || !consumerSecret || !accessToken || !accessTokenSecret) {
    return res.status(401).send('Twitter API keys or access tokens not provided');
  }

  if (!permanentToken.key || !permanentToken.secret) {
    return res.status(401).send('User not authenticated');
  }

  next();
});

// Function to upload media (image) to Twitter
async function uploadMedia(token, filePath) {
  const authHeader = oauth.toHeader(
    oauth.authorize({
      url: 'https://upload.twitter.com/1.1/media/upload.json',
      method: 'POST',
    }, token),
  );

  const formData = new FormData();
  formData.append('media', fs.createReadStream(filePath));

  try {
    // Make a POST request to upload media
    const mediaUploadResponse = await axios.post(
      'https://upload.twitter.com/1.1/media/upload.json',
      formData,
      {
        headers: {
          ...authHeader,
          ...formData.getHeaders(),
        },
      },
    );

    console.log('Media uploaded successfully:', mediaUploadResponse.data);


    return mediaUploadResponse.data.media_id_string;
  } catch (error) {
    console.error('Error uploading media:', error.message);
    throw error;
  }
}

// Function to post a tweet with media
async function postTweetWithMedia(token, tweetText, mediaId) {
  const authHeader = oauth.toHeader(
    oauth.authorize({
      url: 'https://api.twitter.com/2/tweets',
      method: 'POST',
    }, token),
  );

//   const tweetData = 
//   {
//     status: tweetText,
//     media_ids: [mediaId]
//   };

  const tweetData = {"text": tweetText, "media": {"media_ids": [mediaId]}}

//   { status: tweetText, media_ids: [mediaId] };

  try {
    // Make a POST request to post the tweet with the uploaded media
    const tweetResponse = await axios.post(
      'https://api.twitter.com/2/tweets',
      tweetData,
      {
        headers: {
          ...authHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      },
    );

    console.log('Tweet posted successfully:', tweetResponse.data);
    return tweetResponse.data;
  } catch (error) {
    console.error('Error posting tweet:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
    throw error;
  }
}

// Route to post a tweet with media
app.get('/post', async (req, res) => {
  try {
    // Prepare the token object with the user's permanent access token and secret
    const token = {
      key: permanentToken.key,
      secret: permanentToken.secret,
    };

    // Upload media and get the media ID
    const mediaId = await uploadMedia(token, 'img/img.jpeg');

    // Post a tweet with the uploaded media
    const tweetText = 'Hello, Twitter! 🚀 #MyFirstTweet';
    await postTweetWithMedia(token, tweetText, mediaId);

    // Respond with a 200 status
    res.status(200).send('Tweet posted successfully!');
  } catch (error) {
    console.error('Error in /post route:', error.message);
    res.status(500).send(`Error: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
