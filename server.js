const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI)

var Schema = mongoose.Schema;

var ExerciseSchema = new Schema({
  userId: String,
  description: String,
  duration: Number,
  date: Date
});

var UserSchema = new Schema({
  username: String
});

var Exercise = mongoose.model('Exercise', ExerciseSchema);
var User = mongoose.model('User', UserSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.get('/api', (req, res) => {
  res.json({});
});

app.post('/api/exercise/new-user', (req, res) => {
  var userName = req.body.uname;
  User.findOne({username: userName}, function (error, user) {
    if (user) {
        res.json({error: 'Username already taken.'});
    } else {
        console.log(user);
        var newUser = new User({username: userName});

        res.json({user: newUser});

        newUser.save(function(err) {
          if (err) res.json({'error': err});    
        });  
    }
  });
});


app.post('/api/exercise/add', (req, res) => {
  var userId = req.body.userId;
  var description = req.body.description;
  var duration = req.body.duration;
  var date = req.body.date;
  
  console.log(req.body);
  
  User.findById(userId, function(err, user){
    console.log(description);
    if (user) {
      
      var exercise = new Exercise({
        userId: userId,
        description: description,
        duration: duration,
        date: date
      })
      
      exercise.save(function(err, data){
      });
      
      res.json({exercise: exercise});
    } else {
      res.json({error: 'User invalid'});
    }
  });

});

app.get('/api/exercise/log', (req, res) => {
  var userId = req.query.userId;
  var from = req.query.from;
  var to = req.query.to;
  var limit = req.query.limit;
  
  if (userId) {
    User.findById(userId, function(err, user){
      
      if (user) {
         var reqObj = {};
         reqObj.userId = userId;

         if (from || to) {
           var date = {};
           if (from ){
               date.$gt = from;
           }

           if (to) {
               date.$lt = to;
           }
           reqObj.date = date;
         }

        if (limit) {
          reqObj.duration = limit;
        }
      
        Exercise.find(reqObj, function(err, exercise) {
          if (exercise) {
              var response = {username: user.username};
              response['count'] = exercise.length;
              response.logs = exercise;
              res.json(response);
          } else {
            res.json({error: 'There is no exercise for this user'});
          }
        });
      } else {
        res.json({error: 'Invalid User'});
      }
    });
  } else {
    res.json({error: 'Invalid user id'});
  }  
});

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
