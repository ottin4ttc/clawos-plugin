/* @meta
{
  "name": "liepin/download-resume",
  "description": "下载候选人的附件简历 PDF",
  "domain": "h.liepin.com",
  "args": {
    "encAttId": {"required": true, "description": "加密的附件ID（从 harvest 结果获取）"},
    "seekerId": {"required": true, "description": "候选人的 userId"},
    "name": {"required": false, "description": "候选人姓名，用于文件命名"}
  },
  "readOnly": true,
  "example": "clawos site liepin/download-resume 7779d5746f2dA82830a88703e --seekerId 29e008cd1e21c4f14a8a33f1a52a4343 --name 刘先生"
}
*/
async function(args) {
  if (!args.encAttId || !args.seekerId) return {error: 'Missing encAttId or seekerId'};

  var xsrf = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN'));
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;

  var userResp = await fetch('https://api-im.liepin.com/api/com.liepin.cbp.im.get-user-info', {
    method:'POST',credentials:'include',headers:h,body:'imUserType=2&imId=&imApp=1&deviceType=0'
  });
  var userData = await userResp.json();
  var imId = userData.data?.imId || '';

  var snapResp = await fetch('https://api-h.liepin.com/api/com.liepin.rresume.userh.get-attachment-snapshot', {
    method:'POST',credentials:'include',headers:h,
    body:'imId='+imId+'&imApp=1&encryAttachmentSnapshotId='+args.encAttId+'&encodeUsercId='+args.seekerId
  });
  var snapData = await snapResp.json();
  if (snapData.flag !== 1 || !snapData.data) return {error: 'Failed to get snapshot', raw: snapData};

  var downloadPath = snapData.data.downloadPath;
  var accessPath = snapData.data.accessPath;
  if (!downloadPath && !accessPath) return {error: 'No download URL available'};

  var downloadUrl = downloadPath ? 'https://h.liepin.com' + downloadPath : null;
  var viewUrl = accessPath ? 'https://h.liepin.com' + accessPath : null;

  return {
    name: args.name || 'unknown',
    downloadUrl: downloadUrl,
    viewUrl: viewUrl,
    hint: 'Use curl or wget with cookies to download: curl -o "resume.pdf" "' + (downloadUrl || viewUrl) + '"'
  };
}
