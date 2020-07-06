const cheerio = require('cheerio');
const request = require('superagent');
const Throttle = require('superagent-throttle');

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

const scrapeUsers = gameTitle => {
  return request.get(`https://www.metacritic.com/game/playstation-4/${gameTitle}/user-reviews?dist=positive`)
    .use(throttle.plugin())
    .then(siteData => {
      let $ = cheerio.load(siteData.text);
      let userNameArray = $('.review_action > a').get().map(el => $(el).attr('href'));

      return Promise.all(userNameArray.map(async item => {
        return {
          reviews: await hasMultipleReviews(item),
          userName: item,
        };
      }));
    });
};

const getGamesAndScores = async(gameTitle) => {
  return scrapeUsers(gameTitle)
    .then(result => result.filter(item => item.reviews).map(item => item.userName))
    .then(result => result.map(async item => await scrapeReviews(item)))
    .then(result => Promise.all(result));
};

function scrapeReviews(userName) {
  return request.get(`https://www.metacritic.com${userName}?myscore-filter=Game&myreview-sort=score`)
    .use(throttle.plugin())
    .then(siteData => {
      let $ = cheerio.load(siteData.text);
      let reviewTitleArray = $('.user_reviews .product_title > a').get().map(el => $(el).attr('href'));
      let gameReviewScore = $('.user_reviews .metascore_w').get().map(el => $(el).text());
      
      let gameAndRatingArray = [];
      let gameAndRatingObj = {};

      for(let i = 0; i < reviewTitleArray.length; i++){

        if(!gameAndRatingObj.reviewTitle){
          let obj = { 
            reviewTitle: reviewTitleArray[i],
            gameReviewScore: gameReviewScore[i] 
          };
          gameAndRatingArray.push(obj);
        }
      }
      return gameAndRatingArray;
      // console.log(gameAndRatingArray);
    });
}

// scrapesReviews('Fangenijus')
//   .then(result => result.filter(item => item.gameReviewScore > 7))
//   .then(result => console.log(result));
