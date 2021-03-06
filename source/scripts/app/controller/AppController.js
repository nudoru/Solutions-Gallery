/*
 Commands used for most controller functionality.
 */


APP.createNameSpace('APP.AppController');
APP.AppController = function () {
  var _model,
    _view,
    _self,
    _eventDispatcher = require('nudoru.events.EventDispatcher'),
    _eventCommandMap = require('nudoru.events.EventCommandMap'),
    _browserEvents = require('nudoru.events.BrowserEvents'),
    _componentEvents = require('nudoru.events.ComponentEvents'),
    _URLRouter = require('nudoru.utils.URLRouter');

  //----------------------------------------------------------------------------
  //  Initialization
  //----------------------------------------------------------------------------

  function initialize() {
    _self = this;

    _model = APP.AppModel;
    _view = APP.AppView;

    _URLRouter.initialize(_eventDispatcher);
    mapCommand(APP.AppEvents.CONTROLLER_INITIALIZED, _self.AppInitializedCommand, true);
    initializeView();
  }

  function mapCommand(evt, command, once) {
    once = once || false;
    _eventCommandMap.map(evt, command, once);
  }

  function initializeView() {
    _eventDispatcher.subscribe(APP.AppEvents.VIEW_INITIALIZED, onViewInitalized, true);
    _eventDispatcher.subscribe(APP.AppEvents.VIEW_RENDERED, onViewRendered, true);
    _view.initialize();
  }

  function onViewInitalized() {
    _view.render();
  }

  function onViewRendered() {
    initializeModel();
  }

  function initializeModel() {
    _eventDispatcher.subscribe(APP.AppEvents.MODEL_INITIALIZED, onModelInitialized, true);
    _eventDispatcher.subscribe(APP.AppEvents.MODEL_DATA_LOADED, onModelDataLoaded, true);
    _model.initialize();
  }

  function onModelInitialized() {
    _model.loadModelData();
  }

  function onModelDataLoaded() {
    postInitialize();
  }

  /**
   * After the application is loaded, wire events/command and start it going
   */
  function postInitialize() {
    // Browser events
    mapCommand(_browserEvents.URL_HASH_CHANGED, _self.URLHashChangedCommand);
    mapCommand(_browserEvents.BROWSER_RESIZED, _self.BrowserResizedCommand);
    mapCommand(_browserEvents.BROWSER_SCROLLED, _self.BrowserScrolledCommand);

    // Component events
    mapCommand(_componentEvents.MENU_SELECT, _self.MenuSelectionCommand);

    // App events
    mapCommand(APP.AppEvents.VIEW_CHANGE_TO_MOBILE, _self.ViewChangedToMobileCommand);
    mapCommand(APP.AppEvents.VIEW_CHANGE_TO_DESKTOP, _self.ViewChangedToDesktopCommand);

    mapCommand(APP.AppEvents.SEARCH_INPUT, _self.SearchInputCommand);
    mapCommand(APP.AppEvents.GRID_VIEW_ITEMS_CHANGED, _self.GridViewItemsVisibleChangedCommand);
    mapCommand(APP.AppEvents.ITEM_SELECT, _self.ItemSelectCommand);

    mapCommand(APP.AppEvents.VIEW_ALL_FILTERS_CLEARED, _self.ClearAllFiltersCommand);
    mapCommand(APP.AppEvents.DATA_FILTER_CHANGED, _self.DataFiltersChangedCommand);

    mapCommand(APP.AppEvents.RESUME_FROM_MODEL_STATE, _self.ResumeFromModelStateCommand);

    //AppInitializedCommand takes over when this fires
    _eventDispatcher.publish(APP.AppEvents.CONTROLLER_INITIALIZED);
  }

  /**
   * Utility function
   *  1. Create the namespace
   *  2. Picks the last segment of the namespace
   *  3. Sets that to the command class w/ new execute()
   * @param nsStr
   * @param execCode
   */
  function initializeCommand(nsStr, execCode) {
    var parts = nsStr.split('.');
    APP.createNameSpace(nsStr);
    APP.AppController[parts[parts.length-1]] = createAndExtendCommand(execCode);
  }

  /**
   * Instatiate the command object and set exececute() function
   * @param execCode
   * @returns {APP.AppController.AbstractCommand.methods}
   */
  function createAndExtendCommand(execCode) {
    var cmd = Object.create(APP.AppController.AbstractCommand.methods);
    cmd.execute = execCode;
    return cmd;
  }

  return {
    initialize: initialize,
    postIntialize: postInitialize,
    initializeCommand: initializeCommand
  };

}();