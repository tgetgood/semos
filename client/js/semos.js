/**
 * TODO:
 *
 * * Cache songs so for back/forward.
 * * Key board shortcuts for play/pause/next, etc..
 * * Title, album facets.
 * * Infinite scroll.
 * * play/pause/seek support on chrome 16-17 (works in 14).
 */



var Manager;

jQuery(function($) {

  // Set up jPlayer

  $("#jquery_jplayer_1").jPlayer({
    swfPath: "/jPlayer/jquery.jplayer/",
    supplied: "mp3"
  });

  // Set up playlist add-on for jPlayer.

  var myPlaylist = new jPlayerPlaylist({
    jPlayer: "#jquery_jplayer_1",
    cssSelectorAncestor: "#jp_container_1"
    },
    [], // <-- Insert songs here.
    {
      playlistOptions: {
        enableRemoveControls: true
    },
    swfPath: "/jPlayer/jquery.jplayer/",
    supplied: "mp3"
  });

  var addSong = function(elem, link) {
    myPlaylist.add({
      title: elem.title,
      artist: elem.artist,
      mp3: elem.path
    });
  };

  // ==========================================================================

  // Configure infinite scroll

  $('ul#songs').infinitescroll({
    navSelector: '#pager',
    nextSelector: '#pager .pager-next',
    itemSelector: '#songs li',
    debug: true
  });

  // ==========================================================================

  // Define display widgets
  //
  // This will need its own set of files eventually.

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
    currentSearch: '',
    init: function () {
      var self = this;
      $(this.target).find('input').bind('keydown', function(e) {
        if (e.which == 13) {
          var value = $(this).val();
          if (value && self.add(value)) {
            if (self.currentSearch !== '') {
              // A new search that doesn't reset the old one is unintuitive.
              self.remove(self.currentSearch);
            }
            self.currentSearch = value;
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

  AjaxSolr.TagCloudWidget = AjaxSolr.AbstractFacetWidget.extend({
    afterRequest: function () {
      if (this.manager.response.facet_counts.facet_fields[this.field] === undefined) {
        $(this.target).html(AjaxSolr.theme('no_items_found'));
        return;
      }

      var maxCount = 0;
      var objectedItems = [];
      var counts = this.manager.response.facet_counts.facet_fields[this.field];
      for (var i = 0; i < counts.length; i+=2) {
        var facet = counts[i]
        var count = parseInt(counts[i+1]);
        if (count > maxCount) {
          maxCount = count;
        }
        objectedItems.push({ facet: facet, count: count });
      }
      objectedItems.sort(function (a, b) {
        return a.facet < b.facet ? -1 : 1;
      });

      var self = this;
      $(this.target).empty();
      for (var i = 0, l = objectedItems.length; i < l; i++) {
        var facet = objectedItems[i].facet;
        $(this.target).append(AjaxSolr.theme('tag', facet, parseInt(objectedItems[i].count / maxCount * 10), self.clickHandler(facet)));
      }
    }
  });


  // ==========================================================================

  // Define themes

  AjaxSolr.theme.prototype.result = function(elem) {
    var output = $('<a class="search-result" href="#"/>').text(
      elem.title + ': ' + elem.artist + ': ' + elem.album
    ).click(function(x) {
      addSong(elem, x)
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
  };

  AjaxSolr.theme.prototype.tag = function (value, weight, handler) {
    return $('<a href="#" class="tagcloud_item"/>').text(value).addClass('tagcloud_size_' + weight).click(handler);
  };

  /**
   * Taken from http://evolvingweb.github.com/ajax-solr/examples/reuters/index.3.html
   * ajaxsolr.theme.js
   *
   * Appends the given items to the given list, optionally inserting a separator
   * between the items in the list.
   *
   * @param {String} list The list to append items to.
   * @param {Array} items The list of items to append to the list.
   * @param {String} [separator] A string to add between the items.
   * @todo Return HTML rather than modify the DOM directly.
   */
  AjaxSolr.theme.prototype.list_items = function (list, items, separator) {
    jQuery(list).empty();
    for (var i = 0, l = items.length; i < l; i++) {
      var li = jQuery('<li/>');
      if (AjaxSolr.isArray(items[i])) {
        for (var j = 0, m = items[i].length; j < m; j++) {
          if (separator && j > 0) {
            li.append(separator);
          }
          li.append(items[i][j]);
        }
      }
      else {
        if (separator && i > 0) {
          li.append(separator);
        }
        li.append(items[i]);
      }
      jQuery(list).append(li);
    }
  };

  // ==========================================================================

  // Setup AJAX-Solr

  var urlBase = Semos.config.solr.proxy;

  if (urlBase === undefined) {
    // Using Solr without a proxy. Too bad.
    urlBase = Semos.config.solr;
  }

  Manager = new AjaxSolr.Manager({
    solrUrl: 'http://' + urlBase.host + ':' + urlBase.port + urlBase.path
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

  Manager.addWidget(new AjaxSolr.TagCloudWidget({
    id: 'genre-cloud',
    target: '#genre-select',
    field: 'genre'
  }));

  Manager.addWidget(new AjaxSolr.PagerWidget({
    id: 'pager',
    target: '#pager',
    prevLabel: '&lt;',
    nextLabel: '&gt;',
    innerWindow: 1,
  }));

  // ==========================================================================

  // And go

  Manager.init();

  Manager.store.addByValue('q', '*:*');
  var params = {
    rows: '50',
    facet: true,
    'facet.field': [ 'title', 'album', 'artist', 'genre' ],
    'facet.limit': 20,
    'facet.mincount': 1,
    'f.topics.facet.limit': 50
  };

  for (var name in params) {
    Manager.store.addByValue(name, params[name]);
  }

  Manager.doRequest();

});
