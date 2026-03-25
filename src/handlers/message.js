const crypto = require('crypto');
const db = require('../db');
const { buildAttendanceCard } = require('../flex/attendanceCard');

// 飲み会 タイトル 日時 場所 締め切り
// 例: 飲み会 忘年会 12月20日19時 渋谷ハブ 12月18日
const NOMIKAI_REGEX = /^飲み会\s+(.+?)\s+(.+?)\s+(.+?)\s+(\S+)$/;

async function handleMessage(client, event) {
  const { type, source, message } = event;
  if (type !== 'message' || message.type !== 'text') return;

  const text = message.text.trim();
  const groupId = source.groupId || source.roomId || source.userId;
  const userId = source.userId;

  // 飲み会作成
  const match = text.match(NOMIKAI_REGEX);
  if (match) {
    const [, title, date, location, deadline] = match;
    const eventId = crypto.randomBytes(6).toString('hex');

    db.createEvent({
      id: eventId,
      group_id: groupId,
      title,
      date,
      location,
      deadline,
      created_by: userId,
    });

    const card = buildAttendanceCard(
      { id: eventId, title, date, location, deadline },
      []
    );

    const reply = await client.replyMessage({
      replyToken: event.replyToken,
      messages: [
        card,
        {
          type: 'text',
          text: `📋 使い方\n✅参加 / 🤔検討中 / ❌不参加 をタップして回答してください！\n\n集計を見たいときは「集計」と送ってね`,
        },
      ],
    });
    return;
  }

  // 集計表示
  if (text === '集計') {
    const activeEvent = db.getActiveEventByGroup(groupId);
    if (!activeEvent) {
      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: '現在進行中の飲み会はありません。\n\n飲み会を作るには:\n「飲み会 タイトル 日時 場所 締め切り」\n例: 飲み会 忘年会 12月20日19時 渋谷ハブ 12月18日' }],
      });
      return;
    }

    const responses = db.getResponses(activeEvent.id);
    const card = buildAttendanceCard(activeEvent, responses);
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [card],
    });
    return;
  }

  // ヘルプ
  if (text === 'ヘルプ' || text === 'help') {
    await client.replyMessage({
      replyToken: event.replyToken,
      messages: [{
        type: 'text',
        text: '🤖 アラサー会Bot の使い方\n\n【飲み会を作る】\n飲み会 タイトル 日時 場所 締め切り\n例: 飲み会 忘年会 12月20日19時 渋谷ハブ 12月18日\n\n【集計を見る】\n「集計」と送る\n\n【回答する】\nカードのボタンをタップするだけ！',
      }],
    });
  }
}

module.exports = { handleMessage };
