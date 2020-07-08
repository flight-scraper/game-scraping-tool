const Twit = require('twit');
const { finalResult } = require('./getListOfUsers');
const T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret
});
const chance = require('chance').Chance();

const stream = T.stream('statuses/filter', { track: '@game_reccs' });

stream.on('tweet', tweet => {
  const ticketId = chance.hammertime();
  // 'Grand Theft Auto IV, Xbox 360
  T.post('statuses/update', { status: `@${tweet.user.screen_name}, thanks for using GameReccs! We will be with you shortly with a new game to play! TICKET#${ticketId}` });
  // const gameName = tweet.text.replace('@game_reccs', '').trim();
  const [gameName, gameConsole] = tweet.text
    .replace('@game_reccs', '')
    .trim()
    .split(',');

  finalResult(gameName, gameConsole)
    .then(game => {
      T.post('statuses/update', { status: `@${tweet.user.screen_name}, you should try out ${game}! TICKET#${ticketId}` });
    })
    .catch((err) => {
      console.log(err);
      T.post('statuses/update', { status: `@${tweet.user.screen_name}, we couldn't find anything! Make sure your spelling is correct and try again later! TICKET#${ticketId}` });
    });
});


