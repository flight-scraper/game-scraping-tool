const { scrapeReviews, scrapesMultiplePages } = require('../utils/getListOfUsers');

module.exports = async(gameTitle) => {
  return scrapesMultiplePages(gameTitle, 2)
    .then(result => result.filter(item => item.reviews).map(item => item.userName))
    .then(result => result.map(async item => await scrapeReviews(item).then(result => result.filter(item => item.gameReviewScore > 7))))
    .then(result => Promise.all(result));      
};

