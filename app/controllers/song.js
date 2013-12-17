var App = window.App,
    ajax = window.ic.ajax;

export default Ember.ObjectController.extend({
  needs: [ "index" ],

  actions: {
    top: function() {
      var playlist = this.get('controllers.index.currentUser.currentPlaylist');
      var newOrder = playlist.lowestSongOrder();
      var song = this.get('model');
      song.set('order', newOrder);
      song.save();
    },

    remove: function() {
      var song = this.get('model');
      if (window.confirm("sure you want to remove '" + song.get('title') + "' from this playlist?")) {
        song.delete();
      }
    }
  }
});

