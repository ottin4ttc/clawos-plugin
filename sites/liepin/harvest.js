/* @meta
{
  "name": "liepin/harvest",
  "description": "扫描所有对话，收集候选人已分享的简历/手机号/微信号",
  "domain": "h.liepin.com",
  "args": {
    "days": {"required": false, "description": "只扫描最近N天有活动的对话，默认7"},
    "limit": {"required": false, "description": "最多扫描多少个对话，默认50"}
  },
  "readOnly": true,
  "example": "clawos site liepin/harvest --days 3"
}
*/
async function(args) {
  var days = parseInt(args.days) || 7;
  var limit = parseInt(args.limit) || 50;
  var cutoff = Date.now() - days * 86400000;

  var xsrf = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN'));
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;

  var post = async (url, body) => {
    var r = await fetch(url, {method:'POST',credentials:'include',headers:h,body:body});
    return await r.json();
  };

  var userData = await post('https://api-im.liepin.com/api/com.liepin.cbp.im.get-user-info', 'imUserType=2&imId=&imApp=1&deviceType=0');
  var imId = userData.data?.imId;
  if (!imId) return {error: 'Cannot get imId'};

  var contactData = await post('https://api-h.liepin.com/api/com.liepin.im.h.contact.get-contact-list', 'imId='+imId+'&imApp=1&curPage=0&pageSize='+limit);
  var contacts = (contactData.data?.list || []).filter(c => (c.latestMsgTime || 0) > cutoff);

  var results = [];
  for (var ci = 0; ci < contacts.length; ci++) {
    var contact = contacts[ci];
    var oppImId = contact.oppositeImId;
    var seekerId = contact.oppositeUserId || contact.id;
    var name = contact.name || '未知';
    var info = {company: contact.company, title: contact.title, dq: contact.dq, edu: contact.edulevel, workYears: contact.workage};

    var chatData = await post('https://api-h.liepin.com/api/com.liepin.im.h.chat.chat-list',
      'imUserType=2&imId='+imId+'&imApp=1&oppositeImId='+oppImId+'&maxMessageId=&pageSize=20');
    var messages = chatData.data?.list || [];

    var collected = {name: name, imId: oppImId, seekerId: seekerId, info: info, resumes: [], phones: [], wechats: []};
    var hasData = false;

    for (var m of messages) {
      var payload = {};
      try { payload = JSON.parse(m.payload || '{}'); } catch(e) { continue; }
      var extType = payload.ext?.extType;
      var bizData = payload.ext?.extBody?.bizData || {};

      if (extType === 203 && bizData.attachmentResume) {
        var attachParam = {};
        try { attachParam = JSON.parse(bizData.attachmentResume.param || '{}'); } catch(e) {}
        var encAttId = attachParam.encodeAttachmentId;
        var attachUserId = attachParam.userId || seekerId;
        if (encAttId) {
          try {
            var snapData = await post('https://api-h.liepin.com/api/com.liepin.rresume.userh.get-attachment-snapshot',
              'imId='+imId+'&imApp=1&encryAttachmentSnapshotId='+encAttId+'&encodeUsercId='+attachUserId);
            if (snapData.flag === 1 && snapData.data) {
              collected.resumes.push({
                title: bizData.title || name+'的简历',
                type: 'attachment',
                downloadUrl: snapData.data.downloadPath ? 'https://h.liepin.com' + snapData.data.downloadPath : null,
                viewUrl: snapData.data.accessPath ? 'https://h.liepin.com' + snapData.data.accessPath : null,
                encAttId: encAttId
              });
              hasData = true;
            }
          } catch(e) {}
        }
        if (bizData.onlineResume) {
          var onlineParam = {};
          try { onlineParam = JSON.parse(bizData.onlineResume.param || '{}'); } catch(e) {}
          collected.resumes.push({title: '在线简历', type: 'online', encodeResId: onlineParam.encodeResId});
          hasData = true;
        }
      }

      if (extType === 207) {
        if (bizData.codedTel) {
          try {
            var phoneData = await post('https://api-h.liepin.com/api/com.liepin.im.h.askfor.get-exchange-data',
              'imUserType=2&imId='+imId+'&imApp=1&oppositeImId='+oppImId+'&encodeTel='+bizData.codedTel+'&data='+bizData.codedTel+'&encodePhone='+bizData.codedTel);
            if (phoneData.flag === 1 && phoneData.data?.phone) {
              collected.phones.push(phoneData.data.phone);
              hasData = true;
            }
          } catch(e) {}
        }
        if (bizData.codedWx) {
          try {
            var wxData = await post('https://api-h.liepin.com/api/com.liepin.im.h.askfor.get-exchange-data',
              'imUserType=2&imId='+imId+'&imApp=1&oppositeImId='+oppImId+'&encodeTel='+bizData.codedWx+'&data='+bizData.codedWx+'&encodePhone='+bizData.codedWx);
            if (wxData.flag === 1 && wxData.data) {
              collected.wechats.push(wxData.data.wechat || wxData.data.wx || wxData.data.phone || 'encoded');
              hasData = true;
            }
          } catch(e) {}
        }
      }
    }

    if (hasData) {
      collected.phones = [...new Set(collected.phones)];
      collected.wechats = [...new Set(collected.wechats)];
      results.push(collected);
    }
  }

  return {
    scanned: contacts.length,
    withData: results.length,
    cutoffDays: days,
    candidates: results
  };
}
