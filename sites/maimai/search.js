/* @meta
{"name":"maimai/search","description":"脉脉搜索人才","domain":"maimai.cn","args":{"query":{"required":true,"description":"搜索关键词（职位/技能/姓名）"},"city":{"required":false,"description":"城市过滤，如 上海、北京"},"worktime":{"required":false,"description":"工作年限：1-3, 3-5, 5-10, 10+"},"company":{"required":false,"description":"公司名过滤"},"size":{"required":false,"description":"每页数量，默认20"},"page":{"required":false,"description":"页码，从0开始"},"directChat":{"required":false,"description":"仅可直接沟通：true"}}}
*/
async function(args) {
  if (!args.query) return {error:'Missing --query'};
  var searchBody = {
    page: parseInt(args.page || '0'),
    size: parseInt(args.size || '20'),
    sessionid: '',
    deletesessionid: '',
    companyscope: 0,
    sortby: 0,
    is_direct_chat: args.directChat === 'true' ? 1 : 0,
    query: args.query
  };
  if (args.city) searchBody.ht_cities = [args.city];
  if (args.worktime) searchBody.worktimes = [args.worktime];
  if (args.company) searchBody.companies = [args.company];

  var r = await fetch('/api/ent/discover/search?channel=www&data_version=3.0&version=1.0.0', {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({search: searchBody})
  });
  var d = await r.json();
  if (d.code !== 0) return {error: 'search failed', code: d.code};

  var list = (d.data && d.data.list) ? d.data.list : [];
  var results = [];
  for (var i = 0; i < list.length; i++) {
    var p = list[i];
    var topEdu = (p.edu && p.edu[0]) ? p.edu[0] : {};
    var topExp = (p.exp && p.exp[0]) ? p.exp[0] : {};
    results.push({
      uid: p.id,
      name: p.name,
      position: p.position,
      company: p.company,
      city: p.city,
      age: p.age,
      worktime: p.worktime,
      degree: topEdu.sdegree || '',
      school: topEdu.school || '',
      active: p.active_state_v2 || p.active_state || '',
      directChat: p.direct_contact_st === 1,
      tags: (p.tags || '').substring(0, 80),
      expSummary: topExp.company ? (topExp.company + ' · ' + (topExp.position||'') + ' (' + (topExp.worktime||'') + ')') : ''
    });
  }

  return {
    total: d.data ? d.data.total : 0,
    count: results.length,
    page: searchBody.page,
    results: results
  };
}
