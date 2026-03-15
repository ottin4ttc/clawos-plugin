/* @meta
{
  "name": "boss/recommend",
  "description": "获取某个职位的推荐牛人列表",
  "domain": "www.zhipin.com",
  "args": {
    "jobId": {"required": true, "description": "加密职位 ID（从 boss/jobs 获取）"},
    "page": {"required": false, "description": "页码，默认 1"},
    "degree": {"required": false, "description": "学历: 0=不限 202=本科 203=硕士 204=博士"},
    "experience": {"required": false, "description": "经验: 0=不限 103=1-3年 104=3-5年 105=5-10年"}
  },
  "readOnly": true,
  "example": "clawos site boss/recommend ad540390eba2dfa90nZ729q8E1VV"
}
*/
async function(args) {
  if (!args.jobId) return {error: 'Missing argument: jobId', hint: 'Run boss/jobs first to get job IDs.'};
  const page = args.page || 1;
  const params = new URLSearchParams({
    jobId: args.jobId, page, age: '16,-1', school: '0',
    activation: '0', recentNotView: '0', exchangeResumeWithColleague: '0',
    gender: '0', major: '0', keyword1: '-1', switchJobFrequency: '0',
    degree: args.degree || '0', experience: args.experience || '0'
  });
  const resp = await fetch('/wapi/zpjob/rec/geek/list?' + params, {credentials: 'include'});
  if (!resp.ok) return {error: 'HTTP ' + resp.status, hint: 'Please log in to www.zhipin.com first.'};
  const d = await resp.json();
  if (d.code !== 0) return {error: d.message};
  const geeks = (d.zpData?.geekList || []).map(g => {
    const c = g.geekCard || {};
    return {
      encryptId: g.encryptGeekId || c.encryptGeekId,
      name: c.geekName,
      age: c.ageDesc,
      degree: c.geekDegree,
      experience: c.geekWorkYear,
      expectCity: c.expectLocationName,
      expectPosition: c.expectPositionName,
      salary: c.salary,
      activeTime: g.activeTimeDesc,
      securityId: c.securityId,
      expectId: c.expectId,
      jobId: c.encryptJobId,
      lid: c.lid,
      workHistory: (c.geekWorks || []).map(w => (w.company||'') + ' ' + (w.positionName||'')).join(' → '),
      education: (c.geekEdus || []).map(e => (e.school||'')).join(', '),
      cooperate: g.cooperate,
      haveChatted: g.haveChatted
    };
  });
  return {jobId: args.jobId, page, count: geeks.length, geeks};
}
