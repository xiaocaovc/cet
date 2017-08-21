/**
 * Created by Center on 2017/3/31.
 */
var net = require('net');
var Context = require("./context");
function cet() {
	this.middleware = [];
	this.clientList = [];
	this.server = null;
}
Array.prototype.remove = function(val) {
	for(var i=0; i<this.length; i++) {
		if(this[i] == val) {
			this.splice(i, 1);
			break;
		}
	}
}

cet.prototype = {
	trigger: async function (ctx){
		var that = this;
		var n = 0;
		var next = async function () {
			if(that.middleware[n]){
				await that.middleware[n++](ctx,next);
			}
		};
		await next();
	},
	use:function (func) {
		this.middleware.push(func);
	},
	createServer:function(port){
		this.server = net.createServer();
		if(!this.server)
		{
			return null;
		}
		var that = this;
		this.server.on('error', function(e) {
			console.log("cet error:" + e);
		});
		this.server.on('close', function(e) {
			console.log("cet close:" + e);
		});
		this.server.listen(port, function(e){
		});
		// connection:
		this.server.on('connection', function(socket) {
			console.log('Connection: ' + socket.remoteAddress + ':' + socket.remotePort);
			socket.setKeepAlive(true);
			new Context(socket,that);
		});
		return this;
	},
	close:function(){
		if(!this.server ){
			return;
		}
		this.server.close();
	},
	createClient:function(port,ip) {
	  var socket = net.connect({port: port,host:ip});
	  return new Context(socket,this,port,ip);
	},
	remove:function (ctx) {
		this.clientList.remove(ctx);
	},
	register:function (ctx) {
		var len = this.clientList.length;
		for(let i=0;i<len;i++){
			if(this.clientList[i].request.clientId  == ctx.request.clientId){
				if(this.clientList[i].mqttClient){
					this.clientList[i].mqttClient.end();
					this.clientList[i].mqttClient=null;
				}
				this.clientList.splice(i, 1);
				break;
			}
		}
		this.clientList.push(ctx);
	},
	getContext:function (id) {
		var len = this.clientList.length;
		for(let i=0;i<len;i++){
			if(this.clientList[i].request.clientId  == id){
				return this.clientList[i];
			}
		}
		return null;
	}
};
module.exports = cet;