/* @meta
{
  "name": "liepin/jobs",
  "description": "列出猎聘上你发布的所有在线职位",
  "domain": "h.liepin.com",
  "args": {},
  "readOnly": true,
  "example": "clawos site liepin/jobs"
}
*/
async function(args) {
  var xsrf = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN'));
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;

  var resp = await fetch('https://api-h.liepin.com/api/com.liepin.job.h.hjob.get-hjob-suggest-list', {
    method: 'POST', credentials: 'include', headers: h,
    body: 'curPage=0&pageSize=50&jobTitle='
  });
  if (!resp.ok) return {error: 'HTTP ' + resp.status};
  var d = await resp.json();
  if (d.flag !== 1) return {error: d.msg || d.code};
  var jobs = (d.data?.list || []).map(j => ({
    id: j.hjobId,
    title: j.hjobTitle,
    city: j.hjobDqCityName,
    salaryLow: j.hjobMonthlysalaryLow,
    salaryHigh: j.hjobMonthlysalaryHigh,
    salaryMonth: j.hjobSalaryMonth
  }));
  return {count: jobs.length, jobs};
}
