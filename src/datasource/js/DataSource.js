(function () {

var lang   = YAHOO.lang,
    util   = YAHOO.util,
    Ev     = util.Event;

/**
 * The DataSource utility provides a common configurable interface for widgets to
 * access a variety of data, from JavaScript arrays to online database servers.
 *
 * @module datasource
 * @requires yahoo, event
 * @optional json, get, connection 
 * @title DataSource Utility
 */

/****************************************************************************/
/****************************************************************************/
/****************************************************************************/

/**
 * Base class for the YUI DataSource utility.
 *
 * @namespace YAHOO.util
 * @class YAHOO.util.DataSourceBase
 * @constructor
 * @param oLiveData {HTMLElement}  Pointer to live data.
 * @param oConfigs {object} (optional) Object literal of configuration values.
 */
util.DataSourceBase = function(oLiveData, oConfigs) {
    if(oLiveData === null || oLiveData === undefined) {
        YAHOO.log("Could not instantiate DataSource due to invalid live database",
                "error", this.toString());
        return;
    }
    
    this.liveData = oLiveData;
    this._oQueue = {interval:null, conn:null, requests:[]};
    this.responseSchema = {};   

    // Set any config params passed in to override defaults
    if(oConfigs && (oConfigs.constructor == Object)) {
        for(var sConfig in oConfigs) {
            if(sConfig) {
                this[sConfig] = oConfigs[sConfig];
            }
        }
    }
    
    // Validate and initialize public configs
    var maxCacheEntries = this.maxCacheEntries;
    if(!lang.isNumber(maxCacheEntries) || (maxCacheEntries < 0)) {
        maxCacheEntries = 0;
    }

    // Initialize interval tracker
    this._aIntervals = [];

    /////////////////////////////////////////////////////////////////////////////
    //
    // Custom Events
    //
    /////////////////////////////////////////////////////////////////////////////

    /**
     * Fired when a request is made to the local cache.
     *
     * @event cacheRequestEvent
     * @param oArgs.request {Object} The request object.
     * @param oArgs.callback {Object} The callback object.
     * @param oArgs.caller {Object} (deprecated) Use callback.scope.
     */
    this.createEvent("cacheRequestEvent");

    /**
     * Fired when data is retrieved from the local cache.
     *
     * @event cacheResponseEvent
     * @param oArgs.request {Object} The request object.
     * @param oArgs.response {Object} The response object.
     * @param oArgs.callback {Object} The callback object.
     * @param oArgs.caller {Object} (deprecated) Use callback.scope.
     */
    this.createEvent("cacheResponseEvent");

    /**
     * Fired when a request is sent to the live data source.
     *
     * @event requestEvent
     * @param oArgs.request {Object} The request object.
     * @param oArgs.callback {Object} The callback object.
     * @param oArgs.tId {Number} Transaction ID.     
     * @param oArgs.caller {Object} (deprecated) Use callback.scope.
     */
    this.createEvent("requestEvent");

    /**
     * Fired when live data source sends response.
     *
     * @event responseEvent
     * @param oArgs.request {Object} The request object.
     * @param oArgs.response {Object} The raw response object.
     * @param oArgs.callback {Object} The callback object.
     * @param oArgs.tId {Number} Transaction ID.     
     * @param oArgs.caller {Object} (deprecated) Use callback.scope.
     */
    this.createEvent("responseEvent");

    /**
     * Fired when response is parsed.
     *
     * @event responseParseEvent
     * @param oArgs.request {Object} The request object.
     * @param oArgs.response {Object} The parsed response object.
     * @param oArgs.callback {Object} The callback object.
     * @param oArgs.caller {Object} (deprecated) Use callback.scope.
     */
    this.createEvent("responseParseEvent");

    /**
     * Fired when response is cached.
     *
     * @event responseCacheEvent
     * @param oArgs.request {Object} The request object.
     * @param oArgs.response {Object} The parsed response object.
     * @param oArgs.callback {Object} The callback object.
     * @param oArgs.caller {Object} (deprecated) Use callback.scope.
     */
    this.createEvent("responseCacheEvent");
    /**
     * Fired when an error is encountered with the live data source.
     *
     * @event dataErrorEvent
     * @param oArgs.request {Object} The request object.
     * @param oArgs.callback {Object} The callback object.
     * @param oArgs.caller {Object} (deprecated) Use callback.scope.
     * @param oArgs.message {String} The error message.
     */
    this.createEvent("dataErrorEvent");

    /**
     * Fired when the local cache is flushed.
     *
     * @event cacheFlushEvent
     */
    this.createEvent("cacheFlushEvent");

    var DS = util.DataSourceBase;
    this._sName = "DataSource instance" + DS._nIndex;
    DS._nIndex++;
    YAHOO.log("DataSource initialized", "info", this.toString());
};

var DS = util.DataSourceBase;

lang.augmentObject(DS, {

/////////////////////////////////////////////////////////////////////////////
//
// DataSourceBase public constants
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Type is unknown.
 *
 * @property TYPE_UNKNOWN
 * @type Number
 * @final
 * @default -1
 */
TYPE_UNKNOWN : -1,

/**
 * Type is a JavaScript Array.
 *
 * @property TYPE_JSARRAY
 * @type Number
 * @final
 * @default 0
 */
TYPE_JSARRAY : 0,

/**
 * Type is a JavaScript Function.
 *
 * @property TYPE_JSFUNCTION
 * @type Number
 * @final
 * @default 1
 */
TYPE_JSFUNCTION : 1,

/**
 * Type is hosted on a server via an XHR connection.
 *
 * @property TYPE_XHR
 * @type Number
 * @final
 * @default 2
 */
TYPE_XHR : 2,

/**
 * Type is JSON.
 *
 * @property TYPE_JSON
 * @type Number
 * @final
 * @default 3
 */
TYPE_JSON : 3,

/**
 * Type is XML.
 *
 * @property TYPE_XML
 * @type Number
 * @final
 * @default 4
 */
TYPE_XML : 4,

/**
 * Type is plain text.
 *
 * @property TYPE_TEXT
 * @type Number
 * @final
 * @default 5
 */
TYPE_TEXT : 5,

/**
 * Type is an HTML TABLE element. Data is parsed out of TR elements from all TBODY elements.
 *
 * @property TYPE_HTMLTABLE
 * @type Number
 * @final
 * @default 6
 */
TYPE_HTMLTABLE : 6,

/**
 * Type is hosted on a server via a dynamic script node.
 *
 * @property TYPE_SCRIPTNODE
 * @type Number
 * @final
 * @default 7
 */
TYPE_SCRIPTNODE : 7,

/**
 * Type is local.
 *
 * @property TYPE_LOCAL
 * @type Number
 * @final
 * @default 8
 */
TYPE_LOCAL : 8,

/**
 * Error message for invalid dataresponses.
 *
 * @property ERROR_DATAINVALID
 * @type String
 * @final
 * @default "Invalid data"
 */
ERROR_DATAINVALID : "Invalid data",

/**
 * Error message for null data responses.
 *
 * @property ERROR_DATANULL
 * @type String
 * @final
 * @default "Null data"
 */
ERROR_DATANULL : "Null data",

/////////////////////////////////////////////////////////////////////////////
//
// DataSourceBase private static properties
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Internal class variable to index multiple DataSource instances.
 *
 * @property DataSourceBase._nIndex
 * @type Number
 * @private
 * @static
 */
_nIndex : 0,

/**
 * Internal class variable to assign unique transaction IDs.
 *
 * @property DataSourceBase._nTransactionId
 * @type Number
 * @private
 * @static
 */
_nTransactionId : 0,

/////////////////////////////////////////////////////////////////////////////
//
// DataSourceBase public static methods
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Executes a configured callback.  For object literal callbacks, the third
 * param determines whether to execute the success handler or failure handler.
 *  
 * @method issueCallback
 * @param callback {Function|Object} the callback to execute
 * @param params {Array} params to be passed to the callback method
 * @param error {Boolean} whether an error occurred
 * @param scope {Object} the scope from which to execute the callback
 * (deprecated - use an object literal callback)
 * @static     
 */
issueCallback : function (callback,params,error,scope) {
    if (lang.isFunction(callback)) {
        callback.apply(scope, params);
    } else if (lang.isObject(callback)) {
        scope = callback.scope || scope || window;
        var callbackFunc = callback.success;
        if (error) {
            callbackFunc = callback.failure;
        }
        if (callbackFunc) {
            callbackFunc.apply(scope, params.concat([callback.argument]));
        }
    }
},

/**
 * Converts data to type String.
 *
 * @method DataSourceBase.parseString
 * @param oData {String | Number | Boolean | Date | Array | Object} Data to parse.
 * The special values null and undefined will return null.
 * @return {String} A string, or null.
 * @static
 */
parseString : function(oData) {
    // Special case null and undefined
    if(!lang.isValue(oData)) {
        return null;
    }
    
    //Convert to string
    var string = oData + "";

    // Validate
    if(lang.isString(string)) {
        return string;
    }
    else {
        YAHOO.log("Could not convert data " + lang.dump(oData) + " to type String", "warn", this.toString());
        return null;
    }
},

/**
 * Converts data to type Number.
 *
 * @method DataSourceBase.parseNumber
 * @param oData {String | Number | Boolean} Data to convert. Note, the following
 * values return as null: null, undefined, NaN, "". 
 * @return {Number} A number, or null.
 * @static
 */
parseNumber : function(oData) {
    if(!lang.isValue(oData) || (oData === "")) {
        return null;
    }

    //Convert to number
    var number = oData * 1;
    
    // Validate
    if(lang.isNumber(number)) {
        return number;
    }
    else {
        YAHOO.log("Could not convert data " + lang.dump(oData) + " to type Number", "warn", this.toString());
        return null;
    }
},
// Backward compatibility
convertNumber : function(oData) {
    YAHOO.log("The method YAHOO.util.DataSourceBase.convertNumber() has been" +
    " deprecated in favor of YAHOO.util.DataSourceBase.parseNumber()", "warn",
    this.toString());
    return DS.parseNumber(oData);
},

/**
 * Converts data to type Date.
 *
 * @method DataSourceBase.parseDate
 * @param oData {Date | String | Number} Data to convert.
 * @return {Date} A Date instance.
 * @static
 */
parseDate : function(oData) {
    var date = null;
    
    //Convert to date
    if(!(oData instanceof Date)) {
        date = new Date(oData);
    }
    else {
        return oData;
    }
    
    // Validate
    if(date instanceof Date) {
        return date;
    }
    else {
        YAHOO.log("Could not convert data " + lang.dump(oData) + " to type Date", "warn", this.toString());
        return null;
    }
},
// Backward compatibility
convertDate : function(oData) {
    YAHOO.log("The method YAHOO.util.DataSourceBase.convertDate() has been" +
    " deprecated in favor of YAHOO.util.DataSourceBase.parseDate()", "warn",
    this.toString());
    return DS.parseDate(oData);
}

});

// Done in separate step so referenced functions are defined.
/**
 * Data parsing functions.
 * @property DataSource.Parser
 * @type Object
 * @static
 */
DS.Parser = {
    string   : DS.parseString,
    number   : DS.parseNumber,
    date     : DS.parseDate
};

// Prototype properties and methods
DS.prototype = {

/////////////////////////////////////////////////////////////////////////////
//
// DataSourceBase private properties
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Name of DataSource instance.
 *
 * @property _sName
 * @type String
 * @private
 */
_sName : null,

/**
 * Local cache of data result object literals indexed chronologically.
 *
 * @property _aCache
 * @type Object[]
 * @private
 */
_aCache : null,

/**
 * Local queue of request connections, enabled if queue needs to be managed.
 *
 * @property _oQueue
 * @type Object
 * @private
 */
_oQueue : null,

/**
 * Array of polling interval IDs that have been enabled, needed to clear all intervals.
 *
 * @property _aIntervals
 * @type Array
 * @private
 */
_aIntervals : null,

/////////////////////////////////////////////////////////////////////////////
//
// DataSourceBase public properties
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Max size of the local cache.  Set to 0 to turn off caching.  Caching is
 * useful to reduce the number of server connections.  Recommended only for data
 * sources that return comprehensive results for queries or when stale data is
 * not an issue.
 *
 * @property maxCacheEntries
 * @type Number
 * @default 0
 */
maxCacheEntries : 0,

 /**
 * Pointer to live database.
 *
 * @property liveData
 * @type Object
 */
liveData : null,

/**
 * Where the live data is held:
 * 
 * <dl>  
 *    <dt>TYPE_UNKNOWN</dt>
 *    <dt>TYPE_LOCAL</dt>
 *    <dt>TYPE_XHR</dt>
 *    <dt>TYPE_SCRIPTNODE</dt>
 *    <dt>TYPE_JSFUNCTION</dt>
 * </dl> 
 *  
 * @property dataType
 * @type Number
 * @default YAHOO.util.DataSourceBase.TYPE_UNKNOWN
 *
 */
dataType : DS.TYPE_UNKNOWN,

/**
 * Format of response:
 *  
 * <dl>  
 *    <dt>TYPE_UNKNOWN</dt>
 *    <dt>TYPE_JSARRAY</dt>
 *    <dt>TYPE_JSON</dt>
 *    <dt>TYPE_XML</dt>
 *    <dt>TYPE_TEXT</dt>
 *    <dt>TYPE_HTMLTABLE</dt> 
 * </dl> 
 *
 * @property responseType
 * @type Number
 * @default YAHOO.util.DataSourceBase.TYPE_UNKNOWN
 */
responseType : DS.TYPE_UNKNOWN,

/**
 * Response schema object literal takes a combination of the following properties:
 *
 * <dl>
 * <dt>resultsList</dt> <dd>Pointer to array of tabular data</dd>
 * <dt>resultNode</dt> <dd>Pointer to node name of row data (XML data only)</dd>
 * <dt>recordDelim</dt> <dd>Record delimiter (text data only)</dd>
 * <dt>fieldDelim</dt> <dd>Field delimiter (text data only)</dd>
 * <dt>fields</dt> <dd>Array of field names (aka keys), or array of object literals
 * such as: {key:"fieldname",parser:YAHOO.util.DataSourceBase.parseDate}</dd>
 * <dt>metaFields</dt> <dd>Object literal of keys to include in the oParsedResponse.meta collection</dd>
 * <dt>metaNode</dt> <dd>Name of the node under which to search for meta information in XML response data</dd>
 * </dl>
 *
 * @property responseSchema
 * @type Object
 */
responseSchema : null,

/**
 * Additional arguments passed to the JSON parse routine.  The JSON string
 * is the assumed first argument (where applicable).  This property is not
 * set by default, but the parse methods will use it if present.
 *
 * @property parseJSONArgs
 * @type {MIXED|Array} If an Array, contents are used as individual arguments.
 *                     Otherwise, value is used as an additional argument.
 */
// property intentionally undefined
 
/////////////////////////////////////////////////////////////////////////////
//
// DataSourceBase public methods
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Public accessor to the unique name of the DataSource instance.
 *
 * @method toString
 * @return {String} Unique name of the DataSource instance.
 */
toString : function() {
    return this._sName;
},

/**
 * Overridable method passes request to cache and returns cached response if any,
 * refreshing the hit in the cache as the newest item. Returns null if there is
 * no cache hit.
 *
 * @method getCachedResponse
 * @param oRequest {Object} Request object.
 * @param oCallback {Object} Callback object.
 * @param oCaller {Object} (deprecated) Use callback object.
 * @return {Object} Cached response object or null.
 */
getCachedResponse : function(oRequest, oCallback, oCaller) {
    var aCache = this._aCache;

    // If cache is enabled...
    if(this.maxCacheEntries > 0) {        
        // Initialize local cache
        if(!aCache) {
            this._aCache = [];
            YAHOO.log("Cache initialized", "info", this.toString());
        }
        // Look in local cache
        else {
            var nCacheLength = aCache.length;
            if(nCacheLength > 0) {
                var oResponse = null;
                this.fireEvent("cacheRequestEvent", {request:oRequest,callback:oCallback,caller:oCaller});
        
                // Loop through each cached element
                for(var i = nCacheLength-1; i >= 0; i--) {
                    var oCacheElem = aCache[i];
        
                    // Defer cache hit logic to a public overridable method
                    if(this.isCacheHit(oRequest,oCacheElem.request)) {
                        // The cache returned a hit!
                        // Grab the cached response
                        oResponse = oCacheElem.response;
                        this.fireEvent("cacheResponseEvent", {request:oRequest,response:oResponse,callback:oCallback,caller:oCaller});
                        
                        // Refresh the position of the cache hit
                        if(i < nCacheLength-1) {
                            // Remove element from its original location
                            aCache.splice(i,1);
                            // Add as newest
                            this.addToCache(oRequest, oResponse);
                            YAHOO.log("Refreshed cache position of the response for \"" +  oRequest + "\"", "info", this.toString());
                        }
                        
                        // Add a cache flag
                        oResponse.cached = true;
                        break;
                    }
                }
                YAHOO.log("The cached response for \"" + lang.dump(oRequest) +
                        "\" is " + lang.dump(oResponse), "info", this.toString());
                return oResponse;
            }
        }
    }
    else if(aCache) {
        this._aCache = null;
        YAHOO.log("Cache destroyed", "info", this.toString());
    }
    return null;
},

/**
 * Default overridable method matches given request to given cached request.
 * Returns true if is a hit, returns false otherwise.  Implementers should
 * override this method to customize the cache-matching algorithm.
 *
 * @method isCacheHit
 * @param oRequest {Object} Request object.
 * @param oCachedRequest {Object} Cached request object.
 * @return {Boolean} True if given request matches cached request, false otherwise.
 */
isCacheHit : function(oRequest, oCachedRequest) {
    return (oRequest === oCachedRequest);
},

/**
 * Adds a new item to the cache. If cache is full, evicts the stalest item
 * before adding the new item.
 *
 * @method addToCache
 * @param oRequest {Object} Request object.
 * @param oResponse {Object} Response object to cache.
 */
addToCache : function(oRequest, oResponse) {
    var aCache = this._aCache;
    if(!aCache) {
        return;
    }

    // If the cache is full, make room by removing stalest element (index=0)
    while(aCache.length >= this.maxCacheEntries) {
        aCache.shift();
    }

    // Add to cache in the newest position, at the end of the array
    var oCacheElem = {request:oRequest,response:oResponse};
    aCache[aCache.length] = oCacheElem;
    this.fireEvent("responseCacheEvent", {request:oRequest,response:oResponse});
    YAHOO.log("Cached the response for \"" +  oRequest + "\"", "info", this.toString());
},

/**
 * Flushes cache.
 *
 * @method flushCache
 */
flushCache : function() {
    if(this._aCache) {
        this._aCache = [];
        this.fireEvent("cacheFlushEvent");
        YAHOO.log("Flushed the cache", "info", this.toString());
    }
},

/**
 * Sets up a polling mechanism to send requests at set intervals and forward
 * responses to given callback.
 *
 * @method setInterval
 * @param nMsec {Number} Length of interval in milliseconds.
 * @param oRequest {Object} Request object.
 * @param oCallback {Function} Handler function to receive the response.
 * @param oCaller {Object} (deprecated) Use oCallback.scope.
 * @return {Number} Interval ID.
 */
setInterval : function(nMsec, oRequest, oCallback, oCaller) {
    if(lang.isNumber(nMsec) && (nMsec >= 0)) {
        YAHOO.log("Enabling polling to live data for \"" + oRequest + "\" at interval " + nMsec, "info", this.toString());
        var oSelf = this;
        var nId = setInterval(function() {
            oSelf.makeConnection(oRequest, oCallback, oCaller);
        }, nMsec);
        this._aIntervals.push(nId);
        return nId;
    }
    else {
        YAHOO.log("Could not enable polling to live data for \"" + oRequest + "\" at interval " + nMsec, "info", this.toString());
    }
},

/**
 * Disables polling mechanism associated with the given interval ID.
 *
 * @method clearInterval
 * @param nId {Number} Interval ID.
 */
clearInterval : function(nId) {
    // Remove from tracker if there
    var tracker = this._aIntervals || [];
    for(var i=tracker.length-1; i>-1; i--) {
        if(tracker[i] === nId) {
            tracker.splice(i,1);
            clearInterval(nId);
        }
    }
},

/**
 * Disables all known polling intervals.
 *
 * @method clearAllIntervals
 */
clearAllIntervals : function() {
    var tracker = this._aIntervals || [];
    for(var i=tracker.length-1; i>-1; i--) {
        clearInterval(tracker[i]);
    }
    tracker = [];
},

/**
 * First looks for cached response, then sends request to live data. The
 * following arguments are passed to the callback function:
 *     <dl>
 *     <dt><code>oRequest</code></dt>
 *     <dd>The same value that was passed in as the first argument to sendRequest.</dd>
 *     <dt><code>oParsedResponse</code></dt>
 *     <dd>An object literal containing the following properties:
 *         <dl>
 *         <dt><code>tId</code></dt>
 *         <dd>Unique transaction ID number.</dd>
 *         <dt><code>results</code></dt>
 *         <dd>Schema-parsed data results.</dd>
 *         <dt><code>error</code></dt>
 *         <dd>True in cases of data error.</dd>
 *         <dt><code>cached</code></dt>
 *         <dd>True when response is returned from DataSource cache.</dd> 
 *         <dt><code>meta</code></dt>
 *         <dd>Schema-parsed meta data.</dd>
 *         </dl>
 *     <dt><code>oPayload</code></dt>
 *     <dd>The same value as was passed in as <code>argument</code> in the oCallback object literal.</dd>
 *     </dl> 
 *
 * @method sendRequest
 * @param oRequest {Object} Request object.
 * @param oCallback {Object} An object literal with the following properties:
 *     <dl>
 *     <dt><code>success</code></dt>
 *     <dd>The function to call when the data is ready.</dd>
 *     <dt><code>failure</code></dt>
 *     <dd>The function to call upon a response failure condition.</dd>
 *     <dt><code>scope</code></dt>
 *     <dd>The object to serve as the scope for the success and failure handlers.</dd>
 *     <dt><code>argument</code></dt>
 *     <dd>Arbitrary data that will be passed back to the success and failure handlers.</dd>
 *     </dl> 
 * @param oCaller {Object} (deprecated) Use oCallback.scope.
 * @return {Number} Transaction ID, or null if response found in cache.
 */
sendRequest : function(oRequest, oCallback, oCaller) {
    // First look in cache
    var oCachedResponse = this.getCachedResponse(oRequest, oCallback, oCaller);
    if(oCachedResponse) {
        DS.issueCallback(oCallback,[oRequest,oCachedResponse],false,oCaller);
        return null;
    }


    // Not in cache, so forward request to live data
    YAHOO.log("Making connection to live data for \"" + oRequest + "\"", "info", this.toString());
    return this.makeConnection(oRequest, oCallback, oCaller);
},

/**
 * Overridable default method generates a unique transaction ID and passes 
 * the live data reference directly to the  handleResponse function. This
 * method should be implemented by subclasses to achieve more complex behavior
 * or to access remote data.          
 *
 * @method makeConnection
 * @param oRequest {Object} Request object.
 * @param oCallback {Object} Callback object literal.
 * @param oCaller {Object} (deprecated) Use oCallback.scope.
 * @return {Number} Transaction ID.
 */
makeConnection : function(oRequest, oCallback, oCaller) {
    var tId = DS._nTransactionId++;
    this.fireEvent("requestEvent", {tId:tId, request:oRequest,callback:oCallback,caller:oCaller});

    /* accounts for the following cases:
    YAHOO.util.DataSourceBase.TYPE_UNKNOWN
    YAHOO.util.DataSourceBase.TYPE_JSARRAY
    YAHOO.util.DataSourceBase.TYPE_JSON
    YAHOO.util.DataSourceBase.TYPE_HTMLTABLE
    YAHOO.util.DataSourceBase.TYPE_XML
    YAHOO.util.DataSourceBase.TYPE_TEXT
    */
    var oRawResponse = this.liveData;
    
    this.handleResponse(oRequest, oRawResponse, oCallback, oCaller, tId);
    return tId;
},

/**
 * Receives raw data response and type converts to XML, JSON, etc as necessary.
 * Forwards oFullResponse to appropriate parsing function to get turned into
 * oParsedResponse. Calls doBeforeCallback() and adds oParsedResponse to 
 * the cache when appropriate before calling issueCallback().
 * 
 * The oParsedResponse object literal has the following properties:
 * <dl>
 *     <dd><dt>tId {Number}</dt> Unique transaction ID</dd>
 *     <dd><dt>results {Array}</dt> Array of parsed data results</dd>
 *     <dd><dt>meta {Object}</dt> Object literal of meta values</dd> 
 *     <dd><dt>error {Boolean}</dt> (optional) True if there was an error</dd>
 *     <dd><dt>cached {Boolean}</dt> (optional) True if response was cached</dd>
 * </dl>
 *
 * @method handleResponse
 * @param oRequest {Object} Request object
 * @param oRawResponse {Object} The raw response from the live database.
 * @param oCallback {Object} Callback object literal.
 * @param oCaller {Object} (deprecated) Use oCallback.scope.
 * @param tId {Number} Transaction ID.
 */
handleResponse : function(oRequest, oRawResponse, oCallback, oCaller, tId) {
    this.fireEvent("responseEvent", {tId:tId, request:oRequest, response:oRawResponse,
            callback:oCallback, caller:oCaller});
    YAHOO.log("Received live data response for \"" + oRequest + "\"", "info", this.toString());
    var xhr = (this.dataType == DS.TYPE_XHR) ? true : false;
    var oParsedResponse = null;
    var oFullResponse = oRawResponse;
    
    // Try to sniff data type if it has not been defined
    if(this.responseType === DS.TYPE_UNKNOWN) {
        var ctype = (oRawResponse && oRawResponse.getResponseHeader) ? oRawResponse.getResponseHeader["Content-Type"] : null;
        if(ctype) {
             // xml
            if(ctype.indexOf("text/xml") > -1) {
                this.responseType = DS.TYPE_XML;
            }
            else if(ctype.indexOf("application/json") > -1) { // json
                this.responseType = DS.TYPE_JSON;
            }
            else if(ctype.indexOf("text/plain") > -1) { // text
                this.responseType = DS.TYPE_TEXT;
            }
        }
        else {
            if(YAHOO.lang.isArray(oRawResponse)) { // array
                this.responseType = DS.TYPE_JSARRAY;
            }
             // xml
            else if(oRawResponse && oRawResponse.nodeType && oRawResponse.nodeType == 9) {
                this.responseType = DS.TYPE_XML;
            }
            else if(oRawResponse && oRawResponse.nodeName && (oRawResponse.nodeName.toLowerCase() == "table")) { // table
                this.responseType = DS.TYPE_HTMLTABLE;
            }    
            else if(YAHOO.lang.isObject(oRawResponse)) { // json
                this.responseType = DS.TYPE_JSON;
            }
            else if(YAHOO.lang.isString(oRawResponse)) { // text
                this.responseType = DS.TYPE_TEXT;
            }
        }
    }

    switch(this.responseType) {
        case DS.TYPE_JSARRAY:
            if(xhr && oRawResponse && oRawResponse.responseText) {
                oFullResponse = oRawResponse.responseText; 
            }
            try {
                // Convert to JS array if it's a string
                if(lang.isString(oFullResponse)) {
                    var parseArgs = [oFullResponse].concat(this.parseJSONArgs);
                    // Check for YUI JSON Util
                    if(lang.JSON) {
                        oFullResponse = lang.JSON.parse.apply(lang.JSON,parseArgs);
                    }
                    // Look for JSON parsers using an API similar to json2.js
                    else if(window.JSON && JSON.parse) {
                        oFullResponse = JSON.parse.apply(JSON,parseArgs);
                    }
                    // Look for JSON parsers using an API similar to json.js
                    else if(oFullResponse.parseJSON) {
                        oFullResponse = oFullResponse.parseJSON.apply(oFullResponse,parseArgs.slice(1));
                    }
                    // No JSON lib found so parse the string
                    else {
                        // Trim leading spaces
                        while (oFullResponse.length > 0 &&
                                (oFullResponse.charAt(0) != "{") &&
                                (oFullResponse.charAt(0) != "[")) {
                            oFullResponse = oFullResponse.substring(1, oFullResponse.length);
                        }

                        if(oFullResponse.length > 0) {
                            // Strip extraneous stuff at the end
                            var arrayEnd =
Math.max(oFullResponse.lastIndexOf("]"),oFullResponse.lastIndexOf("}"));
                            oFullResponse = oFullResponse.substring(0,arrayEnd+1);

                            // Turn the string into an object literal...
                            // ...eval is necessary here
                            oFullResponse = eval("(" + oFullResponse + ")");

                        }
                    }
                }
            }
            catch(e1) {
            }
            oFullResponse = this.doBeforeParseData(oRequest, oFullResponse, oCallback);
            oParsedResponse = this.parseArrayData(oRequest, oFullResponse);
            break;
        case DS.TYPE_JSON:
            if(xhr && oRawResponse && oRawResponse.responseText) {
                oFullResponse = oRawResponse.responseText;
            }
            try {
                // Convert to JSON object if it's a string
                if(lang.isString(oFullResponse)) {
                    var parseArgs = [oFullResponse].concat(this.parseJSONArgs);
                    // Check for YUI JSON Util
                    if(lang.JSON) {
                        oFullResponse = lang.JSON.parse.apply(lang.JSON,parseArgs);
                    }
                    // Look for JSON parsers using an API similar to json2.js
                    else if(window.JSON && JSON.parse) {
                        oFullResponse = JSON.parse.apply(JSON,parseArgs);
                    }
                    // Look for JSON parsers using an API similar to json.js
                    else if(oFullResponse.parseJSON) {
                        oFullResponse = oFullResponse.parseJSON.apply(oFullResponse,parseArgs.slice(1));
                    }
                    // No JSON lib found so parse the string
                    else {
                        // Trim leading spaces
                        while (oFullResponse.length > 0 &&
                                (oFullResponse.charAt(0) != "{") &&
                                (oFullResponse.charAt(0) != "[")) {
                            oFullResponse = oFullResponse.substring(1, oFullResponse.length);
                        }
    
                        if(oFullResponse.length > 0) {
                            // Strip extraneous stuff at the end
                            var objEnd = Math.max(oFullResponse.lastIndexOf("]"),oFullResponse.lastIndexOf("}"));
                            oFullResponse = oFullResponse.substring(0,objEnd+1);
    
                            // Turn the string into an object literal...
                            // ...eval is necessary here
                            oFullResponse = eval("(" + oFullResponse + ")");
    
                        }
                    }
                }
            }
            catch(e) {
            }

            oFullResponse = this.doBeforeParseData(oRequest, oFullResponse, oCallback);
            oParsedResponse = this.parseJSONData(oRequest, oFullResponse);
            break;
        case DS.TYPE_HTMLTABLE:
            if(xhr && oRawResponse.responseText) {
                var el = document.createElement('div');
                el.innerHTML = oRawResponse.responseText;
                oFullResponse = el.getElementsByTagName('table')[0];
            }
            oFullResponse = this.doBeforeParseData(oRequest, oFullResponse, oCallback);
            oParsedResponse = this.parseHTMLTableData(oRequest, oFullResponse);
            break;
        case DS.TYPE_XML:
            if(xhr && oRawResponse.responseXML) {
                oFullResponse = oRawResponse.responseXML;
            }
            oFullResponse = this.doBeforeParseData(oRequest, oFullResponse, oCallback);
            oParsedResponse = this.parseXMLData(oRequest, oFullResponse);
            break;
        case DS.TYPE_TEXT:
            if(xhr && lang.isString(oRawResponse.responseText)) {
                oFullResponse = oRawResponse.responseText;
            }
            oFullResponse = this.doBeforeParseData(oRequest, oFullResponse, oCallback);
            oParsedResponse = this.parseTextData(oRequest, oFullResponse);
            break;
        default:
            oFullResponse = this.doBeforeParseData(oRequest, oFullResponse, oCallback);
            oParsedResponse = this.parseData(oRequest, oFullResponse);
            break;
    }


    // Clean up for consistent signature
    oParsedResponse = oParsedResponse || {};
    if(!oParsedResponse.results) {
        oParsedResponse.results = [];
    }
    if(!oParsedResponse.meta) {
        oParsedResponse.meta = {};
    }

    // Success
    if(oParsedResponse && !oParsedResponse.error) {
        // Last chance to touch the raw response or the parsed response
        oParsedResponse = this.doBeforeCallback(oRequest, oFullResponse, oParsedResponse, oCallback);
        this.fireEvent("responseParseEvent", {request:oRequest,
                response:oParsedResponse, callback:oCallback, caller:oCaller});
        // Cache the response
        this.addToCache(oRequest, oParsedResponse);
    }
    // Error
    else {
        // Be sure the error flag is on
        oParsedResponse.error = true;
        this.fireEvent("dataErrorEvent", {request:oRequest, response: oRawResponse, callback:oCallback, 
                caller:oCaller, message:DS.ERROR_DATANULL});
        YAHOO.log(DS.ERROR_DATANULL, "error", this.toString());
    }

    // Send the response back to the caller
    oParsedResponse.tId = tId;
    DS.issueCallback(oCallback,[oRequest,oParsedResponse],oParsedResponse.error,oCaller);
},

/**
 * Overridable method gives implementers access to the original full response
 * before the data gets parsed. Implementers should take care not to return an
 * unparsable or otherwise invalid response.
 *
 * @method doBeforeParseData
 * @param oRequest {Object} Request object.
 * @param oFullResponse {Object} The full response from the live database.
 * @param oCallback {Object} The callback object.  
 * @return {Object} Full response for parsing.
  
 */
doBeforeParseData : function(oRequest, oFullResponse, oCallback) {
    return oFullResponse;
},

/**
 * Overridable method gives implementers access to the original full response and
 * the parsed response (parsed against the given schema) before the data
 * is added to the cache (if applicable) and then sent back to callback function.
 * This is your chance to access the raw response and/or populate the parsed
 * response with any custom data.
 *
 * @method doBeforeCallback
 * @param oRequest {Object} Request object.
 * @param oFullResponse {Object} The full response from the live database.
 * @param oParsedResponse {Object} The parsed response to return to calling object.
 * @param oCallback {Object} The callback object. 
 * @return {Object} Parsed response object.
 */
doBeforeCallback : function(oRequest, oFullResponse, oParsedResponse, oCallback) {
    return oParsedResponse;
},

/**
 * Overridable method parses data of generic RESPONSE_TYPE into a response object.
 *
 * @method parseData
 * @param oRequest {Object} Request object.
 * @param oFullResponse {Object} The full Array from the live database.
 * @return {Object} Parsed response object with the following properties:<br>
 *     - results {Array} Array of parsed data results<br>
 *     - meta {Object} Object literal of meta values<br>
 *     - error {Boolean} (optional) True if there was an error<br>
 */
parseData : function(oRequest, oFullResponse) {
    if(lang.isValue(oFullResponse)) {
        var oParsedResponse = {results:oFullResponse,meta:{}};
        YAHOO.log("Parsed generic data is " +
                lang.dump(oParsedResponse), "info", this.toString());
        return oParsedResponse;

    }
    YAHOO.log("Generic data could not be parsed: " + lang.dump(oFullResponse), 
            "error", this.toString());
    return null;
},

/**
 * Overridable method parses Array data into a response object.
 *
 * @method parseArrayData
 * @param oRequest {Object} Request object.
 * @param oFullResponse {Object} The full Array from the live database.
 * @return {Object} Parsed response object with the following properties:<br>
 *     - results (Array) Array of parsed data results<br>
 *     - error (Boolean) True if there was an error
 */
parseArrayData : function(oRequest, oFullResponse) {
    if(lang.isArray(oFullResponse)) {
        var results = [],
            i, j,
            rec, field, data;
        
        // Parse for fields
        if(lang.isArray(this.responseSchema.fields)) {
            var fields = this.responseSchema.fields;
            for (i = fields.length - 1; i >= 0; --i) {
                if (typeof fields[i] !== 'object') {
                    fields[i] = { key : fields[i] };
                }
            }

            var parsers = {}, p;
            for (i = fields.length - 1; i >= 0; --i) {
                p = (typeof fields[i].parser === 'function' ?
                          fields[i].parser :
                          DS.Parser[fields[i].parser+'']) || fields[i].converter;
                if (p) {
                    parsers[fields[i].key] = p;
                }
            }

            var arrType = lang.isArray(oFullResponse[0]);
            for(i=oFullResponse.length-1; i>-1; i--) {
                var oResult = {};
                rec = oFullResponse[i];
                if (typeof rec === 'object') {
                    for(j=fields.length-1; j>-1; j--) {
                        field = fields[j];
                        data = arrType ? rec[j] : rec[field.key];

                        if (parsers[field.key]) {
                            data = parsers[field.key].call(this,data);
                        }

                        // Safety measure
                        if(data === undefined) {
                            data = null;
                        }

                        oResult[field.key] = data;
                    }
                }
                else if (lang.isString(rec)) {
                    for(j=fields.length-1; j>-1; j--) {
                        field = fields[j];
                        data = rec;

                        if (parsers[field.key]) {
                            data = parsers[field.key].call(this,data);
                        }

                        // Safety measure
                        if(data === undefined) {
                            data = null;
                        }

                        oResult[field.key] = data;
                    }                
                }
                results[i] = oResult;
            }    
        }
        // Return entire data set
        else {
            results = oFullResponse;
        }
        var oParsedResponse = {results:results};
        YAHOO.log("Parsed array data is " +
                lang.dump(oParsedResponse), "info", this.toString());
        return oParsedResponse;

    }
    YAHOO.log("Array data could not be parsed: " + lang.dump(oFullResponse), 
            "error", this.toString());
    return null;
},

/**
 * Overridable method parses plain text data into a response object.
 *
 * @method parseTextData
 * @param oRequest {Object} Request object.
 * @param oFullResponse {Object} The full text response from the live database.
 * @return {Object} Parsed response object with the following properties:<br>
 *     - results (Array) Array of parsed data results<br>
 *     - error (Boolean) True if there was an error
 */
parseTextData : function(oRequest, oFullResponse) {
    if(lang.isString(oFullResponse)) {
        if(lang.isString(this.responseSchema.recordDelim) &&
                lang.isString(this.responseSchema.fieldDelim)) {
            var oParsedResponse = {results:[]};
            var recDelim = this.responseSchema.recordDelim;
            var fieldDelim = this.responseSchema.fieldDelim;
            if(oFullResponse.length > 0) {
                // Delete the last line delimiter at the end of the data if it exists
                var newLength = oFullResponse.length-recDelim.length;
                if(oFullResponse.substr(newLength) == recDelim) {
                    oFullResponse = oFullResponse.substr(0, newLength);
                }
                if(oFullResponse.length > 0) {
                    // Split along record delimiter to get an array of strings
                    var recordsarray = oFullResponse.split(recDelim);
                    // Cycle through each record
                    for(var i = 0, len = recordsarray.length, recIdx = 0; i < len; ++i) {
                        var bError = false,
                            sRecord = recordsarray[i];
                        if (lang.isString(sRecord) && (sRecord.length > 0)) {
                            // Split each record along field delimiter to get data
                            var fielddataarray = recordsarray[i].split(fieldDelim);
                            var oResult = {};
                            
                            // Filter for fields data
                            if(lang.isArray(this.responseSchema.fields)) {
                                var fields = this.responseSchema.fields;
                                for(var j=fields.length-1; j>-1; j--) {
                                    try {
                                        // Remove quotation marks from edges, if applicable
                                        var data = fielddataarray[j];
                                        if (lang.isString(data)) {
                                            if(data.charAt(0) == "\"") {
                                                data = data.substr(1);
                                            }
                                            if(data.charAt(data.length-1) == "\"") {
                                                data = data.substr(0,data.length-1);
                                            }
                                            var field = fields[j];
                                            var key = (lang.isValue(field.key)) ? field.key : field;
                                            // Backward compatibility
                                            if(!field.parser && field.converter) {
                                                field.parser = field.converter;
                                                YAHOO.log("The field property converter has been deprecated" +
                                                        " in favor of parser", "warn", this.toString());
                                            }
                                            var parser = (typeof field.parser === 'function') ?
                                                field.parser :
                                                DS.Parser[field.parser+''];
                                            if(parser) {
                                                data = parser.call(this, data);
                                            }
                                            // Safety measure
                                            if(data === undefined) {
                                                data = null;
                                            }
                                            oResult[key] = data;
                                        }
                                        else {
                                            bError = true;
                                        }
                                    }
                                    catch(e) {
                                        bError = true;
                                    }
                                }
                            }            
                            // No fields defined so pass along all data as an array
                            else {
                                oResult = fielddataarray;
                            }
                            if(!bError) {
                                oParsedResponse.results[recIdx++] = oResult;
                            }
                        }
                    }
                }
            }
            YAHOO.log("Parsed text data is " +
                    lang.dump(oParsedResponse), "info", this.toString());
            return oParsedResponse;
        }
    }
    YAHOO.log("Text data could not be parsed: " + lang.dump(oFullResponse), 
            "error", this.toString());
    return null;
            
},


/**
 * Overridable method parses XML data for one result into an object literal.
 *
 * @method parseXMLResult
 * @param result {XML} XML for one result.
 * @return {Object} Object literal of data for one result.
 */
parseXMLResult : function(result) {
    var oResult = {},
        schema = this.responseSchema;
        
    try {
        // Loop through each data field in each result using the schema
        for(var m = schema.fields.length-1; m >= 0 ; m--) {
            var field = schema.fields[m];
            var key = (lang.isValue(field.key)) ? field.key : field;
            var data = null;
            // Values may be held in an attribute...
            var xmlAttr = result.attributes.getNamedItem(key);
            if(xmlAttr) {
                data = xmlAttr.value;
            }
            // ...or in a node
            else {
                var xmlNode = result.getElementsByTagName(key);
                if(xmlNode && xmlNode.item(0)) {
                    var item = xmlNode.item(0);
                    // For IE, then DOM...
                    data = (item) ? ((item.text) ? item.text : (item.textContent) ? item.textContent : null) : null;
                    // ...then fallback, but check for multiple child nodes
                    if(!data) {
                        var datapieces = [];
                        for(var j=0, len=item.childNodes.length; j<len; j++) {
                            if(item.childNodes[j].nodeValue) {
                                datapieces[datapieces.length] = item.childNodes[j].nodeValue;
                            }
                        }
                        if(datapieces.length > 0) {
                            data = datapieces.join("");
                        }
                    }
                }
            }
            // Safety net
            if(data === null) {
                   data = "";
            }
            // Backward compatibility
            if(!field.parser && field.converter) {
                field.parser = field.converter;
                YAHOO.log("The field property converter has been deprecated" +
                        " in favor of parser", "warn", this.toString());
            }
            var parser = (typeof field.parser === 'function') ?
                field.parser :
                DS.Parser[field.parser+''];
            if(parser) {
                data = parser.call(this, data);
            }
            // Safety measure
            if(data === undefined) {
                data = null;
            }
            oResult[key] = data;
        }
    }
    catch(e) {
        YAHOO.log("Error while parsing XML result: " + e.message);
    }

    return oResult;
},



/**
 * Overridable method parses XML data into a response object.
 *
 * @method parseXMLData
 * @param oRequest {Object} Request object.
 * @param oFullResponse {Object} The full XML response from the live database.
 * @return {Object} Parsed response object with the following properties<br>
 *     - results (Array) Array of parsed data results<br>
 *     - error (Boolean) True if there was an error
 */
parseXMLData : function(oRequest, oFullResponse) {
    var bError = false,
        schema = this.responseSchema,
        oParsedResponse = {meta:{}},
        xmlList = null,
        metaNode      = schema.metaNode,
        metaLocators  = schema.metaFields || {},
        i,k,loc,v;

    // In case oFullResponse is something funky
    try {
        xmlList = (schema.resultNode) ?
            oFullResponse.getElementsByTagName(schema.resultNode) :
            null;

        // Pull any meta identified
        metaNode = metaNode ? oFullResponse.getElementsByTagName(metaNode)[0] :
                   oFullResponse;

        if (metaNode) {
            for (k in metaLocators) {
                if (lang.hasOwnProperty(metaLocators, k)) {
                    loc = metaLocators[k];
                    // Look for a node
                    v = metaNode.getElementsByTagName(loc)[0];

                    if (v) {
                        v = v.firstChild.nodeValue;
                    } else {
                        // Look for an attribute
                        v = metaNode.attributes.getNamedItem(loc);
                        if (v) {
                            v = v.value;
                        }
                    }

                    if (lang.isValue(v)) {
                        oParsedResponse.meta[k] = v;
                    }
                }
                
            }
        }
    }
    catch(e) {
        YAHOO.log("Error while parsing XML data: " + e.message);
    }
    if(!xmlList || !lang.isArray(schema.fields)) {
        bError = true;
    }
    // Loop through each result
    else {
        oParsedResponse.results = [];
        for(i = xmlList.length-1; i >= 0 ; --i) {
            var oResult = this.parseXMLResult(xmlList.item(i));
            // Capture each array of values into an array of results
            oParsedResponse.results[i] = oResult;
        }
    }
    if(bError) {
        YAHOO.log("XML data could not be parsed: " +
                lang.dump(oFullResponse), "error", this.toString());
        oParsedResponse.error = true;
    }
    else {
        YAHOO.log("Parsed XML data is " +
                lang.dump(oParsedResponse), "info", this.toString());
    }
    return oParsedResponse;
},

/**
 * Overridable method parses JSON data into a response object.
 *
 * @method parseJSONData
 * @param oRequest {Object} Request object.
 * @param oFullResponse {Object} The full JSON from the live database.
 * @return {Object} Parsed response object with the following properties<br>
 *     - results (Array) Array of parsed data results<br>
 *     - error (Boolean) True if there was an error
 */
parseJSONData : function(oRequest, oFullResponse) {
    var oParsedResponse = {results:[],meta:{}};
    
    if(lang.isObject(oFullResponse) && this.responseSchema.resultsList) {
        var schema = this.responseSchema,
            fields          = schema.fields,
            resultsList     = oFullResponse,
            results         = [],
            metaFields      = schema.metaFields || {},
            fieldParsers    = [],
            fieldPaths      = [],
            simpleFields    = [],
            bError          = false,
            i,len,j,v,key,parser,path;

        // Function to convert the schema's fields into walk paths
        var buildPath = function (needle) {
            var path = null, keys = [], i = 0;
            if (needle) {
                // Strip the ["string keys"] and [1] array indexes
                needle = needle.
                    replace(/\[(['"])(.*?)\1\]/g,
                    function (x,$1,$2) {keys[i]=$2;return '.@'+(i++);}).
                    replace(/\[(\d+)\]/g,
                    function (x,$1) {keys[i]=parseInt($1,10)|0;return '.@'+(i++);}).
                    replace(/^\./,''); // remove leading dot

                // If the cleaned needle contains invalid characters, the
                // path is invalid
                if (!/[^\w\.\$@]/.test(needle)) {
                    path = needle.split('.');
                    for (i=path.length-1; i >= 0; --i) {
                        if (path[i].charAt(0) === '@') {
                            path[i] = keys[parseInt(path[i].substr(1),10)];
                        }
                    }
                }
                else {
                    YAHOO.log("Invalid locator: " + needle, "error", this.toString());
                }
            }
            return path;
        };


        // Function to walk a path and return the pot of gold
        var walkPath = function (path, origin) {
            var v=origin,i=0,len=path.length;
            for (;i<len && v;++i) {
                v = v[path[i]];
            }
            return v;
        };

        // Parse the response
        // Step 1. Pull the resultsList from oFullResponse (default assumes
        // oFullResponse IS the resultsList)
        path = buildPath(schema.resultsList);
        if (path) {
            resultsList = walkPath(path, oFullResponse);
            if (resultsList === undefined) {
                bError = true;
            }
        } else {
            bError = true;
        }
        
        if (!resultsList) {
            resultsList = [];
        }

        if (!lang.isArray(resultsList)) {
            resultsList = [resultsList];
        }

        if (!bError) {
            // Step 2. Parse out field data if identified
            if(schema.fields) {
                var field;
                // Build the field parser map and location paths
                for (i=0, len=fields.length; i<len; i++) {
                    field = fields[i];
                    key    = field.key || field;
                    parser = ((typeof field.parser === 'function') ?
                        field.parser :
                        DS.Parser[field.parser+'']) || field.converter;
                    path   = buildPath(key);
    
                    if (parser) {
                        fieldParsers[fieldParsers.length] = {key:key,parser:parser};
                    }
    
                    if (path) {
                        if (path.length > 1) {
                            fieldPaths[fieldPaths.length] = {key:key,path:path};
                        } else {
                            simpleFields[simpleFields.length] = {key:key,path:path[0]};
                        }
                    } else {
                        YAHOO.log("Invalid key syntax: " + key,"warn",this.toString());
                    }
                }

                // Process the results, flattening the records and/or applying parsers if needed
                for (i = resultsList.length - 1; i >= 0; --i) {
                    var r = resultsList[i], rec = {};
                    if(r) {
                        for (j = simpleFields.length - 1; j >= 0; --j) {
                            // Bug 1777850: data might be held in an array
                            rec[simpleFields[j].key] =
                                    (r[simpleFields[j].path] !== undefined) ?
                                    r[simpleFields[j].path] : r[j];
                        }

                        for (j = fieldPaths.length - 1; j >= 0; --j) {
                            rec[fieldPaths[j].key] = walkPath(fieldPaths[j].path,r);
                        }

                        for (j = fieldParsers.length - 1; j >= 0; --j) {
                            var p = fieldParsers[j].key;
                            rec[p] = fieldParsers[j].parser(rec[p]);
                            if (rec[p] === undefined) {
                                rec[p] = null;
                            }
                        }
                    }
                    results[i] = rec;
                }
            }
            else {
                results = resultsList;
            }

            for (key in metaFields) {
                if (lang.hasOwnProperty(metaFields,key)) {
                    path = buildPath(metaFields[key]);
                    if (path) {
                        v = walkPath(path, oFullResponse);
                        oParsedResponse.meta[key] = v;
                    }
                }
            }

        } else {
            YAHOO.log("JSON data could not be parsed due to invalid responseSchema.resultsList or invalid response: " +
                    lang.dump(oFullResponse), "error", this.toString());

            oParsedResponse.error = true;
        }

        oParsedResponse.results = results;
    }
    else {
        YAHOO.log("JSON data could not be parsed: " +
                lang.dump(oFullResponse), "error", this.toString());
        oParsedResponse.error = true;
    }

    return oParsedResponse;
},

/**
 * Overridable method parses an HTML TABLE element reference into a response object.
 * Data is parsed out of TR elements from all TBODY elements. 
 *
 * @method parseHTMLTableData
 * @param oRequest {Object} Request object.
 * @param oFullResponse {Object} The full HTML element reference from the live database.
 * @return {Object} Parsed response object with the following properties<br>
 *     - results (Array) Array of parsed data results<br>
 *     - error (Boolean) True if there was an error
 */
parseHTMLTableData : function(oRequest, oFullResponse) {
    var bError = false;
    var elTable = oFullResponse;
    var fields = this.responseSchema.fields;
    var oParsedResponse = {results:[]};

    if(lang.isArray(fields)) {
        // Iterate through each TBODY
        for(var i=0; i<elTable.tBodies.length; i++) {
            var elTbody = elTable.tBodies[i];
    
            // Iterate through each TR
            for(var j=elTbody.rows.length-1; j>-1; j--) {
                var elRow = elTbody.rows[j];
                var oResult = {};
                
                for(var k=fields.length-1; k>-1; k--) {
                    var field = fields[k];
                    var key = (lang.isValue(field.key)) ? field.key : field;
                    var data = elRow.cells[k].innerHTML;
    
                    // Backward compatibility
                    if(!field.parser && field.converter) {
                        field.parser = field.converter;
                        YAHOO.log("The field property converter has been deprecated" +
                                " in favor of parser", "warn", this.toString());
                    }
                    var parser = (typeof field.parser === 'function') ?
                        field.parser :
                        DS.Parser[field.parser+''];
                    if(parser) {
                        data = parser.call(this, data);
                    }
                    // Safety measure
                    if(data === undefined) {
                        data = null;
                    }
                    oResult[key] = data;
                }
                oParsedResponse.results[j] = oResult;
            }
        }
    }
    else {
        bError = true;
        YAHOO.log("Invalid responseSchema.fields", "error", this.toString());
    }

    if(bError) {
        YAHOO.log("HTML TABLE data could not be parsed: " +
                lang.dump(oFullResponse), "error", this.toString());
        oParsedResponse.error = true;
    }
    else {
        YAHOO.log("Parsed HTML TABLE data is " +
                lang.dump(oParsedResponse), "info", this.toString());
    }
    return oParsedResponse;
}

};

// DataSourceBase uses EventProvider
lang.augmentProto(DS, util.EventProvider);



/****************************************************************************/
/****************************************************************************/
/****************************************************************************/

/**
 * LocalDataSource class for in-memory data structs including JavaScript arrays,
 * JavaScript object literals (JSON), XML documents, and HTML tables.
 *
 * @namespace YAHOO.util
 * @class YAHOO.util.LocalDataSource
 * @extends YAHOO.util.DataSourceBase 
 * @constructor
 * @param oLiveData {HTMLElement}  Pointer to live data.
 * @param oConfigs {object} (optional) Object literal of configuration values.
 */
util.LocalDataSource = function(oLiveData, oConfigs) {
    this.dataType = DS.TYPE_LOCAL;
    
    if(oLiveData) {
        if(YAHOO.lang.isArray(oLiveData)) { // array
            this.responseType = DS.TYPE_JSARRAY;
        }
         // xml
        else if(oLiveData.nodeType && oLiveData.nodeType == 9) {
            this.responseType = DS.TYPE_XML;
        }
        else if(oLiveData.nodeName && (oLiveData.nodeName.toLowerCase() == "table")) { // table
            this.responseType = DS.TYPE_HTMLTABLE;
            oLiveData = oLiveData.cloneNode(true);
        }    
        else if(YAHOO.lang.isString(oLiveData)) { // text
            this.responseType = DS.TYPE_TEXT;
        }
        else if(YAHOO.lang.isObject(oLiveData)) { // json
            this.responseType = DS.TYPE_JSON;
        }
    }
    else {
        oLiveData = [];
        this.responseType = DS.TYPE_JSARRAY;
    }
    
    util.LocalDataSource.superclass.constructor.call(this, oLiveData, oConfigs); 
};

// LocalDataSource extends DataSourceBase
lang.extend(util.LocalDataSource, DS);

// Copy static members to LocalDataSource class
lang.augmentObject(util.LocalDataSource, DS);













/****************************************************************************/
/****************************************************************************/
/****************************************************************************/

/**
 * FunctionDataSource class for JavaScript functions.
 *
 * @namespace YAHOO.util
 * @class YAHOO.util.FunctionDataSource
 * @extends YAHOO.util.DataSourceBase  
 * @constructor
 * @param oLiveData {HTMLElement}  Pointer to live data.
 * @param oConfigs {object} (optional) Object literal of configuration values.
 */
util.FunctionDataSource = function(oLiveData, oConfigs) {
    this.dataType = DS.TYPE_JSFUNCTION;
    oLiveData = oLiveData || function() {};
    
    util.FunctionDataSource.superclass.constructor.call(this, oLiveData, oConfigs); 
};

// FunctionDataSource extends DataSourceBase
lang.extend(util.FunctionDataSource, DS, {

/////////////////////////////////////////////////////////////////////////////
//
// FunctionDataSource public properties
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Context in which to execute the function. By default, is the DataSource
 * instance itself. If set, the function will receive the DataSource instance
 * as an additional argument. 
 *
 * @property scope
 * @type Object
 * @default null
 */
scope : null,


/////////////////////////////////////////////////////////////////////////////
//
// FunctionDataSource public methods
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Overriding method passes query to a function. The returned response is then
 * forwarded to the handleResponse function.
 *
 * @method makeConnection
 * @param oRequest {Object} Request object.
 * @param oCallback {Object} Callback object literal.
 * @param oCaller {Object} (deprecated) Use oCallback.scope.
 * @return {Number} Transaction ID.
 */
makeConnection : function(oRequest, oCallback, oCaller) {
    var tId = DS._nTransactionId++;
    this.fireEvent("requestEvent", {tId:tId,request:oRequest,callback:oCallback,caller:oCaller});

    // Pass the request in as a parameter and
    // forward the return value to the handler
    
    
    var oRawResponse = (this.scope) ? this.liveData.call(this.scope, oRequest, this) : this.liveData(oRequest);
    
    // Try to sniff data type if it has not been defined
    if(this.responseType === DS.TYPE_UNKNOWN) {
        if(YAHOO.lang.isArray(oRawResponse)) { // array
            this.responseType = DS.TYPE_JSARRAY;
        }
         // xml
        else if(oRawResponse && oRawResponse.nodeType && oRawResponse.nodeType == 9) {
            this.responseType = DS.TYPE_XML;
        }
        else if(oRawResponse && oRawResponse.nodeName && (oRawResponse.nodeName.toLowerCase() == "table")) { // table
            this.responseType = DS.TYPE_HTMLTABLE;
        }    
        else if(YAHOO.lang.isObject(oRawResponse)) { // json
            this.responseType = DS.TYPE_JSON;
        }
        else if(YAHOO.lang.isString(oRawResponse)) { // text
            this.responseType = DS.TYPE_TEXT;
        }
    }

    this.handleResponse(oRequest, oRawResponse, oCallback, oCaller, tId);
    return tId;
}

});

// Copy static members to FunctionDataSource class
lang.augmentObject(util.FunctionDataSource, DS);













/****************************************************************************/
/****************************************************************************/
/****************************************************************************/

/**
 * ScriptNodeDataSource class for accessing remote data via the YUI Get Utility. 
 *
 * @namespace YAHOO.util
 * @class YAHOO.util.ScriptNodeDataSource
 * @extends YAHOO.util.DataSourceBase  
 * @constructor
 * @param oLiveData {HTMLElement}  Pointer to live data.
 * @param oConfigs {object} (optional) Object literal of configuration values.
 */
util.ScriptNodeDataSource = function(oLiveData, oConfigs) {
    this.dataType = DS.TYPE_SCRIPTNODE;
    oLiveData = oLiveData || "";
    
    util.ScriptNodeDataSource.superclass.constructor.call(this, oLiveData, oConfigs); 
};

// ScriptNodeDataSource extends DataSourceBase
lang.extend(util.ScriptNodeDataSource, DS, {

/////////////////////////////////////////////////////////////////////////////
//
// ScriptNodeDataSource public properties
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Alias to YUI Get Utility, to allow implementers to use a custom class.
 *
 * @property getUtility
 * @type Object
 * @default YAHOO.util.Get
 */
getUtility : util.Get,

/**
 * Defines request/response management in the following manner:
 * <dl>
 *     <!--<dt>queueRequests</dt>
 *     <dd>If a request is already in progress, wait until response is returned before sending the next request.</dd>
 *     <dt>cancelStaleRequests</dt>
 *     <dd>If a request is already in progress, cancel it before sending the next request.</dd>-->
 *     <dt>ignoreStaleResponses</dt>
 *     <dd>Send all requests, but handle only the response for the most recently sent request.</dd>
 *     <dt>allowAll</dt>
 *     <dd>Send all requests and handle all responses.</dd>
 * </dl>
 *
 * @property asyncMode
 * @type String
 * @default "allowAll"
 */
asyncMode : "allowAll",

/**
 * Callback string parameter name sent to the remote script. By default,
 * requests are sent to
 * &#60;URI&#62;?&#60;scriptCallbackParam&#62;=callbackFunction
 *
 * @property scriptCallbackParam
 * @type String
 * @default "callback"
 */
scriptCallbackParam : "callback",


/////////////////////////////////////////////////////////////////////////////
//
// ScriptNodeDataSource public methods
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Creates a request callback that gets appended to the script URI. Implementers
 * can customize this string to match their server's query syntax.
 *
 * @method generateRequestCallback
 * @return {String} String fragment that gets appended to script URI that 
 * specifies the callback function 
 */
generateRequestCallback : function(id) {
    return "&" + this.scriptCallbackParam + "=YAHOO.util.ScriptNodeDataSource.callbacks["+id+"]" ;
},

/**
 * Overridable method gives implementers access to modify the URI before the dynamic
 * script node gets inserted. Implementers should take care not to return an
 * invalid URI.
 *
 * @method doBeforeGetScriptNode
 * @param {String} URI to the script 
 * @return {String} URI to the script
 */
doBeforeGetScriptNode : function(sUri) {
    return sUri;
},

/**
 * Overriding method passes query to Get Utility. The returned
 * response is then forwarded to the handleResponse function.
 *
 * @method makeConnection
 * @param oRequest {Object} Request object.
 * @param oCallback {Object} Callback object literal.
 * @param oCaller {Object} (deprecated) Use oCallback.scope.
 * @return {Number} Transaction ID.
 */
makeConnection : function(oRequest, oCallback, oCaller) {
    var tId = DS._nTransactionId++;
    this.fireEvent("requestEvent", {tId:tId,request:oRequest,callback:oCallback,caller:oCaller});
    
    // If there are no global pending requests, it is safe to purge global callback stack and global counter
    if(util.ScriptNodeDataSource._nPending === 0) {
        util.ScriptNodeDataSource.callbacks = [];
        util.ScriptNodeDataSource._nId = 0;
    }
    
    // ID for this request
    var id = util.ScriptNodeDataSource._nId;
    util.ScriptNodeDataSource._nId++;
    
    // Dynamically add handler function with a closure to the callback stack
    var oSelf = this;
    util.ScriptNodeDataSource.callbacks[id] = function(oRawResponse) {
        if((oSelf.asyncMode !== "ignoreStaleResponses")||
                (id === util.ScriptNodeDataSource.callbacks.length-1)) { // Must ignore stale responses
                
            // Try to sniff data type if it has not been defined
            if(oSelf.responseType === DS.TYPE_UNKNOWN) {
                if(YAHOO.lang.isArray(oRawResponse)) { // array
                    oSelf.responseType = DS.TYPE_JSARRAY;
                }
                 // xml
                else if(oRawResponse.nodeType && oRawResponse.nodeType == 9) {
                    oSelf.responseType = DS.TYPE_XML;
                }
                else if(oRawResponse.nodeName && (oRawResponse.nodeName.toLowerCase() == "table")) { // table
                    oSelf.responseType = DS.TYPE_HTMLTABLE;
                }    
                else if(YAHOO.lang.isObject(oRawResponse)) { // json
                    oSelf.responseType = DS.TYPE_JSON;
                }
                else if(YAHOO.lang.isString(oRawResponse)) { // text
                    oSelf.responseType = DS.TYPE_TEXT;
                }
            }

            oSelf.handleResponse(oRequest, oRawResponse, oCallback, oCaller, tId);
        }
        else {
            YAHOO.log("DataSource ignored stale response for tId " + tId + "(" + oRequest + ")", "info", oSelf.toString());
        }
    
        delete util.ScriptNodeDataSource.callbacks[id];
    };
    
    // We are now creating a request
    util.ScriptNodeDataSource._nPending++;
    var sUri = this.liveData + oRequest + this.generateRequestCallback(id);
    sUri = this.doBeforeGetScriptNode(sUri);
    YAHOO.log("DataSource is querying URL " + sUri, "info", this.toString());
    this.getUtility.script(sUri,
            {autopurge: true,
            onsuccess: util.ScriptNodeDataSource._bumpPendingDown,
            onfail: util.ScriptNodeDataSource._bumpPendingDown});

    return tId;
}

});

// Copy static members to ScriptNodeDataSource class
lang.augmentObject(util.ScriptNodeDataSource, DS);

// Copy static members to ScriptNodeDataSource class
lang.augmentObject(util.ScriptNodeDataSource,  {

/////////////////////////////////////////////////////////////////////////////
//
// ScriptNodeDataSource private static properties
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Unique ID to track requests.
 *
 * @property _nId
 * @type Number
 * @private
 * @static
 */
_nId : 0,

/**
 * Counter for pending requests. When this is 0, it is safe to purge callbacks
 * array.
 *
 * @property _nPending
 * @type Number
 * @private
 * @static
 */
_nPending : 0,

/**
 * Global array of callback functions, one for each request sent.
 *
 * @property callbacks
 * @type Function[]
 * @static
 */
callbacks : []

});














/****************************************************************************/
/****************************************************************************/
/****************************************************************************/

/**
 * XHRDataSource class for accessing remote data via the YUI Connection Manager
 * Utility
 *
 * @namespace YAHOO.util
 * @class YAHOO.util.XHRDataSource
 * @extends YAHOO.util.DataSourceBase  
 * @constructor
 * @param oLiveData {HTMLElement}  Pointer to live data.
 * @param oConfigs {object} (optional) Object literal of configuration values.
 */
util.XHRDataSource = function(oLiveData, oConfigs) {
    this.dataType = DS.TYPE_XHR;
    this.connMgr = this.connMgr || util.Connect;
    oLiveData = oLiveData || "";
    
    util.XHRDataSource.superclass.constructor.call(this, oLiveData, oConfigs); 
};

// XHRDataSource extends DataSourceBase
lang.extend(util.XHRDataSource, DS, {

/////////////////////////////////////////////////////////////////////////////
//
// XHRDataSource public properties
//
/////////////////////////////////////////////////////////////////////////////

 /**
 * Alias to YUI Connection Manager, to allow implementers to use a custom class.
 *
 * @property connMgr
 * @type Object
 * @default YAHOO.util.Connect
 */
connMgr: null,

 /**
 * Defines request/response management in the following manner:
 * <dl>
 *     <dt>queueRequests</dt>
 *     <dd>If a request is already in progress, wait until response is returned
 *     before sending the next request.</dd>
 *
 *     <dt>cancelStaleRequests</dt>
 *     <dd>If a request is already in progress, cancel it before sending the next
 *     request.</dd>
 *
 *     <dt>ignoreStaleResponses</dt>
 *     <dd>Send all requests, but handle only the response for the most recently
 *     sent request.</dd>
 *
 *     <dt>allowAll</dt>
 *     <dd>Send all requests and handle all responses.</dd>
 *
 * </dl>
 *
 * @property connXhrMode
 * @type String
 * @default "allowAll"
 */
connXhrMode: "allowAll",

 /**
 * True if data is to be sent via POST. By default, data will be sent via GET.
 *
 * @property connMethodPost
 * @type Boolean
 * @default false
 */
connMethodPost: false,

 /**
 * The connection timeout defines how many  milliseconds the XHR connection will
 * wait for a server response. Any non-zero value will enable the Connection Manager's
 * Auto-Abort feature.
 *
 * @property connTimeout
 * @type Number
 * @default 0
 */
connTimeout: 0,

/////////////////////////////////////////////////////////////////////////////
//
// XHRDataSource public methods
//
/////////////////////////////////////////////////////////////////////////////

/**
 * Overriding method passes query to Connection Manager. The returned
 * response is then forwarded to the handleResponse function.
 *
 * @method makeConnection
 * @param oRequest {Object} Request object.
 * @param oCallback {Object} Callback object literal.
 * @param oCaller {Object} (deprecated) Use oCallback.scope.
 * @return {Number} Transaction ID.
 */
makeConnection : function(oRequest, oCallback, oCaller) {

    var oRawResponse = null;
    var tId = DS._nTransactionId++;
    this.fireEvent("requestEvent", {tId:tId,request:oRequest,callback:oCallback,caller:oCaller});

    // Set up the callback object and
    // pass the request in as a URL query and
    // forward the response to the handler
    var oSelf = this;
    var oConnMgr = this.connMgr;
    var oQueue = this._oQueue;

    /**
     * Define Connection Manager success handler
     *
     * @method _xhrSuccess
     * @param oResponse {Object} HTTPXMLRequest object
     * @private
     */
    var _xhrSuccess = function(oResponse) {
        // If response ID does not match last made request ID,
        // silently fail and wait for the next response
        if(oResponse && (this.connXhrMode == "ignoreStaleResponses") &&
                (oResponse.tId != oQueue.conn.tId)) {
            YAHOO.log("Ignored stale response", "warn", this.toString());
            return null;
        }
        // Error if no response
        else if(!oResponse) {
            this.fireEvent("dataErrorEvent", {request:oRequest,
                    callback:oCallback, caller:oCaller,
                    message:DS.ERROR_DATANULL});
            YAHOO.log(DS.ERROR_DATANULL, "error", this.toString());

            // Send error response back to the caller with the error flag on
            DS.issueCallback(oCallback,[oRequest, {error:true}], true, oCaller);

            return null;
        }
        // Forward to handler
        else {
            // Try to sniff data type if it has not been defined
            if(this.responseType === DS.TYPE_UNKNOWN) {
                var ctype = (oResponse.getResponseHeader) ? oResponse.getResponseHeader["Content-Type"] : null;
                if(ctype) {
                    // xml
                    if(ctype.indexOf("text/xml") > -1) {
                        this.responseType = DS.TYPE_XML;
                    }
                    else if(ctype.indexOf("application/json") > -1) { // json
                        this.responseType = DS.TYPE_JSON;
                    }
                    else if(ctype.indexOf("text/plain") > -1) { // text
                        this.responseType = DS.TYPE_TEXT;
                    }
                }
            }
            this.handleResponse(oRequest, oResponse, oCallback, oCaller, tId);
        }
    };

    /**
     * Define Connection Manager failure handler
     *
     * @method _xhrFailure
     * @param oResponse {Object} HTTPXMLRequest object
     * @private
     */
    var _xhrFailure = function(oResponse) {
        this.fireEvent("dataErrorEvent", {request:oRequest,
                callback:oCallback, caller:oCaller,
                message:DS.ERROR_DATAINVALID});
        YAHOO.log(DS.ERROR_DATAINVALID + ": " +
                oResponse.statusText, "error", this.toString());

        // Backward compatibility
        if(lang.isString(this.liveData) && lang.isString(oRequest) &&
            (this.liveData.lastIndexOf("?") !== this.liveData.length-1) &&
            (oRequest.indexOf("?") !== 0)){
                YAHOO.log("DataSources using XHR no longer automatically supply " + 
                "a \"?\" between the host and query parameters" +
                " -- please check that the request URL is correct", "warn", this.toString());
        }

        // Send failure response back to the caller with the error flag on
        oResponse = oResponse || {};
        oResponse.error = true;
        DS.issueCallback(oCallback,[oRequest,oResponse],true, oCaller);

        return null;
    };

    /**
     * Define Connection Manager callback object
     *
     * @property _xhrCallback
     * @param oResponse {Object} HTTPXMLRequest object
     * @private
     */
     var _xhrCallback = {
        success:_xhrSuccess,
        failure:_xhrFailure,
        scope: this
    };

    // Apply Connection Manager timeout
    if(lang.isNumber(this.connTimeout)) {
        _xhrCallback.timeout = this.connTimeout;
    }

    // Cancel stale requests
    if(this.connXhrMode == "cancelStaleRequests") {
            // Look in queue for stale requests
            if(oQueue.conn) {
                if(oConnMgr.abort) {
                    oConnMgr.abort(oQueue.conn);
                    oQueue.conn = null;
                    YAHOO.log("Canceled stale request", "warn", this.toString());
                }
                else {
                    YAHOO.log("Could not find Connection Manager abort() function", "error", this.toString());
                }
            }
    }

    // Get ready to send the request URL
    if(oConnMgr && oConnMgr.asyncRequest) {
        var sLiveData = this.liveData;
        var isPost = this.connMethodPost;
        var sMethod = (isPost) ? "POST" : "GET";
        // Validate request
        var sUri = (isPost || !lang.isValue(oRequest)) ? sLiveData : sLiveData+oRequest;
        var sRequest = (isPost) ? oRequest : null;

        // Send the request right away
        if(this.connXhrMode != "queueRequests") {
            oQueue.conn = oConnMgr.asyncRequest(sMethod, sUri, _xhrCallback, sRequest);
        }
        // Queue up then send the request
        else {
            // Found a request already in progress
            if(oQueue.conn) {
                var allRequests = oQueue.requests;
                // Add request to queue
                allRequests.push({request:oRequest, callback:_xhrCallback});

                // Interval needs to be started
                if(!oQueue.interval) {
                    oQueue.interval = setInterval(function() {
                        // Connection is in progress
                        if(oConnMgr.isCallInProgress(oQueue.conn)) {
                            return;
                        }
                        else {
                            // Send next request
                            if(allRequests.length > 0) {
                                // Validate request
                                sUri = (isPost || !lang.isValue(allRequests[0].request)) ? sLiveData : sLiveData+allRequests[0].request;
                                sRequest = (isPost) ? allRequests[0].request : null;
                                oQueue.conn = oConnMgr.asyncRequest(sMethod, sUri, allRequests[0].callback, sRequest);

                                // Remove request from queue
                                allRequests.shift();
                            }
                            // No more requests
                            else {
                                clearInterval(oQueue.interval);
                                oQueue.interval = null;
                            }
                        }
                    }, 50);
                }
            }
            // Nothing is in progress
            else {
                oQueue.conn = oConnMgr.asyncRequest(sMethod, sUri, _xhrCallback, sRequest);
            }
        }
    }
    else {
        YAHOO.log("Could not find Connection Manager asyncRequest() function", "error", this.toString());
        // Send null response back to the caller with the error flag on
        DS.issueCallback(oCallback,[oRequest,{error:true}],true,oCaller);
    }

    return tId;
}

});

// Copy static members to XHRDataSource class
lang.augmentObject(util.XHRDataSource, DS);













/****************************************************************************/
/****************************************************************************/
/****************************************************************************/

/**
 * Factory class for creating a BaseDataSource subclass instance. The sublcass is
 * determined by oLiveData's type, unless the dataType config is explicitly passed in.  
 *
 * @namespace YAHOO.util
 * @class YAHOO.util.DataSource
 * @constructor
 * @param oLiveData {HTMLElement}  Pointer to live data.
 * @param oConfigs {object} (optional) Object literal of configuration values.
 */
util.DataSource = function(oLiveData, oConfigs) {
    oConfigs = oConfigs || {};
    
    // Point to one of the subclasses, first by dataType if given, then by sniffing oLiveData type.
    var dataType = oConfigs.dataType;
    if(dataType) {
        if(dataType == DS.TYPE_LOCAL) {
            lang.augmentObject(util.DataSource, util.LocalDataSource);
            return new util.LocalDataSource(oLiveData, oConfigs);            
        }
        else if(dataType == DS.TYPE_XHR) {
            lang.augmentObject(util.DataSource, util.XHRDataSource);
            return new util.XHRDataSource(oLiveData, oConfigs);            
        }
        else if(dataType == DS.TYPE_SCRIPTNODE) {
            lang.augmentObject(util.DataSource, util.ScriptNodeDataSource);
            return new util.ScriptNodeDataSource(oLiveData, oConfigs);            
        }
        else if(dataType == DS.TYPE_JSFUNCTION) {
            lang.augmentObject(util.DataSource, util.FunctionDataSource);
            return new util.FunctionDataSource(oLiveData, oConfigs);            
        }
    }
    
    if(YAHOO.lang.isString(oLiveData)) { // strings default to xhr
        lang.augmentObject(util.DataSource, util.XHRDataSource);
        return new util.XHRDataSource(oLiveData, oConfigs);
    }
    else if(YAHOO.lang.isFunction(oLiveData)) {
        lang.augmentObject(util.DataSource, util.FunctionDataSource);
        return new util.FunctionDataSource(oLiveData, oConfigs);
    }
    else { // ultimate default is local
        lang.augmentObject(util.DataSource, util.LocalDataSource);
        return new util.LocalDataSource(oLiveData, oConfigs);
    }
};

// Copy static members to DataSource class
lang.augmentObject(util.DataSource, DS);

})();
