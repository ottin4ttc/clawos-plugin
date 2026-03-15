/* @meta
{
  "name": "liepin/resume",
  "description": "获取候选人的简历详情",
  "domain": "h.liepin.com",
  "args": {
    "seekerId": {"required": true, "description": "候选人 userId（从 liepin/conversations 获取）"}
  },
  "readOnly": true,
  "example": "clawos site liepin/resume 83f530632b82fb6cd97271d5d0dfa4ea"
}
*/
async function(args) {
  if (!args.seekerId) return {error: 'Missing argument: seekerId'};

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

  var resp = await fetch('https://api-h.liepin.com/api/com.liepin.im.h.contact.im-resume-detail', {
    method: 'POST', credentials: 'include', headers: h,
    body: 'imUserType=2&imId=' + (imId || '') + '&imApp=1&seekerId=' + args.seekerId
  });
  if (!resp.ok) return {error: 'HTTP ' + resp.status};
  var d = await resp.json();
  if (d.flag !== 1) return {error: d.msg || d.code};
  var r = d.data || {};
  return {
    resId: r.resId,
    workExperiences: (r.workExperiences || []).map(w => ({
      company: w.compName,
      title: w.title,
      start: w.startShow,
      end: w.endShow || '至今',
      duty: (w.duty || '').substring(0, 200)
    })),
    eduExperiences: (r.eduExperiences || []).map(e => ({
      school: e.school,
      major: e.major,
      degree: e.degree,
      start: e.startShow,
      end: e.endShow
    })),
    raw: r
  };
}
