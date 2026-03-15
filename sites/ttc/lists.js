/* @meta
{"name":"ttc/lists","description":"TTC名单列表（智能名单+自定义名单）","domain":"ttcadvisory.com","args":{"type":{"required":false,"description":"名单类型：smart(智能名单) 或 custom(自定义名单)，默认both"}}}
*/
async function(args) {
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

  var result = {};
  var listType = args.type || 'both';

  if (listType === 'smart' || listType === 'both') {
    var smartResp = ttcRequest('GET', 'https://api.ttcadvisory.com/api/talent_store/v1/search/smart_list/list', null);
    if (smartResp.code === 0 && smartResp.data) {
      var smartItems = smartResp.data.smart_list_items || [];
      result.smartLists = smartItems.map(function(item) {
        return {key: item.key, name: item.display_name, count: item.total_count, enabled: item.enable};
      });
    } else {
      result.smartLists = {error: smartResp.msg || 'failed'};
    }
  }

  if (listType === 'custom' || listType === 'both') {
    var customResp = ttcRequest('POST', 'https://api.ttcadvisory.com/api/talent_store/v1/customized_list/get', {});
    if (customResp.code === 0 && customResp.data) {
      var lists = customResp.data.person_leads_customized_lists || [];
      result.customLists = lists.map(function(item) {
        return {id: item.key, name: item.display_name, count: item.total_count, role: item.role};
      });
    } else {
      result.customLists = {error: customResp.msg || 'failed'};
    }
  }

  return result;
}
