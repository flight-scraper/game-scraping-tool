require('dotenv').config();
const Twit = require('twit');
const chance = require('chance').Chance();
const { getGameRecc } = require('./getGameRecc');

const T = new Twit({
  consumer_key: process.env.consumer_key,
  consumer_secret: process.env.consumer_secret,
  access_token: process.env.access_token,
  access_token_secret: process.env.access_token_secret
});


// checks when someone tweets at bot
const stream = T.stream('statuses/filter', { track: '@game_reccs' });

stream.on('tweet', tweet => {
  const ticketId = chance.hammertime();

  // posts confirmation tweet to user
  T.post('statuses/update', { status: `@${tweet.user.screen_name}, thanks for using GameReccs! We will be with you shortly with a new game to play! TICKET#${ticketId}` });
  const [gameName, gameConsole] = tweet.text
    .replace('@game_reccs', '')
    .trim()
    .split(',');

  getGameRecc(gameName, gameConsole)
    .then(game => {
      // posts game recommendation
      T.post('statuses/update', { status: `@${tweet.user.screen_name}, you should try out ${game}! TICKET#${ticketId}` });
    })
    .catch((err) => {
      console.log(err);
      // if input data is faulty, posts error tweet at user
      T.post('statuses/update', { status: `@${tweet.user.screen_name}, we couldn't find anything! Make sure your spelling is correct and try again later! TICKET#${ticketId}` });
    });
});


