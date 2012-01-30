var Manager;

jQuery(function($){
  $("#jquery_jplayer_1").jPlayer({
    ready: function () {
      $(this).jPlayer("setMedia", {
        mp3: "http://localhost:8000/test",
      });
    },
    swfPath: "/js",
    supplied: "mp3"
  });
});

jQuery(function ($) {
  $(function () {
    Manager = new AjaxSolr.Manager({
      solrUrl: 'http://localhost:8080/solr/'
    });
    Manager.init();
  });
});

