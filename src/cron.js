const cron = require('node-cron');
const db = require('./db');
const { buildAttendanceCard } = require('./flex/attendanceCard');

function startCron(client) {
  // 毎朝9時にリマインド
  cron.schedule('0 9 * * *', async () => {
    const events = await db.getEventsNeedingReminder();

    for (const event of events) {
      const responses = await db.getResponses(event.id);
      const card = buildAttendanceCard(event, responses);

      try {
        await client.pushMessage({
          to: event.group_id,
          messages: [
            {
              type: 'text',
              text: `⏰ リマインド！\n「${event.title}」の参加回答締め切りは明日です！\nまだ回答してない人は忘れずに👇`,
            },
            card,
          ],
        });
      } catch (e) {
        console.error(`リマインド送信失敗 (event: ${event.id}):`, e.message);
      }
    }
  }, { timezone: 'Asia/Tokyo' });

  console.log('Cron started: reminder at 9:00 JST');
}

module.exports = { startCron };
