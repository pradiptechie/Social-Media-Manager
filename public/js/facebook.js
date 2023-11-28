// facebook.js

window.fbAsyncInit = function () {
    FB.init({
      appId: '890801745449022', // Use your actual Facebook App ID
      cookie: true,
      xfbml: true,
      version: 'v15.0',
    });
  };
  
  function initializeFacebookAndConnect() {
    // Load the Facebook SDK asynchronously
    const sdkScript = document.createElement('script');
    sdkScript.src = 'https://connect.facebook.net/en_US/sdk.js';
    sdkScript.async = true;
    sdkScript.defer = true;
    sdkScript.crossOrigin = 'anonymous';
  
    sdkScript.onload = function () {
      // Once the SDK is loaded, initialize it
      FB.init({
        appId: '890801745449022', // Use your actual Facebook App ID
        cookie: true,
        xfbml: true,
        version: 'v15.0',
      });
  
      // After initialization, call the connectWithFacebook function
      connectWithFacebook();
    };
  
    // Append the script element to the document
    document.head.appendChild(sdkScript);
  }
  
  function connectWithFacebook() {
    // Trigger the Facebook login dialog
    FB.login(
      function (response) {
        if (response.authResponse) {
          // User granted permission, now make API requests
          getFacebookToken();
        } else {
          console.log('User canceled login or did not fully authorize.');
        }
      },
      { scope: 'email,user_posts' }
    );
  }
  
  function getFacebookToken() {
    // Retrieve the access token after successful login
    const accessToken = FB.getAuthResponse()['accessToken'];
  
    // Now you can use this access token to make Graph API requests
    console.log('Facebook Access Token:', accessToken);
  
    // Example: Fetch user's profile using the access token
    FB.api('/me', { fields: 'id,name,email', access_token: accessToken }, function (response) {
      // Handle the response (user's profile data)
      console.log('User Profile:', response);
    });
  }
  