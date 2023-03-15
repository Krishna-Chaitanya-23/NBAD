const Trade = require('../models/trade');
const watchList = require('../models/watchList');

exports.index = (req, res, next) => {
  Trade.find()
    .then((trades) => res.render('./trade/index', { trades }))
    .catch((err) => next(err));
};

exports.new = (req, res) => {
  res.render('./trade/new');
};

exports.create = (req, res, next) => {
  let trade = new Trade(req.body); //create a new trade document
  trade.host = req.session.user;
  trade
    .save() //insert the document to the database
    .then((trade) => {
      console.log('trade created', trade);
      req.flash('success', 'You have successfully created a new trade');
      res.redirect('/trades');
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        next(err);
      }
    });
};

exports.show = (req, res, next) => {
  let id = req.params.id;
  Trade.findById(id)
    .populate('host', 'firstName lastName')
    .then((trade) => {
      if (trade) {
        res.render('./trade/show', { trade });
      } else {
        let err = new Error('Cannot find a trade with id ' + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => next(err));
};

exports.edit = (req, res, next) => {
  let id = req.params.id;
  Trade.findById(id)
    .then((trade) => {
      if (trade) {
        return res.render('./trade/edit', { trade });
      } else {
        let err = new Error('Cannot find a trade with id ' + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => next(err));
};

exports.update = (req, res, next) => {
  let trade = req.body;
  let id = req.params.id;
  Trade.findByIdAndUpdate(id, trade, { useFindAndModify: false, runValidators: true })
    .then((trade) => {
      if (trade) {
        req.flash('success', 'trade has been successfully updated');
        res.redirect('/trades/' + id);
      } else {
        let err = new Error('Cannot find a trade with id ' + id);
        err.status = 404;
        next(err);
      }
    })
    .catch((err) => {
      if (err.name === 'ValidationError') {
        req.flash('error', err.message);
        res.redirect('back');
      } else {
        next(err);
      }
    });
};

exports.delete = (req, res, next) => {
  let id = req.params.id;
  console.log('inside delete');
  Trade.deleteOne({ _id: id })
    .then((trade) => {
      console.log(trade);
      if (trade) {
        res.redirect('/trades');
      } else {
        let err = new Error('Cannot find a trade with id ' + id);
        err.status = 404;
        return next(err);
      }
    })
    .catch((err) => next(err));
};

exports.watchList = (req, res, next) => {
  let requestUser = req.session.user;
  let id = req.params.id;

  watchList
    .find({ user: requestUser, trade: id })
    .then((watch) => {
      if (watch.length) {
        req.flash('error', 'trade is already added to watchlist');
        res.redirect('back');
      } else {
        let watch = new watchList();
        watch.user = requestUser;
        watch.trade = id;
        watch
          .save()
          .then((watch) => {
            if (watch) {
              req.flash('success', 'Successfully added to watchList for this trade!');
              res.redirect('/users/profile');
            } else {
              req.flash('error', 'There was an error');
            }
          })
          .catch((err) => {
            if (err.name === 'ValidationError') {
              req.flash('error', err.message);
              res.redirect('back');
            } else {
              next(err);
            }
          });
      }
    })
    .catch((err) => next(err));
};

exports.deletewatchList = (req, res, next) => {
  let id = req.params.id;
  watchList
    .findOneAndDelete({ user: req.session.user, trade: id })
    .then((watchList) => {
      if (watchList) {
        req.flash('success', 'trade has been sucessfully removed from watchlist!');
        res.redirect('/users/profile');
      } else {
        let err = new Error('Cannot find an watchList with id ' + id);
        err.status = 404;
        return next(err);
      }
    })
    .catch((err) => next(err));
};

exports.updateStatus = (req, res, next) => {
  let ownItem = req.body;
  // others item
  let otherItemsId = req.params.id;
  let tradingUser = req.session.user;

  Promise.all([Trade.findById(ownItem.trade), Trade.findById(otherItemsId)])
    .then((results) => {
      const [ownItem, otherItem] = results;
      ownItem.status = 'Offer Pending';
      ownItem.save();

      otherItem.status = 'Offer Pending';
      otherItem.tradeWith = ownItem._id;
      otherItem.save();
      res.redirect('/users/profile');
    })
    .catch((err) => {
      console.log(err);
      next(err);
    });
};
