var App = window.App;

export default Ember.Route.extend({
  model: function() {
    var fb = App.get('firebase');

    var currentSongInfo = Ember.Object.create({});
    App.set('currentSongInfo', currentSongInfo);
    fb.child('current_song').on('value', function(snapshot) {
      var value = snapshot.val();
      if (value) {
        currentSongInfo.setProperties({
          startTime: value.start_time,
          user: this.store.find("user", value.user_id),
          song: this.store.find("song", value.song_id)
        });
      } else {
        currentSongInfo.setProperties({
          startTime: null,
          user: null,
          song: null
        });
      }
    }.bind(this));

    var authInfo = this.controllerFor('login').get('authInfo');
    return Ember.RSVP.hash({
      users: this.store.fetch("online_user"),
      currentUser: this.store.fetch("user", authInfo.username)
    });
  }
});
