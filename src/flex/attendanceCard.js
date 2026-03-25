function buildAttendanceCard(event, responses) {
  const yes = responses.filter(r => r.status === 'yes');
  const no = responses.filter(r => r.status === 'no');
  const maybe = responses.filter(r => r.status === 'maybe');

  const nameList = (arr) =>
    arr.length > 0 ? arr.map(r => r.display_name).join('、') : 'まだいない';

  return {
    type: 'flex',
    altText: `🍺 ${event.title} - 参加確認`,
    contents: {
      type: 'bubble',
      size: 'mega',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '🍺 飲み会の参加確認',
            color: '#ffffff',
            size: 'sm',
            weight: 'bold',
          },
          {
            type: 'text',
            text: event.title,
            color: '#ffffff',
            size: 'xl',
            weight: 'bold',
            wrap: true,
          },
        ],
        backgroundColor: '#FF6B35',
        paddingAll: '20px',
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: [
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '📅', size: 'sm', flex: 0 },
              { type: 'text', text: event.date, size: 'sm', margin: 'sm', wrap: true },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '📍', size: 'sm', flex: 0 },
              { type: 'text', text: event.location, size: 'sm', margin: 'sm', wrap: true },
            ],
          },
          {
            type: 'box',
            layout: 'horizontal',
            contents: [
              { type: 'text', text: '⏰', size: 'sm', flex: 0 },
              { type: 'text', text: `締め切り：${event.deadline}`, size: 'sm', margin: 'sm', color: '#E74C3C' },
            ],
          },
          { type: 'separator', margin: 'lg' },
          {
            type: 'box',
            layout: 'vertical',
            spacing: 'sm',
            contents: [
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: `✅ 参加 ${yes.length}人`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#27AE60',
                    flex: 1,
                  },
                ],
              },
              {
                type: 'text',
                text: nameList(yes),
                size: 'xs',
                color: '#666666',
                wrap: true,
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: `🤔 検討中 ${maybe.length}人`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#F39C12',
                    flex: 1,
                  },
                ],
                margin: 'sm',
              },
              {
                type: 'text',
                text: nameList(maybe),
                size: 'xs',
                color: '#666666',
                wrap: true,
              },
              {
                type: 'box',
                layout: 'horizontal',
                contents: [
                  {
                    type: 'text',
                    text: `❌ 不参加 ${no.length}人`,
                    size: 'sm',
                    weight: 'bold',
                    color: '#E74C3C',
                    flex: 1,
                  },
                ],
                margin: 'sm',
              },
              {
                type: 'text',
                text: nameList(no),
                size: 'xs',
                color: '#666666',
                wrap: true,
              },
            ],
          },
        ],
      },
      footer: {
        type: 'box',
        layout: 'horizontal',
        spacing: 'sm',
        contents: [
          {
            type: 'button',
            style: 'primary',
            color: '#27AE60',
            action: {
              type: 'postback',
              label: '✅ 参加',
              data: `action=respond&event_id=${event.id}&status=yes`,
              displayText: '参加します！',
            },
            height: 'sm',
          },
          {
            type: 'button',
            style: 'primary',
            color: '#F39C12',
            action: {
              type: 'postback',
              label: '🤔 検討中',
              data: `action=respond&event_id=${event.id}&status=maybe`,
              displayText: '検討中です',
            },
            height: 'sm',
          },
          {
            type: 'button',
            style: 'primary',
            color: '#E74C3C',
            action: {
              type: 'postback',
              label: '❌ 不参加',
              data: `action=respond&event_id=${event.id}&status=no`,
              displayText: '不参加です',
            },
            height: 'sm',
          },
        ],
      },
    },
  };
}

module.exports = { buildAttendanceCard };
