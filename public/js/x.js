/*
XApi DATA:
API Key: Hqd3ztRQekdAVkADD92aGevim
API Key Secret: ZvPv5yEdFPiP9odi77UmmmydGqnyEfcxVnEs3dmxnPhTcDUreb

Bearer Token: AAAAAAAAAAAAAAAAAAAAAHIdrQEAAAAACluCwAEi1bB%2FVbjEz7Ros2VA9qU%3Dl5zRH9TYszoPah5APINI81rNcTTsg6efxwv6TFZvNCfYb8ULiq
Access Token: 1337604392548065284-5wcPh4iO3Sf01M4HAMQ8NY4JziwpQF
Access Token Secret: HI8nniUbOsBeZN7Zol3W4mUiYRgahDAPlcXrI8MEwZwxs

-------------OAuth 2.0 Client ID and Client Secret------------------

Client ID: UUtxWVNsdXJnWWZhTS1NN0NqQ0E6MTpjaQ
Client Secret: _D-L9Z567lfA4RVwprZ3LdK-gn6a7VBY2mGJvxET7m4mUxpeYi
Client Secret: _D-L9Z567lfA4RVwprZ3LdK-gn6a7VBY2mGJvxET7m4mUxpeYi

*/

const Twit = require('twit');
const twitterClient = new Twit({
    consumer_key: process.env.TWITTER_API_KEY,
    consumer_secret: process.env.TWITTER_API_SECRET_KEY,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

