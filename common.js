var isAndroid = navigator.userAgent.indexOf('Android') > -1 || navigator.userAgent.indexOf('Linux') > -1; //android终端或者uc浏览器
var isIOS = !!(navigator.userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/)); //IOS 设备
var bridge; // 用于挂载IOS的所有方法 （Android挂载在 Android.onTransact 上）
var basic = {};	// 用于挂载基本参数 （10个）
document.addEventListener("DOMContentLoaded", function(){
	if (isIOS) {
		InjectWebView()
		.then(function(webview){
			Init(webview)
		})
		.catch(function(e){
			alert("promise："+e);
		})
	}else{
		HMF_requestBaseData();  
	}
}, false);
/***
* ios初始化方法
*/
function InjectWebView(){
	return new Promise(function(resolve, reject){
		if (window.WebViewJavascriptBridge) {
			resolve(WebViewJavascriptBridge);
		}else{
			document.addEventListener('WebViewJavascriptBridgeReady', function() {
				resolve(WebViewJavascriptBridge);
			}, false)
		}
	}) 
}
/***
* ios初始化方法
*/
function Init(webview) {
	return new Promise(function(resolve, reject){
		bridge = webview;
		bridge.init(function(message, responseCallback) {
			log('JS got a message', message);
			var data = { 'Javascript Responds': 'Wee!'};
			log('JS responding with', data);
			responseCallback(data);
		})
		var Handler = bridge.callHandler;
	 	HMF_requestBaseData();
	})
}
/***
* 调用 安卓和ios方法
*/
function bridgeCallHandler(fname, data, ObjectClass) {
	if(isIOS){
		bridge.callHandler(fname, data, function(response) {
			response = jsonStringify(response);
			ObjectClass != null && ObjectClass.responseCallback(response);
		})
	} else if(isAndroid) {
		var jData = jsonStringify(data);
		var _Transact = Android.onTransact(fname, jData); 
		ObjectClass != null && ObjectClass.responseCallback(_Transact);
	}
}
/***
* json对象转字符串
*/
function jsonStringify(items){
	var json = "{";
	for(var item in items){
	 	json+='"'+item+'":"'+items[item]+'",';
	}
	json = json.substring(0,json.length-1)+"}";
	return json;  
};

/***
* 获取基本参数
*/
function HMF_requestBaseData(){
   	bridgeCallHandler("HMF_requestBaseData", "", {
			responseCallback: function(data){
			var jsonData = JSON.parse(data);
			basic = {
				device_id: jsonData.device_id,
				device_os: jsonData.device_os,
				device_osversion: jsonData.device_osversion,
				device_type: jsonData.device_type,
				q_version: jsonData.q_version,
				sessionToken: jsonData.sessionToken,
				app_name: jsonData.app_name,
				req_timestamp: jsonData.req_timestamp,
				userId: jsonData.userId
			}
			try{
				onLoadReady();
			}catch(e){
				alert("onLoadReady:"+ e);
			}
   		}
   	})
}


/***
* PC获取模拟获取基本参数
*/
function getSign(params, callback) { 
 	basic = {
		"userId": window.localStorage.getItem("userId"),
		"sessionToken": window.localStorage.getItem("sessionToken"),
		"device_osversion": "9.3.1",
		"q_version": "2.5.0622",
		"device_type": "iPhone 5s",
		"req_timestamp": "1477559717410",
		"device_id": "b96738d6ce1200d349132e27e554035777c54307",
		"app_name": "forums",
		"device_os": "iOS"
    }
 	for(var i in basic){
 		params[i] = basic[i];
 	}
    params.sign && delete params.sign;
    var signSalt = "dev-sign-salt-1234";
    var keys = Object.keys(params).sort();
    var sign = signSalt;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if ("sign" !== key && !/file_/.test(key)) {
            sign += key + params[key];
        }
    }
    if (!MD5 instanceof Object) {
    	alert("请引入MD5.min.js");
    }
    sign += signSalt;
    sign = MD5.hex_md5(sign).toUpperCase();
    var obj = {
        errorCode: 0,
        sign: sign
    }
    callback["responseCallback"](JSON.stringify(obj));
}
/***
** 登入接口 loginAjax("19500000001")
*/
function loginAjax(user){
	if (!isPath201) alert("未定义变量isPath201");
	var loginRequest = {
	    url: isPath201 + "/forums/user/loginbyauthcode",
	    params: {
	        "phoneNumber": user || "19500000001",
	        "authCode": "1234",
	        "device_os": "iOS",
	        "device_osversion": "9.3.1",
	        "device_type": "iPhone 5s",
	        "q_version": "2.5.0622",
	        "req_timestamp": +new Date(),
	        "device_id": "b96738d6ce1200d349132e27e554035777c54307"
	    }
	}
    $.ajax({
        type: "get",
        url: loginRequest.url,
        async: false,
        dateType: "json",
        data: loginRequest.params,
        success: function(data){
            var jsonData = data;
            var userId = jsonData["user"]["userId"];
            var sessionToken = jsonData["sessionToken"];
            window.localStorage.setItem("账号", user);
            window.localStorage.setItem("userId", userId);
            window.localStorage.setItem("sessionToken", sessionToken);
            console.log("登入成功! userId:"+userId +" 账号:"+ user);
        },
        error: function(XMLHttpRequest){
            alert("登入失败:" + XMLHttpRequest);
        }
    })  
}

/***
* 警告弹窗
*/ 
function HMF_requestShowAlertView(message, btn){
	var message = {
		alertId: 52,
		message: message,
		cancelButtonTitle: btn || "确定"
	}
	try{
   		bridgeCallHandler("HMF_requestShowAlertView", message, null);
   	}catch(e){
   		alert("系统繁忙");
   	}
}
/***
** 是否登入弹框
*/
function HMF_requsetUserLogin(msg){
	var obj = {
		message: msg || "该操作需要登入，现在登入？"
	}
 	try{
   		bridgeCallHandler("HMF_requsetUserLogin", obj, null);
   	}catch(e){
   		alert("系统繁忙");
   	}
}
/***
* 调用客户端弹窗
*/ 
function HMF_requestShowToast(message){
    try{
   		bridgeCallHandler("HMF_requestShowToast", {message: message}, null);	
   		jsonData = null;
   	}catch(e){
   		alert(message);
   	}
}
/***
* 隐藏分享功能
*/
function HMF_webTopRightButtonMoreVisible(){
	try {
		bridgeCallHandler("HMF_webTopRightButtonMoreVisible", {visible: 0}, null)
	}catch(e){
		alert("系统繁忙");
	}
}
/***
* 静止滑动
*/ 
function executeWebView(){
	try{
		hmf_jsNativeIOSInvoke("HMF_iOSExecuteWebView", 
		   	{
		   		"selector": "setValue:forKeyPath:",
		   		"parameters": [0, "scrollView.bounces"]
		   	}, 
		   	function(responseData){
		   		//
		   	}
		)	
	}catch(e){
		alert("系统繁忙")
	}
}
/***
* 分享信息发布给客户端
*/ 
function HMF_getShareData(shareTitle, shareContent, sharePic){
	var jsonData = {
		shareTitle: shareTitle,
		shareContent: shareContent,
		sharePic: sharePic
	}
	try{
		bridgeCallHandler("HMF_getShareData", jsonData, null)
	}catch(e){
		alert("系统繁忙");
	}
}
/***
** 跳转到个人详情
*/
function HMF_requestJumpToUserProfile(userId){
	try {
		bridgeCallHandler("HMF_requestJumpToUserProfile", {userId: userId}, null);
	}catch(e){
		alert("系统繁忙");
	}
}
/***
** 询问弹窗
*/
function HMF_requestShowAlertView(message, cancelButtonTitle, otherButtonTitle, callback){
	var jsonData = {
		alertId: "alertId52",
		message: message,
		cancelButtonTitle: cancelButtonTitle,
		otherButtonTitle: otherButtonTitle
	}
    try{
	    bridgeCallHandler('HMF_requestShowAlertView', jsonData, callback);	
	}catch(e){
		alert("系统繁忙");
	}
}
/****
 * 更改导航栏标题
 */ 
function HMF_setTitle(title){
	var message = {
		title: title
	}
	try{
   		bridgeCallHandler("HMF_setTitle", message, null);
   	}catch(e){
   		alert("系统繁忙");
   	}
}
/****
 * 跳转帖子详情
 */ 
function HMF_requestJumpToPostDetails(postId){
	var message = {
		postId: postId
	}
	try{
   		bridgeCallHandler("HMF_requestJumpToPostDetails", message, null);
   	}catch(e){
   		alert("系统繁忙");
   	}
}
/***
* 关闭当前页面
*/ 
function HMF_requestCloseCurrentView(){
    try{
   		bridgeCallHandler("HMF_requestCloseCurrentView", {close: 1}, null);
   	}catch(e){
   		alert("系统繁忙");
   	}
}
function hmf_jsNativeIOSInvoke(invokeName, invokeParameters, callback) {
	"use strict";
	// alert("invokeName: "+invokeName+" 2: "+invokeParameters+" callback: "+callback)
	var jsInvoke = "js_invoke";
	var jsInvokeIdName = "js_invokeid";
	var jsInvokeCallback = "js_callback";
	var jsInvokeParameters = "js_invokeparameters";
	var invokeId = hmf_jsNativeInvokeIdGenerator(invokeName);
	var link = "//forums_jsaction/callnative?" + jsInvoke + "=" + invokeName;
	link = link + "&" + jsInvokeIdName + "=" + invokeId;
	link = link + "&" + jsInvokeCallback + "=" + "hmf_jsNativeIOSInvokeCallback";
	if (invokeParameters != null) {
		link = link + "&" + jsInvokeParameters + "=" + JSON.stringify(invokeParameters);
	}
	if (callback) {
		hmf_jsNativeIOSInvokeCallback[invokeId] = callback;
	}
	if (isAndroid) {
		window.open(link);
	}else{
		window.location.href = link;
	}
	
}
function hmf_jsNativeIOSInvokeCallback(result) {
	"use strict";
	var invokeParameters = result["invokeParameters"];
	var responseData = result["responseData"];

	var invokeId = invokeParameters["js_invokeid"];
	var callbackFunction = hmf_jsNativeIOSInvokeCallback[invokeId];
	if (callbackFunction != null) {
		callbackFunction(responseData);
	}
	delete hmf_jsNativeIOSInvokeCallback[invokeId];
}
function hmf_jsNativeInvokeIdGenerator(invokeName) {
	"use strict";
	if (hmf_jsNativeInvokeIdGenerator.currentId == null) {
		hmf_jsNativeInvokeIdGenerator.currentId = 0;
	}
	hmf_jsNativeInvokeIdGenerator.currentId++;
	return invokeName + hmf_jsNativeInvokeIdGenerator.currentId;
}
/***
* 获取url data
*/ 
var getUrlData = function(attr){
	var url = location.search;
	var obj = {};
	var arr = url.substr(1).split("&")
	for (var i = 0; i < arr.length; i++) {
		obj[arr[i].split("=")[0]] = arr[i].split("=")[1];
	}
	return obj[attr];
}
//写cookies
function setCookie(name, value, expiredays){
	var Days = expiredays;
	var exp = new Date();
	exp.setTime(exp.getTime() + Days);
	document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString();
}
//读取cookies
function getCookie(name){
    var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
    arr= document.cookie.match(reg)
    if(arr){
        return (arr[2]);
    }
    else{
        return null;
    }
}
//删除cookies
function delCookie(name){
	var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval=getCookie(name);
    if(cval!=null)
    document.cookie= name + "="+cval+";expires="+exp.toGMTString();
}
//随机数
function rand(start, end){
	// @param 包括起始值 和 终点值
	// 返回一个数字
	// rand(end-start)+start 范围值随机加限定的最小值
	// 判断end是否大于start
	if (start > end) {var i = 0;i = start;start = end;end = i;};
	return Math.floor(Math.random()*(end-start+1))+start;
}
/***
* 随机不重复数字
*/ 
function randomNoRepeat(leng, start, end){
	// @param 随机个数，起始值，终点值
	// 返回一个数组
	var arr = [];
	while(arr.length < leng){
		var i = rand(start, end)
		arr.indexOf(i) == -1 && arr.push(i);
	}
	return arr;
}
//时间格式化
Date.prototype.format = function(fmt) {
	// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
	// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
	if (!fmt) return 0;
	var obj = {
		"M+": this.getMonth() + 1, //月份 
		"d+": this.getDate(), //日 
		"h+": this.getHours(), //小时 
		"m+": this.getMinutes(), //分 
		"s+": this.getSeconds(), //秒 
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度 
		"S": this.getMilliseconds() //毫秒 
	};
	if (/(y+)/.test(fmt)){
		fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	}
	for (var i in obj){
		if (new RegExp("(" + i + ")").test(fmt)){
			fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (obj[i]) : (("00" + obj[i]).substr(("" + obj[i]).length)));
		}
	}
	return fmt;
}
/*
* get sign -> ajax -> return data
*/
var requestAjax = function(url, params){
	return new Promise(function(resolve, reject) {
		"sign" in params && delete params["sign"];
		for(var key in basic){
			params[key] = basic[key];
		}
		var callback = {
			responseCallback: function(data){
				var jsonData = JSON.parse(data); 
	            var errorCode =  jsonData.errorCode;
	            var errMsg = jsonData.errMsg;
	            if(errorCode == 0){
	                params.sign = jsonData.sign
	                $.ajax({
						url: url,
						type: "get",
						data: params,
						dataType: "json",
						success: function(data){
							resolve(data);
						},
						error: function(error){
							reject("ajaxError");
						}
					})
	            }else{
	            	reject("signError");
	            }
			}
		}
		try{
			if (isOnPc) {
				getSign(params, callback)
				return;
			}
		}catch(e){}
		bridgeCallHandler("HMF_requestSign", params, callback);
	})
}
