var App = window.App;

export default Ember.ObjectController.extend({
  needs: [ "login" ],

  duration: 1,
  currentTime: 0,
  progress: 0,

  currentUserIsDJ: function() {
    return (this.get('model.user.id') == this.get('controllers.login.authInfo.username'));
  }.property('model.user.id', 'controllers.login.authInfo.username'),

  songChanged: function() {
    var $audio = $("#audioPlayer");

    // OMG so ghetto, sorry but it's getting late
    // i just want to defer this call until the element
    // shows up.
    if ($audio.length === 0 && this.get('model.song.url')) {
      Ember.run.later(this, function() {
        this.songChanged();
      }, 500);
      return;
    }

    $audio.attr('src', this.get('model.song.url'));

    // Figure out where to start playing from
    var now = (new Date()).getTime();
    var started = this.get('model.startTime');

    var startAt = (now - started) / 1000;

    $audio.one("canplay", function() {
      if (startAt < $audio[0].duration) {
        $audio[0].currentTime = startAt;
        $audio[0].play();
      }
    });
  }.observes("model.song.url"),

  progressChanged: function() {
    var progress = (this.get("currentTime") / this.get("duration")) * 100;
    $("#currentSong .progress-bar").css("width", progress + "%");
  }.observes("duration", "currentTime"),

  ended: function() {
    if (this.get('currentUserIsDJ')) {
      App.get('firebase').child('current_song').child('done').set(true);
    }
  }.observes("endedAt"),

  actions: {
    toggleMute: function() {
      var audio = $("#audioPlayer")[0];
      if (audio.muted) {
        this.set('muted', false);
        audio.muted = false;
        audio.defaultMuted = false;
      } else {
        this.set('muted', true);
        audio.muted = true;
        audio.defaultMuted = true;
      }
    },

    skip: function() {
      App.get('firebase').child('current_song').child('done').set(true);
    }
  }
});

