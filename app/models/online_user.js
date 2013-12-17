var FP = window.FP;

var OnlineUser = FP.Model.extend({
  user: FP.hasOne({ detached: true })
});

OnlineUser.reopenClass({
  firebasePath: "online_users"
});

window.OnlineUser = OnlineUser;

export default OnlineUser;
