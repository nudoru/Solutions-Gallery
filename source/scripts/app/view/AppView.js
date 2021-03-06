APP.createNameSpace('APP.AppView');

APP.AppView = (function () {
  var _self,
      _appGlobals,
      _currentViewPortSize,
      _currentViewPortScroll,
      _mainScrollEl,
      _mainSearchInputEl,
      _searchHeaderEl,
      _clearAllButtonEl,
      _appContainerEl,
      _appEl,
      _drawerEl,
      _mainHeaderEl,
      _mainFooterEl,
      _drawerToggleButtonEl,
      _uiUpdateLayoutStream,
      _searchInputStream,
      _clearAllButtonStream,
      _browserScrollStream,
      _browserResizeStream,
      _isScrollingTimerStream,
      _drawerToggleButtonStream,
      _isMobile,
      _tabletBreakWidth,
      _phoneBreakWidth,
      _drawerWidth,
      _isDrawerOpen,
      _eventDispatcher = require('nudoru.events.EventDispatcher'),
      _headerMenuView  = requireUnique('nudoru.components.DDMenuBarView'),
      _drawerMenuView  = requireUnique('nudoru.components.DDMenuBarView'),
      _toastView       = require('nudoru.components.ToastView'),
      _modalCoverView  = require('nudoru.components.ModalCoverView'),
      _tagBarView      = require('APP.AppView.TagBarView'),
      _itemGridView    = require('APP.AppView.GridCollectionView'),
      _itemDetailView  = require('APP.AppView.ItemDetailView'),
      _browserEvents   = require('nudoru.events.BrowserEvents'),
      _componentEvents = require('nudoru.events.ComponentEvents'),
      _stringUtils     = require('nudoru.utils.StringUtils'),
      _browserInfo     = require('nudoru.utils.BrowserInfo');

  //----------------------------------------------------------------------------
  //  Accessors
  //----------------------------------------------------------------------------

  function getMainScrollingView() {
    return _mainScrollEl;
  }

  //----------------------------------------------------------------------------
  //  Initialization
  //----------------------------------------------------------------------------

  function initialize() {
    _self       = this;
    _appGlobals = APP.globals();

    _isMobile         = false;
    _tabletBreakWidth = 750;
    _phoneBreakWidth  = 475;
    _drawerWidth      = 250;
    _isDrawerOpen     = false;

    _eventDispatcher.publish(APP.AppEvents.VIEW_INITIALIZED);
  }

  function render() {
    defineDOMElements();
    setCurrentViewPortSize();
    setCurrentViewPortScroll();
    initializeViewComponents();
    configureUIStreams();
    configureUIEvents();
    checkForMobile();
    hideModalCover();
    positionUIElements();
    updateAppTitle();

    TweenLite.to(_drawerEl, 0, {x: _drawerWidth * -1});

    _eventDispatcher.publish(APP.AppEvents.VIEW_RENDERED);
  }

  function updateAppTitle() {
    var apptitle       = _mainHeaderEl.querySelector('h1');
    apptitle.innerHTML = _appGlobals.appConfig.title;

    document.title = _stringUtils.removeTags(_appGlobals.appConfig.title);
  }

  function defineDOMElements() {
    // ui parts
    _appContainerEl = document.getElementById('app__container');
    _appEl          = document.getElementById('app__contents');

    // listen for scroll on the app container not window or body
    _mainScrollEl         = _appEl;
    _drawerEl             = document.getElementById('drawer');
    _drawerToggleButtonEl = document.querySelector('.drawer__menu-spinner-button > input');

    _mainHeaderEl = document.getElementById('header');
    _mainFooterEl = document.getElementById('footer');

    // item grid header
    _mainSearchInputEl = document.querySelector('.grid__header-search > input');
    _searchHeaderEl    = document.querySelector('.grid__header > h1');
    _clearAllButtonEl  = document.getElementById('clearall-button');
  }

  function initializeViewComponents() {
    _toastView.initialize('toast__container');
    _modalCoverView.initialize();
    _itemDetailView.initialize('details');
    _tagBarView.initialize('tagbar__container');

    // Menus init'd with data below
    // Grid collection view init'd with below

  }

  function configureUIEvents() {
    _eventDispatcher.subscribe(_componentEvents.MODAL_COVER_HIDE, hideModalContent);
    //reserved for future _eventDispatcher.subscribe(APP.AppEvents.GRID_VIEW_LAYOUT_COMPLETE, onGridViewLayoutComplete);
  }

  function configureUIStreams() {
    var uiresizestream = Rx.Observable.fromEvent(window, 'resize'),
        uiscrollscream = Rx.Observable.fromEvent(_mainScrollEl, 'scroll');

    _uiUpdateLayoutStream = Rx.Observable.merge(uiresizestream, uiscrollscream)
      .subscribe(function () {
        positionUIElementsOnChange();
      });

    _browserResizeStream = Rx.Observable.fromEvent(window, 'resize')
      .throttle(100)
      .subscribe(function () {
        handleViewPortResize();
      });

    _browserScrollStream = Rx.Observable.fromEvent(_mainScrollEl, 'scroll')
      .throttle(100)
      .subscribe(function () {
        handleViewPortScroll();
      });

    _searchInputStream = Rx.Observable.fromEvent(_mainSearchInputEl, 'keyup')
      .throttle(150)
      .map(function (evt) {
        return evt.target.value;
      })
      .subscribe(function (value) {
        _eventDispatcher.publish(APP.AppEvents.SEARCH_INPUT, value);
      });

    _clearAllButtonStream = Rx.Observable.fromEvent(_clearAllButtonEl, _browserInfo.mouseClickEvtStr())
      .subscribe(function () {
        _eventDispatcher.publish(APP.AppEvents.VIEW_ALL_FILTERS_CLEARED);
      });

    _drawerToggleButtonStream = Rx.Observable.fromEvent(_drawerToggleButtonEl, 'change')
      .subscribe(function () {
        toggleDrawer();
      });

  }

  //----------------------------------------------------------------------------
  //  Viewport and UI elements
  //----------------------------------------------------------------------------

  function handleViewPortResize() {
    checkForMobile();
    _eventDispatcher.publish(_browserEvents.BROWSER_RESIZED, _currentViewPortSize);
  }

  function handleViewPortScroll() {
    _eventDispatcher.publish(_browserEvents.BROWSER_SCROLLED, _currentViewPortScroll);
  }

  /**
   * Cache the current view port size in a var
   */
  function setCurrentViewPortSize() {
    _currentViewPortSize = {
      width : window.innerWidth,
      height: window.innerHeight
    };
  }

  /**
   * Cache the current view port scroll in a var
   */
  function setCurrentViewPortScroll() {
    var left = _mainScrollEl.scrollLeft,
        top  = _mainScrollEl.scrollTop;

    left = left ? left : 0;
    top  = top ? top : 0;

    _currentViewPortScroll = {left: left, top: top};
  }

  /**
   * Reposition the UI elements on a UI change, scroll, resize, etc.
   */
  function positionUIElementsOnChange() {
    setCurrentViewPortScroll();
    setCurrentViewPortSize();

    if (_isMobile) {
      startIsScrollingTimer();
      hideElementsOnScrollStart();
    } else {
      positionUIElements();
    }

  }

  /**
   * Position UI elements that are dependant on the view port
   */
  function positionUIElements() {
    _mainHeaderEl.style.top = _currentViewPortScroll.top + 'px';
    _mainFooterEl.style.top = (_currentViewPortSize.height + _currentViewPortScroll.top - _mainFooterEl.clientHeight) + 'px';
  }

  /**
   * Update on filters changed
   */
  function updateUIOnFilterChanges() {
    TweenLite.to(_mainScrollEl, 1, {scrollTop: 0, ease: Quad.easeIn});
  }

  /**
   * Start a timer monitor when scrolling stops
   */
  function startIsScrollingTimer() {
    if (_isScrollingTimerStream) {
      _isScrollingTimerStream.dispose();
    }

    _isScrollingTimerStream = Rx.Observable.timer(500)
      .pluck('interval')
      .take(1)
      .subscribe(showElementsOnScrollEnd);
  }


  /**
   * Hide UI elements
   */
  function hideElementsOnScrollStart() {
    TweenLite.to(_mainHeaderEl, 0, {autoAlpha: 0, ease: Circ.easeOut});
    TweenLite.to(_mainFooterEl, 0, {autoAlpha: 0, ease: Circ.easeOut});
  }

  /**
   * Show UI elements
   */
  function showElementsOnScrollEnd() {
    positionUIElements();

    TweenLite.to(_mainHeaderEl, 0.1, {autoAlpha: 1, ease: Circ.easeOut});
    TweenLite.to(_mainFooterEl, 0.1, {autoAlpha: 1, ease: Circ.easeOut});
  }

  //----------------------------------------------------------------------------
  //  Mobile
  //----------------------------------------------------------------------------

  /**
   * Usually on resize, check to see if we're in mobile
   */
  function checkForMobile() {
    if (_currentViewPortSize.width <= _tabletBreakWidth || _browserInfo.mobile.any()) {
      switchToMobileView();
    } else if (_currentViewPortSize.width > _tabletBreakWidth) {
      switchToDesktopView();
    }
  }

  function switchToMobileView() {
    if (_isMobile) {
      return;
    }

    _isMobile = true;

    _eventDispatcher.publish(APP.AppEvents.VIEW_CHANGE_TO_MOBILE);
  }

  function switchToDesktopView() {
    if (!_isMobile) {
      return;
    }

    _isMobile = false;

    closeDrawer();
    _eventDispatcher.publish(APP.AppEvents.VIEW_CHANGE_TO_DESKTOP);
  }

  function toggleDrawer() {
    if (_isDrawerOpen) {
      closeDrawer();
    } else {
      openDrawer();
    }
  }

  function openDrawer() {
    _isDrawerOpen = true;

    TweenLite.to(_drawerEl, 0.5, {x: 0, ease: Quad.easeOut});
    TweenLite.to(_appEl, 0.5, {x: _drawerWidth, ease: Quad.easeOut});
  }

  function closeDrawer() {
    _isDrawerOpen = false;

    TweenLite.to(_drawerEl, 0.5, {x: _drawerWidth * -1, ease: Quad.easeOut});
    TweenLite.to(_appEl, 0.5, {x: 0, ease: Quad.easeOut});
  }

  //----------------------------------------------------------------------------
  //  Menus
  //----------------------------------------------------------------------------

  function initializeMenus(data) {
    _headerMenuView.initialize('header__navigation', data);
    _drawerMenuView.initialize('drawer__navigation', data, true);
  }

  function updateMenuSelections(data) {
    updateHeaderMenuSelections(data);
    updateDrawerMenuSelections(data);
  }

  function updateHeaderMenuSelections(data) {
    _headerMenuView.setMenuSelections(data);
  }

  function updateDrawerMenuSelections(data) {
    _drawerMenuView.setMenuSelections(data);
  }

  //----------------------------------------------------------------------------
  //  Tar Bar
  //----------------------------------------------------------------------------

  function updateTagBarDisplay(tags) {
    _tagBarView.update(tags);

    // Updating will change the height of the bar, reposition
    positionUIElements();
  }

  //----------------------------------------------------------------------------
  //  Grid Collection view
  //----------------------------------------------------------------------------


  function initializeGridCollectionView(data) {
    _itemGridView.initialize('grid__item-container', data);
  }

  // reserved, no use currently
  //function onGridViewLayoutComplete() {
  //  console.log('gridview layout complete');
  //}

  function updateGridItemVisibility(data) {
    _itemGridView.updateItemVisibility(data);
  }

  /**
   * Set the item grid search header
   * @param message
   */
  function updateSearchHeader(message) {
    _searchHeaderEl.innerHTML = message;
  }

  function clearAllFilters() {
    clearFreeTextFilter();
    _headerMenuView.resetAllSelections();
    _drawerMenuView.resetAllSelections();
    _tagBarView.update([]);
    showAllGridViewItems();
  }

  function clearFreeTextFilter() {
    _mainSearchInputEl.value = '';
  }

  function setFreeTextFilterValue(str) {
    _mainSearchInputEl.value = str;
    _eventDispatcher.publish(APP.AppEvents.SEARCH_INPUT, str);
  }

  function showAllGridViewItems() {
    _itemGridView.showAllItems();
  }

  //----------------------------------------------------------------------------
  //  Modal View
  //----------------------------------------------------------------------------

  function showModalCover(animate) {
    _modalCoverView.show(animate);
  }

  function hideModalCover(animate) {
    _modalCoverView.hide(animate);
  }

  function hideModalContent() {
    _itemDetailView.hide();
    _eventDispatcher.publish(APP.AppEvents.ITEM_SELECT, '');
  }

  //----------------------------------------------------------------------------
  //  Init and messaging
  //----------------------------------------------------------------------------

  /**
   * Display a notification "toast"
   * @param title The title
   * @param message The message
   */
  function showNotification(title, message) {
    title = title || "Notification";
    _toastView.add(title, message);
  }

  function showItemDetailView(item) {
    _itemDetailView.showItem(item);
    showModalCover(true);
  }

  function hideItemDetailView() {
    hideModalCover(true);
    hideModalContent();
  }

  function showBigMessage(title, message) {
    _itemDetailView.showMessage({title: title, description: message});
    showModalCover(true);
  }

  function removeLoadingMessage() {
    var cover   = document.getElementById('initialization__cover'),
        message = document.getElementsByClassName('initialization__message')[0];

    TweenLite.to(cover, 1, {
      alpha: 0, ease: Quad.easeOut, onComplete: function () {
        document.body.removeChild(cover);
      }
    });

    TweenLite.to(message, 2, {
      top: "+=50px", ease: Quad.easeIn, onComplete: function () {
        cover.removeChild(message);
      }
    });
  }

  //----------------------------------------------------------------------------
  //  API
  //----------------------------------------------------------------------------

  return {
    initialize                : initialize,
    render                    : render,
    showNotification          : showNotification,
    removeLoadingMessage      : removeLoadingMessage,
    getMainScrollingView      : getMainScrollingView,
    updateSearchHeader        : updateSearchHeader,
    showBigMessage            : showBigMessage,
    initializeMenus           : initializeMenus,
    initializeGridView        : initializeGridCollectionView,
    showItemDetailView        : showItemDetailView,
    hideItemDetailView        : hideItemDetailView,
    clearAllFilters           : clearAllFilters,
    clearFreeTextFilter       : clearFreeTextFilter,
    setFreeTextFilterValue    : setFreeTextFilterValue,
    showAllGridViewItems      : showAllGridViewItems,
    updateGridItemVisibility  : updateGridItemVisibility,
    updateTagBarDisplay       : updateTagBarDisplay,
    updateMenuSelections      : updateMenuSelections,
    updateHeaderMenuSelections: updateHeaderMenuSelections,
    updateDrawerMenuSelections: updateDrawerMenuSelections,
    updateUIOnFilterChanges   : updateUIOnFilterChanges
  };
}());