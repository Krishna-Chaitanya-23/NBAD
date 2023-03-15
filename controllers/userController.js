const model = require('../models/user');
const trade = require('../models/trade');
const watchList = require('../models/watchList');
const bcrypt = require('bcrypt');
const mongoose = require('mongoose');

exports.new = (req, res) => {
  res.render('./user/new');
};

exports.create = (req, res, next) => {
  let user = new model(req.body);
  user
    .save()
    .then((user) => {
      req.flash('success', 'You have successfully registered');
      res.redirect('/users/login');
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        req.flash('error', err.message);
        return res.redirect('/users/new');
      }

      if (err.code === 11000) {
        req.flash('error', 'Email has been used');
        return res.redirect('/users/new');
      }

      next(err);
    });
};

exports.getUserLogin = (req, res, next) => {
  res.render('./user/login');
};

exports.login = (req, res, next) => {
  let email = req.body.email;
  let password = req.body.password;

  model
    .findOne({ email: email })
    .then((user) => {
      if (!user) {
        req.flash('error', 'Wrong email address');
        res.redirect('/users/login');
      } else {
        bcrypt
          .compare(password, user.password)
          .then((result) => {
            if (result) {
              req.session.user = user._id;
              req.session.firstName = user.firstName;
              req.session.lastName = user.lastName;
              req.flash('success', 'You have successfully logged in');
              res.redirect('/users/profile');
            } else {
              req.flash('error', 'Wrong password');
              res.redirect('/users/login');
            }
          })
          .catch((err) => next(err));
      }
    })
    .catch((err) => next(err));
};

exports.profile = (req, res, next) => {
  let id = req.session.user;

  let pendingTradeIds = [];
  trade
    .find({ host: id, status: 'Offer Pending' })
    .then((pendingTrades) => {
      return (pendingTradeIds = pendingTrades.map((pt) => pt._id.toString()));
    })
    .then(async (response) => {
      const results = await Promise.all([
        model.findById(id),
        trade.find({ host: id }),
        watchList.find({ user: id }).populate('trade'),
        trade.find({ tradeWith: { $in: response } }),
      ]);
      const [user, trades, watchLists, myOffers] = results;
      res.render('./user/profile', { user, trades, watchLists, myOffers });
    })
    .catch((err) => next(err));
};

exports.logout = (req, res, next) => {
  req.session.destroy((err) => {
    if (err) return next(err);
    else res.redirect('/');
  });
};

exports.trades = (req, res, next) => {
  let itemToTrade = { id: req.params.id };
  let id = req.session.user;
  Promise.all([model.findById(id), trade.find({ host: id, status: 'Available' })])
    .then((results) => {
      const [user, trades] = results;
      res.render('./user/trade', { user, trades, itemToTrade });
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
};

exports.offer = (req, res, next) => {
  let tradeId = req.params.id;
  trade
    .findOne({ tradeWith: tradeId })
    .then(async (othersTrade) => {
      trade
        .findById(othersTrade.tradeWith)
        .then((ownTrade) => {
          res.render('./user/offer', { ownTrade, othersTrade });
        })
        .catch((err) => next(err));
    })
    .catch((err) => next(err));
};

// manage own offer
exports.ownoffer = (req, res, next) => {
  let tradeId = req.params.id;
  trade
    .findById(tradeId)
    .then(async (ownTrade) => {
      trade
        .findById(ownTrade.tradeWith)
        .then((othersTrade) => {
          res.render('./user/offer', { othersTrade, ownTrade });
        })
        .catch((err) => next(err));
    })
    .catch((err) => next(err));
};

exports.cancelOffer = (req, res, next) => {
  let tradeIds = req.params.id.split('&');
  let othersTradeId = tradeIds[0];
  let ownTradeId = tradeIds[1];

  trade
    .findByIdAndUpdate(
      othersTradeId,
      {
        $unset: {
          tradeWith: '',
        },
        $set: {
          status: 'Available',
        },
      },
      { useFindAndModify: false, runValidators: true }
    )
    .then((result) => {
      if (result) {
        trade
          .findByIdAndUpdate(
            ownTradeId,
            {
              $unset: {
                tradeWith: '',
              },
              $set: {
                status: 'Available',
              },
            },
            { useFindAndModify: false, runValidators: true }
          )
          .then((x) => {
            req.flash('success', 'Cancelled Offer Successfully');
            res.redirect('./user/profile');
          });
      } else {
        req.flash('Failure', 'Cancel Offer Failed');
        res.redirect('back');
      }
    })
    .catch((err) => next(err));
};

exports.acceptOffer = (req, res, next) => {
  let tradeIds = req.params.id.split('&');
  let othersTradeId = tradeIds[0];
  let ownTradeId = tradeIds[1];

  trade
    .findByIdAndUpdate(
      othersTradeId,
      {
        $unset: {
          tradeWith: '',
        },
        $set: {
            status: 'Traded',
        },
      },
      { useFindAndModify: false, runValidators: true }
    )
    .then((result) => {
      if (result) {
        trade
          .findByIdAndUpdate(
            ownTradeId,
            {
              $unset: {
                tradeWith: '',
              },
              $set: {
                status: 'Traded',
              },
            },
            { useFindAndModify: false, runValidators: true }
          )
          .then((x) => {
            req.flash('success', 'Accepted Offer Successfully');
            res.redirect('./user/profile');
          });
      } else {
        req.flash('Failure', 'Accept Offer Failed');
        res.redirect('back');
      }
    })
    .catch((err) => next(err));
};
