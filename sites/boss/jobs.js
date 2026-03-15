/* @meta
{
  "name": "boss/jobs",
  "description": "列出 BOSS 直聘上你发布的所有在线职位",
  "domain": "www.zhipin.com",
  "args": {},
  "readOnly": true,
  "example": "clawos site boss/jobs"
}
*/
async function(args) {
  const resp = await fetch('/wapi/zpjob/job/recJobList', {credentials: 'include'});
  if (!resp.ok) return {error: 'HTTP ' + resp.status, hint: 'Please log in to www.zhipin.com first.'};
  const d = await resp.json();
  if (d.code !== 0) return {error: d.message};
  const jobs = (d.zpData?.onlineJobList || []).map(j => ({
    id: j.encryptId,
    name: j.jobName,
    company: j.brandName,
    city: j.locationName,
    salary: j.salaryDesc,
    proxy: j.proxyJob === 1
  }));
  return {count: jobs.length, jobs};
}
