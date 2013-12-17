var Dropzone = window.Dropzone,
    ajax = window.ic.ajax,
    ID3 = window.ID3;

export default Ember.Component.extend({
  tagName: "li",
  classNames: [ "list-group-item", "zw-dropzone", "song", "dz-clickable" ],

  albumPicture: function() {
    var picture = this.get('tags.picture');
    if (!picture) {
      return "";
    }

    var b64String = "";
    for (var i = 0; i < picture.data.length; i++) {
      b64String += String.fromCharCode(picture.data[i]);
    }
    return "data:" + (picture.format || picture.k) + ";base64," + window.btoa(b64String);
  }.property("tags.picture"),

  progressStyle: function() {
    return "width: " + this.get('progress') + '%';
  }.property("progress"),

  didInsertElement: function() {
    var tags = ["artist", "title", "album", "year", "track", "genre", "picture"];

    var dropzone = new Dropzone(this.get('element'), {
      url: "/api/upload",
      maxFiles: 1,
      acceptedFiles: ".mp3,.aac,.m4a",
      createImageThumbnails: false,
      autoProcessQueue: true,
      clickable: ".dz-clickable",

      accept: function(file, done) {
        ID3.loadTags(file.name, function() {
          file.tags = ID3.getAllTags(file.name);
          this.set('tags', file.tags);
          window.tags = file.tags;
          done();
        }.bind(this), {
          tags: tags,
          dataReader: window.FileAPIReader(file)
        });
      }.bind(this),

      sending: function(file, xhr, formData) {
        tags.forEach(function(tagName) {
          var value = file.tags[tagName];
          if (!value) { return; }

          if (tagName === "picture") {
            value = new window.Blob([ new window.Uint8Array(value.data) ], { type: value.format || value.k });
          }

          formData.append(tagName, value);
        });

        formData.append('auth', JSON.stringify(this.get('auth')));
      }.bind(this),

      success: function(file, response) {
        this.get('delegate').uploadedSong(response.file.id);
      }.bind(this),

      complete: function(file) {
        this.set('tags', null);
        dropzone.removeFile(file);
        this.set('progress', 0);
        this.set('uploadedBytes', 0);
      }.bind(this)
    });

    dropzone.on("uploadprogress", function(file, progress, bytesSent) {
      this.set("progress", progress + "%");
      this.set("uploadedBytes", bytesSent);
    }.bind(this));
  }
});

