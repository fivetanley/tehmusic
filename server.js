module.exports = function(server) {

  var DotEnv = require('dotenv-node'),
      bcrypt = require('bcrypt'),
      FirebaseTokenGenerator = require("firebase-token-generator"),
      Firebase = require('firebase'),
      expressValidator = require('express-validator'),
      express = require('express'),
      util = require('util'),
      fs = require('fs'),
      AWS = require('aws-sdk'),
      crypto = require('crypto');

  // Load config
  if (fs.existsSync('./.env')) {
    new DotEnv();
  }

  // Configure AWS
  var s3 = new AWS.S3({
    apiVersion: 'latest',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.S3_REGION
  });

  // Create our token generator
  var tokenGenerator = new FirebaseTokenGenerator(process.env.FIREBASE_SECRET);

  // Create a token for our own usage
  var adminToken = tokenGenerator.createToken({}, { admin: true });
  var fbRef = new Firebase(process.env.FIREBASE_ROOT);
  fbRef.auth(adminToken, function(err) {
    if (err) {
      console.log("Could not authenticate admin account to firebase? " + err);
      // panic?
    }
  });

  var songLoop = null;

  // We'll keep (in memory) an object holding all the current users,
  // so we can do uber fast auth.
  var cachedUsers = {};
  var usersRef = fbRef.child('users');
  usersRef.on('value', function(snapshot) {
    cachedUsers = snapshot.val();
    if (cachedUsers === null) {
      cachedUsers = {};
    }
    setTimeout(function() { songLoop(); }, 1);
  });
  var cachedUserPrivates = {};
  var userPrivatesRef = fbRef.child('user_privates');
  userPrivatesRef.on('value', function(snapshot) {
    cachedUserPrivates = snapshot.val();
    if (cachedUserPrivates === null) {
      cachedUserPrivates = {};
    }
  });

  var currentSong = null;

  // Make someone lose DJ status when all connections disappear
  fbRef.child('online_users').on('child_removed', function(snapshot) {
    fbRef.child('users').child(snapshot.name()).child('spinning').set(false);

    // clear out the current song if it's this person's
    if (currentSong && currentSong.user_id === snapshot.name()) {
      fbRef.child('current_song').set(null);
    }
  });

  songLoop = function() {
    // is the current song's dj still up?
    if (currentSong && !currentSong.done &&
        !cachedUsers[currentSong.user_id].spinning) {
      fbRef.child('current_song').child('done').set(true);
      return;
    }

    // is it time to move to the next DJ?
    if (!currentSong || currentSong.done) {
      // choose next DJ
      var djs = [];
      Object.keys(cachedUsers).forEach(function(userId) {
        var user = cachedUsers[userId];
        if (user.spinning) {
          djs.push({ id: userId, user: user });
        }
      });
      djs = djs.sort(function(a, b) {
        return a.user.spinning < b.user.spinning ? -1 : 1;
      });

      if (djs.length === 0) {
        fbRef.child('current_song').remove();
        return;
      }

      var currentDjIndex = -1;
      if (currentSong) {
        djs.forEach(function(dj, idx) {
          if (dj.id == currentSong.user_id) {
            currentDjIndex = idx;
          }
        });
      }

      if (currentDjIndex < 0) {
        console.log("Could not find current DJ! just choosing the first one.");
      }

      currentDjIndex += 1;
      if (currentDjIndex >= djs.length) {
        currentDjIndex = 0;
      }

      var newDj = djs[currentDjIndex];

      // find the next song on this djs current playlist
      var currentPlaylistId = newDj.user.current_playlist_id;
      if (currentPlaylistId === null) {
        // no playlists, kick this user out of the booth!
        console.log("no playlists for " + newDj.id);
        fbRef.child('users').child(newDj.id).child('spinning').set(false, function() {
          setTimeout(songLoop, 0);
          return;
        });
      }

      var playlistSongsRef = fbRef.child('playlists').
        child(newDj.id).
        child(currentPlaylistId).
        child('songs');

      playlistSongsRef.once('value', function(snapshot) {
        var playlistSongs = snapshot.val();
        if (playlistSongs === null) {
          // no songs, kick out this user!
          console.log("no songs for " + newDj.id);
          fbRef.child('users').child(newDj.id).child('spinning').set(false, function() {
            setTimeout(songLoop, 0);
            return;
          });
        }

        var first = null;
        var highestOrder = 0;
        Object.keys(playlistSongs).forEach(function(playlistSongId) {
          var playlistSong = playlistSongs[playlistSongId];
          if (!first || playlistSong.order < first.order) {
            first = playlistSong;
            first.songId = playlistSongId;
          }

          if (playlistSong.order > highestOrder) {
            highestOrder = playlistSong.order;
          }
        });

        // move that song to the end of the playlist
        playlistSongsRef.child(first.songId).child('order').set(highestOrder + 1);

        // ... and set it to the current song.
        fbRef.child('current_song').set({
          song_id: first.songId,
          user_id: newDj.id,
          start_time: (new Date()).getTime()
        });

        // ... and add it to the song history
        fbRef.child('history').push().set({
          song_id: first.songId,
          user_id: newDj.id,
          start_time: (new Date()).getTime()
        });
      });

    }
  };

  setInterval(songLoop, 5000);

  // Keep current song state in memory all the time
  fbRef.child('current_song').on('value', function(snapshot) {
    currentSong = snapshot.val();
    songLoop();
  });

  server.use(express.bodyParser());
  server.use(expressValidator());

  // Force SSL when in production
  if (process.env.ENV === "production") {
    server.get('*', function(req, res, next){
      if(req.headers['x-forwarded-proto'] != 'https')
        res.redirect('https://' + req.headers['host'] + '/' + req.url)
      else
        next() /* Continue to other routes if we're not redirecting */
    });
  }


  var hmac = function(ary) {
    return crypto.createHmac('sha1', process.env.FIREBASE_SECRET).
      update(ary.join(':')).
      digest('hex');
  }

  var genAuth = function(username) {
    return {
      username: username,
      token: tokenGenerator.createToken({ username: username }),
      hmac: hmac([username])
    }
  }

  var checkAuth = function(data) {
    var goodHmac = hmac([data.username]);
    if (goodHmac === data.hmac) {
      return true;
    }

    return false;
  }

  // Create an API namespace, so that the root does not 
  // have to be repeated for each end point.
	server.namespace('/api', function() {
    server.post('/login', function(req, res) {
      var user = cachedUsers[req.body.username];
      if (!user) {
        res.send({ error: "invalid username or password" });
        return;
      }

      var userPrivates = cachedUserPrivates[req.body.username];
      bcrypt.compare(req.body.password, userPrivates.password, function(err, match) {
        if (match === true) {
          res.send({
            status: "ok",
            auth: genAuth(req.body.username)
          });
          return;
        }

        res.send({ error: "invalid username or password" });
      });
    });

    server.get('/config.js', function(req, res) {
      res.header("Content-Type", "application/javascript");
      res.end("window.FIREBASE_ROOT = '" + process.env.FIREBASE_ROOT + "';");
    });

    server.post('/register', function(req, res) {
      req.checkBody('username', 'Invalid username').notEmpty().isAlphanumeric();
      req.checkBody('email', 'Invalid email').notEmpty().isEmail();
      req.checkBody('password', 'No password').notEmpty();
      req.checkBody('joinCode', 'No join code').notEmpty();

      var errors = req.validationErrors(true);
      if (errors) {
        res.send({ error: util.inspect(errors) });
        return;
      }

      if (req.body.joinCode != process.env.JOIN_CODE) {
        res.send({ error: "Incorrect join code" });
        return;
      }

      var user = cachedUsers[req.body.username];
      if (user) {
        res.send({ error: "user already exists" });
        return;
      }

      bcrypt.hash(req.body.password, 10, function(err, hash) {
        usersRef.child(req.body.username).set({
          screenname: req.body.username,
          email: req.body.email
        }, function(err) {
          if (err) {
            console.log("error saving user " + err);
            res.send({ error: "error saving user" });
            return;
          }

          userPrivatesRef.child(req.body.username).set({
            password: hash
          }, function(err) {
            if (err) {
              console.log("error saving user password " + err);
              res.send({ error: "error saving user" });
              return;
            }

            // create a default playlist
            var playlist = { name: "Default" };
            var playlistRef = fbRef.child('playlists').child(req.body.username).push(playlist);
            usersRef.child(req.body.username).child('current_playlist_id').set(playlistRef.name());

            res.send({
              status: "ok",
              auth: genAuth(req.body.username)
            });
          });
        });
      });
    });

    server.post('/upload', function(req, res) {
      var auth = JSON.parse(req.body.auth);
      if (!checkAuth(auth)) {
        res.send({ error: "unauthorized" });
        return;
      }

      // add file to firebase...
      var songRef = fbRef.child('songs').push({
        name: req.files.file.name || "",
        artist: req.body.artist || "",
        title: req.body.title || req.files.file.name || "",
        album: req.body.album || "",
        genre: req.body.genre || "",
        uploaded_by: auth.username
      });

      console.log("file at " + req.files.file.path);

      s3.client.putObject({
        Bucket: process.env.S3_BUCKET,
        Key: 'media/' + songRef.name(),
        Body: fs.createReadStream(req.files.file.path),
        ACL: "public-read",
        ContentType: req.files.file.type
      }, function(err, data) {
        console.log("upload done, err: " + err + " data: " + data);
        if (err) {
          res.send({ error: "error uploading " + err });
          return;
        }

        songRef.child('url').set('https://s3.amazonaws.com/' +
                                 process.env.S3_BUCKET +
                                 '/media/' +
                                 songRef.name());

        var success = function() {
          res.send({
            status: "ok",
            file: {
              id: songRef.name()
            }
          });
        };

        if (req.files.picture) {
          var data = fs.readFileSync(req.files.picture.path);
          var sha1sum = crypto.createHash('sha1');
          sha1sum.update(data);
          var sha1 = sha1sum.digest('hex');

          s3.client.putObject({
            Bucket: process.env.S3_BUCKET,
            Key: 'media/' + sha1,
            Body: data,
            ACL: "public-read",
            ContentType: req.files.picture.type
          }, function(err, data) {
            songRef.child('image_url').set('https://s3.amazonaws.com/' +
                                       process.env.S3_BUCKET +
                                       '/media/' +
                                       sha1);
            success();
          });
        }
        else {
          success();
        }
      });
    });
	});
};
