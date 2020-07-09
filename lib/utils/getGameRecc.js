const getGamesAndScores = require('./getGamesAndScores');

function getGameRecc(gameName, gameConsole) {
  // formats user input for requests
  const formattedName = gameName.trim().replace(/ /g, '-').toLowerCase();
  const formattedConsole = gameConsole.trim().replace(/ /g, '-').toLowerCase();

  // getGamesAndScores gets back an array of users score arrays for specific game/console
  return getGamesAndScores(formattedName, formattedConsole)
  // formats array from getGamesAndScores into single array, selects a game recommendation to tweet at user
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
    .then(result => result[Math.floor(Math.random() *  Math.min(20, result.length))]);
}

module.exports = {
  getGameRecc
};
