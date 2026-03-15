/* @meta
{"name":"ttc/detail","description":"TTC候选人详情（基本信息+画像）","domain":"ttcadvisory.com","args":{"id":{"required":true,"description":"候选人ID，如 PL1928085809270763520"},"profile":{"required":false,"description":"是否获取画像数据：true（默认false，只获取基本信息）"}}}
*/
async function(args) {
  if (!args.id) return {error: 'Missing --id (person_leads_id)'};
  var token = localStorage.getItem('ottin-jwt-token-v2');
  if (!token) return {error: 'Not logged in to TTC'};

  function ttcRequest(method, url, body) {
    var xhr = new XMLHttpRequest();
    xhr.open(method, url, false);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('Authorization', 'Bearer ' + token);
    xhr.setRequestHeader('Accept', 'application/json');
    xhr.send(body ? JSON.stringify(body) : null);
    if (xhr.status !== 200) return {error: 'HTTP ' + xhr.status};
    return JSON.parse(xhr.responseText);
  }

  var basicResp = ttcRequest('POST', 'https://api.ttcadvisory.com/api/talent_store/v1/person_leads/basic_info', {person_leads_id: args.id});
  if (basicResp.error || basicResp.code !== 0) return {error: 'basic_info failed', detail: basicResp};

  var d = basicResp.data;
  var result = {
    id: args.id,
    name: d.cn_name,
    enName: d.en_name || null,
    age: d.age || null,
    birthday: d.date_of_birth || null,
    gender: d.gender === 1 ? '男' : d.gender === 2 ? '女' : '未知',
    degree: d.degree,
    jobTitle: d.job_title,
    locations: d.locations,
    tags: d.tags || [],
    phone: d.phone || [],
    email: d.email || [],
    highlights: d.personal_highlights || null,
    hasGulu: d.gulu_info ? d.gulu_info.has_gulu_id : false,
    lists: d.customized_list_ids || [],
    activities: (d.activities || []).slice(0, 5).map(function(a) {
      return {platform: a.platform, time: a.time, action: a.action};
    })
  };

  if (args.profile === 'true') {
    var profileResp = ttcRequest('GET', 'https://api.ttcadvisory.com/api/talent_store/v1/time_based/profile_summary?person_leads_id=' + args.id, null);
    if (profileResp.code === 0 && profileResp.data && profileResp.data.profile_data) {
      var pd = profileResp.data.profile_data;
      var profileSections = {};
      var categories = [pd.basic_profile, pd.work_profile, pd.education_profile, pd.skill_profile].filter(Boolean);
      for (var i = 0; i < categories.length; i++) {
        var cat = categories[i];
        var subs = cat.sub_categories || [];
        var section = {};
        for (var j = 0; j < subs.length; j++) {
          var sub = subs[j];
          var fields = {};
          for (var k = 0; k < (sub.fields || []).length; k++) {
            var f = sub.fields[k];
            fields[f.field_name || f.key] = f.content;
          }
          section[sub.sub_category_name || sub.sub_category_key] = fields;
        }
        profileSections[cat.category_name] = section;
      }
      result.profile = profileSections;
    }
  }

  return result;
}
