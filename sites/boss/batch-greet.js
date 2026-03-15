/* @meta
{
  "name": "boss/batch-greet",
  "description": "批量打招呼：获取推荐牛人并逐个打招呼",
  "domain": "www.zhipin.com",
  "args": {
    "jobId": {"required": true, "description": "加密职位 ID（从 boss/jobs 获取）"},
    "count": {"required": false, "description": "最多打招呼人数，默认 10"},
    "greeting": {"required": false, "description": "自定义打招呼消息"},
    "minExperience": {"required": false, "description": "最低工作年限（数字），不设则不筛选"},
    "skipChatted": {"required": false, "description": "跳过已聊过的人，默认 true"}
  },
  "readOnly": false,
  "example": "clawos site boss/batch-greet ad540390eba2dfa90nZ729q8E1VV --count 5"
}
*/
async function(args) {
  if (!args.jobId) return {error: 'Missing argument: jobId', hint: 'Run boss/jobs first.'};
  const maxCount = parseInt(args.count) || 10;
  const skipChatted = args.skipChatted !== 'false';
  const minExp = parseInt(args.minExperience) || 0;

  const listResp = await fetch(`/wapi/zpjob/rec/geek/list?jobId=${args.jobId}&page=1&age=16,-1&school=0&degree=0&experience=0&activation=0&recentNotView=0&exchangeResumeWithColleague=0&gender=0&major=0&keyword1=-1&switchJobFrequency=0`, {credentials: 'include'});
  if (!listResp.ok) return {error: 'HTTP ' + listResp.status};
  const listData = await listResp.json();
  if (listData.code !== 0) return {error: listData.message};

  const geeks = (listData.zpData?.geekList || []);
  const results = [];
  let greeted = 0;

  for (const g of geeks) {
    if (greeted >= maxCount) break;
    const card = g.geekCard || {};
    const expYears = parseInt(card.geekWorkYear) || 0;
    if (minExp > 0 && expYears < minExp) continue;
    if (skipChatted && g.haveChatted) continue;

    const gid = g.encryptGeekId || card.encryptGeekId;
    const sid = card.securityId;
    const eid = card.expectId;
    const lid = card.lid || '';
    if (!gid || !sid || !eid) {
      results.push({name: card.geekName, status: 'skipped', reason: 'missing data'});
      continue;
    }

    const body = new URLSearchParams({
      gid, suid: '', jid: args.jobId,
      expectId: eid, lid, greet: args.greeting || '',
      from: '', securityId: sid
    });
    try {
      const resp = await fetch('/wapi/zpjob/chat/start', {
        method: 'POST', credentials: 'include',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: body.toString()
      });
      const d = await resp.json();
      results.push({
        name: card.geekName,
        experience: card.geekWorkYear,
        position: card.expectPositionName,
        status: d.zpData?.status === 1 ? 'greeted' : 'failed',
        newFriend: d.zpData?.newfriend === 1,
        message: d.message
      });
      if (d.zpData?.status === 1) greeted++;
      await new Promise(r => setTimeout(r, 800 + Math.random() * 700));
    } catch (e) {
      results.push({name: card.geekName, status: 'error', error: e.message});
    }
  }
  return {jobId: args.jobId, total: geeks.length, greeted, results};
}
