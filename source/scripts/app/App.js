var APP = {};

APP = (function () {
  var _self,
    _globals,
    _objectUtils = require('nudoru.utils.ObjectUtils'),
    _browserInfo = require('nudoru.utils.BrowserInfo');

  //----------------------------------------------------------------------------
  //  Initialize
  //----------------------------------------------------------------------------

  function initialize() {
    _self = this;
    initGlobals();
    this.AppController.initialize();
  }

  /**
   * Initialize the global vars
   */
  function initGlobals() {
    _globals = {};
    _globals.appConfig = APP_CONFIG_DATA;
    _globals.enhanced = !_browserInfo.isIE && !_browserInfo.mobile.any();
  }

  /**
   * Return a copy of the globals
   * @returns {void|*}
   */
  function globals() {
    return _objectUtils.extend({}, _globals);
  }

  //----------------------------------------------------------------------------
  //  Run
  //----------------------------------------------------------------------------

  function run() {
    _self.AppController.run();
  }

  function createNameSpace(str) {
    return NNameSpace.createNameSpace(str, APP, "APP");
  }

  return {
    initialize: initialize,
    run: run,
    createNameSpace: createNameSpace,
    globals: globals
  };

}());