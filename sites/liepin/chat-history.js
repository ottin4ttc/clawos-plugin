/* @meta
{
  "name": "liepin/chat-history",
  "description": "获取与某个候选人的聊天记录",
  "domain": "h.liepin.com",
  "args": {
    "oppositeImId": {"required": true, "description": "对方的 imId（从 liepin/conversations 获取）"},
    "pageSize": {"required": false, "description": "消息数量，默认 20"}
  },
  "readOnly": true,
  "example": "clawos site liepin/chat-history 92acd0b4e61923db3236da4ede1d7827"
}
*/
async function(args) {
  if (!args.oppositeImId) return {error: 'Missing argument: oppositeImId'};
  var pageSize = args.pageSize || 20;

  var xsrf = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN'));
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;

  var userResp = await fetch('https://api-im.liepin.com/api/com.liepin.cbp.im.get-user-info', {
    method: 'POST', credentials: 'include', headers: h,
    body: 'imUserType=2&imId=&imApp=1&deviceType=0'
  });
  var userData = await userResp.json();
  var imId = userData.data?.imId;
  if (!imId) return {error: 'Cannot get imId'};

  var resp = await fetch('https://api-h.liepin.com/api/com.liepin.im.h.chat.chat-list', {
    method: 'POST', credentials: 'include', headers: h,
    body: 'imUserType=2&imId=' + imId + '&imApp=1&oppositeImId=' + args.oppositeImId + '&maxMessageId=&pageSize=' + pageSize
  });
  if (!resp.ok) return {error: 'HTTP ' + resp.status};
  var d = await resp.json();
  if (d.flag !== 1) return {error: d.msg || d.code};
  var messages = (d.data?.list || []).map(m => {
    var payload = {};
    try { payload = JSON.parse(m.payload || '{}'); } catch(e) {}
    var text = '';
    if (payload.bodies && payload.bodies[0]) text = payload.bodies[0].msg || '';
    return {
      from: m.imId === imId ? 'me' : 'them',
      text: text,
      time: m.msgTime,
      type: payload.bodies?.[0]?.type || 'unknown'
    };
  });
  return {count: messages.length, messages};
}
