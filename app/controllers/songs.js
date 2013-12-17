var App = window.App;

export default Ember.ArrayController.extend({
  sortProperties: [ "order" ],
  sortAscending: true,

  updateSortOrder: function(indexes) {
    this.forEach(function(song) {
      var index = indexes[song.get('id')];
      song.set('order', index);
      song.save();
    }, this);
  }
});

