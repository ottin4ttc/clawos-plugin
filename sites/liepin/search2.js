/* @meta
{"name":"liepin/search2","description":"搜索候选人","domain":"h.liepin.com","args":{"jobName":{"required":true,"description":"职位名称,逗号分隔"},"keyword":{"required":false,"description":"行业关键词"},"city":{"required":false,"description":"期望城市代码"},"ageMax":{"required":false,"description":"最大年龄"},"pageSize":{"required":false,"description":"每页数量,默认20"}}}
*/
async function(args) {
  if (!args.jobName) return {error:'Missing --jobName'};
  var titles = args.jobName.split(',').map(function(t){return t.trim()}).filter(Boolean);
  var keyword = args.keyword || '';
  var pageSize = parseInt(args.pageSize) || 20;
  var xsrf = document.cookie.split(';').map(function(c){return c.trim()}).find(function(c){return c.startsWith('XSRF-TOKEN')});
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;
  var allMap = {};
  for (var ti = 0; ti < titles.length; ti++) {
    var vo = {nowDqs:'',wantDqs:args.city||'',keyword:keyword,anyKeyword:'0',ageHigh:args.ageMax||'',ageLow:'',searchType:'0',curPage:0,pageSize:String(pageSize),sortType:'0',filterViewed:false,filterChat:false,filterDownload:false,resumetype:'0',graduate:false,eduLevels:[],workYearsLow:'',workYearsHigh:'',version:'',jobName:titles[ti],jobPeriod:'0',compName:'',compPeriod:'0',schoolKindList:[],sex:'',activeStatus:'',nowJobTitles:'',wantJobTitles:'',industrys:'',modifytimeType:'',school:'',major:''};
    var reqBody = 'searchParamsInputVo='+encodeURIComponent(JSON.stringify(vo))+'&version=V5&logForm='+encodeURIComponent(JSON.stringify({ckId:'',skId:'',fkId:'',searchScene:'new'}));
    var r = await fetch('https://api-h.liepin.com/api/com.liepin.searchfront4r.h.search-resumes',{method:'POST',credentials:'include',headers:h,body:reqBody});
    var d = await r.json();
    var resList = (d.data && d.data.resList) ? d.data.resList : [];
    for (var ri = 0; ri < resList.length; ri++) { if (resList[ri].usercIdEncode) allMap[resList[ri].usercIdEncode] = resList[ri]; }
  }
  var keys = Object.keys(allMap);
  var candidates = [];
  for (var ki = 0; ki < keys.length; ki++) {
    var c = allMap[keys[ki]];
    var s = c.simpleResumeForm || {};
    var workSummary = (s.workExpFormList||[]).slice(0,3).map(function(w){return (w.rwTitle||'')+' @ '+(w.rwCompname||'')}).join(' | ');
    candidates.push({userId:c.usercIdEncode,name:s.resEname||s.resName,age:s.resBirthYearAge,sex:s.resSexName,edu:s.resEdulevelName,workYears:s.resWorkyearAge,title:s.resTitle,company:s.resCompany,city:s.resDqName,wantDq:c.wantDq,active:(c.activeStatus&&c.activeStatus.name)||'',chatted:!!c.chat,workSummary:workSummary});
  }
  return {total:candidates.length,searchedTitles:titles,keyword:keyword,candidates:candidates};
}
