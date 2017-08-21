/**
 * Created by Center on 2017/4/1.
 */
const G_HEAD = 0xAA75;
module.exports = function() {
	return async function (ctx,next) {
		console.log("start data check...");
		if(!ctx.request.state){
			if(ctx.request.rvLen >= 6){
				let buffer = Buffer.concat(ctx.request.dataBuffers, 6);
				let dHead = buffer.readUInt16BE(0);
				if(G_HEAD != dHead){
					throw new Error("数据头错误");
				}
				ctx.request.cmd = buffer.readUInt16BE(2); // cmd
				ctx.request.dataLen = buffer.readUInt16BE(4);
				ctx.request.state = true;
			}
		}
		if(ctx.request.state){
			if(ctx.request.rvLen >= ctx.request.dataLen + 6){ // 数据完整
				ctx.request.state = false;
				var buffer = Buffer.concat(ctx.request.dataBuffers);
				ctx.request.data = buffer.slice(6,ctx.request.dataLen + 6);
				console.log("start deal with business...");
				await next();
				ctx.request.rvLen = ctx.request.rvLen - ctx.request.dataLen -6; // 10 header
				ctx.request.dataBuffers .length = 0;
				if(ctx.request.rvLen > 0){
					ctx.request.dataBuffers.push(buffer.slice(ctx.request.dataLen + 6));
				}
			}
		}
	};
};
