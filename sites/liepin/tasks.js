/* @meta
{
  "name": "liepin/tasks",
  "description": "获取猎聘每日任务列表和完成进度",
  "domain": "h.liepin.com",
  "args": {},
  "readOnly": true,
  "example": "clawos site liepin/tasks"
}
*/
async function(args) {
  var xsrf = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN'));
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;

  var resp = await fetch('https://api-h.liepin.com/api/com.liepin.h.daily.task.get-task-list', {
    method: 'POST', credentials: 'include', headers: h, body: ''
  });
  if (!resp.ok) return {error: 'HTTP ' + resp.status};
  var d = await resp.json();
  if (d.flag !== 1) return {error: d.msg || d.code};
  var tasks = (d.data?.taskList || d.data?.list || []).map(t => ({
    name: t.taskName || t.name,
    reward: t.rewardCount || t.reward,
    current: t.currentCount || t.current,
    target: t.targetCount || t.target,
    completed: t.completed || (t.currentCount >= t.targetCount)
  }));
  return {tasks, raw: d.data};
}
