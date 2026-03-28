# CLAUDE.md

このファイルは、このリポジトリで作業するAIアシスタント向けのガイドです。

## プロジェクト概要

**arasaa-bot** は、飲み会の出欠確認を行うLINE Messaging Botです。日本の「アラサー会」（30〜40代のグループ）をターゲットとしています。Node.js、Express、PostgreSQL（Supabase）、LINE Messaging APIで構築されています。

### Botの機能
- LINEグループチャットで、タイトル・日時・場所・出欠締切を設定した飲み会イベントを作成できる
- メンバーがFlexメッセージのボタンで出欠（参加/未定/不参加）を回答できる
- 参加者名を含むリアルタイムの出欠集計を表示する
- 締切前日に毎朝9時（JST）にリマインダーメッセージを送信する

## コードベース構造

```
src/
├── index.js              # Expressサーバー、webhookエンドポイント、LINE SDK初期化
├── db.js                 # PostgreSQL接続プールと全DBアクセス関数
├── cron.js               # 毎日のリマインダースケジューラー（node-cron）
├── handlers/
│   ├── message.js        # テキストメッセージ処理（イベント作成、コマンド）
│   └── postback.js       # ボタンクリックのpostback処理
└── flex/
    └── attendanceCard.js # LINE Flexメッセージカードのビルダー
```

## 開発ワークフロー

### セットアップ

1. 依存パッケージのインストール: `npm install`
2. 環境変数の設定（[環境変数](#環境変数)参照）
3. 開発モードで起動: `npm run dev`

### スクリプト

- `npm start` — 本番モード（`node src/index.js`）
- `npm run dev` — nodemonによる自動リロード付き開発モード

### テストなし

このプロジェクトにはテストスイートがありません。ロジックを変更した場合は、LINEのwebhookシミュレーターまたは実際のLINE Bot接続で手動テストしてください。

## アーキテクチャ

### リクエストの流れ

```
LINEプラットフォーム
    → POST /webhook (index.js)
        → messageイベント → handlers/message.js
        → postbackイベント → handlers/postback.js
            → db.js (PostgreSQLの読み書き)
            → flex/attendanceCard.js (レスポンスカードの構築)
        → @line/bot-sdk クライアントでLINEに返信
```

### データベーススキーマ

**`events` テーブル**
| カラム | 型 | 備考 |
|---|---|---|
| id | TEXT PRIMARY KEY | crypto.randomBytes(8).toString('hex') |
| group_id | TEXT | LINEグループ/ルーム/ユーザーのソースID |
| title | TEXT | イベント名 |
| date | TEXT | 日時の文字列 |
| location | TEXT | 会場 |
| deadline | TEXT | 締切日の文字列 |
| created_by | TEXT | 作成者のLINE userId |
| created_at | TIMESTAMP | 自動設定 |

**`responses` テーブル**
| カラム | 型 | 備考 |
|---|---|---|
| event_id | TEXT | FK → events.id |
| user_id | TEXT | LINE userId |
| display_name | TEXT | 回答時のLINE表示名 |
| status | TEXT | CHECK: 'yes' / 'no' / 'maybe' |

複合PK: `(event_id, user_id)` — 1ユーザーにつき1イベント1回答。

### 主要なDB関数（src/db.js）

- `createEvent(groupId, title, date, location, deadline, createdBy)` — イベントを新規作成
- `getEvent(eventId)` — IDでイベントを取得
- `getActiveEventByGroup(groupId)` — グループの最新イベントを取得
- `upsertResponse(eventId, userId, displayName, status)` — 出欠を登録または更新
- `getResponses(eventId)` — イベントの全回答を取得
- `getEventsNeedingReminder()` — 締切が翌日のイベントを取得

## 主要な規約

### 言語

- コメントとユーザー向けメッセージは**日本語**
- 変数名・関数名は**英語のcamelCase**

### メッセージコマンド（日本語）

テキストメッセージは `src/handlers/message.js` の正規表現で解析されます:

| 入力 | 動作 |
|---|---|
| `飲み会 <タイトル> <日時> <場所> <締切>` | 新規イベント作成 |
| `集計` | 出欠集計を表示 |
| `ヘルプ` または `help` | 使い方を表示 |

### postbackデータのフォーマット

ボタンクリックはURLクエリ文字列形式でpostbackデータを送信します:
```
action=respond&event_id=<id>&status=yes
action=respond&event_id=<id>&status=no
action=respond&event_id=<id>&status=maybe
```

### ソースIDの解決順序

グループコンテキストは以下の優先順で解決されます（message.js）:
1. `event.source.groupId` — LINEグループチャット
2. `event.source.roomId` — LINEルームチャット
3. `event.source.userId` — ダイレクトメッセージ（フォールバック）

### FlexメッセージカードのカラーコードFlexメッセージカードの色

- ヘッダー背景: `#FF6B35`（オレンジ）
- 参加ボタン: `#27AE60`（緑）
- 未定ボタン: `#F39C12`（オレンジ）
- 不参加ボタン: `#E74C3C`（赤）

### データベースクエリ

SQLには必ずパラメーター化クエリ（`$1`, `$2`, ...）を使用すること — 文字列補間は禁止。

### SSL（Supabase / Railway）

`db.js` のPostgreSQLプールはSupabase互換のため `ssl: { rejectUnauthorized: false }` を使用。RailwayデプロイではIPv4を明示的に指定:
```js
{ family: 4 }
```

## 環境変数

`.env` ファイルに記載（コミット禁止 — `.gitignore` 対象）:

| 変数名 | 説明 |
|---|---|
| `LINE_CHANNEL_SECRET` | LINEボットのチャンネルシークレット |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINEボットのアクセストークン |
| `DATABASE_URL` | PostgreSQL接続文字列（Supabase形式） |
| `PORT` | HTTPポート（省略時デフォルト: `3000`） |

## デプロイ

**Railway** 上にデプロイし、**Supabase PostgreSQL** に接続。LINE Developers ConsoleでwebhookのURLを `/webhook` エンドポイントに設定する必要があります。

## 依存パッケージ

| パッケージ | 用途 |
|---|---|
| `@line/bot-sdk` ^9.3.0 | LINE Messaging API |
| `express` ^4.18.3 | HTTPサーバー |
| `pg` ^8.11.3 | PostgreSQLクライアント |
| `node-cron` ^3.0.3 | cronスケジューリング |
| `dotenv` ^16.4.5 | 環境変数の読み込み |
| `nodemon` ^3.1.0 | 開発時の自動リロード |
