require('dotenv').config();

const { getGameRecc } = require('./getGameRecc');

jest.mock('./getGamesAndScores.js');


describe('gameScrape routes', () => {

  it('will return a random game from array of arrays that meets criteria', async() => {
    return getGameRecc('vanquish', 'playstation-4')
      .then(game => {
        expect(game).toEqual('whatever');
      });
  });
});
