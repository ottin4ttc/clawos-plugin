/* @meta
{"name":"maimai/user","description":"获取当前登录用户信息","domain":"maimai.cn","args":{}}
*/
async function(args) {
  var r = await fetch('/api/ent/user/current?channel=www&version=1.0.0', {credentials:'include'});
  var d = await r.json();
  if (d.code !== 0) return {error: 'fetch user failed', code: d.code};
  var u = d.data || d;
  var co = u.company || {};
  return {
    uid: u.ucard ? u.ucard.uid : null,
    identity: u.identity,
    company: {
      cid: co.cid,
      name: co.stdname,
      stage: co.stage,
      size: co.people,
      domain: co.domain
    },
    isVip: u.is_company_vip === 1,
    limits: u.limit || null
  };
}
