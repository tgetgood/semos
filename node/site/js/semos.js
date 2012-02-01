var Manager;

jQuery(function($) {

  // Set up jPlayer

  $("#jquery_jplayer_1").jPlayer({
    swfPath: "/jPlayer/jquery.jplayer/",
    supplied: "mp3"
  });
  

  // Callback to change current song.

  var setSong = function(elem, link) {
    console.log(elem);
    $("#jquery_jplayer_1").jPlayer("setMedia",
      {
        mp3: elem,
      });
    $("#jquery_jplayer_1").jPlayer("play");
  };

  // ==========================================================================

  // Extend AJAX-Solr
  //
  // This will need it's own set of files eventually.

  AjaxSolr.ResultWidget = AjaxSolr.AbstractWidget.extend({
    afterRequest: function () {
      $(this.target).empty();
      for (var i = 0, l = this.manager.response.response.docs.length; i < l; i++) {
        var doc = this.manager.response.response.docs[i];
        $(this.target).append(AjaxSolr.theme('result', doc));
      }
    }
  });

  AjaxSolr.TextWidget = AjaxSolr.AbstractFacetWidget.extend({
    init: function () {
      var self = this;
      $(this.target).find('input').bind('keydown', function(e) {
        if (e.which == 13) {
          var value = $(this).val();
          if (value && self.add(value)) {
            self.manager.doRequest(0);
          }
        }
      });
    },
    afterRequest: function () {
      $(this.target).find('input').val('');
    }
  });

  AjaxSolr.CurrentSearchWidget = AjaxSolr.AbstractWidget.extend({
    afterRequest: function () {
      var self = this;
      var links = [];

      var fq = this.manager.store.values('fq');
      for (var i = 0, l = fq.length; i < l; i++) {
        links.push($('<a href="#"/>').text('(x) ' + fq[i]).click(self.removeFacet(fq[i])));
      }

      if (links.length > 1) {
        links.unshift($('<a href="#"/>').text('remove all').click(function () {
          self.manager.store.remove('fq');
          self.manager.doRequest(0);
          return false;
        }));
      }

      if (links.length) {
        AjaxSolr.theme('list_links', this.target, links);
      }
      else {
        $(this.target).html('<div>Viewing all documents!</div>');
      }
    },

    removeFacet: function (facet) {
      var self = this;
      return function () {
        if (self.manager.store.removeByValue('fq', facet)) {
          self.manager.doRequest(0);
        }
        return false;
      };
    }
  });

  // ==========================================================================

  // Define themes

  AjaxSolr.theme.prototype.result = function(elem) {
    var output = $('<a class="search-result" href="#"/>').text(
      elem.title + ': ' + elem.artist + ': ' + elem.album
    ).click(function(x) {
      setSong(elem.path, x)
    });

    return $('<li/>').append(output);
  };

  AjaxSolr.theme.prototype.list_links = function(elem, links) {
    $(elem).empty();
    for (var i = 0; i < links.length; i++) {
      var output = $('<li/>');
      output.append(links[i]);
      $(elem).append(output);
    }
  }

  // ==========================================================================

  // Setup AJAX-Solr

  Manager = new AjaxSolr.Manager({
    solrUrl: 'http://localhost:8080/solr/'
  });

  Manager.addWidget(new AjaxSolr.TextWidget({
    id: 'search',
    target: '#search',
    field: 'text',
    multivalue: false
  }));

  Manager.addWidget(new AjaxSolr.ResultWidget({
    id: 'result',
    target: '#songs'
  }));

  Manager.addWidget(new AjaxSolr.CurrentSearchWidget({
    id: 'current_search',
    target: '#current-search'
  }));

  // ==========================================================================

  // And go

  Manager.init();

  Manager.store.addByValue('q', '*:*');
  var params = {
    facet: true,
    'facet.field': [ 'title', 'album', 'artist' ],
    'facet.limit': 20,
    'facet.mincount': 1,
    'f.topics.facet.limit': 50
  };

  for (var name in params) {
    Manager.store.addByValue(name, params[name]);
  }

  Manager.doRequest();

});
