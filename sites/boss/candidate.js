/* @meta
{
  "name": "boss/candidate",
  "description": "获取候选人详细信息（从沟通页面点击某人后获取）",
  "domain": "www.zhipin.com",
  "args": {
    "uid": {"required": true, "description": "候选人 UID（数字 ID）"},
    "securityId": {"required": true, "description": "安全令牌（从对话列表获取）"}
  },
  "readOnly": true,
  "example": "clawos site boss/candidate 733772559 --securityId xxx"
}
*/
async function(args) {
  if (!args.uid || !args.securityId) return {error: 'Missing uid or securityId'};
  const resp = await fetch(`/wapi/zpjob/chat/geek/info?uid=${args.uid}&geekSource=0&securityId=${encodeURIComponent(args.securityId)}`, {credentials: 'include'});
  if (!resp.ok) return {error: 'HTTP ' + resp.status};
  const d = await resp.json();
  if (d.code !== 0) return {error: d.message};
  const z = d.zpData || {};
  return {
    uid: args.uid,
    name: z.geekName || z.name,
    avatar: z.avatar,
    gender: z.gender,
    age: z.ageDesc,
    degree: z.geekDegree,
    experience: z.geekWorkYear,
    city: z.cityName,
    phone: z.phone,
    email: z.email,
    expectPosition: z.expectPositionName,
    expectSalary: z.salaryDesc,
    workHistory: z.workExps || z.geekWorks,
    education: z.geekEdus,
    status: z.friendStatus
  };
}
