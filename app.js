// require modules
const express = require('express');
const morgan = require('morgan');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
const tradeRoutes = require('./routes/tradeRoutes');
const mainRoutes = require('./routes/mainRoutes');
const userRoutes = require('./routes/userRoutes');

//create app
const app = express();

//configure app
let port = 3000;
let host = 'localhost';
app.set('view engine', 'ejs');

//connect to database
mongoose.set('strictQuery', false);
mongoose
  .connect('mongodb://127.0.0.1:27017/GamesTrade', { useNewUrlParser: true })
  .then(() => {
    //start app
    app.listen(port, host, () => {
      console.log('Server is running on port', port);
    });
  })
  .catch((err) => console.log(err.message));

//mount middlewares

app.use(
  session({
    secret: 'ajsbxrf69xyu9eroksjoeyj',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongoUrl: 'mongodb://127.0.0.1:27017/GamesTrade' }),
    cookie: { maxAge: 60 * 60 * 1000 },
  })
);
app.use(flash());
app.use((req, res, next) => {
  //console.log(req.session);
  res.locals.user = req.session.user || null;
  res.locals.firstName = req.session.firstName || null;
  res.locals.lastName = req.session.lastName || null;
  res.locals.errorMessages = req.flash('error');
  res.locals.successMessages = req.flash('success');
  next();
});

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(methodOverride('_method'));

//set up routes
app.use('/', mainRoutes);
app.use('/trades', tradeRoutes);
app.use('/users', userRoutes);

app.use((req, res, next) => {
  let err = new Error('The server cannot locate ' + req.url);
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  if(!err.status){
    console.log(err.stack)
    err.status = 500
    err.message = "Internal Server error"
  }
  res.status = err.status
  res.render('error',{error:err})
});
