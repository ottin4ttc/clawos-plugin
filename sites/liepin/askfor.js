/* @meta
{
  "name": "liepin/askfor",
  "description": "向候选人索要信息（手机号/微信号/简历）",
  "domain": "h.liepin.com",
  "args": {
    "oppositeImId": {"required": true, "description": "对方的 imId（从 liepin/conversations 获取）"},
    "type": {"required": false, "description": "索要类型: resume(默认), phone, wechat"}
  },
  "readOnly": false,
  "example": "clawos site liepin/askfor 92acd0b4e61923db3236da4ede1d7827 --type phone"
}
*/
async function(args) {
  if (!args.oppositeImId) return {error: 'Missing argument: oppositeImId'};
  var typeMap = {wechat: 1, phone: 2, resume: 3};
  var typeStr = args.type || 'resume';
  var bizType = typeMap[typeStr];
  if (!bizType) return {error: 'Invalid type: ' + typeStr, hint: 'Use: resume, phone, or wechat'};

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

  var btnResp = await fetch('https://api-h.liepin.com/api/com.liepin.im.h.askfor.top-buttons', {
    method: 'POST', credentials: 'include', headers: h,
    body: 'imUserType=2&imId=' + imId + '&imApp=1&oppositeImId=' + args.oppositeImId
  });
  var btnData = await btnResp.json();
  // status encoding: bizType*10 + state, where state: 1=unavailable, 2=ready, 3=already sent
  var allBtns = (btnData.data?.topBtnList || []).map(b => {
    var state = b.status % 10;
    return {type: Object.keys(typeMap).find(k=>typeMap[k]===b.bizType), bizType: b.bizType, status: b.status, state: state, msg: b.msg};
  });
  var btn = allBtns.find(b => b.bizType === bizType);
  if (!btn) return {error: typeStr + ' button not available', available: allBtns};
  if (btn.state === 3) return {alreadySent: true, type: typeStr, msg: btn.msg, hint: '已索要，无需重复'};
  if (btn.state === 1) return {unavailable: true, type: typeStr, msg: btn.msg, hint: '当前不可索要'};

  var resp = await fetch('https://api-h.liepin.com/api/com.liepin.im.h.askfor.send-askfor-request', {
    method: 'POST', credentials: 'include', headers: h,
    body: 'imUserType=2&imId=' + imId + '&imApp=1&oppositeImId=' + args.oppositeImId + '&bizType=' + bizType
  });
  if (!resp.ok) return {error: 'HTTP ' + resp.status};
  var d = await resp.json();
  if (d.flag !== 1) return {error: d.msg || d.code, flag: d.flag};
  return {success: true, type: typeStr, bizType: bizType, hint: '索要请求已发送'};
}
