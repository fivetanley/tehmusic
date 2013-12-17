export default Ember.View.extend({
  didInsertElement: function() {
    var audio = this.$("audio");
    var controller = this.get('controller');

    var lastSend = (new Date()).getTime();
    audio.on('durationchange timeupdate', function() {
      var now = (new Date()).getTime();
      if (now - lastSend > 500) {
        lastSend = now;
        controller.set("duration", audio[0].duration);
        controller.set("currentTime", audio[0].currentTime);
      };
    }.bind(this));

    audio.on('ended', function() {
      // hokey...
      controller.set("endedAt", (new Date()).getTime());
    });
  }
});

