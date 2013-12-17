var FP = window.FP;

var User = FP.Model.extend({
  email: FP.attr(),
  screenname: FP.attr(),
  spinning: FP.attr(),
  lastOnline: FP.attr("date"),
  playlists: FP.hasMany({
    detached: true,
    path: "playlists/{{id}}"
  }),
  currentPlaylistId: FP.attr(),

  currentPlaylist: function() {
    return this.get('playlists').findProperty('id', this.get('currentPlaylistId'));
  }.property('playlists.@each', 'currentPlaylistId'),

  avatarURL: function() {
    return 'http://robohash.org/' + this.get('email') + '?gravatar=yes&amp;size=120x120';
  }.property('user.email')
});

User.reopenClass({
  firebasePath: "users"
});

export default User;

