/**
 * Created by matt on 1/15/15
 * Modified 3/13/15
 */

APP.createNameSpace('APP.AppView.DDMenuBarView');
APP.AppView.DDMenuBarView = {
  state: {},

  methods: {

    eventDispatcher: null,
    containerEl: null,
    barEl: null,
    data: null,
    children: null,
    isKeepOpen: false,

    initialize: function(elID, data, keep) {
      this.eventDispatcher = APP.EventDispatcher;

      this.containerEl = $(elID);
      this.data = data;

      this.isKeepOpen = keep ? true : false;

      this.render();
    },

    render: function() {
      var i = 0,
          len = this.data.length;

      this.children = [];

      this.barEl = $('<ul></ul>');
      for(; i<len; i++) {
        var menuobj = ObjectUtils.basicFactory(APP.AppView.DDMenuBarView.DDMenuView);
        menuobj.initialize(this.data[i], this.isKeepOpen);
        $(this.barEl).append(menuobj.element);
        this.children.push(menuobj);
      }

      this.containerEl.prepend(this.barEl);

      // hack to prevent clicking on menuItems from selecting text on ie since CSS isn't supported
      if(APP.globals().isIE) {
        this.containerEl[0].onselectstart = function() {
          return false;
        };
      }

    },

    resetAllSelections: function() {
      this.children.forEach(function(menu) {
        menu.deselectAllItems();
      });
    },

    setMenuSelections: function(data) {
      this.children.forEach(function(menu) {
        menu.setSelections(data);
      });
    }

  },

  closures: []
};
