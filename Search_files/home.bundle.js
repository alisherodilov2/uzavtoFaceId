(window.webpackJsonp=window.webpackJsonp||[]).push([[3],{467:function(e,t){e.exports='\x3c!-- <div header></div>\r\n<div ui-view="content" class="content"></div>\r\n<div class="footerNone">©2018 neutral Digital Technology Co., Ltd. All Rights Reserved.</div> --\x3e\r\n<div header ng-if="!nohead"></div>\r\n<div ui-view="content" class="content" ng-class="{true: \'content-without-head\'}[nohead]"></div>\r\n<div class="footerNone">\r\n    <div class="copyright" id="loginFooter"></div>\r\n</div>'},468:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=function(e,t,n){return t&&o(e.prototype,t),n&&o(e,n),e};function o(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}var a=d(n(954)),r=d(n(6)),s=d(n(5)),u=d(n(14)),c=d(n(1)),l=d(n(28)),f=d(n(2));function d(e){return e&&e.__esModule?e:{default:e}}function g(e){return function(){var s=e.apply(this,arguments);return new Promise(function(a,r){return function t(e,n){try{var i=s[e](n),o=i.value}catch(e){return void r(e)}if(!i.done)return Promise.resolve(o).then(function(e){t("next",e)},function(e){t("throw",e)});a(o)}("next")})}}var p,v=(i(h,[{key:"init",value:function(){var n=this;a.default.init(function(){setTimeout(function(){JSON.parse(u.default.getItem("deviceInfo"))?window.location.href="./doc/dispatch/close.asp":n.$state.go("login")},1e3)}),this.scope.$on("$stateChangeSuccess",g(regeneratorRuntime.mark(function e(){var t;return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:t=n.$state.current.name.split(".")[1],document.title=a.default.oLan[t];case 2:case"end":return e.stop()}},e,n)}))),this.scope.$on("$destroy",g(regeneratorRuntime.mark(function e(){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:r.default.removePlugin();case 1:case"end":return e.stop()}},e,this)}))),f.default.getDeviceDispatchInfo()&&"ezviz"===f.default.getDeviceDispatchInfo().mode&&(this.bFooterShow=!1),this.bFooterShow&&$("#loginFooter").text("©20"+l.default.szWebVersion.substr(l.default.szWebVersion.indexOf("build")+5,2)+" neutral Digital Technology Co., Ltd. All Rights Reserved."),a.default.getUsername().then(function(e){n.szUsername=e,n.scope.$digest()})}},{key:"jumpTo",value:(p=g(regeneratorRuntime.mark(function e(t,n){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:if(this.szNavActive===t)return e.abrupt("return");e.next=2;break;case 2:if("home.intelligentDisplay"!==t){e.next=14;break}e.prev=3,localStorage.getItem("test"),e.next=11;break;case 7:return e.prev=7,e.t0=e.catch(3),s.default.alert('<div style="padding:10px;">'+c.default.getValue("openIntelligentDisplayTip")+"</div>"),e.abrupt("return");case 11:if($.browser.msie&&parseInt($.browser.version,10)<11)return s.default.alert('<div style="padding:10px;">'+c.default.getValue("openIntelligentDisplayTipIeLess11")+"</div>"),e.abrupt("return");e.next=14;break;case 14:$("#MultiVideoActiveX").remove(),this.szNavActive=t,this.$state.go(t,{messageId:n||""});case 17:case"end":return e.stop()}},e,this,[[3,7]])})),function(e,t){return p.apply(this,arguments)})},{key:"logout",value:function(){var e=this;a.default.logout().then(function(){e.$state.go("login")})}},{key:"help",value:function(){a.default.help()}}]),h);function h(e,t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,h),this.$state=t,this.scope=e,this.bFooterShow=!0,this.init();var n=t.current.name.split(".")[0]+"."+t.current.name.split(".")[1];this.szNavActive=n,this.oLan=a.default.oLan,this.szUsername="",window.hideState=t,this.scope.nohead="true"===t.params.nohead,this.scope.nofoot="true"===t.params.nofoot}(t.default=v).$inject=["$scope","$state"]},954:function(e,t,n){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var i=function(e,t,n){return t&&o(e.prototype,t),n&&o(e,n),e};function o(e,t){for(var n=0;n<t.length;n++){var i=t[n];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}var a=g(n(9)),r=g(n(1)),s=g(n(5)),u=g(n(6)),c=g(n(14)),l=g(n(18)),f=g(n(28)),d=g(n(10));function g(e){return e&&e.__esModule?e:{default:e}}var p,v,h=(i(m,[{key:"init",value:(p=regeneratorRuntime.mark(function e(t){return regeneratorRuntime.wrap(function(e){for(;;)switch(e.prev=e.next){case 0:a.default.setRequestOptions({401:function(){t&&t()}}),($.cookie("language")||c.default.getItem("language"))&&r.default.getLanguages(["Common","Login","Preview","Playback","Download","Application","Config","panoramicMap","deviceManage"]),this.oLan=r.default.oLastLanguage,s.default.initConfig();case 4:case"end":return e.stop()}},e,this)}),v=function(){var s=p.apply(this,arguments);return new Promise(function(a,r){return function t(e,n){try{var i=s[e](n),o=i.value}catch(e){return void r(e)}if(!i.done)return Promise.resolve(o).then(function(e){t("next",e)},function(e){t("throw",e)});a(o)}("next")})},function(e){return v.apply(this,arguments)})},{key:"logout",value:function(){return new Promise(function(e,t){u.default.hidePlugin(),s.default.confirm(r.default.getValue("confirmLogout"),300,function(){a.default.logout().then(function(){e()},function(){t()})},function(){u.default.showPlugin()})})}},{key:"help",value:function(){var e=$.cookie("language");"zh"!==e&&(e="en");var t="../../help/"+e+"/index.html?version="+f.default.szPluginVersion,n=location.hash.split("/")[2];if("config"!==n)"download"===n&&(n="picture"),t=t+"&page="+n;else{var i=location.hash.split("/")[3],o=location.hash.split("/")[4];"systemBasicConfig"!==i&&"systemMaintain"!==i&&"systemSecurity"!==i&&"systemUserManager"!==i||(i="system","deviceInfo"===o&&(o="settingBasic"),"timeSetting"===o&&(o="settingTime"),"dstSetting"===o&&(o="settingDST"),"rs232"===o&&(o="setting232"),"rs485"===o&&(o="setting485"),"about"===o&&(o="aboutDevice"),"multiVCAResource"===o&&(o="settingVCAResource")),"netBasicConfig"!==i&&"netAdvancedConfig"!==i||(i="network"),"smartEvent"!==i&&"commonEvent"!==i||(i="event"),"storagePlanConfig"!==i&&"storageManageConfig"!==i||(i="storage"),"tempMeasConfig"===i&&(i="tempMeas"),"imageConfig"===i&&(i="image"),"ptzConfig"===i&&(i="ptzCfg"),"commonITS"===i&&(i="ITS"),t=t+"&page="+i+"&subpage="+o}window.open(d.default.handleHelpUrl(t,"get"))}},{key:"getUsername",value:function(){return new Promise(function(n){setTimeout(function(){var e=c.default.getItem("authInfo"),t={name:"admin"};e&&(t=JSON.parse(l.default.decodeBase64(e))),n(t.name)},1e3)})}}]),m);function m(){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,m)}t.default=new h}}]);