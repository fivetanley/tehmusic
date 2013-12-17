var FP = window.FP;

var Playlist = FP.Model.extend({
  name: FP.attr(),
  songs: FP.hasMany("song", { embedded: false, as: "playlist_song" }),

  lowestSongOrder: function() {
    var order = 0;
    this.get('songs').forEach(function(song) {
      if (song.get('order') <= order) {
        order = song.get('order');
      }
    });
    return order - 1;
  },

  addSongIdToTop: function(songId) {
    this.buildFirebaseReference().child('songs').child(songId).set({
      order: this.lowestSongOrder()
    });
  }
});

export default Playlist;
