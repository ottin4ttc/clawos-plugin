/* @meta
{"name":"ttc/search","description":"TTC人才库搜索","domain":"ttcadvisory.com","args":{"keyword":{"required":true,"description":"搜索关键词（职位/技能/姓名）"},"location":{"required":false,"description":"地点过滤：北京、上海、深圳等"},"degree":{"required":false,"description":"学历过滤：大专、本科、硕士、博士"},"size":{"required":false,"description":"每页数量，默认20"},"page":{"required":false,"description":"页码，从1开始，默认1"},"hasPhone":{"required":false,"description":"只看有手机号：true"},"hasResume":{"required":false,"description":"只看有原始简历：true"},"company":{"required":false,"description":"公司名过滤"},"title":{"required":false,"description":"职位过滤"}}}
*/
async function(args) {
  if (!args.keyword) return {error: 'Missing --keyword'};
  var token = localStorage.getItem('ottin-jwt-token-v2');
  if (!token) return {error: 'Not logged in to TTC (no JWT token found)'};

  var filter = {
    locations: args.location ? [args.location] : [],
    degree: args.degree ? [args.degree] : ['不限'],
    university_category: ['不限'],
    overseas_experience: ['不限'],
    age_range: ['', ''],
    has_system_tag_gulu: false,
    has_system_tag_ttc: false,
    has_mobile: args.hasPhone === 'true',
    has_raw_resume: args.hasResume === 'true'
  };

  var body = {
    keyword: args.keyword,
    page_size: parseInt(args.size || '20'),
    filter: filter,
    search_id: '',
    current_page: parseInt(args.page || '1'),
    colors: '',
    names: [],
    companies: args.company ? [args.company] : [],
    titles: args.title ? [args.title] : [],
    keyword_type: 2,
    company_type: 2
  };

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://api.ttcadvisory.com/api/talent_store/v1/search', false);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.send(JSON.stringify(body));

  if (xhr.status !== 200) return {error: 'HTTP ' + xhr.status, body: xhr.responseText.substring(0, 200)};
  var resp = JSON.parse(xhr.responseText);
  if (resp.code !== 0) return {error: 'API error', code: resp.code, msg: resp.msg};

  var items = (resp.data && resp.data.person_leads_items) || [];
  var results = [];
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var workInfo = item.work_information || [];
    var eduInfo = item.education_information || [];
    var socials = (item.social_information || []).map(function(s) { return s.platform; });

    results.push({
      id: item.person_leads_id,
      name: item.cn_name,
      age: item.age || null,
      gender: item.gender === 1 ? '男' : item.gender === 2 ? '女' : '未知',
      degree: item.degree,
      jobTitle: item.job_title,
      location: item.locations_display || item.locations,
      tags: item.system_tags || [],
      hasPhone: item.has_phone,
      hasEmail: item.has_email,
      platforms: socials,
      work: workInfo.slice(0, 3).map(function(w) {
        return {company: w.company || w.formatted_company, title: w.job_title || w.title, duration: w.duration_in_years + 'y', period: w.start_time + '~' + w.end_time};
      }),
      edu: eduInfo.slice(0, 2).map(function(e) {
        return {school: e.school, degree: e.degree, major: e.major};
      })
    });
  }

  return {total: resp.data.total_num || items.length, page: parseInt(args.page || '1'), count: results.length, results: results};
}
