var App = window.App;

export default Ember.Controller.extend({
  uploadedSong: function(id) {
    this.get('model').addSongIdToTop(id);
  }
});

