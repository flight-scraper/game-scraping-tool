const cheerio = require('cheerio');
const request = require('superagent');
const Throttle = require('superagent-throttle');

let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 50,          // how many requests can be sent every `ratePer`
  ratePer: 60000,   // number of ms in which `rate` requests may be sent
  concurrent: 2     // how many requests can be sent concurrently
});

// scrapes through multiple review pages and scrapes the user data
function scrapesMultiplePages(gameTitle, gameConsole, pagesAmount){ 
  return Promise.all([...Array(pagesAmount)].map((_, i) => {
    return scrapeUsers(gameTitle, gameConsole, i);
  }))
    .then(result => result.flat());   
}

// grabs users who have reviewed specified game on specified console, checks if they have multiple reviews
function scrapeUsers(gameTitle, gameConsole, page){
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
}

// returns true if they have more than one review, false if not
function hasMultipleReviews(userName){
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
}

// grabs all of a user's reviews and returns game name and score
function scrapeReviews(userName) {
  return request.get(`https://www.metacritic.com${userName}?myscore-filter=Game&myreview-sort=score`)
    .use(throttle.plugin())
    .retry(3)
    .then(siteData => {
      let $ = cheerio.load(siteData.text);
      let reviewTitleArray = $('.user_reviews .product_title > a').get().map(el => $(el).attr('href'));
      let gameReviewScore = $('.user_reviews .metascore_w').get().map(el => $(el).text());
      
      return [...Array(reviewTitleArray.length)].map((_, i) => ({
        reviewTitle: reviewTitleArray[i],
        gameReviewScore: gameReviewScore[i]
      }));
    });
}

module.exports = async(gameTitle, gameConsole) => {
  return scrapesMultiplePages(gameTitle, gameConsole, 1) // grab all the users across multiple pages
    .then(result => result.filter(item => item.reviews).map(item => item.userName)) // creates array of users with multiple reviews
    .then(result => result.map(async item => await scrapeReviews(item)
      .then(result => result.filter(item => item.gameReviewScore > 7 && item.reviewTitle.split('/')[2] === gameConsole)))) // grabs games that were reviewed positively AND are for the specified console
    .then(result => Promise.all(result));
};

