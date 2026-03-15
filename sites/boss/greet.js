/* @meta
{
  "name": "boss/greet",
  "description": "给推荐牛人打招呼（开始聊天）",
  "domain": "www.zhipin.com",
  "args": {
    "geekId": {"required": true, "description": "加密牛人 ID（从 boss/recommend 获取的 encryptId）"},
    "jobId": {"required": true, "description": "加密职位 ID（从 boss/jobs 获取）"},
    "expectId": {"required": true, "description": "牛人期望 ID（从 boss/recommend 获取）"},
    "securityId": {"required": true, "description": "安全令牌（从 boss/recommend 获取）"},
    "greeting": {"required": false, "description": "打招呼的自定义消息，默认使用系统默认"}
  },
  "readOnly": false,
  "example": "clawos site boss/greet --geekId abc123 --jobId def456 --expectId 12345 --securityId xyz"
}
*/
async function(args) {
  if (!args.geekId || !args.jobId || !args.expectId || !args.securityId)
    return {error: 'Missing required arguments', hint: 'Need geekId, jobId, expectId, securityId. Get them from boss/recommend.'};
  const body = new URLSearchParams({
    gid: args.geekId, suid: '', jid: args.jobId,
    expectId: args.expectId, lid: '', greet: args.greeting || '',
    from: '', securityId: args.securityId
  });
  const resp = await fetch('/wapi/zpjob/chat/start', {
    method: 'POST', credentials: 'include',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString()
  });
  if (!resp.ok) return {error: 'HTTP ' + resp.status};
  const d = await resp.json();
  if (d.code !== 0) return {error: d.message};
  const z = d.zpData || {};
  return {
    success: z.status === 1,
    newFriend: z.newfriend === 1,
    greeting: z.greeting || '(default)',
    status: z.stateDesc || 'ok'
  };
}
