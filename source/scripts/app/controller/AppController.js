/*
Commands used for most controller functionality.
 */


APP.createNameSpace('APP.AppController');
APP.AppController = function () {
  var _appScope,
      _globalScope,
      _viewParent,
      _model,
      _view,
      _eventDispatcher,
      _router,
      _self;

  //----------------------------------------------------------------------------
  //  Initialization
  //----------------------------------------------------------------------------

  function initialize(app, global, viewParent) {
    _appScope = app;
    _globalScope = global;
    _viewParent = viewParent;
    _self = this;
    _eventDispatcher = nudoru.events.EventDispatcher;
    _router = APP.AppController.Router;

    _router.initialize();

    mapCommand(APP.AppEvents.CONTROLLER_INITIALIZED, _self.AppInitializedCommand, true);

    initializeView();
  }

  function mapCommand(evt, command, once) {
    once = once || false;
    nudoru.events.EventCommandMap.map(evt, command, once);
  }

  function initializeView() {
    _view = APP.AppView;
    _eventDispatcher.subscribe(APP.AppEvents.VIEW_INITIALIZED, onViewInitalized, true);
    _eventDispatcher.subscribe(APP.AppEvents.VIEW_RENDERED, onViewRendered, true);
    _view.initialize(_appScope, _viewParent);
  }

  function onViewInitalized() {
    _view.render();
  }

  function onViewRendered() {
    initializeModel();
  }

  function initializeModel() {
    _model = APP.AppModel;
    _eventDispatcher.subscribe(APP.AppEvents.MODEL_INITIALIZED, onModelInitialized, true);
    _eventDispatcher.subscribe(APP.AppEvents.MODEL_DATA_LOADED, onModelDataLoaded, true);
    _model.initialize();
  }

  function onModelInitialized() {
    _model.loadModelData();
  }

  function onModelDataLoaded() {
    _eventDispatcher.publish(APP.AppEvents.CONTROLLER_INITIALIZED);

    //AppInitializedCommand takes over here
  }

  function postInitialize() {
    // Browser events
    mapCommand(nudoru.events.BrowserEvents.URL_HASH_CHANGED, _self.URLHashChangedCommand);
    mapCommand(nudoru.events.BROWSER_RESIZED, _self.BrowserResizedCommand);
    mapCommand(nudoru.events.BROWSER_SCROLLED, _self.BrowserScrolledCommand);

    // Component events
    mapCommand(nudoru.events.ComponentEvents.MENU_SELECT, _self.MenuSelectionCommand);

    // App events
    mapCommand(APP.AppEvents.VIEW_CHANGE_TO_MOBILE, _self.ViewChangedToMobileCommand);
    mapCommand(APP.AppEvents.VIEW_CHANGE_TO_DESKTOP, _self.ViewChangedToDesktopCommand);

    mapCommand(APP.AppEvents.SEARCH_INPUT, _self.SearchInputCommand);
    mapCommand(APP.AppEvents.GRID_VIEW_ITEMS_CHANGED, _self.GridViewItemsVisibleChangedCommand);
    mapCommand(APP.AppEvents.ITEM_SELECT, _self.ItemSelectCommand);

    mapCommand(APP.AppEvents.VIEW_ALL_FILTERS_CLEARED, _self.ClearAllFiltersCommand);
    mapCommand(APP.AppEvents.DATA_FILTER_CHANGED, _self.DataFiltersChangedCommand);

    mapCommand(APP.AppEvents.RESUME_FROM_MODEL_STATE, _self.ResumeFromModelStateCommand);
  }

  return {
    initialize: initialize,
    postIntialize: postInitialize,
    createCommand: ObjectUtils.basicFactory
  };

}();