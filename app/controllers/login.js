var App = window.App,
    ajax = window.ic.ajax,
    Firebase = window.Firebase;

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
      ajax('/api/login', {
        type: 'POST',
        data: {
          username: this.get('username'),
          password: this.get('password')
        }
      }).then(function(response) {
        if (response.status === "ok") {
          this.set('authInfo', response.auth);
          Ember.run.next(this, function() {
            this.transitionToRoute('');
          });
        } else {
          this.set('message', 'Could not login: ' + response.error);
        }
      }.bind(this));
    }
  },

  updatePresence: function() {
    var fb = App.get('firebase'),
        userRef = fb.child("/users/" + this.get('authInfo.username')),
        connectedUsersRef = fb.child("/online_users/" + this.get('authInfo.username'));
    App.set('userRef', userRef);
    App.set('authInfo', this.get('authInfo'));

    fb.auth(this.get('authInfo.token'), function(err, auth) {
      if (err) {
        window.alert('Firebase auth failed! ' + err);
        return;
      }

      var connectionsRef = connectedUsersRef.child('connections');
      var lastOnlineRef = userRef.child('lastOnline');
      var connectedRef = fb.child('.info/connected');
      connectedRef.on('value', function(snapshot) {
        if (snapshot.val() === true) {
          var con = connectionsRef.push(true);
          con.onDisconnect().remove();
          lastOnlineRef.onDisconnect().set(Firebase.ServerValue.TIMESTAMP);
        }
      });
    }.bind(this));

  }.observes('authInfo')
});
