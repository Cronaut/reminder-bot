'use strict'

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const mongodb = require('mongodb');
const mongoose = require('mongoose');

const config = require('./config/database');

// bring up the Entry model
let Entry = require('./models/entry');

mongoose.connect(config.database);
let db = mongoose.connection;

db.on('error', (err) => {
    console.log(err);
});

db.once('open', () => {
    console.log('Connection to DB has been established.');
});

const app = express();

// Create seed data

let seedData = [
  {
    id: '1',
    todos: ['meowing', 'drawing for 2 hours']
  },
  {
    id: '2',
    todos: ['dancing', 'playing guitar', 'watching birds']
  },

];

app.set('port', (process.env.PORT || 5000));

// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Process application/json
app.use(bodyParser.json());

// Index route
app.get('/', function (req, res) {
    res.send('Sup, it\'s a chat bot.');
});

// for Facebook verification
app.get('/webhook/', function (req, res) {
    if (req.query['hub.verify_token'] === 'my_voice_is_my_password_verify_me') {
        res.send(req.query['hub.challenge']);
    }
    res.send('Error, wrong token');
});

// Spin up the server
app.listen(app.get('port'), function () {
    console.log('running on port', app.get('port'));
});

// Post stuff
app.post('/webhook/', function (req, res) {
    let messaging_events = req.body.entry[0].messaging;
    for (let i = 0; i < messaging_events.length; i++) {
        let event = req.body.entry[0].messaging[i];
        let sender = event.sender.id;

        if (event.message && event.message.text) {
            // add the todo entries to db
            if (sender != process.env.BOTSENDER_ID) {
                if (parseMessage(event)) {
                    
                    let entries = {
                        userid: sender,
                        todos: event.message.text
                    }
                    
                    let upsert = {upsert: true};
                    Entry.findOneAndUpdate({userid: sender}, entries, upsert, (err, docs) => {
                       if (err) {
                           console.log('Something really weird has happened:', err);
                            return;
                       } else {
                            console.log(upsert.upsert.valueOf() ? 'Entry has been updated.' : 'Entry has been added.');
                       }
                    });
                }
                
                sendTextMessage(sender, 'I still work fine, I just pretended: \n' + event.message.text);
            }
        }
    }
    res.sendStatus(200);
})

const token = process.env.FB_PAGE_ACCESS_TOKEN;

function sendTextMessage(sender, text) {
    let messageData = { text: text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: { access_token: token },
        method: 'POST',
        json: {
            recipient: { id: sender },
            message: messageData,
        }
    }, function (error, response, body) {
        if (error) {
            console.log('Error sending messages: ', error);
        } else if (response.body.error) {
            console.log('Error, something wrong with response body: ', response.body.error);
        }
    });
}


function parseMessage(event) {
    // starts with -
    // includes "view todos"

    let message = event.message.text;    
    if (typeof message === 'string' || message instanceof String) {
        if (message.startsWith('-')) {
            return true;
        }
    } else {
        throw "The passed object is somehow not a string.";
    }
   return false;
}

/*mongodb.MongoClient.connect(uri, (err, db) => {
      if (err) throw err;
      let users = db.collection('users');

      users.insert(seedData, (err, result) => {
          if (err) throw err;

          seedData.forEach((user, i) => {
            console.log(user.todos + i);

          });

          db.close((err) => {
              if (err) throw err;
          });
      });
});*/