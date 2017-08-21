/**
 * Created by Center on 2017/3/31.
 */
var net = require('net');
function context(socket,cet) {
	// 基本数据
	this.cet = cet;
	this.socket = socket;
	this.mqttClient = null;
	// 请求响应
	this.request = {}; // 请求结构
	this.response = {};// 响应结构
	
	// 辅助数据
	this.request.dataBuffers = [];
	var that = this;
	this.request.rvLen = 0;
	this.request.state =false;
	function register() {
		// 错误事件监听
		that.socket.on('error', function(e) {
			console.log("socket error:" + e);
			that.cet.remove(that);
			that.socket.destroy();
		});
		// 关闭事件监听
		that.socket.on('close', function(e) {
			if(e){
				console.log("Client  accidentally closed!");
				that.socket.destroy();
			}else {
				console.log("Client  closed!");
			}
			if(that.mqttClient){
				that.mqttClient.end();
				that.mqttClient=null;
			}
			that.cet.remove(that);
		});
		// receive data
		that.socket.on('data', function(data) {
			that.request.dataBuffers.push(data);
			that.request.rvLen += data.length;
			// 激发中间件处理接收到的数据
			that.cet.trigger(that).then(function () {
				if(that.response.data){
					that.send(that.response.data); // 发送响应数据
					if(that.response.status != 200){
						that.close();
					}
					that.response = {}; // 初始化响应
				}
			}).catch(function (err) {
				console.log("error:"  + err.message);
				that.close();
			});
		});
	}
	register();
}
context.prototype = {
	send:function (buffer) {
		return this.socket.write(buffer);
	},
	close:function () {
		this.socket.end();
	}
};
module.exports = context;