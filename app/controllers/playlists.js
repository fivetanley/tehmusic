var App = window.App;

export default Ember.ArrayController.extend({
  needs: [ "index" ],

  actions: {
    newPlaylist: function() {
      var name = window.prompt("Please name your new playlist:");
      if (name) {
        var user = this.get('controllers.index.model.currentUser');

        var playlists = user.get('playlists');

        // TODO: what's the "right" way to do this?
        var ref = playlists.buildFirebaseReference().push({ name: name });

        user.set('currentPlaylistId', ref.name());
        user.save();
      }
    },

    selectPlaylist: function(playlist) {
      var user = this.get('controllers.index.model.currentUser');
      user.set('currentPlaylistId', playlist.get('id'));
      user.save();
    }
  }
});
