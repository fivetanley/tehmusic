var App = window.App;

export default Ember.Controller.extend({
  currentPathDidChange: function() {
    App.set('currentPath', this.get('currentPath'));
  }.observes('currentPath')
});
