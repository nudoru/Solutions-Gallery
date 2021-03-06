/**
 * Created by matt on 12/5/14.
 */

define('APP.AppView.GridCollectionView',
  function(require, module, exports) {

    var _self,
      _mountPoint,
      _appGlobals,
      _containerElID,
      _data,
      _packery,
      _isLayingOut,
      _children = [],
      _numItemsVisible,
      _itemOverStream,
      _itemOutStream,
      _itemSelectStream,
      _highestZ,
      _imagesLoaded,
      _firstTouchPosition = [],
      _lastTouchPosition = [],
      _touchDeltaTolerance = 10,
      _shouldProcessTouchEnd,
      _eventDispatcher = require('nudoru.events.EventDispatcher'),
      _DOMUtils = require('nudoru.utils.DOMUtils'),
      _touchUtils = require('nudoru.utils.TouchUtils'),
      _numberUtils = require('nudoru.utils.NumberUtils'),
      _browserInfo = require('nudoru.utils.BrowserInfo');

    //----------------------------------------------------------------------------
    //  Accessors
    //----------------------------------------------------------------------------

    function getNumItemsVisible() {
      return _numItemsVisible;
    }

    function setNumItemsVisible(number) {
      if (_numItemsVisible === number) {
        return;
      }
      _numItemsVisible = number;
      _eventDispatcher.publish(APP.AppEvents.GRID_VIEW_ITEMS_CHANGED, _numItemsVisible);
    }

    //----------------------------------------------------------------------------
    //  Initialization
    //----------------------------------------------------------------------------

    function initialize(elID, data) {
      _self = this;
      _appGlobals = APP.globals();
      _containerElID = elID;
      _mountPoint = document.getElementById(_containerElID);
      _data = data;

      _isLayingOut = false;

      render();

      if (_browserInfo.mobile.any()) {
        configureMobileStreams();
      } else {
        configureStreams();
      }

      _highestZ = _children.length;

      setNumItemsVisible(_children.length);
    }

    function render() {

      //initImagesLoaded();

      _data.forEach(function (item) {
        var itemobj = requireUnique('APP.AppView.GridCollectionView.GridElementView');
        itemobj.initialize(item);
        _mountPoint.appendChild(itemobj.getElement());

        // gets item props (image alpha) that can only be retrieved after adding to dom
        itemobj.postRender();
        _children.push(itemobj);
      });

      // hack to prevent clicking on menuItems from selecting text on ie since CSS isn't supported
      if (_browserInfo.isIE) {
        _mountPoint.onselectstart = function () {
          return false;
        };
      }

      initPackery();

      // staggering in was causing display issues when going to a saved link on load
      //staggerFrom(getItemsInView(), 0.25, 0.25);
    }

    /**
     * Show a nice effect on load
     * Disable mouse overs during this so that the tween doesn't get "stuck"
     * @param elList
     * @param dur
     * @param interval
     */
    //function staggerFrom(elList, dur, interval) {
    //  var i = 0,
    //    len = elList.length;
    //
    //  elList.forEach(function (item) {
    //    item.setIsAnimating(true);
    //  });
    //
    //  for (; i < len; i++) {
    //    TweenLite.from(elList[i].getElement(), dur, {
    //      rotationY: -90,
    //      transformOrigin: 'left',
    //      alpha: 0,
    //      ease: Quad.easeOut,
    //      delay: (i + 1) * interval,
    //      onComplete: onStaggerInComplete,
    //      onCompleteParams: [elList[i]]
    //    });
    //  }
    //}
    //
    //function onStaggerInComplete(item) {
    //  item.setIsAnimating(false);
    //}

    function killAllAnimations() {
      var els = _children.map(function(item) { return item.getElement();});

      _children.forEach(function(item) { item.setIsAnimating(false);});

      TweenLite.killTweensOf(els);
    }

    /**
     * Images loaded control - not used yet
     * http://imagesloaded.desandro.com/
     */
    //function initImagesLoaded() {
    //  _imagesLoaded = imagesLoaded(_containerElID, function(instance) {
    //    console.log('[ItemGridView] All images loaded');
    //  });
    //
    //  _imagesLoaded.on('fail', function(instance) {
    //    console.log('[ItemGridView] All images loaded, with errors');
    //    _eventDispatcher.publish(APP.AppEvents.GRID_VIEW_IMAGE_LOAD_ERROR);
    //  });
    //}

    /**
     * Init Packery view for the grid
     */
    function initPackery() {
      var packeryGutter = _browserInfo.mobile.any() ? 10 : 33,
        packeryTransDuration = _browserInfo.mobile.any() ? '0.5s' : '0.75s';

      _packery = new Packery('#' + _containerElID, {
        itemSelector: '.item',
        gutter: packeryGutter,
        transitionDuration: packeryTransDuration
      });

      _packery.on('layoutComplete', onPackeryLayoutComplete);
    }

    /**
     * If the view is rearranging, we don't want to handle events from the iteme
     * because it would cause display issues. So ignore them with the isLayingOut
     * toggle until the layout has been completed
     * @param packery
     * @param items
     */
    function onPackeryLayoutComplete(packery, items) {
      _isLayingOut = false;

      _eventDispatcher.publish(APP.AppEvents.GRID_VIEW_LAYOUT_COMPLETE);
    }

    /**
     * Gets an ojbect to pass to packery
     * @param item
     * @returns {*}
     */
    function getPackeryItem(item) {
      return item.getElement();
      //return item.element[0];
    }

    /**
     * Users RxJS streams rather than typical JS events. Allows for better
     * sorting and readability
     */
    function configureStreams() {

      _itemOverStream = Rx.Observable.fromEvent(_mountPoint, 'mouseover')
        .filter(filterForMouseEventsOnItems)
        .map(getMouseEventTargetID)
        .subscribe(function (id) {
          selectItemByID(id);
        });

      _itemOutStream = Rx.Observable.fromEvent(_mountPoint, 'mouseout')
        .filter(filterForMouseEventsOnItems)
        .map(getMouseEventTargetID)
        .subscribe(function (id) {
          deselectItemByID(id);
        });

      _itemSelectStream = Rx.Observable.fromEvent(_mountPoint, 'click')
        .filter(filterForMouseEventsOnItems)
        .map(getMouseEventTargetID)
        .subscribe(function (id) {
          depressItemByID(id);
          _eventDispatcher.publish(APP.AppEvents.ITEM_SELECT, id);
        });

    }

    function filterForMouseEventsOnItems(evt) {
      evt.preventDefault();

      var target = evt.target;

      if (target === null) {
        return false;
      }

      // Need to traverse up the DOM for IE9
      var el = getTargetElMatching(target, '.item__content');
      if (el) {
        return el.tagName.toLowerCase() === 'ul';
      }
      return false;
    }

    function getMouseEventTargetID(evt) {
      var target = getTargetElMatching(evt.target, '.item__content');
      return target.getAttribute('data-value');
    }

    function getTargetElMatching(el, cls) {
      return _DOMUtils.closest(el, cls);
    }

    /**
     * The rationale here
     * 1. on start, register where the finger was on the screen
     * 2. update position on touch move
     * 3. on end, compare that the where the finger was
     * 4. if it's less than the tolerance, show the item
     * 5. if not, then it was probably a drag/scroll and ignore it
     * based on https://github.com/filamentgroup/tappy/blob/master/tappy.js
     */
    function configureMobileStreams() {
      // Note - had problems getting RxJS to work correctly here, used events
      _mountPoint.addEventListener('touchstart', function (evt) {
        _firstTouchPosition = _lastTouchPosition = _touchUtils.getCoords(evt);
        _shouldProcessTouchEnd = false;
      }, false);

      _mountPoint.addEventListener('touchmove', function (evt) {
        _lastTouchPosition = _touchUtils.getCoords(evt);
      }, false);

      _itemSelectStream = Rx.Observable.fromEvent(_mountPoint, 'touchend')
        .filter(processTouchEndEventsOnItems)
        .map(getMouseEventTargetID)
        .subscribe(function (id) {
          if (_shouldProcessTouchEnd) {
            depressItemByID(id);
            _eventDispatcher.publish(APP.AppEvents.ITEM_SELECT, id);
          }
        });

    }

    function processTouchEndEventsOnItems(evt) {
      var deltaX = Math.abs(_lastTouchPosition[0] - _firstTouchPosition[0]),
        deltaY = Math.abs(_lastTouchPosition[1] - _firstTouchPosition[1]);

      if (deltaX <= _touchDeltaTolerance && deltaY <= _touchDeltaTolerance) {
        _shouldProcessTouchEnd = true;
      }

      return filterForMouseEventsOnItems(evt);
    }

    //----------------------------------------------------------------------------
    //  Items
    //----------------------------------------------------------------------------

    function getItemsInView() {
      return _children
        .filter(function (item) {
          return item.isInViewport();
        })
        .filter(function (item) {
          return item.isVisible();
        })
        .map(function (item) {
          return item;
        });
    }

    function getItemByID(id) {
      var i = 0,
        len = _children.length;
      for (; i < len; i++) {
        if (_children[i].getID() === id) {
          return _children[i];
        }
      }

      return null;
    }

    function deselectAllItems() {
      var i = 0,
        len = _children.length;
      for (; i < len; i++) {
        _children[i].deselect();
      }
    }

    function itemsInViewAnimating() {
      var items = getItemsInView(),
        i = 0,
        len = items.length;

      for (; i < len; i++) {
        if (items[i].getIsAnimating()) {
          return true;
        }
      }

      return false;
    }

    function selectItemByID(id) {
      if (_isLayingOut || itemsInViewAnimating()) {
        return;
      }

      var item = getItemByID(id);

      if (item !== null) {
        deselectAllItems();
        elementToTop(item.getElement());
        item.select();
        resetOtherItems(item.getElement());
      }
    }

    function deselectItemByID(id) {
      if (_isLayingOut || itemsInViewAnimating()) {
        return;
      }

      var item = getItemByID(id);

      if (item !== null) {
        item.deselect();
        unfadeOtherItems(item.getElement());
      }
    }

    function depressItemByID(id) {
      if (_isLayingOut || itemsInViewAnimating()) {
        return;
      }

      var item = getItemByID(id);
      if (item !== null) {
        item.depress();
        unfadeOtherItems(item.getElement());
      }
    }

    /**
     * Raises an item to the top of the view stack so it appears above other items
     * @param element
     */
    function elementToTop(element) {
      element.style.zIndex = ++_highestZ;
    }

    //----------------------------------------------------------------------------
    //  Fade items OTHER than the one your mouse is over
    //----------------------------------------------------------------------------

    /**
     * Gets a list of all items in the viewport excluding a certain one.
     * Used to fade other items on mouse over
     * @param excludedel
     * @returns {*}
     */
    function getItemElementsInViewExcluding(excludedel) {
      var items = getItemsInView().map(function (item) {
          return item.getElement();
        }),
        idx = items.indexOf(excludedel);

      if (idx > -1) {
        items.splice(idx, 1);
      }

      return items;
    }

    /**
     * Scales the other items based on the distance from the target item
     * The farther away, the smaller\
     * Possible change - base on middle of elements not top/left
     * @param itemel
     */
    function fadeOtherItems(itemel) {
      if (_isLayingOut) {
        return;
      }

      var otheritems = getItemElementsInViewExcluding(itemel),
        fromPos = _DOMUtils.position(itemel),
        vpW = window.innerWidth;

      TweenLite.killDelayedCallsTo(otheritems);

      otheritems.forEach(function (item) {
        var itemPos = _DOMUtils.position(item),
          dist = _numberUtils.distanceTL(fromPos, itemPos) / 2,
          pct = Math.max(1 - (dist / vpW), 0.35);

        TweenLite.to(item, 2, {
          scale: pct,
          alpha: pct,
          ease: Quad.easeIn,
          delay: 1
        });
      });

    }

    function clearAndGetOtherItems(itemel) {
      if (_isLayingOut) {
        return null;
      }

      var otheritems = getItemElementsInViewExcluding(itemel);
      TweenLite.killDelayedCallsTo(otheritems);
      return otheritems;
    }

    function resetOtherItems(itemel) {
      TweenLite.to(clearAndGetOtherItems(itemel), 0.25, {
        scale: 1,
        alpha: 1,
        ease: Quad.easeOut,
        onComplete: fadeOtherItems,
        onCompleteParams: [itemel]
      });
    }

    function unfadeOtherItems(itemel) {
      TweenLite.to(clearAndGetOtherItems(itemel), 0.25, {
        scale: 1,
        alpha: 1,
        ease: Quad.easeOut
      });
    }

    //----------------------------------------------------------------------------
    //  Updates
    //----------------------------------------------------------------------------

    /**
     * Shows or hides an item based on it's presence in the visibleArray.
     * Items NOT in in the array are hidden. This array is generated in the model
     * based on filtering criteria
     * @param visibleArray
     */
    function updateItemVisibility(visibleArray) {
      var len = visibleArray.length;

      killAllAnimations();

      _children.forEach(function (item) {
        var i = 0,
          found = false;

        for (; i < len; i++) {
          if (item.getID() === visibleArray[i].id) {
            found = true;
            break;
          }
        }

        if (found) {
          showItem(item);
        } else {
          hideItem(item);
        }
      });

      setNumItemsVisible(visibleArray.length);

      _isLayingOut = true;

      _packery.layout();
    }

    function showItem(item) {
      _packery.unignore(getPackeryItem(item));
      item.show();
    }

    function hideItem(item) {
      // Raised to top so that the fade out animation is visible over shown items
      elementToTop(item.getElement());
      _packery.ignore(getPackeryItem(item));
      item.hide();
    }

    function showAllItems() {
      _children.forEach(function (item) {
        showItem(item);
      });

      setNumItemsVisible(_children.length);

      _packery.layout();
    }

    exports.initialize = initialize;
    exports.render = render;
    exports.showAllItems = showAllItems;
    exports.updateItemVisibility = updateItemVisibility;
    exports.getNumItemsVisible = getNumItemsVisible;

  });



