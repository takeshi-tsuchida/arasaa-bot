const db = require('../db');
const { buildAttendanceCard } = require('../flex/attendanceCard');

const STATUS_LABEL = { yes: '参加', no: '不参加', maybe: '検討中' };
const STATUS_EMOJI = { yes: '✅', no: '❌', maybe: '🤔' };

async function handlePostback(client, event) {
  const { source, replyToken } = event;
  const params = Object.fromEntries(new URLSearchParams(event.postback.data));

  if (params.action !== 'respond') return;

  const { event_id, status } = params;
  const userId = source.userId;

  // ユーザー名取得
  let displayName = 'メンバー';
  try {
    const groupId = source.groupId || source.roomId;
    if (groupId) {
      const profile = await client.getGroupMemberProfile(groupId, userId);
      displayName = profile.displayName;
    } else {
      const profile = await client.getProfile(userId);
      displayName = profile.displayName;
    }
  } catch (e) {
    // プロフィール取得失敗時はデフォルト名を使う
  }

  await db.upsertResponse({ event_id, user_id: userId, display_name: displayName, status });

  const eventData = await db.getEvent(event_id);
  const responses = await db.getResponses(event_id);
  const card = buildAttendanceCard(eventData, responses);

  await client.replyMessage({
    replyToken,
    messages: [
      {
        type: 'text',
        text: `${displayName} さんが ${STATUS_EMOJI[status]} ${STATUS_LABEL[status]} で回答しました！`,
      },
      card,
    ],
  });
}

module.exports = { handlePostback };
