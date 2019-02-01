require('dotenv').config()
const express = require('express')();
const bodyParser = require('body-parser');
const fetch = require('node-fetch')
const querystring = require('querystring')
const request = require('request')

express.use(bodyParser.json());
express.use(bodyParser.urlencoded({ extended: true }));
express.listen(8888, () => console.log('Webhook server is listening, port 8888'));

const verify_token = process.env.VERIFY_TOKEN;

express.get('/', (req, res) => {
    res.send("Hello darling");
})

express.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = verify_token;
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });

 express.post('/webhook', (req, res) => {   
    let body = req.body;  
    // Checks this is an event from a page subscription
    if (body.object === 'page') {  
      // Iterates over each entry - there may be multiple if batched
      body.entry.forEach(function(entry) {  
        // Gets the message. entry.messaging is an array, but 
        // will only ever contain one message, so we get index 0
        let webhook_event = entry.messaging[0];
        let songlink = webhook_event.message.text;
        if(songlink != undefined){
          songlink = songlink.split('track/')[1];
          let songUri = `spotify%3Atrack%3A${songlink.split('?')[0]}`;
          addToSpotifyPlaylist(songUri);
          console.log(songUri);
        } else {
          console.log(songlink)
        }

        
      });  
      // Returns a '200 OK' response to all requests
      res.status(200).send('EVENT_RECEIVED');
    } else {
      // Returns a '404 Not Found' if event is not from a page subscription
      res.sendStatus(404);
    }     
  });





let token;
let refreshToken;
const playlist_id = '6D4wR8Gxo1vjBc8UIrr6fO';

const auth = () => { }
const addToPlaylist = () => { }
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

const redirect_uri = "";

express.get('/login', (req, res) => {

  const queryParams = querystring.stringify({
      client_id,
      response_type: 'code',
      scope: 'playlist-modify-public',
      redirect_uri: 'http://localhost:8888/persistToken'
  })

  res.redirect('https://accounts.spotify.com/authorize?' + queryParams)
})

express.get('/persistToken', (req, res) => {
  token = req.query.code;

  const options = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
          'grant_type': 'authorization_code',
          'code': token,
          'redirect_uri': 'http://localhost:8888/persistToken'
      },
      headers: {
          Authorization: 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
  }

  request.post(options, (err, response, body) => {
      token = body.access_token;
      refreshToken = body.refresh_token;
      res.send(token);
  })
})


function addToSpotifyPlaylist(songUri){
  fetch(`https://api.spotify.com/v1/playlists/${playlist_id}/tracks?uris=${songUri}`, {
      method: "POST",
      'Content-Type':'application/json',
      'headers': {       
          'Authorization': `Bearer ` + token
      },
  }).then((response) => {
      console.log(response);
      res.send(response);
  })
}



  