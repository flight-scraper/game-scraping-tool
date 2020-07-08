const cheerio = require('cheerio');
const request = require('superagent');
const Throttle = require('superagent-throttle');
const getGamesAndScores = require('./getGamesAndScores');

let throttle = new Throttle({
  active: true,     // set false to pause queue
  rate: 90,          // how many requests can be sent every `ratePer`
  ratePer: 60000,   // number of ms in which `rate` requests may be sent
  concurrent: 20     // how many requests can be sent concurrently
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


// const scrapesMultiplePages = (gameTitle, gameConsole, pagesAmount) => { 
//   return Promise.all([...Array(pagesAmount)].map((_, i) => {
//     return scrapeUsers(gameTitle, gameConsole, i);
//   }))
//     .then(result => result.flat());   
// };


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


// function scrapeReviews(userName) {
//   return request.get(`https://www.metacritic.com${userName}?myscore-filter=Game&myreview-sort=score`)
//     .use(throttle.plugin())
//     .retry(3)
//     .then(siteData => {
//       let $ = cheerio.load(siteData.text);
//       let reviewTitleArray = $('.user_reviews .product_title > a').get().map(el => $(el).attr('href'));
//       let gameReviewScore = $('.user_reviews .metascore_w').get().map(el => $(el).text());
      
//       let gameAndRatingArray = [];

//       for(let i = 0; i < reviewTitleArray.length; i++){   
//         gameAndRatingArray.push({ 
//           reviewTitle: reviewTitleArray[i],
//           gameReviewScore: gameReviewScore[i] 
//         });
//       }     
//       return gameAndRatingArray;
//     });
// }


function finalResult(gameName, gameConsole) {
  const formattedName = gameName.trim().replace(/ /g, '-').toLowerCase();
  const formattedConsole = gameConsole.trim().replace(/ /g, '-').toLowerCase();

  return getGamesAndScores(formattedName, formattedConsole)
    .then(result => result.flat())
    .then(result => result.reduce((acc, item) => {
      let addGame = true;
      let title = item.reviewTitle.split('/')[3];

    
      acc.forEach(game => {
        if(game.gameTitle === title){
          addGame = false;
          game.count++;
        }
      });

      if(addGame) {
        acc.push({
          gameTitle: title,
          count: 1
        });
      }
      return acc;
    }, []))
    .then(result => result.sort((a, b) => b.count - a.count))
    .then(result => result.filter(game => game.gameTitle !== formattedName).slice(0, Math.min(20, result.length)))
    .then(result => result[Math.floor(Math.random() *  Math.min(20, result.length))].gameTitle);
}

// finalResult('astral chain', 'switch');
module.exports = {
  finalResult,
  scrapeUsers
};
