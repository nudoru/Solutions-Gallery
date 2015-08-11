/**
 * Provides a connection to a SP Site 2013 and List
 * Matt Perkins, 7/21/15
 *
 * Dependancies:
 *  - Nudoru.utils.core
 *  - Bluebird.js
 *
 * Reference links
 * https://msdn.microsoft.com/library/jj163201.aspx#BasicOps_SPWebTasks
 * https://msdn.microsoft.com/en-us/library/office/jj163201.aspx#BasicOps_SPJSOMOps
 * https://msdn.microsoft.com/en-us/library/hh185011(v=office.14).aspx
 *
 * Cool script to reference
 * https://gist.github.com/zplume/1395dee6b8b2e38e5927
 *
 * On CRUD with REST
 * http://blog.vgrem.com/2014/03/22/list-items-manipulation-via-rest-api-in-sharepoint-2010/
 * http://www.nothingbutsharepoint.com/2011/12/28/got-rest-querying-sharepoint-list-data-using-rest-services-client-side-part-1-aspx-2/
 *
 * TODO
 * 1. Create accessors for objects
 * 2. Retrive only list items matching a CAML query
 * 3. set list item field and if field doesn't exist, create it
 */

define('nori/service/SharePoint',
  function (require, module, exports) {

    var _debug   = true,
        _context = require('nori/service/SharePoint/ContextFacade'),
        _list    = require('nori/service/SharePoint/ListFacade'),
        _user    = require('nori/service/SharePoint/UserInfoFacade');

    /**
     * Connect to the SP site
     *
     _spSite.connect({}).then(function (value) {
        console.log('connect', value);
      }, handleSPError);
     *
     * @param initObj
     * @param cb
     */
    module.exports.connect = function (initObj) {
      if (_debug) console.log('SharePoint > connect');
      return _context.connect(initObj);
    };

    /**
     * First gets the current user and then queries for more details on the
     * current user
     *
     _spSite.getCurrentUser().then(function (value) {
        console.log('getCurrentUser', value);
        return value.userName; // Pass it to the next then()
      }, handleSPError).then(function (value) {
        _spSite.getUserDetails(value).then(function (value) {
          console.log('getUserDetails', value);
        })
      }, handleSPError);
     *
     * @param cb
     */
    module.exports.getCurrentUser = function () {
      if (_debug) console.log('SharePoint > getcurrentuser');
      return _user.getCurrentUser({});
    };

    /**
     * Get extended details on a user
     * @param userName
     * @returns {*}
     */
    module.exports.getUserDetails = function (userName) {
      if (_debug) console.log('SharePoint > getuserdetails');
      return _user.getUserDetails(userName);
    };

    /**
     * Gets an array of the list's fields
     *
     _spSite.getListFieldNames({
        listTitle: 'TestList'
      }).then(function (value) {
        console.log('getListFieldNames', value);
      }, handleSPError);
     *
     * @param initObj
     * @returns {*}
     */
    module.exports.getListFieldNames = function (initObj) {
      if (_debug) console.log('SharePoint > GetListFieldNames', initObj);
      return _list.getFieldNames(initObj);
    };

    /**
     * Get an array of objects with key(fields) values
     *
     _spSite.getListFields({
        listTitle: 'TestList',
        fields   : ['Title', 'ProjectName', 'ProjectID', 'Resource']
      }).then(function (value) {
        console.log('getListFields', value);
      }, handleSPError);
     *
     * @param initObj
     * @returns {*}
     */
    module.exports.getListFields = function (initObj) {
      if (_debug) console.log('SharePoint > GetListFields', initObj);
      return _list.getFields(initObj);
    };

    /**
     * Update a list item's values for the fields
     *
     _spSite.updateListFields({
        listTitle: 'TestList',
        rowID    : 3,
        fields   : ['Title', 'ProjectName', 'ProjectID'],
        values   : ['zzzNew Title', 'zzzNew ProjectName', 'zzzNew ProjectID']
      }).then(function (value) {
        console.log('updateListFields', value);
      }, handleSPError);
     *
     * @param initObj
     * @returns {*}
     */
    module.exports.updateListFields = function (initObj) {
      if (_debug) console.log('SharePoint > UpdateListFields', initObj);
      return _list.updateFields(initObj);
    };

    /**
     * Add a new row to a list
     *
     _spSite.createListRow({
          listTitle: 'TestList',
          fields   : ['Title', 'ProjectName', 'ProjectID'],
          values   : ['Nother New Title', 'Nother New ProjectName', 'Nother New ProjectID']
        }).then(function (value) {
          console.log('createListRow', value);
      }, handleSPError);
     *
     * @param initObj
     * @returns {*}
     */
    module.exports.createListRow = function (initObj) {
      if (_debug) console.log('SharePoint > CreateListItem', initObj);
      return _list.createRow(initObj);
    };

    /**
     * Delete a row from the list
     *
     _spSite.deleteListRow({
        listTitle: 'TestList',
        rowID    : 5
      }).then(function (value) {
        console.log('deleteListRow', value);
      }, handleSPError);
     *
     * @param initObj
     * @returns {*}
     */
    module.exports.deleteListRow = function (initObj) {
      if (_debug) console.log('SharePoint > DeleteListItem', initObj);
      return _list.deleteRow(initObj);
    };

    /**
     * Add a field to a list. Refer to this page on field types
     * https://msdn.microsoft.com/en-us/library/office/aa979575.aspx
     *
     _spSite.addListField({
        listTitle: 'TestList',
        field    : {'w2015_Week': 'Note'}
      }).then(function success(value) {
        console.log('addListField', value);
      }, handleSPError);
     *
     * @param initObj
     * @returns {*}
     */
    module.exports.addListField = function (initObj) {
      if (_debug) console.log('SharePoint > AddListField', initObj);
      return _list.createField(initObj);
    };


  });


/*******************************************************************************
 * Module to connect to a SharePoint site and get properties
 * 2010 reference https://msdn.microsoft.com/en-us/library/ff408569(v=office.14).aspx
 ******************************************************************************/

define('nori/service/SharePoint/ContextFacade',
  function (require, module, exports) {

    var _spSiteURL,
        _spTargetVersion,
        _spSiteContext,
        _spSiteWeb,
        _spUtils = require('nori/service/SharePoint/Utils');

    function connect(initObj) {
      _spSiteURL       = initObj.site;
      _spTargetVersion = initObj.version;

      if (_spSiteURL) {
        _spSiteContext = new SP.ClientContext(_spSiteURL);
      } else {
        _spSiteContext = new SP.ClientContext.get_current();
      }

      _spSiteWeb = _spSiteContext.get_web();
      _spSiteContext.load(_spSiteWeb);
      return _spUtils.executeQuery(_spSiteContext,
        function parser() {
          // Props https://msdn.microsoft.com/en-us/library/ee549149(v=office.14).aspx
          return {
            title            : _spSiteWeb.get_title(),
            id               : _spSiteWeb.get_id(),
            uiVersion        : _spSiteWeb.get_uiVersion(),
            description      : _spSiteWeb.get_description(),
            created          : _spSiteWeb.get_created(),
            serverRelativeUrl: _spSiteWeb.get_serverRelativeUrl()
          };
        });
    }

    module.exports.connect    = connect;
    module.exports.getContext = function () {
      return _spSiteContext
    };
    module.exports.getWebSite = function () {
      return _spSiteWeb
    };

  });

/*******************************************************************************
 * Module to connect to a SharePoint list view and get items
 *
 * Lots of great documentation on MSDN here
 * https://msdn.microsoft.com/library/jj163201.aspx#BasicOps_SPWebTasks
 ******************************************************************************/

define('nori/service/SharePoint/ListFacade',
  function (require, module, exports) {

    var _spUtils = require('nori/service/SharePoint/Utils');

    /**
     * Gets the site context and the list object by name
     * @param title
     * @returns {{context: *, list: *}}
     */
    function getListContext(title, url) {
      var ctx, list;
      ctx  = url ? SP.ClientContext(url) : SP.ClientContext.get_current();
      list = ctx.get_web().get_lists().getByTitle(title);
      return {context: ctx, list: list};
    }


    /**
     * Creates the include string to fetch the specified fields from the list rows
     * @param fields
     * @returns {string}
     */
    function getFieldsIncludeString(fields) {
      var encodedFields = _spUtils.encodeFieldNames(fields).join(',');
      return 'Include(Id,' + encodedFields + ')';
    }


    /**
     * Gets an array of the list's fields from the All Items view
     * @param initObj
     * @param successCB
     * @param errorCB
     */
    function getFieldNames(initObj) {
      var listProps, view, viewFields;

      listProps  = getListContext(initObj.listTitle, initObj.siteUrl);
      view       = listProps.list.get_views().getByTitle('All Items');
      viewFields = view.get_viewFields();

      listProps.context.load(viewFields);

      return _spUtils.executeQuery(listProps.context,
        function parser() {
          var enumerator = viewFields.getEnumerator(),
              fields     = [];

          while (enumerator.moveNext()) {
            fields.push(enumerator.get_current())
          }
          return fields;
        });
    }

    /**
     * Gets rows and fields from a SharePoint List
     * @param initObj
     * @param successCB
     * @param errorCB
     */
    function getFields(initObj) {
      var listProps, rowsCollection;

      listProps      = getListContext(initObj.listTitle, initObj.siteUrl);
      rowsCollection = listProps.list.getItems(SP.CamlQuery.createAllItemsQuery());

      listProps.context.load(rowsCollection, getFieldsIncludeString(initObj.fields));

      return _spUtils.executeQuery(listProps.context,
        function parser() {
          var fields, currentRow, enumerator, rowsArray;

          enumerator = rowsCollection.getEnumerator();
          rowsArray  = [];

          while (enumerator.moveNext()) {
            currentRow = enumerator.get_current();

            // Only capture the specific rowID or all rows
            if (!initObj.rowID || initObj.rowID === currentRow.get_id()) {
              fields         = Object.create(null);
              fields['SPID'] = currentRow.get_id(); // grab the internal row ID

              _spUtils.encodeFieldNames(initObj.fields).forEach(function (col, idx) {
                fields[initObj.fields[idx]] = currentRow.get_item(col);
              });

              rowsArray.push(fields);
            }
          }

          return rowsArray;
        });
    }

    /**
     * Update a row's fields
     * @param initObj
     * @param successCB
     * @param errorCB
     */
    function updateFields(initObj) {
      var listProps, rowItem;

      listProps = getListContext(initObj.listTitle, initObj.siteUrl);
      rowItem   = listProps.list.getItemById(initObj.rowID);

      _spUtils.encodeFieldNames(initObj.fields).forEach(function (field, i) {
        rowItem.set_item(field, initObj.values[i]);
      });

      rowItem.update();

      return _spUtils.executeQuery(listProps.context,
        function parser() {
          return true;
        });
    }

    /**
     * Creates a new list row
     * @param initObj
     * @param successCB
     * @param errorCB
     */
    function createRow(initObj) {
      var listProps, rowItem;

      listProps = getListContext(initObj.listTitle, initObj.siteUrl);
      rowItem   = listProps.list.addItem(new SP.ListItemCreationInformation());

      _spUtils.encodeFieldNames(initObj.fields).forEach(function (field, i) {
        rowItem.set_item(field, initObj.values[i]);
      });

      rowItem.update();
      listProps.context.load(rowItem);

      return _spUtils.executeQuery(listProps.context,
        function parser() {
          return rowItem.get_id();
        });

    }

    /**
     * Deletes a list row
     * @param initObj
     * @param successCB
     * @param errorCB
     */
    function deleteRow(initObj) {
      var listProps, rowItem;

      listProps = getListContext(initObj.listTitle, initObj.siteUrl);
      rowItem   = listProps.list.getItemById(initObj.rowID);
      rowItem.deleteObject();

      return _spUtils.executeQuery(listProps.context,
        function parser() {
          return true;
        });

    }

    /**
     * Adds a new field to the SP list
     * Field properties reference: https://msdn.microsoft.com/en-us/library/office/aa979575.aspx
     * XML Referenece: https://karinebosch.wordpress.com/my-articles/creating-fields-using-csom/
     * @param initObj
     * @param successCB
     * @param errorCB
     */
    function createField(initObj) {
      var listProps, field, fieldName, fieldType;

      fieldName = Object.keys(initObj.field)[0];
      fieldType = initObj.field[fieldName];

      // If the field start with a number, SP will encode the char resulting in an unexpected internal field name
      if (!_spUtils.isLetter(fieldName.charAt(0))) {
        throw new Error('Field name, ' + fieldName + ', must begin with a letter or encoding will occur.');
      }

      listProps = getListContext(initObj.listTitle, initObj.siteUrl);
      field     = listProps.list.get_fields().addFieldAsXml(
        '<Field Name="' + fieldName + '" DisplayName="' + fieldName + '" Type="' + fieldType + '" />',
        true,
        SP.AddFieldOptions.defaultValue
      );

      listProps.context.load(field);

      return _spUtils.executeQuery(listProps.context,
        function parser() {
          return field.get_internalName();
        });
    }

    module.exports.getFieldNames = getFieldNames;
    module.exports.getFields     = getFields;
    module.exports.updateFields  = updateFields;
    module.exports.createField   = createField;
    module.exports.createRow     = createRow;
    module.exports.deleteRow     = deleteRow;

  });

/*******************************************************************************
 * Module to get user information
 * http://sharepoint.stackexchange.com/questions/31457/get-user-via-javascript-client-object-model
 ******************************************************************************/

define('nori/service/SharePoint/UserInfoFacade',
  function (require, module, exports) {

    var _spSiteContext,
        _spSiteWeb,
        _spUtils = require('nori/service/SharePoint/Utils');

    function getCurrentUser(initObj) {
      _spSiteContext = initObj.context || new SP.ClientContext.get_current();
      _spSiteWeb     = _spSiteContext.get_web();

      var currentUser = _spSiteWeb.get_currentUser();
      currentUser.retrieve();

      _spSiteContext.load(_spSiteWeb);

      return _spUtils.executeQuery(_spSiteContext,
        function parser() {
          var userObject = _spSiteWeb.get_currentUser();
          return {
            userID  : userObject.get_id(),
            userName: userObject.get_title(),
            login   : userObject.get_loginName(),
            email   : userObject.get_email()
          };
        });
    }

    function getUserDetails(userName) {
      _spSiteContext = _spSiteContext || new SP.ClientContext.get_current();
      _spSiteWeb     = _spSiteContext.get_web();

      var userInfoList = _spSiteWeb.get_siteUserInfoList(),
          camlQuery    = new SP.CamlQuery();

      camlQuery.set_viewXml("<View><Query><Where><Eq><FieldRef Name=\'Title\'/><Value Type=\'Text\'>" + userName + "</Value></Eq></Where></Query><RowLimit>1</RowLimit></View>");

      var colListItem = userInfoList.getItems(camlQuery);
      _spSiteContext.load(colListItem);

      return _spUtils.executeQuery(_spSiteContext,
        function parser() {
          var userObject = colListItem.itemAt(0);
          return {
            name       : userObject.get_fieldValues().Name,
            userName   : userObject.get_fieldValues().UserName,
            email      : userObject.get_fieldValues().Email,
            firstName  : userObject.get_fieldValues().FirstName,
            jobTitle   : userObject.get_fieldValues().JobTitle,
            mobilePhone: userObject.get_fieldValues().MobilePhone,
            workPhone  : userObject.get_fieldValues().WorkPhone,
            notes      : userObject.get_fieldValues().Notes,
            picture    : userObject.get_fieldValues().Picture,
            sipAddress : userObject.get_fieldValues().SipAddress,
            title      : userObject.get_fieldValues().Title,
            department : userObject.get_fieldValues().Department,
            webSite    : userObject.get_fieldValues().WebSite,
            timeZone   : userObject.get_fieldValues().TimeZone
          };
        });
    }

    module.exports.getCurrentUser = getCurrentUser;
    module.exports.getUserDetails = getUserDetails;

  });

/*******************************************************************************
 * Helpful utils for SP
 ******************************************************************************/

define('nori/service/SharePoint/Utils',
  function (require, module, exports) {

    var SP2010 = 'sp2010',
        SP2013 = 'sp2013';

    /**
     * Utility to encode a string to a valid SP field name
     * Encode/decode form - http://www.n8d.at/blog/encode-and-decode-field-names-from-display-name-to-internal-name/
     * @param toEncode
     * @returns {string}
     */
    function encodeToSPFieldName(version, toEncode) {

      // Default to 2013 encodings
      version = version || SP2013;

      var charToEncode  = toEncode.split(''),
          encodedString = '',
          maxLen        = (version === SP2010 ? 32 : 255),
          i             = 0,
          len           = charToEncode.length;

      for (; i < len; i++) {
        encodedChar = encodeURIComponent(charToEncode[i]);
        if (encodedChar.length == 3) {
          encodedString += encodedChar.replace("%", "_x00") + "_";
        }
        else if (encodedChar.length == 5) {
          encodedString += encodedChar.replace("%u", "_x") + "_";
        }
        else {
          encodedString += encodedChar;
        }
      }

      return encodedString.substr(0, maxLen);
    }

    /**
     * Utility to decode a SP field name
     * @param toDecode
     * @returns {string}
     */
    function decodeSPFieldName(toDecode) {
      var decodedString = toDecode.replace("_x", "%u").replace("_", "");
      return decodeURIComponent(decodedString);
    }

    /**
     * Encodes the field names to proper SP syntax. Defaults to 2013
     * @param fields
     * @returns {Array|*}
     */
    function encodeFieldNames(fields) {
      return fields.map(function encodeFields(field) {
        // version defaults to Sp 2013
        return encodeToSPFieldName('', field);
      });
    }

    /**
     * True if character is a letter
     * @param str
     * @returns {boolean|Array|{index: number, input: string}|*}
     */
    function isLetter(str) {
      return str.length === 1 && str.match(/[a-z]/i);
    }

    /**
     * Create a promise object for the operation
     * @param context SharePoint context object
     * @param parser Processes the result of the query and returns the results
     */
    function executeQuery(context, parser) {
      return new Promise(function (resolve, reject) {
        context.executeQueryAsync(
          function success(sender, args) {
            resolve(parser());
          },
          function error(sender, args) {
            reject('context.executeQueryAsync Error ' + args.get_message() + ', ' + args.get_stackTrace());
          });
      });
    }

    module.exports.encodeToSPFieldName = encodeToSPFieldName;
    module.exports.decodeSPFieldName   = decodeSPFieldName;
    module.exports.encodeFieldNames    = encodeFieldNames;

    module.exports.isLetter     = isLetter;
    module.exports.executeQuery = executeQuery;

    module.exports.version = {
      SP2010: function () {
        return SP2010;
      },
      SP2013: function () {
        return SP2013;
      }
    };

  });