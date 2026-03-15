/* @meta
{
  "name": "liepin/conversations",
  "description": "获取猎聘沟通页面的对话列表",
  "domain": "h.liepin.com",
  "args": {
    "page": {"required": false, "description": "页码，默认 0"},
    "pageSize": {"required": false, "description": "每页数量，默认 30"}
  },
  "readOnly": true,
  "example": "clawos site liepin/conversations"
}
*/
async function(args) {
  var page = args.page || 0;
  var pageSize = args.pageSize || 30;

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
  if (!imId) return {error: 'Cannot get imId', hint: 'Please log in to h.liepin.com first.'};

  var resp = await fetch('https://api-h.liepin.com/api/com.liepin.im.h.contact.get-contact-list', {
    method: 'POST', credentials: 'include', headers: h,
    body: 'imUserType=2&imId=' + imId + '&imApp=1&pageSize=' + pageSize + '&curPage=' + page
  });
  if (!resp.ok) return {error: 'HTTP ' + resp.status};
  var d = await resp.json();
  if (d.flag !== 1) return {error: d.msg || d.code};
  var contacts = (d.data?.list || []).map(c => {
    var payload = {};
    try { payload = JSON.parse(c.lastPayload || '{}'); } catch(e) {}
    var lastMsg = '';
    if (payload.bodies && payload.bodies[0]) lastMsg = payload.bodies[0].msg || '';
    return {
      imId: c.oppositeImId,
      userId: c.oppositeUserId,
      unread: c.unReadCnt,
      lastMsg: lastMsg.substring(0, 80),
      lastTime: c.latestMsgTime,
      shielded: c.shieldFlag
    };
  });
  return {myImId: imId, count: contacts.length, contacts};
}
