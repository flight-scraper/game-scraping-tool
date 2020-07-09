const cheerio = require('cheerio');
const request = require('superagent');
const Throttle = require('superagent-throttle');
const getGamesAndScores = require('./getGamesAndScores');

let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 50,          // how many requests can be sent every `ratePer`
  ratePer: 60000,   // number of ms in which `rate` requests may be sent
  concurrent: 2     // how many requests can be sent concurrently
});

const hasMultipleReviews = userName => {
  if(userName.includes('/user/')){
    return request.get(`https://www.metacritic.com${userName}?myscore-filter=Game&myreview-sort=score`)
      .use(throttle.plugin())
      .retry(3)
      .then(siteData => {
        let $ = cheerio.load(siteData.text);
        const reviewAmount = $('.total_summary_reviews span:first-of-type').text();
        console.log(reviewAmount);
        return reviewAmount > 1;
      });
  }
};

const scrapeUsers = (gameTitle, gameConsole, page) => {
  return request
    .get(`https://www.metacritic.com/game/${gameConsole}/${gameTitle}/user-reviews?dist=positive&page=${page}`)
    .use(throttle.plugin())
    .retry(3)
    .then(siteData => {
      let $ = cheerio.load(siteData.text);
      let userNameArray = $('.review_action > a').get().map(el => $(el).attr('href'));

      return Promise.all(userNameArray.map(async item => {
        return {
          reviews: await hasMultipleReviews(item), //boolean
          userName: item,
        };
      }));
    })
    .catch(() => { 
      throw new Error('Invalid game/title, please check spelling and try again');
    });
};

function finalResult(gameName, gameConsole) {
  const formattedName = gameName.trim().replace(/ /g, '-').toLowerCase();
  const formattedConsole = gameConsole.trim().replace(/ /g, '-').toLowerCase();

  return getGamesAndScores(formattedName, formattedConsole)
    .then(result => result
      .flat()
      .reduce((acc, item) => {
        if(item.reviewTitle in acc) {
          acc[item.reviewTitle]++;
        } else {
          acc[item.reviewTitle] = 1;
        }
        return acc;
      }, {}))
    .then(result => Object.entries(result).sort((a, b) => b[1] - a[1]))
    .then(result => result.map(item => item[0].split('/')[3]))
    .then(result => result.filter(game => game !== formattedName).slice(0, Math.min(20, result.length)))
    .then(result => result[Math.floor(Math.random() *  Math.min(20, result.length))])
    .then(result => console.log(result));
}

finalResult('the last of us part ii', 'playstation 4');
module.exports = {
  finalResult,
  scrapeUsers
};
