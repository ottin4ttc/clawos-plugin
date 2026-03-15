/* @meta
{
  "name": "liepin/recommend",
  "description": "获取某个职位的推荐候选人列表",
  "domain": "h.liepin.com",
  "args": {
    "jobId": {"required": true, "description": "职位 ID（从 liepin/jobs 获取）"},
    "pageSize": {"required": false, "description": "每页数量，默认 10"}
  },
  "readOnly": true,
  "example": "clawos site liepin/recommend 72114549"
}
*/
async function(args) {
  if (!args.jobId) return {error: 'Missing argument: jobId', hint: 'Run liepin/jobs first.'};
  var pageSize = args.pageSize || 10;

  var xsrf = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN'));
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;

  var resp = await fetch('https://api-h.liepin.com/api/com.liepin.recommend.h.get-rec-list', {
    method: 'POST', credentials: 'include', headers: h,
    body: 'queryKind=hpc_recom_hp&pageSize=' + pageSize + '&jobId=' + args.jobId + '&operateKind=LOGIN&existFallbackResult=false'
  });
  if (!resp.ok) return {error: 'HTTP ' + resp.status};
  var d = await resp.json();
  if (d.flag !== 1) return {error: d.msg || d.code};
  var list = (d.data?.list || []).map(item => {
    var r = item.resume || {};
    var job = item.job || {};
    return {
      resumeUrl: r.url,
      name: r.showName,
      gender: r.sexCode,
      resType: r.resType,
      activeStatus: r.showActiveStatus,
      headId: r.headId,
      workHistory: (r.workExpList || []).map(w => w.rwdCompname + ' ' + w.rwdsTitle + ' (' + w.rwdStart + '-' + (w.rwdsEnd || '至今') + ')').join(' → '),
      education: (r.eduList || []).map(e => (e.school || '') + ' ' + (e.major || '')).join(', '),
      jobTitle: job.jobTitle,
      viewed: item.viewed,
      hasConcat: item.hasConcat,
      asFrom: item.asFrom
    };
  });
  return {jobId: args.jobId, count: list.length, candidates: list};
}
