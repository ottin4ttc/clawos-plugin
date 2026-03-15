/* @meta
{
  "name": "boss/conversations",
  "description": "获取沟通页面的对话列表（需要先在 BOSS 直聘沟通页面）",
  "domain": "www.zhipin.com",
  "args": {
    "filter": {"required": false, "description": "筛选: all(默认), unread, replied"}
  },
  "readOnly": true,
  "example": "clawos site boss/conversations"
}
*/
async function(args) {
  if (!location.href.includes('zhipin.com')) return {error: 'Not on BOSS直聘', hint: 'Navigate to www.zhipin.com/web/chat/index first.'};

  const items = document.querySelectorAll('.geek-item');
  if (!items.length) return {error: 'No conversations found', hint: 'Make sure you are on the chat page.'};

  const conversations = [];
  items.forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.height <= 0) return;
    const nameEl = el.querySelector('[class*="name"]');
    const msgEl = el.querySelector('[class*="msg"], [class*="message"], [class*="desc"]');
    const timeEl = el.querySelector('[class*="time"]');
    const id = el.dataset?.id || '';
    const uid = id.split('-')[0] || '';
    conversations.push({
      uid,
      dataId: id,
      name: nameEl?.textContent?.trim() || '',
      lastMsg: msgEl?.textContent?.trim()?.substring(0, 80) || '',
      time: timeEl?.textContent?.trim() || '',
      selected: el.className.includes('selected')
    });
  });
  return {count: conversations.length, conversations};
}
