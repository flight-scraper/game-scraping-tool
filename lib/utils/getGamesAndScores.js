const cheerio = require('cheerio');
const request = require('superagent');
const Throttle = require('superagent-throttle');

let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 70,          // how many requests can be sent every `ratePer`
  ratePer: 60000,   // number of ms in which `rate` requests may be sent
  concurrent: 10     // how many requests can be sent concurrently
});

function scrapeReviews(userName) {
  return request.get(`https://www.metacritic.com${userName}?myscore-filter=Game&myreview-sort=score`)
    .use(throttle.plugin())
    .retry(3)
    .then(siteData => {
      let $ = cheerio.load(siteData.text);
      let reviewTitleArray = $('.user_reviews .product_title > a').get().map(el => $(el).attr('href'));
      let gameReviewScore = $('.user_reviews .metascore_w').get().map(el => $(el).text());
      
      return [...Array(reviewTitleArray.length)]
        .map((_, i) => ({
          reviewTitle: reviewTitleArray[i],
          gameReviewScore: gameReviewScore[i] 
        }));

      // return gameAndRatingArray;
      // for(let i = 0; i < reviewTitleArray.length; i++){   
      //   gameAndRatingArray.push({ 
      //     reviewTitle: reviewTitleArray[i],
      //     gameReviewScore: gameReviewScore[i] 
      //   });
      // }     
      
    });
}

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
      throw new Error('Invalid game/console, please check your spelling and try again');
    });
}

function scrapesMultiplePages(gameTitle, gameConsole, pagesAmount){ 
  return Promise.all([...Array(pagesAmount)].map((_, i) => {
    return scrapeUsers(gameTitle, gameConsole, i);
  }))
    .then(result => result.flat());   
}

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

module.exports = async(gameTitle, gameConsole) => {
  return scrapesMultiplePages(gameTitle, gameConsole, 1)
    .then(result => result
      .filter(item => item.reviews)
      .map(item => item.userName))
    .then(result => result.map(async item => await scrapeReviews(item).then(result => result.filter(item => item.gameReviewScore > 7 && item.reviewTitle.split('/')[2] === gameConsole))))
    .then(result => Promise.all(result));
};

// Promise.all(result)
