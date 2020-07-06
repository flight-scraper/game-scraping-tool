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
        const reviewAmount = $('.total_summary_reviews span').text().slice(0, 1);
        return reviewAmount > 1;
      });
  }
};

const scraper = gameTitle => {
  return request.get(`https://www.metacritic.com/game/playstation-4/${gameTitle}/user-reviews?dist=positive`)
    .use(throttle.plugin())
    .then(siteData => {
      let $ = cheerio.load(siteData.text);
      let linkArray = $('.review_action > a').get().map(el => $(el).attr('href'));

      return Promise.all(linkArray.map(async item => {
        return {
          reviews: await hasMultipleReviews(item),
          userName: item,
        };
      }));
    });
};

// scraper('the-last-of-us-part-ii')
//   .then(result => result.filter(item => item.reviews).map(item => item.userName))
//   .then(result => console.log(result));

const scrapesReviews = userName => {
  return request.get(`https://www.metacritic.com/user/${userName}?myscore-filter=Game&myreview-sort=score`)
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
      console.log(gameAndRatingArray);
    });
};

scrapesReviews('Fangenijus')
  .then(result => result.filter(item => item.gameReviewScore > 7))
  .then(result => console.log(result));
