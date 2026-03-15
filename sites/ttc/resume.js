/* @meta
{"name":"ttc/resume","description":"TTC获取简历附件列表","domain":"ttcadvisory.com","args":{"id":{"required":true,"description":"候选人ID，如 PL1928085809270763520"}}}
*/
async function(args) {
  if (!args.id) return {error: 'Missing --id (person_leads_id)'};
  var token = localStorage.getItem('ottin-jwt-token-v2');
  if (!token) return {error: 'Not logged in to TTC'};

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'https://api.ttcadvisory.com/api/talent_store/v1/person_leads/resume/attachment/list', false);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('Authorization', 'Bearer ' + token);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.send(JSON.stringify({person_leads_id: args.id}));

  if (xhr.status !== 200) return {error: 'HTTP ' + xhr.status};
  var resp = JSON.parse(xhr.responseText);
  if (resp.code !== 0) return {error: 'API error', msg: resp.msg};

  var items = (resp.data && resp.data.attachment_items) || [];
  if (items.length === 0) return {id: args.id, message: 'No resume attachments found', attachments: []};

  var results = items.map(function(item) {
    return {
      attachmentId: item.attachment_id,
      fileName: item.name,
      downloadUrl: item.link || null,
      previewUrl: item.preview_url || null,
      uploadTime: item.created_at,
      updatedAt: item.updated_at,
      sourceUser: item.source_user_name || null,
      sourceChannel: item.source_channel_name || null
    };
  });

  return {id: args.id, count: results.length, attachments: results};
}
