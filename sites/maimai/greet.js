/* @meta
{"name":"maimai/greet","description":"脉脉立即沟通（打招呼）","domain":"maimai.cn","args":{"targetUid":{"required":true,"description":"目标用户uid（从 maimai/search 获取）"},"msg":{"required":false,"description":"打招呼消息，默认：你好，刚看了你的简历，跟职位很匹配，有兴趣聊聊么？"},"jobId":{"required":false,"description":"附带职位ID，默认0（不附带）"}}}
*/
async function(args) {
  if (!args.targetUid) return {error:'Missing --targetUid'};

  var r0 = await fetch('/api/ent/user/current?channel=www&version=1.0.0', {credentials:'include'});
  var d0 = await r0.json();
  var myUid = d0.data && d0.data.ucard ? d0.data.ucard.id : null;
  if (!myUid) return {error:'Cannot get current user uid'};

  var targetUid = args.targetUid;
  var rl = await fetch('/api/ent/user/limit?channel=www&to_uid=' + targetUid + '&uid=' + myUid + '&version=1.0.0', {credentials:'include'});
  var dl = await rl.json();
  if (dl.is_limit === 1) return {error:'Daily contact limit reached', detail:dl.limit_dialog};

  var msg = args.msg || '你好，刚看了你的简历，跟职位很匹配，有兴趣聊聊么？';
  var jid = args.jobId || '0';
  var sendUrl = '/groundhog/job/v3/direct/recruiter/send?channel=www'
    + '&comfirmed=1'
    + '&fr=talentDiscover_discover_list_pc_v0.1'
    + '&greet_text=' + encodeURIComponent(msg)
    + '&is_has_name=0'
    + '&jid=' + jid
    + '&search_double_exposure=0'
    + '&template_id=0'
    + '&u=' + myUid
    + '&u2=' + targetUid
    + '&version=5.0.2';

  var rs = await fetch(sendUrl, {credentials:'include'});
  if (rs.status === 204) {
    return {success:true, targetUid:targetUid, message:msg};
  }
  var body = '';
  try { body = await rs.text(); } catch(e) {}
  return {success:false, status:rs.status, body:body.substring(0, 200)};
}
