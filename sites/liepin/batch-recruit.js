/* @meta
{"name":"liepin/batch-recruit","description":"搜索+智能筛选+批量打招呼","domain":"h.liepin.com","args":{"jobName":{"required":true,"description":"职位名称,逗号分隔"},"count":{"required":false,"description":"打招呼数量,默认10"},"dry":{"required":false,"description":"true=只搜索不发送"},"keyword":{"required":false,"description":"行业关键词"},"city":{"required":false,"description":"期望城市代码"},"ageMax":{"required":false,"description":"最大年龄"},"msg":{"required":false,"description":"自定义招呼语"}}}
*/
async function(args) {
  if (!args.jobName) return {error:'Missing --jobName'};
  var titles = args.jobName.split(',').map(function(t){return t.trim()}).filter(Boolean);
  var keyword = args.keyword || '';
  var count = parseInt(args.count) || 10;
  var dry = (args.dry === 'true');
  var xsrf = document.cookie.split(';').map(function(c){return c.trim()}).find(function(c){return c.startsWith('XSRF-TOKEN')});
  var token = xsrf ? xsrf.split('=')[1] : null;
  var h = {'Content-Type':'application/x-www-form-urlencoded','X-Client-Type':'web','X-Fscp-Version':'1.1','X-Requested-With':'XMLHttpRequest','X-Fscp-Std-Info':JSON.stringify({client_id:'40231'}),'X-Fscp-Bi-Stat':JSON.stringify({location:location.href}),'X-Fscp-Trace-Id':crypto.randomUUID()};
  if (token) h['X-XSRF-TOKEN'] = token;
  var allMap = {};
  for (var ti = 0; ti < titles.length; ti++) {
    var vo = {nowDqs:'',wantDqs:args.city||'',keyword:keyword,anyKeyword:'0',ageHigh:args.ageMax||'',ageLow:'',searchType:'0',curPage:0,pageSize:'40',sortType:'0',filterViewed:false,filterChat:false,filterDownload:false,resumetype:'0',graduate:false,eduLevels:[],workYearsLow:'',workYearsHigh:'',version:'',jobName:titles[ti],jobPeriod:'0',compName:'',compPeriod:'0',schoolKindList:[],sex:'',activeStatus:'',nowJobTitles:'',wantJobTitles:'',industrys:'',modifytimeType:'',school:'',major:''};
    var rb = 'searchParamsInputVo='+encodeURIComponent(JSON.stringify(vo))+'&version=V5&logForm='+encodeURIComponent(JSON.stringify({ckId:'',skId:'',fkId:'',searchScene:'new'}));
    var rsp = await fetch('https://api-h.liepin.com/api/com.liepin.searchfront4r.h.search-resumes',{method:'POST',credentials:'include',headers:h,body:rb});
    var dd = await rsp.json();
    var rl = (dd.data && dd.data.resList) ? dd.data.resList : [];
    for (var ri = 0; ri < rl.length; ri++) { if (rl[ri].usercIdEncode) allMap[rl[ri].usercIdEncode] = rl[ri]; }
  }
  var kwW = keyword ? keyword.split(/\s+/) : [];
  var ks = Object.keys(allMap);
  var scored = [];
  for (var ki = 0; ki < ks.length; ki++) {
    var ca = allMap[ks[ki]]; var sf = ca.simpleResumeForm || {};
    var wk = (sf.workExpFormList||[]).map(function(w){return (w.rwTitle||'')+' '+(w.rwCompname||'')}).join(' ');
    var txt = (sf.resTitle||'')+' '+(sf.resCompany||'')+' '+wk;
    var km = false;
    for (var wi = 0; wi < kwW.length; wi++) { if (txt.indexOf(kwW[wi]) >= 0) km = true; }
    var tm = false;
    for (var tci = 0; tci < titles.length; tci++) { if ((sf.resTitle||'').indexOf(titles[tci]) >= 0 || wk.indexOf(titles[tci]) >= 0) tm = true; }
    var mgr = !!(sf.resTitle||'').match(/总监|负责人|经理|部长|主管|Director|Manager|VP|Head/i);
    var act = ca.activeStatus && parseInt(ca.activeStatus.code) <= 2;
    var sc = (km&&tm?6:0)+(km?2:0)+(tm?2:0)+(mgr?1:0)+(act?1:0);
    scored.push({userId:ca.usercIdEncode,name:sf.resEname||sf.resName,age:sf.resBirthYearAge,title:sf.resTitle,company:sf.resCompany,city:sf.resDqName,active:(ca.activeStatus&&ca.activeStatus.name)||'',score:sc,chatted:!!ca.chat});
  }
  scored.sort(function(a,b){return b.score-a.score});
  var targets = scored.filter(function(c){return !c.chatted}).slice(0,count);
  if (dry) {
    var out = [];
    for (var mi = 0; mi < targets.length; mi++) { targets[mi].rank = mi+1; out.push(targets[mi]); }
    return {mode:'preview',searched:scored.length,selected:out.length,candidates:out};
  }
  var results = [];
  for (var gi = 0; gi < targets.length; gi++) {
    var tc = targets[gi];
    if (gi > 0) await new Promise(function(res){setTimeout(res,800+Math.random()*700)});
    var gb = 'imId=&imApp=1&userId='+tc.userId+'&encodeUsercId='+tc.userId+'&hasSayHi=true&ck_id='+crypto.randomUUID()+'&selectedJobId=&strongRelation=false&strongGuidance=false&jobKind=1&resSource=h_search&msg='+encodeURIComponent(args.msg||'');
    var gr = await fetch('https://api-h.liepin.com/api/com.liepin.im.h.chat.to-chat',{method:'POST',credentials:'include',headers:h,body:gb});
    var gd = await gr.json();
    results.push({rank:gi+1,name:tc.name,age:tc.age,title:tc.title,company:tc.company,city:tc.city,score:tc.score,ok:gd.flag===1});
  }
  return {mode:'sent',searched:scored.length,greeted:results.filter(function(r){return r.ok}).length,failed:results.filter(function(r){return !r.ok}).length,results:results};
}
