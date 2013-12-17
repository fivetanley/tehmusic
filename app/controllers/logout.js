var App = window.App;

export default Ember.Controller.extend({
  reset: function() {
    this.setProperties({
      username: "",
      password: "",
      message: ""
    });
  },

  actions: {
    login: function() {
      App.get('firebaseAuth').login('password', {
        email: this.get('username'),
        password: this.get('password')
      });
    }
  }
});

