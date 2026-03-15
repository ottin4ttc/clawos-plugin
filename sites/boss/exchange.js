/* @meta
{
  "name": "boss/exchange",
  "description": "向候选人发起交换请求（求简历/换电话/换微信）",
  "domain": "www.zhipin.com",
  "args": {
    "securityId": {"required": true, "description": "候选人的 securityId（从对话详情或 boss/recommend 获取）"},
    "type": {"required": false, "description": "交换类型: resume(默认), phone, wechat"}
  },
  "readOnly": false,
  "example": "clawos site boss/exchange --securityId xxx --type resume"
}
*/
async function(args) {
  if (!args.securityId) return {error: 'Missing argument: securityId'};
  const typeMap = {resume: 4, phone: 1, wechat: 2};
  const typeStr = args.type || 'resume';
  const typeCode = typeMap[typeStr];
  if (!typeCode) return {error: 'Invalid type: ' + typeStr, hint: 'Use: resume, phone, or wechat'};

  const body = new URLSearchParams({type: typeCode, securityId: args.securityId});

  const testResp = await fetch('/wapi/zpchat/exchange/test', {
    method: 'POST', credentials: 'include',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString()
  });
  if (!testResp.ok) return {error: 'HTTP ' + testResp.status};
  const testData = await testResp.json();
  if (testData.code !== 0) return {error: testData.message};
  if (testData.zpData?.status !== 0) return {error: 'Exchange not allowed (双方需先互相回复过消息)', detail: testData.zpData};

  const reqResp = await fetch('/wapi/zpchat/exchange/request', {
    method: 'POST', credentials: 'include',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString()
  });
  if (!reqResp.ok) return {error: 'HTTP ' + reqResp.status};
  const reqData = await reqResp.json();
  if (reqData.code !== 0) return {error: reqData.message};
  return {
    success: reqData.zpData?.status === 0,
    type: typeStr,
    typeCode: typeCode
  };
}
