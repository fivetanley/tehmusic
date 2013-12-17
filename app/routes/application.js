var Firebase = window.Firebase;
var FirebaseAuthClient = window.FirebaseAuthClient;
var App = window.App;

export default Ember.Route.extend({
  beforeModel: function(transition) {
    App.set('firebase', new Firebase(window.FIREBASE_ROOT));

    if (!this.controllerFor('login').get('token')) {
      var loginController = this.controllerFor('login');
      loginController.set('attemptedTransition', transition);
      this.transitionTo('login');
    }
  }
});

