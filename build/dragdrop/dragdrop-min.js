if(!YAHOO.util.DragDropMgr){YAHOO.util.DragDropMgr=function(){var a=YAHOO.util.Event,b=YAHOO.util.Dom;return{useShim:false,_shimActive:false,_shimState:false,_debugShim:false,_createShim:function(){var c=document.createElement("div");c.id="yui-ddm-shim";if(document.body.firstChild){document.body.insertBefore(c,document.body.firstChild);}else{document.body.appendChild(c);}c.style.display="none";c.style.backgroundColor="red";c.style.position="absolute";c.style.zIndex="99999";b.setStyle(c,"opacity","0");this._shim=c;a.on(c,"mouseup",this.handleMouseUp,this,true);a.on(c,"mousemove",this.handleMouseMove,this,true);a.on(window,"scroll",this._sizeShim,this,true);},_sizeShim:function(){if(this._shimActive){var c=this._shim;c.style.height=b.getDocumentHeight()+"px";c.style.width=b.getDocumentWidth()+"px";c.style.top="0";c.style.left="0";}},_activateShim:function(){if(this.useShim){if(!this._shim){this._createShim();}this._shimActive=true;var c=this._shim,d="0";if(this._debugShim){d=".5";}b.setStyle(c,"opacity",d);this._sizeShim();c.style.display="block";}},_deactivateShim:function(){this._shim.style.display="none";this._shimActive=false;},_shim:null,ids:{},handleIds:{},dragCurrent:null,dragOvers:{},deltaX:0,deltaY:0,preventDefault:true,stopPropagation:true,initialized:false,locked:false,interactionInfo:null,init:function(){this.initialized=true;},POINT:0,INTERSECT:1,STRICT_INTERSECT:2,mode:0,_execOnAll:function(e,d){for(var f in this.ids){for(var c in this.ids[f]){var g=this.ids[f][c];if(!this.isTypeOfDD(g)){continue;}g[e].apply(g,d);}}},_onLoad:function(){this.init();a.on(document,"mouseup",this.handleMouseUp,this,true);a.on(document,"mousemove",this.handleMouseMove,this,true);a.on(window,"unload",this._onUnload,this,true);a.on(window,"resize",this._onResize,this,true);},_onResize:function(c){this._execOnAll("resetConstraints",[]);},lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isLocked:function(){return this.locked;},locationCache:{},useCache:true,clickPixelThresh:3,clickTimeThresh:1000,dragThreshMet:false,clickTimeout:null,startX:0,startY:0,fromTimeout:false,regDragDrop:function(d,c){if(!this.initialized){this.init();}if(!this.ids[c]){this.ids[c]={};}this.ids[c][d.id]=d;},removeDDFromGroup:function(e,c){if(!this.ids[c]){this.ids[c]={};}var d=this.ids[c];if(d&&d[e.id]){delete d[e.id];}},_remove:function(e){for(var d in e.groups){if(d){var c=this.ids[d];if(c&&c[e.id]){delete c[e.id];}}}delete this.handleIds[e.id];},regHandle:function(d,c){if(!this.handleIds[d]){this.handleIds[d]={};}this.handleIds[d][c]=c;},isDragDrop:function(c){return(this.getDDById(c))?true:false;},getRelated:function(h,d){var g=[];for(var f in h.groups){for(var e in this.ids[f]){var c=this.ids[f][e];if(!this.isTypeOfDD(c)){continue;}if(!d||c.isTarget){g[g.length]=c;}}}return g;},isLegalTarget:function(g,f){var d=this.getRelated(g,true);for(var e=0,c=d.length;e<c;++e){if(d[e].id==f.id){return true;}}return false;},isTypeOfDD:function(c){return(c&&c.__ygDragDrop);},isHandle:function(d,c){return(this.handleIds[d]&&this.handleIds[d][c]);},getDDById:function(d){for(var c in this.ids){if(this.ids[c][d]){return this.ids[c][d];}}return null;},handleMouseDown:function(f,d){this.currentTarget=YAHOO.util.Event.getTarget(f);this.dragCurrent=d;var c=d.getEl();this.startX=YAHOO.util.Event.getPageX(f);this.startY=YAHOO.util.Event.getPageY(f);this.deltaX=this.startX-c.offsetLeft;this.deltaY=this.startY-c.offsetTop;this.dragThreshMet=false;this.clickTimeout=setTimeout(function(){var e=YAHOO.util.DDM;e.startDrag(e.startX,e.startY);e.fromTimeout=true;},this.clickTimeThresh);},startDrag:function(c,e){if(this.dragCurrent&&this.dragCurrent.useShim){this._shimState=this.useShim;this.useShim=true;}this._activateShim();clearTimeout(this.clickTimeout);var d=this.dragCurrent;if(d&&d.events.b4StartDrag){d.b4StartDrag(c,e);d.fireEvent("b4StartDragEvent",{x:c,y:e});}if(d&&d.events.startDrag){d.startDrag(c,e);d.fireEvent("startDragEvent",{x:c,y:e});}this.dragThreshMet=true;},handleMouseUp:function(c){if(this.dragCurrent){clearTimeout(this.clickTimeout);if(this.dragThreshMet){if(this.fromTimeout){this.fromTimeout=false;this.handleMouseMove(c);}this.fromTimeout=false;this.fireEvents(c,true);}else{}this.stopDrag(c);this.stopEvent(c);}},stopEvent:function(c){if(this.stopPropagation){YAHOO.util.Event.stopPropagation(c);}if(this.preventDefault){YAHOO.util.Event.preventDefault(c);}},stopDrag:function(f,d){var c=this.dragCurrent;if(c&&!d){if(this.dragThreshMet){if(c.events.b4EndDrag){c.b4EndDrag(f);c.fireEvent("b4EndDragEvent",{e:f});}if(c.events.endDrag){c.endDrag(f);c.fireEvent("endDragEvent",{e:f});}}if(c.events.mouseUp){c.onMouseUp(f);c.fireEvent("mouseUpEvent",{e:f});}}if(this._shimActive){this._deactivateShim();if(this.dragCurrent&&this.dragCurrent.useShim){this.useShim=this._shimState;this._shimState=false;}}this.dragCurrent=null;this.dragOvers={};},handleMouseMove:function(g){var c=this.dragCurrent;if(c){if(YAHOO.env.ua.ie&&(YAHOO.env.ua.ie<9)&&!g.button){this.stopEvent(g);return this.handleMouseUp(g);}else{if(g.clientX<0||g.clientY<0){}}if(!this.dragThreshMet){var f=Math.abs(this.startX-YAHOO.util.Event.getPageX(g));var d=Math.abs(this.startY-YAHOO.util.Event.getPageY(g));if(f>this.clickPixelThresh||d>this.clickPixelThresh){this.startDrag(this.startX,this.startY);}}if(this.dragThreshMet){if(c&&c.events.b4Drag){c.b4Drag(g);c.fireEvent("b4DragEvent",{e:g});}if(c&&c.events.drag){c.onDrag(g);c.fireEvent("dragEvent",{e:g});}if(c){this.fireEvents(g,false);}}this.stopEvent(g);}},fireEvents:function(A,o){var F=this.dragCurrent;if(!F||F.isLocked()||F.dragOnly){return;}var q=YAHOO.util.Event.getPageX(A),p=YAHOO.util.Event.getPageY(A),s=new YAHOO.util.Point(q,p),m=F.getTargetCoord(s.x,s.y),g=F.getDragEl(),f=["out","over","drop","enter"],z=new YAHOO.util.Region(m.y,m.x+g.offsetWidth,m.y+g.offsetHeight,m.x),k=[],d={},n={},t=[],G={outEvts:[],overEvts:[],dropEvts:[],enterEvts:[]};for(var v in this.dragOvers){var H=this.dragOvers[v];if(!this.isTypeOfDD(H)){continue;
}if(!this.isOverTarget(s,H,this.mode,z)){G.outEvts.push(H);}k[v]=true;delete this.dragOvers[v];}for(var u in F.groups){if("string"!=typeof u){continue;}for(v in this.ids[u]){var h=this.ids[u][v];if(!this.isTypeOfDD(h)){continue;}if(h.isTarget&&!h.isLocked()&&h!=F){if(this.isOverTarget(s,h,this.mode,z)){d[u]=true;if(o){G.dropEvts.push(h);}else{if(!k[h.id]){G.enterEvts.push(h);}else{G.overEvts.push(h);}this.dragOvers[h.id]=h;}}}}}this.interactionInfo={out:G.outEvts,enter:G.enterEvts,over:G.overEvts,drop:G.dropEvts,point:s,draggedRegion:z,sourceRegion:this.locationCache[F.id],validDrop:o};for(var c in d){t.push(c);}if(o&&!G.dropEvts.length){this.interactionInfo.validDrop=false;if(F.events.invalidDrop){F.onInvalidDrop(A);F.fireEvent("invalidDropEvent",{e:A});}}for(v=0;v<f.length;v++){var D=null;if(G[f[v]+"Evts"]){D=G[f[v]+"Evts"];}if(D&&D.length){var j=f[v].charAt(0).toUpperCase()+f[v].substr(1),C="onDrag"+j,l="b4Drag"+j,r="drag"+j+"Event",B="drag"+j;if(this.mode){if(F.events[l]){F[l](A,D,t);n[C]=F.fireEvent(l+"Event",{event:A,info:D,group:t});}if(F.events[B]&&(n[C]!==false)){F[C](A,D,t);F.fireEvent(r,{event:A,info:D,group:t});}}else{for(var E=0,w=D.length;E<w;++E){if(F.events[l]){F[l](A,D[E].id,t[0]);n[C]=F.fireEvent(l+"Event",{event:A,info:D[E].id,group:t[0]});}if(F.events[B]&&(n[C]!==false)){F[C](A,D[E].id,t[0]);F.fireEvent(r,{event:A,info:D[E].id,group:t[0]});}}}}}},getBestMatch:function(e){var g=null;var d=e.length;if(d==1){g=e[0];}else{for(var f=0;f<d;++f){var c=e[f];if(this.mode==this.INTERSECT&&c.cursorIsOver){g=c;break;}else{if(!g||!g.overlap||(c.overlap&&g.overlap.getArea()<c.overlap.getArea())){g=c;}}}}return g;},refreshCache:function(d){var f=d||this.ids;for(var c in f){if("string"!=typeof c){continue;}for(var e in this.ids[c]){var h=this.ids[c][e];if(this.isTypeOfDD(h)){var j=this.getLocation(h);if(j){this.locationCache[h.id]=j;}else{delete this.locationCache[h.id];}}}}},verifyEl:function(d){try{if(d){var c=d.offsetParent;if(c){return true;}}}catch(f){}return false;},getLocation:function(i){if(!this.isTypeOfDD(i)){return null;}var g=i.getEl(),m,f,d,o,n,p,c,k,h;try{m=YAHOO.util.Dom.getXY(g);}catch(j){}if(!m){return null;}f=m[0];d=f+g.offsetWidth;o=m[1];n=o+g.offsetHeight;p=o-i.padding[0];c=d+i.padding[1];k=n+i.padding[2];h=f-i.padding[3];return new YAHOO.util.Region(p,c,k,h);},isOverTarget:function(k,c,e,f){var g=this.locationCache[c.id];if(!g||!this.useCache){g=this.getLocation(c);this.locationCache[c.id]=g;}if(!g){return false;}c.cursorIsOver=g.contains(k);var j=this.dragCurrent;if(!j||(!e&&!j.constrainX&&!j.constrainY)){return c.cursorIsOver;}c.overlap=null;if(!f){var h=j.getTargetCoord(k.x,k.y);var d=j.getDragEl();f=new YAHOO.util.Region(h.y,h.x+d.offsetWidth,h.y+d.offsetHeight,h.x);}var i=f.intersect(g);if(i){c.overlap=i;return(e)?true:c.cursorIsOver;}else{return false;}},_onUnload:function(d,c){this.unregAll();},unregAll:function(){if(this.dragCurrent){this.stopDrag();this.dragCurrent=null;}this._execOnAll("unreg",[]);this.ids={};},elementCache:{},getElWrapper:function(d){var c=this.elementCache[d];if(!c||!c.el){c=this.elementCache[d]=new this.ElementWrapper(YAHOO.util.Dom.get(d));}return c;},getElement:function(c){return YAHOO.util.Dom.get(c);},getCss:function(d){var c=YAHOO.util.Dom.get(d);return(c)?c.style:null;},ElementWrapper:function(c){this.el=c||null;this.id=this.el&&c.id;this.css=this.el&&c.style;},getPosX:function(c){return YAHOO.util.Dom.getX(c);},getPosY:function(c){return YAHOO.util.Dom.getY(c);},swapNode:function(e,c){if(e.swapNode){e.swapNode(c);}else{var f=c.parentNode;var d=c.nextSibling;if(d==e){f.insertBefore(e,c);}else{if(c==e.nextSibling){f.insertBefore(c,e);}else{e.parentNode.replaceChild(c,e);f.insertBefore(e,d);}}}},getScroll:function(){var e,c,f=document.documentElement,d=document.body;if(f&&(f.scrollTop||f.scrollLeft)){e=f.scrollTop;c=f.scrollLeft;}else{if(d){e=d.scrollTop;c=d.scrollLeft;}else{}}return{top:e,left:c};},getStyle:function(d,c){return YAHOO.util.Dom.getStyle(d,c);},getScrollTop:function(){return this.getScroll().top;},getScrollLeft:function(){return this.getScroll().left;},moveToEl:function(c,e){var d=YAHOO.util.Dom.getXY(e);YAHOO.util.Dom.setXY(c,d);},getClientHeight:function(){return YAHOO.util.Dom.getViewportHeight();},getClientWidth:function(){return YAHOO.util.Dom.getViewportWidth();},numericSort:function(d,c){return(d-c);},_timeoutCount:0,_addListeners:function(){var c=YAHOO.util.DDM;if(YAHOO.util.Event&&document){c._onLoad();}else{if(c._timeoutCount>2000){}else{setTimeout(c._addListeners,10);if(document&&document.body){c._timeoutCount+=1;}}}},handleWasClicked:function(c,e){if(this.isHandle(e,c.id)){return true;}else{var d=c.parentNode;while(d){if(this.isHandle(e,d.id)){return true;}else{d=d.parentNode;}}}return false;}};}();YAHOO.util.DDM=YAHOO.util.DragDropMgr;YAHOO.util.DDM._addListeners();}(function(){var a=YAHOO.util.Event;var b=YAHOO.util.Dom;YAHOO.util.DragDrop=function(e,c,d){if(e){this.init(e,c,d);}};YAHOO.util.DragDrop.prototype={events:null,on:function(){this.subscribe.apply(this,arguments);},id:null,config:null,dragElId:null,handleElId:null,invalidHandleTypes:null,invalidHandleIds:null,invalidHandleClasses:null,startPageX:0,startPageY:0,groups:null,locked:false,lock:function(){this.locked=true;},unlock:function(){this.locked=false;},isTarget:true,padding:null,dragOnly:false,useShim:false,_domRef:null,__ygDragDrop:true,constrainX:false,constrainY:false,minX:0,maxX:0,minY:0,maxY:0,deltaX:0,deltaY:0,maintainOffset:false,xTicks:null,yTicks:null,primaryButtonOnly:true,available:false,hasOuterHandles:false,cursorIsOver:false,overlap:null,b4StartDrag:function(c,d){},startDrag:function(c,d){},b4Drag:function(c){},onDrag:function(c){},onDragEnter:function(c,d){},b4DragOver:function(c){},onDragOver:function(c,d){},b4DragOut:function(c){},onDragOut:function(c,d){},b4DragDrop:function(c){},onDragDrop:function(c,d){},onInvalidDrop:function(c){},b4EndDrag:function(c){},endDrag:function(c){},b4MouseDown:function(c){},onMouseDown:function(c){},onMouseUp:function(c){},onAvailable:function(){},getEl:function(){if(!this._domRef){this._domRef=b.get(this.id);
}return this._domRef;},getDragEl:function(){return b.get(this.dragElId);},init:function(f,c,d){this.initTarget(f,c,d);a.on(this._domRef||this.id,"mousedown",this.handleMouseDown,this,true);for(var e in this.events){this.createEvent(e+"Event");}},initTarget:function(e,c,d){this.config=d||{};this.events={};this.DDM=YAHOO.util.DDM;this.groups={};if(typeof e!=="string"){this._domRef=e;e=b.generateId(e);}this.id=e;this.addToGroup((c)?c:"default");this.handleElId=e;a.onAvailable(e,this.handleOnAvailable,this,true);this.setDragElId(e);this.invalidHandleTypes={A:"A"};this.invalidHandleIds={};this.invalidHandleClasses=[];this.applyConfig();},applyConfig:function(){this.events={mouseDown:true,b4MouseDown:true,mouseUp:true,b4StartDrag:true,startDrag:true,b4EndDrag:true,endDrag:true,drag:true,b4Drag:true,invalidDrop:true,b4DragOut:true,dragOut:true,dragEnter:true,b4DragOver:true,dragOver:true,b4DragDrop:true,dragDrop:true};if(this.config.events){for(var c in this.config.events){if(this.config.events[c]===false){this.events[c]=false;}}}this.padding=this.config.padding||[0,0,0,0];this.isTarget=(this.config.isTarget!==false);this.maintainOffset=(this.config.maintainOffset);this.primaryButtonOnly=(this.config.primaryButtonOnly!==false);this.dragOnly=((this.config.dragOnly===true)?true:false);this.useShim=((this.config.useShim===true)?true:false);},handleOnAvailable:function(){this.available=true;this.resetConstraints();this.onAvailable();},setPadding:function(e,c,f,d){if(!c&&0!==c){this.padding=[e,e,e,e];}else{if(!f&&0!==f){this.padding=[e,c,e,c];}else{this.padding=[e,c,f,d];}}},setInitPosition:function(f,e){var g=this.getEl();if(!this.DDM.verifyEl(g)){if(g&&g.style&&(g.style.display=="none")){}else{}return;}var d=f||0;var c=e||0;var h=b.getXY(g);this.initPageX=h[0]-d;this.initPageY=h[1]-c;this.lastPageX=h[0];this.lastPageY=h[1];this.setStartPosition(h);},setStartPosition:function(d){var c=d||b.getXY(this.getEl());this.deltaSetXY=null;this.startPageX=c[0];this.startPageY=c[1];},addToGroup:function(c){this.groups[c]=true;this.DDM.regDragDrop(this,c);},removeFromGroup:function(c){if(this.groups[c]){delete this.groups[c];}this.DDM.removeDDFromGroup(this,c);},setDragElId:function(c){this.dragElId=c;},setHandleElId:function(c){if(typeof c!=="string"){c=b.generateId(c);}this.handleElId=c;this.DDM.regHandle(this.id,c);},setOuterHandleElId:function(c){if(typeof c!=="string"){c=b.generateId(c);}a.on(c,"mousedown",this.handleMouseDown,this,true);this.setHandleElId(c);this.hasOuterHandles=true;},unreg:function(){a.removeListener(this.id,"mousedown",this.handleMouseDown);this._domRef=null;this.DDM._remove(this);},isLocked:function(){return(this.DDM.isLocked()||this.locked);},handleMouseDown:function(k,j){var d=k.which||k.button;if(this.primaryButtonOnly&&d>1){return;}if(this.isLocked()){return;}var c=this.b4MouseDown(k),g=true;if(this.events.b4MouseDown){g=this.fireEvent("b4MouseDownEvent",k);}var f=this.onMouseDown(k),i=true;if(this.events.mouseDown){if(f===false){i=false;}else{i=this.fireEvent("mouseDownEvent",k);}}if((c===false)||(f===false)||(g===false)||(i===false)){return;}this.DDM.refreshCache(this.groups);var h=new YAHOO.util.Point(a.getPageX(k),a.getPageY(k));if(!this.hasOuterHandles&&!this.DDM.isOverTarget(h,this)){}else{if(this.clickValidator(k)){this.setStartPosition();this.DDM.handleMouseDown(k,this);this.DDM.stopEvent(k);}else{}}},clickValidator:function(d){var c=YAHOO.util.Event.getTarget(d);return(this.isValidHandleChild(c)&&(this.id==this.handleElId||this.DDM.handleWasClicked(c,this.id)));},getTargetCoord:function(e,d){var c=e-this.deltaX;var f=d-this.deltaY;if(this.constrainX){if(c<this.minX){c=this.minX;}if(c>this.maxX){c=this.maxX;}}if(this.constrainY){if(f<this.minY){f=this.minY;}if(f>this.maxY){f=this.maxY;}}c=this.getTick(c,this.xTicks);f=this.getTick(f,this.yTicks);return{x:c,y:f};},addInvalidHandleType:function(c){var d=c.toUpperCase();this.invalidHandleTypes[d]=d;},addInvalidHandleId:function(c){if(typeof c!=="string"){c=b.generateId(c);}this.invalidHandleIds[c]=c;},addInvalidHandleClass:function(c){this.invalidHandleClasses.push(c);},removeInvalidHandleType:function(c){var d=c.toUpperCase();delete this.invalidHandleTypes[d];},removeInvalidHandleId:function(c){if(typeof c!=="string"){c=b.generateId(c);}delete this.invalidHandleIds[c];},removeInvalidHandleClass:function(d){for(var e=0,c=this.invalidHandleClasses.length;e<c;++e){if(this.invalidHandleClasses[e]==d){delete this.invalidHandleClasses[e];}}},isValidHandleChild:function(g){var f=true;var j;try{j=g.nodeName.toUpperCase();}catch(h){j=g.nodeName;}f=f&&!this.invalidHandleTypes[j];f=f&&!this.invalidHandleIds[g.id];for(var d=0,c=this.invalidHandleClasses.length;f&&d<c;++d){f=!b.hasClass(g,this.invalidHandleClasses[d]);}return f;},setXTicks:function(f,c){this.xTicks=[];this.xTickSize=c;var e={};for(var d=this.initPageX;d>=this.minX;d=d-c){if(!e[d]){this.xTicks[this.xTicks.length]=d;e[d]=true;}}for(d=this.initPageX;d<=this.maxX;d=d+c){if(!e[d]){this.xTicks[this.xTicks.length]=d;e[d]=true;}}this.xTicks.sort(this.DDM.numericSort);},setYTicks:function(f,c){this.yTicks=[];this.yTickSize=c;var e={};for(var d=this.initPageY;d>=this.minY;d=d-c){if(!e[d]){this.yTicks[this.yTicks.length]=d;e[d]=true;}}for(d=this.initPageY;d<=this.maxY;d=d+c){if(!e[d]){this.yTicks[this.yTicks.length]=d;e[d]=true;}}this.yTicks.sort(this.DDM.numericSort);},setXConstraint:function(e,d,c){this.leftConstraint=parseInt(e,10);this.rightConstraint=parseInt(d,10);this.minX=this.initPageX-this.leftConstraint;this.maxX=this.initPageX+this.rightConstraint;if(c){this.setXTicks(this.initPageX,c);}this.constrainX=true;},clearConstraints:function(){this.constrainX=false;this.constrainY=false;this.clearTicks();},clearTicks:function(){this.xTicks=null;this.yTicks=null;this.xTickSize=0;this.yTickSize=0;},setYConstraint:function(c,e,d){this.topConstraint=parseInt(c,10);this.bottomConstraint=parseInt(e,10);this.minY=this.initPageY-this.topConstraint;this.maxY=this.initPageY+this.bottomConstraint;
if(d){this.setYTicks(this.initPageY,d);}this.constrainY=true;},resetConstraints:function(){if(this.initPageX||this.initPageX===0){var d=(this.maintainOffset)?this.lastPageX-this.initPageX:0;var c=(this.maintainOffset)?this.lastPageY-this.initPageY:0;this.setInitPosition(d,c);}else{this.setInitPosition();}if(this.constrainX){this.setXConstraint(this.leftConstraint,this.rightConstraint,this.xTickSize);}if(this.constrainY){this.setYConstraint(this.topConstraint,this.bottomConstraint,this.yTickSize);}},getTick:function(j,f){if(!f){return j;}else{if(f[0]>=j){return f[0];}else{for(var d=0,c=f.length;d<c;++d){var e=d+1;if(f[e]&&f[e]>=j){var h=j-f[d];var g=f[e]-j;return(g>h)?f[d]:f[e];}}return f[f.length-1];}}},toString:function(){return("DragDrop "+this.id);}};YAHOO.augment(YAHOO.util.DragDrop,YAHOO.util.EventProvider);})();YAHOO.util.DD=function(c,a,b){if(c){this.init(c,a,b);}};YAHOO.extend(YAHOO.util.DD,YAHOO.util.DragDrop,{scroll:true,autoOffset:function(c,b){var a=c-this.startPageX;var d=b-this.startPageY;this.setDelta(a,d);},setDelta:function(b,a){this.deltaX=b;this.deltaY=a;},setDragElPos:function(c,b){var a=this.getDragEl();this.alignElWithMouse(a,c,b);},alignElWithMouse:function(c,g,f){var e=this.getTargetCoord(g,f);if(!this.deltaSetXY){var h=[e.x,e.y];YAHOO.util.Dom.setXY(c,h);var d=parseInt(YAHOO.util.Dom.getStyle(c,"left"),10);var b=parseInt(YAHOO.util.Dom.getStyle(c,"top"),10);this.deltaSetXY=[d-e.x,b-e.y];}else{YAHOO.util.Dom.setStyle(c,"left",(e.x+this.deltaSetXY[0])+"px");YAHOO.util.Dom.setStyle(c,"top",(e.y+this.deltaSetXY[1])+"px");}this.cachePosition(e.x,e.y);var a=this;setTimeout(function(){a.autoScroll.call(a,e.x,e.y,c.offsetHeight,c.offsetWidth);},0);},cachePosition:function(b,a){if(b){this.lastPageX=b;this.lastPageY=a;}else{var c=YAHOO.util.Dom.getXY(this.getEl());this.lastPageX=c[0];this.lastPageY=c[1];}},autoScroll:function(k,j,e,l){if(this.scroll){var m=this.DDM.getClientHeight();var b=this.DDM.getClientWidth();var o=this.DDM.getScrollTop();var d=this.DDM.getScrollLeft();var i=e+j;var n=l+k;var g=(m+o-j-this.deltaY);var f=(b+d-k-this.deltaX);var c=40;var a=(document.all)?80:30;if(i>m&&g<c){window.scrollTo(d,o+a);}if(j<o&&o>0&&j-o<c){window.scrollTo(d,o-a);}if(n>b&&f<c){window.scrollTo(d+a,o);}if(k<d&&d>0&&k-d<c){window.scrollTo(d-a,o);}}},applyConfig:function(){YAHOO.util.DD.superclass.applyConfig.call(this);this.scroll=(this.config.scroll!==false);},b4MouseDown:function(a){this.setStartPosition();this.autoOffset(YAHOO.util.Event.getPageX(a),YAHOO.util.Event.getPageY(a));},b4Drag:function(a){this.setDragElPos(YAHOO.util.Event.getPageX(a),YAHOO.util.Event.getPageY(a));},toString:function(){return("DD "+this.id);}});YAHOO.util.DDProxy=function(c,a,b){if(c){this.init(c,a,b);this.initFrame();}};YAHOO.util.DDProxy.dragElId="ygddfdiv";YAHOO.extend(YAHOO.util.DDProxy,YAHOO.util.DD,{resizeFrame:true,centerFrame:false,createFrame:function(){var b=this,a=document.body;if(!a||!a.firstChild){setTimeout(function(){b.createFrame();},50);return;}var f=this.getDragEl(),e=YAHOO.util.Dom;if(!f){f=document.createElement("div");f.id=this.dragElId;var d=f.style;d.position="absolute";d.visibility="hidden";d.cursor="move";d.border="2px solid #aaa";d.zIndex=999;d.height="25px";d.width="25px";var c=document.createElement("div");e.setStyle(c,"height","100%");e.setStyle(c,"width","100%");e.setStyle(c,"background-color","#ccc");e.setStyle(c,"opacity","0");f.appendChild(c);a.insertBefore(f,a.firstChild);}},initFrame:function(){this.createFrame();},applyConfig:function(){YAHOO.util.DDProxy.superclass.applyConfig.call(this);this.resizeFrame=(this.config.resizeFrame!==false);this.centerFrame=(this.config.centerFrame);this.setDragElId(this.config.dragElId||YAHOO.util.DDProxy.dragElId);},showFrame:function(e,d){var c=this.getEl();var a=this.getDragEl();var b=a.style;this._resizeProxy();if(this.centerFrame){this.setDelta(Math.round(parseInt(b.width,10)/2),Math.round(parseInt(b.height,10)/2));}this.setDragElPos(e,d);YAHOO.util.Dom.setStyle(a,"visibility","visible");},_resizeProxy:function(){if(this.resizeFrame){var h=YAHOO.util.Dom;var b=this.getEl();var c=this.getDragEl();var g=parseInt(h.getStyle(c,"borderTopWidth"),10);var i=parseInt(h.getStyle(c,"borderRightWidth"),10);var f=parseInt(h.getStyle(c,"borderBottomWidth"),10);var d=parseInt(h.getStyle(c,"borderLeftWidth"),10);if(isNaN(g)){g=0;}if(isNaN(i)){i=0;}if(isNaN(f)){f=0;}if(isNaN(d)){d=0;}var e=Math.max(0,b.offsetWidth-i-d);var a=Math.max(0,b.offsetHeight-g-f);h.setStyle(c,"width",e+"px");h.setStyle(c,"height",a+"px");}},b4MouseDown:function(b){this.setStartPosition();var a=YAHOO.util.Event.getPageX(b);var c=YAHOO.util.Event.getPageY(b);this.autoOffset(a,c);},b4StartDrag:function(a,b){this.showFrame(a,b);},b4EndDrag:function(a){YAHOO.util.Dom.setStyle(this.getDragEl(),"visibility","hidden");},endDrag:function(d){var c=YAHOO.util.Dom;var b=this.getEl();var a=this.getDragEl();c.setStyle(a,"visibility","");c.setStyle(b,"visibility","hidden");YAHOO.util.DDM.moveToEl(b,a);c.setStyle(a,"visibility","hidden");c.setStyle(b,"visibility","");},toString:function(){return("DDProxy "+this.id);}});YAHOO.util.DDTarget=function(c,a,b){if(c){this.initTarget(c,a,b);}};YAHOO.extend(YAHOO.util.DDTarget,YAHOO.util.DragDrop,{toString:function(){return("DDTarget "+this.id);}});YAHOO.register("dragdrop",YAHOO.util.DragDropMgr,{version:"@VERSION@",build:"@BUILD@"});