const Twit = require('twit');

const T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret
});

const stream = T.stream('statuses/filter', { track: '@game_reccs' });

stream.on('tweet', tweet => {
  T.post('statuses/update', { status: 'hello fam' })
    .then((tweet) => {
      console.log(tweet.text);
    })
    .catch((err) => {
      console.log(err);
    });
});


