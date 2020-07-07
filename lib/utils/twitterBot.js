const Twit = require('twit');
const { finalResult } = require('./getListOfUsers');
const T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret
});

const stream = T.stream('statuses/filter', { track: '@game_reccs' });

stream.on('tweet', tweet => {
  const gameName = tweet.text.replace('@game_reccs', '').trim();
  finalResult(gameName)
    .then(game => {
      T.post('statuses/update', { status: game });
    })
    .catch((err) => {
      console.log(err);
    });
});


