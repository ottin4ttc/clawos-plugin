/* @meta
{"name":"liepin/send-greet","description":"向候选人打招呼","domain":"h.liepin.com","args":{"userId":{"required":true,"description":"候选人usercIdEncode"},"msg":{"required":false,"description":"自定义招呼语"},"jobId":{"required":false,"description":"关联职位ID"}}}
*/
async function(args) {
  if (!args.userId) return {error:'Missing userId'};
  var xsrf = document.cookie.split(';').map(function(c){return c.trim()}).find(function(c){return c.startsWith('XSRF-TOKEN')});
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;
  var params = 'imId=&imApp=1&userId='+args.userId+'&encodeUsercId='+args.userId+'&hasSayHi=true&ck_id='+crypto.randomUUID()+'&selectedJobId='+(args.jobId||'')+'&strongRelation=false&strongGuidance=false&jobKind=1&resSource=h_search&msg='+encodeURIComponent(args.msg||'');
  var r = await fetch('https://api-h.liepin.com/api/com.liepin.im.h.chat.to-chat',{method:'POST',credentials:'include',headers:h,body:params});
  var d = await r.json();
  if (d.flag !== 1) return {error:d.msg||'greet failed',code:d.code};
  return {success:true,userId:args.userId};
}
