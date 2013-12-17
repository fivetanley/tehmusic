export default Ember.View.extend({
  didInsertElement: function() {
    var controller = this.get('controller');
    this.$(".sortable").sortable({
      axis: "y",
      update: function(event, ui) {
        var indexes = {};
        $(this).find('.song').each(function(index) {
          indexes[$(this).data('id')] = index;
        });

        $(this).sortable('cancel');

        controller.updateSortOrder(indexes);
      }
    });
  }
});
