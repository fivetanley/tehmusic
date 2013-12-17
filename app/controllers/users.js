var App = window.App;

export default Ember.ArrayController.extend({
  // undocumented yo
  orderBy: function(a, b) {
    if (a.get('user.spinning') && b.get('user.spinning')) {
      return a.get('user.spinning') < b.get('user.spinning') ? -1 : 1;
    }

    if (a.get('user.spinning')) {
      return -1;
    }

    if (b.get('user.spinning')) {
      return 1;
    }

    return a.get('id') < b.get('id') ? -1 : 1;
  },

  // still need this
  sortProperties: [ "user.spinning" ]
});

