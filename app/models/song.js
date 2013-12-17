var FP = window.FP;

var Song = FP.Model.extend({
  album: FP.attr(),
  artist: FP.attr(),
  genre: FP.attr(),
  imageUrl: FP.attr(),
  name: FP.attr(),
  title: FP.attr(),
  url: FP.attr()
});

Song.reopenClass({
  firebasePath: "songs"
});

export default Song;
