/* @meta
{
  "name": "liepin/stats",
  "description": "获取猎聘账户统计数据（昨日数据、发布职位数、找到人才数等）",
  "domain": "h.liepin.com",
  "args": {},
  "readOnly": true,
  "example": "clawos site liepin/stats"
}
*/
async function(args) {
  var xsrf = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN'));
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;

  var [summaryResp, yesterdayResp] = await Promise.all([
    fetch('https://api-h.liepin.com/api/com.liepin.h.home.get-user-summary-data', {method:'POST',credentials:'include',headers:h,body:''}),
    fetch('https://api-h.liepin.com/api/com.liepin.rdatacenter.h.home.get-user-yesterday-data', {method:'POST',credentials:'include',headers:h,body:''})
  ]);

  var summary = await summaryResp.json();
  var yesterday = await yesterdayResp.json();

  return {
    summary: summary.data || {},
    yesterday: yesterday.data || {}
  };
}
