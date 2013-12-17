var App = window.App,
    ajax = window.ic.ajax,
    Firebase = window.Firebase;

export default Ember.ObjectController.extend({
  needs: ['login'],

  isSelf: function() {
    return this.get('id') === this.get('controllers.login.authInfo.username');
  }.property('username', 'controllers.login.authInfo'),

  actions: {
    edit: function() {
      this.set('savedScreenname', this.get('model.user.screenname'));
      this.set('editing', true);
    },

    cancel: function() {
      this.set('model.user.screenname', this.get('savedScreenname'));
      this.set('editing', false);
    },

    save: function() {
      this.get('model.user').save();
      this.set('editing', false);
    },

    stepDown: function() {
      var user = this.get('model.user');
      user.set('spinning', false);
      user.save();
    },

    stepUp: function() {
      var user = this.get('model.user');
      user.set('spinning', Firebase.ServerValue.TIMESTAMP);
      user.save();
    }
  }
});
