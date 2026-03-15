/* @meta
{
  "name": "boss/accept",
  "description": "接受候选人发来的交换请求（简历/电话/微信），支持按 UID 自动扫描或当前聊天窗口",
  "domain": "www.zhipin.com",
  "args": {
    "uid": {"required": false, "description": "候选人 UID，提供则通过 API 扫描聊天记录找待接受请求"},
    "mode": {"required": false, "description": "dom = 点击当前聊天窗口的同意按钮(默认), api = 通过 API 接受"}
  },
  "readOnly": false,
  "example": "clawos site boss/accept --uid 12868927"
}
*/
async function(args) {
  var mode = args.mode || (args.uid ? 'api' : 'dom');

  if (mode === 'dom') {
    var accepted = [];

    var bottomBtns = document.querySelectorAll('.chat-im-tips a, .im-tips-bar a, [class*=tip] a');
    for (var i = 0; i < bottomBtns.length; i++) {
      if (bottomBtns[i].textContent.trim() === '同意') {
        bottomBtns[i].click();
        accepted.push('bottom-bar');
        break;
      }
    }

    if (accepted.length === 0) {
      var allLinks = document.querySelectorAll('a');
      for (var j = 0; j < allLinks.length; j++) {
        var a = allLinks[j];
        if (a.textContent.trim() === '同意' && a.href && a.href.includes('javascript')) {
          a.click();
          accepted.push('link-agree');
          break;
        }
      }
    }

    if (accepted.length === 0) {
      var cardBtns = document.querySelectorAll('.message-card-wrap .card-btn');
      for (var k = cardBtns.length - 1; k >= 0; k--) {
        var btn = cardBtns[k];
        if (btn.textContent.trim() === '同意' && !btn.classList.contains('disabled')) {
          btn.click();
          accepted.push('card-btn');
          break;
        }
      }
    }

    if (accepted.length === 0) {
      return {accepted: false, reason: 'No pending accept button found in current chat'};
    }
    return {accepted: true, method: accepted[0]};
  }

  if (mode === 'api') {
    if (!args.uid) return {error: 'uid required for api mode'};
    var resp = await fetch('/wapi/zpchat/boss/historyMsg?src=0&gid=' + args.uid + '&maxMsgId=0&c=50&page=1', {credentials: 'include'});
    if (!resp.ok) return {error: 'HTTP ' + resp.status};
    var d = await resp.json();
    if (d.code !== 0) return {error: d.message};

    var pending = (d.zpData.messages || []).filter(function(m) {
      return m.type === 4 && m.status !== 2 && m.from && m.from.uid !== 529443692;
    });

    if (pending.length === 0) {
      var alreadyAccepted = (d.zpData.messages || []).filter(function(m) {
        return m.type === 4 && m.status === 2;
      });
      return {accepted: false, reason: 'No pending requests', alreadyAccepted: alreadyAccepted.length};
    }

    var results = [];
    for (var p = 0; p < pending.length; p++) {
      var msg = pending[p];
      var body = new URLSearchParams();
      body.set('securityId', msg.securityId);
      body.set('type', String(msg.body.type || 4));

      var acceptResp = await fetch('/wapi/zpchat/exchange/accept', {
        method: 'POST', credentials: 'include',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: body.toString()
      });
      var acceptData = await acceptResp.json();
      results.push({
        mid: msg.mid,
        bodyType: msg.body.type,
        text: msg.pushText || msg.body.text || '',
        code: acceptData.code,
        success: acceptData.code === 0,
        message: acceptData.message
      });
    }
    return {uid: args.uid, accepted: results.filter(function(r){return r.success}).length, results: results};
  }

  return {error: 'Invalid mode: ' + mode, hint: 'Use dom or api'};
}
