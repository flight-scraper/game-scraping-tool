
module.exports =  jest.fn(() => Promise.resolve(
  [
    [{
      reviewTitle: '/game/playstation-4/whatever',
      gameReviewScore: '8'
    }],
    [{
      reviewTitle: '/game/playstation-4/newGame',
      gameReviewScore: '9'
    }]
  ]

))   
;

