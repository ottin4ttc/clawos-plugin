/* @meta
{
  "name": "boss/history",
  "description": "获取与某个候选人的聊天记录",
  "domain": "www.zhipin.com",
  "args": {
    "uid": {"required": true, "description": "候选人 UID（数字 ID）"},
    "page": {"required": false, "description": "页码，默认 1"},
    "count": {"required": false, "description": "每页条数，默认 20"}
  },
  "readOnly": true,
  "example": "clawos site boss/history 733772559"
}
*/
async function(args) {
  if (!args.uid) return {error: 'Missing argument: uid'};
  const c = args.count || 20;
  const page = args.page || 1;
  const resp = await fetch(`/wapi/zpchat/boss/historyMsg?src=0&gid=${args.uid}&maxMsgId=0&c=${c}&page=${page}`, {credentials: 'include'});
  if (!resp.ok) return {error: 'HTTP ' + resp.status, hint: 'Please log in to www.zhipin.com first.'};
  const d = await resp.json();
  if (d.code !== 0) return {error: d.message};
  const msgs = (d.zpData?.messages || []).map(m => ({
    id: m.mid,
    from: m.from === 1 ? 'boss' : 'geek',
    type: m.type,
    text: m.body?.text || m.body?.templateText || '',
    time: m.time
  }));
  return {uid: args.uid, page, count: msgs.length, messages: msgs};
}
