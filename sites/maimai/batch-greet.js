/* @meta
{"name":"maimai/batch-greet","description":"脉脉批量搜索+打招呼","domain":"maimai.cn","args":{"query":{"required":true,"description":"搜索关键词"},"count":{"required":false,"description":"最多打招呼人数，默认5"},"dry":{"required":false,"description":"试运行模式：true 只搜索不发送"},"city":{"required":false,"description":"城市过滤"},"worktime":{"required":false,"description":"工作年限：1-3, 3-5, 5-10, 10+"},"company":{"required":false,"description":"公司名过滤"},"msg":{"required":false,"description":"打招呼消息"},"directOnly":{"required":false,"description":"仅可直接沟通：true"}}}
*/
async function(args) {
  if (!args.query) return {error:'Missing --query'};
  var maxCount = parseInt(args.count || '5');
  var dryRun = args.dry === 'true';
  var msg = args.msg || '你好，刚看了你的简历，跟职位很匹配，有兴趣聊聊么？';

  var r0 = await fetch('/api/ent/user/current?channel=www&version=1.0.0', {credentials:'include'});
  var d0 = await r0.json();
  var myUid = d0.data && d0.data.ucard ? d0.data.ucard.id : null;
  if (!myUid) return {error:'Cannot get current user uid'};

  var searchBody = {
    page: 0,
    size: Math.min(maxCount * 2, 40),
    sessionid: '',
    deletesessionid: '',
    companyscope: 0,
    sortby: 0,
    is_direct_chat: args.directOnly === 'true' ? 1 : 0,
    query: args.query
  };
  if (args.city) searchBody.ht_cities = [args.city];
  if (args.worktime) searchBody.worktimes = [args.worktime];
  if (args.company) searchBody.companies = [args.company];

  var rs = await fetch('/api/ent/discover/search?channel=www&data_version=3.0&version=1.0.0', {
    method: 'POST',
    credentials: 'include',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({search: searchBody})
  });
  var ds = await rs.json();
  if (ds.code !== 0) return {error: 'search failed', code: ds.code};

  var list = (ds.data && ds.data.list) ? ds.data.list : [];
  var candidates = [];
  for (var i = 0; i < list.length; i++) {
    var p = list[i];
    if (p.direct_contact_st !== 1) continue;
    var topEdu = (p.edu && p.edu[0]) ? p.edu[0] : {};
    candidates.push({
      uid: p.id,
      name: p.name,
      position: p.position,
      company: p.company,
      city: p.city,
      worktime: p.worktime,
      degree: topEdu.sdegree || '',
      school: topEdu.school || '',
      active: p.active_state_v2 || p.active_state || ''
    });
    if (candidates.length >= maxCount) break;
  }

  if (dryRun) {
    return {
      mode: 'DRY RUN',
      query: args.query,
      totalFound: ds.data ? ds.data.total : 0,
      directChatCount: candidates.length,
      candidates: candidates,
      message: msg
    };
  }

  var results = [];
  for (var j = 0; j < candidates.length; j++) {
    var c = candidates[j];

    var rl = await fetch('/api/ent/user/limit?channel=www&to_uid=' + c.uid + '&uid=' + myUid + '&version=1.0.0', {credentials:'include'});
    var dl = await rl.json();
    if (dl.is_limit === 1) {
      results.push({uid: c.uid, name: c.name, status: 'LIMIT_REACHED'});
      break;
    }

    var sendUrl = '/groundhog/job/v3/direct/recruiter/send?channel=www'
      + '&comfirmed=1'
      + '&fr=talentDiscover_discover_list_pc_v0.1'
      + '&greet_text=' + encodeURIComponent(msg)
      + '&is_has_name=0'
      + '&jid=0'
      + '&search_double_exposure=0'
      + '&template_id=0'
      + '&u=' + myUid
      + '&u2=' + c.uid
      + '&version=5.0.2';

    var rg = await fetch(sendUrl, {credentials:'include'});
    results.push({
      uid: c.uid,
      name: c.name,
      company: c.company,
      position: c.position,
      status: rg.status === 204 ? 'SENT' : 'FAILED:' + rg.status
    });

    if (j < candidates.length - 1) {
      await new Promise(function(resolve){setTimeout(resolve, 800)});
    }
  }

  return {
    query: args.query,
    totalFound: ds.data ? ds.data.total : 0,
    greeted: results.filter(function(r){return r.status === 'SENT'}).length,
    results: results
  };
}
