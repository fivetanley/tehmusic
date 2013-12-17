var App = window.App,
    ajax = window.ic.ajax;

export default Ember.Controller.extend({
  needs: ['login'],

  reset: function() {
    this.setProperties({
      username: "",
      email: "",
      password: "",
      message: "",
      joinCode: ""
    });
  },

  actions: {
    register: function() {
      ajax('/api/register', {
        type: 'POST',
        data: {
          username: this.get('username'),
          password: this.get('password'),
          email: this.get('email'),
          joinCode: this.get('joinCode')
        }
      }).then(function(response) {
        if (response.status === "ok") {
          this.set('controllers.login.authInfo', response.auth);
          Ember.run.next(this, function() {
            this.transitionToRoute('');
          });
        } else {
          this.set('message', 'Could not register: ' + response.error);
        }
      }.bind(this));
    }
  }
});
