'use strict'
var express = require('express')
var mustacheExpress = require('mustache-express')
var expressSession = require('express-session')
var fetch = require('node-fetch')

var app = express()

app.use(express.static('public'))

app.use(
  expressSession({
    secret: 'Keyboard Cat',
    resave: false,
    saveUninitialized: true
  })
)

app.engine('mst', mustacheExpress())
app.set('views', './templates')
app.set('view engine', 'mst')

app.get('/', (req, res) => {
  req.session.gamestatus = true
  let promise = fetch('https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1')
    .then(response => response.json())
    .then(function(data) {
      var deckid = data.deck_id
      req.session.deckid = deckid
      res.render('index', req.session)
    })
  //res.render('index', req.session)
})

app.post('/start', (req, res) => {
  let promise = fetch('https://deckofcardsapi.com/api/deck/' + req.session.deckid + '/draw/?count=4')
    .then(response => response.json())
    .then(function(data) {
      req.session.playerscards = [data.cards[0], data.cards[2]]
      req.session.dealerscards = [data.cards[1], data.cards[3]]
      req.session.playerstotal = 0
      if (
        (req.session.dealerscards[0] == 'JACK' && req.session.dealerscards[1] == 'ACE') ||
        (req.session.dealerscards[1] == 'JACK' && req.session.dealerscards[0] == 'ACE')
      ) {
        req.session.gamestatus = false
        req.session.message = 'Dealer has Blackjack'
      }
      for (var i = 0; i < req.session.playerscards.length; i++) {
        if (
          req.session.playerscards[i].value == 'KING' ||
          req.session.playerscards[i].value == 'QUEEN' ||
          req.session.playerscards[i].value == 'JACK'
        ) {
          var value = 10
        } else if (req.session.playerscards[i].value == 'ACE') {
          var value = 1
        } else {
          var value = parseInt(req.session.playerscards[i].value)
        }
        req.session.playerstotal += value
      }
      req.session.dealerstotal = 0
      for (var i = 0; i < req.session.dealerscards.length; i++) {
        if (
          req.session.dealerscards[i].value == 'KING' ||
          req.session.dealerscards[i].value == 'QUEEN' ||
          req.session.dealerscards[i].value == 'JACK'
        ) {
          var value = 10
        } else if (req.session.dealerscards[i].value == 'ACE') {
          var value = 1
        } else {
          var value = parseInt(req.session.dealerscards[i].value)
        }
        req.session.dealerstotal += value
      }
      res.render('game', req.session)
    })
})
app.post('/hit', (req, res) => {
  let promise = fetch('https://deckofcardsapi.com/api/deck/' + req.session.deckid + '/draw/?count=1')
    .then(response => response.json())
    .then(function(data) {
      req.session.playerscards.push(data.cards[0])
      if (data.cards[0].value == 'KING' || data.cards[0].value == 'QUEEN' || data.cards[0].value == 'JACK') {
        var value = 10
      } else if (data.cards[0].value == 'ACE') {
        var value = 1
      } else {
        var value = parseInt(data.cards[0].value)
      }
      req.session.playerstotal += value
      if (req.session.playerstotal > 21) {
        req.session.gamestatus = false
        req.session.message = 'You Lose'
      }
      res.render('game', req.session)
    })
})

app.post('/stay', (req, res) => {
  req.session.gamestatus = false
  if (req.session.dealerstotal < 17) {
    let promise = fetch('https://deckofcardsapi.com/api/deck/' + req.session.deckid + '/draw/?count=1')
      .then(response => response.json())
      .then(function(data) {
        req.session.dealerscards.push(data.cards[0])
        if (data.cards[0].value == 'KING' || data.cards[0].value == 'QUEEN' || data.cards[0].value == 'JACK') {
          var value = 10
        } else if (data.cards[0].value == 'ACE') {
          var value = 1
        } else {
          var value = parseInt(data.cards[0].value)
        }
        req.session.dealerstotal += value
        if (req.session.dealerstotal > 21) {
          req.session.message = 'You Win'
        } else if (req.session.dealerstotal > req.session.playerstotal) {
          req.session.message = 'You Lose'
        } else if (req.session.dealerstotal == req.session.playerstotal) {
          req.session.message = "It's a Tie"
        } else {
          req.session.message = 'You Win'
        }
        res.render('game', req.session)
      })
  } else {
    if (req.session.dealerstotal > req.session.playerstotal) {
      req.session.message = 'You Lose'
    } else if (req.session.dealerstotal == req.session.playerstotal) {
      req.session.message = "It's a Tie"
    } else {
      req.session.message = 'You Win'
    }
    res.render('game', req.session)
  }
})

app.post('/reset', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})

app.listen(3000, () => {
  console.log('there is life on 3000')
})
