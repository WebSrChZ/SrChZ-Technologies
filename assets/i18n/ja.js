/* SrChZ Technologies — 日本語 (ja)
   Carregado pelo assets/i18n.js apenas quando o idioma ativo e `ja`.

   Registro: です・ます調. Nem keigo rigido de empresa grande (soaria falso num
   site de consultor individual), nem informal. Termos tecnicos de END usam a
   nomenclatura corrente no Japao: 非破壊検査, 超音波探傷, 浸透探傷, 肉厚測定.

   Observacao tipografica: o assets/i18n.js troca a familia de fontes e desliga
   italico quando lang="ja", porque Cormorant Garamond nao tem glifo CJK e o
   navegador sintetizaria uma inclinacao ruim no japones.

   _meta.pages tem um bloco por pagina (a pagina se identifica em
   <html data-i18n-page="…">), porque titulo e descricao mudam por pagina. */
window.SRCHZ_I18N = window.SRCHZ_I18N || {};
window.SRCHZ_I18N.ja = {
  _meta: {
    htmlLang: 'ja',
    ogLocale: 'ja_JP',
    pages: {
      home: {
        title: 'SrChZ Technologies — ラファエル・コルデイロ｜ソリューション・ストラテジスト',
        ogTitle: 'SrChZ Technologies — ソリューション・ストラテジスト',
        description: 'ラファエル・コルデイロ — ソリューション・ストラテジスト。他が見落とすものを解決します：ブランディング＆グロース、エンジニアリング＆非破壊検査、テクノロジー＆データ/AI。'
      },
      tech: {
        title: 'SrChZ · テクノロジー＆データ/AI｜ウェブ・ポータル・自動化・動画・AI',
        ogTitle: 'SrChZ · テクノロジー＆データ/AI',
        description: 'SrChZ のテクノロジー部門：受託ウェブ開発、ポータルとウェブアプリ、業務自動化と連携、ホスティングとデータ処理、動画の制作と編集、経営コンサルティング、そして実務で使える AI。設計からデプロイまで。'
      }
    }
  },

  // ---- home ---------------------------------------------------------------
  'nav.skip': '本文へスキップ',
  'nav.about': '私について',
  'nav.method': '手法',
  'nav.practices': '事業領域',
  'nav.cta': 'ご相談ください',

  'hero.role': 'ソリューション・ストラテジスト',
  'hero.title': 'ソリューション・ストラテジスト',
  'hero.lead': '他が見落とすものを解決します。<b>テクノロジー・ブランド・エンジニアリング</b>の境界、そして人が実際にどう考え、学び、決めるのか——その境目が私の仕事場です。デジタルの成長から産業検査まで、<b>領域は違っても、仕組みは一つです。</b>',

  'doors.n1': '01 · 領域',
  'doors.n2': '02 · 領域',
  'doors.n3': '03 · 領域',
  'doors.enter': '詳しく見る',
  'doors.growth.name': 'ブランディング＆グロース',
  'doors.growth.desc': '広告運用、ブランド構築、動画制作、そして自社専用の顧客ポータル。成果を出すための一貫した仕組みをつくります。',
  'doors.end.name': 'エンジニアリング＆非破壊検査',
  'doors.end.desc': '超音波探傷、鉄道検査、肉厚測定、浸透探傷——規格に準拠した報告書まで。資格取得用の学習教材も扱っています。',
  'doors.tech.name': 'テクノロジー＆データ/AI',
  'doors.tech.desc': 'ウェブ、ポータル、業務自動化、カスタマーエクスペリエンス、そしてデータ活用。',

  'about.eyebrow': '私について',
  'about.title': '分野は変わる。<span class="gold-text">手法は変わらない。</span>',
  'about.p1': '<b>他の誰も動かせなかった問題</b>を解くために呼ばれます。分野は問いません。これまで産業・鉄道エンジニアリング、テクノロジー、マーケティングと広告運用、映像制作、そして海外顧客対応に携わってきました。',
  'about.pull': '私を定義するのは、やっていることではなく、理解していることです。肩書きは道具にすぎません——お届けするのは解決策そのものです。',
  'about.p2': '私の強みは<b>多くの人が見落とすものに気づくこと</b>です。曖昧な問題を引き受け、その仕組みを根本原因まで分解し、明快な解決策にして返します。とくに分析・戦略・美意識が交わるデジタルとテクノロジーの領域で力を発揮します。',
  'about.p3': '誰も解けずに止まっている案件はありませんか。戦略、テクノロジー、映像制作、データとAI——どの分野にも同じ手法で臨みます。<b>実行する前に考える人</b>が必要なら、ぜひご連絡ください。',
  'about.card': '「混沌の秩序」——エンジニアリング、精神分析、ハイエンドな美意識を結ぶ戦略コンサルティング。ラファエル・コルデイロ創業。',
  'about.chip1': '3言語対応 · <b>PT · EN C2 · JP B1</b>',
  'about.chip2': '情報工学 ＋ <b>精神分析</b>',
  'about.chip3': '<b>非破壊検査レベル2</b> 検査員',
  'about.chip4': '海外<b>カスタマーエクスペリエンス</b>',

  'method.eyebrow': '仕事の進め方',
  'method.title': '一つの手法で、どの分野にも。',
  'method.lede': '鉄道の溶接でも、広告キャンペーンでも、デジタルシステムでも、適用する工程は同じです。これほど違う分野で成果が揺れないのは、そのためです。',
  'method.s1.t': 'パターンを読む',
  'method.s1.d': '背後の仕組みが見えてくるまで問題と向き合います。多くの人が見ないのは、まさにそこです。',
  'method.s2.t': 'シナリオを比べる',
  'method.s2.d': '仮説を並べ、摩擦が最も少なく効果が最も大きい道筋を検証します。',
  'method.s3.t': '戦略を組み立てる',
  'method.s3.d': '根本原因まで降りていき、始まりと途中と終わりのある明快な解決策を設計します。',
  'method.s4.t': '美意識をもって実行する',
  'method.s4.d': 'ハイエンドな水準で仕上げます。形そのものが信頼を伝えるからです。',

  'practices.eyebrow': '提供できること',
  'practices.title': '入口をお選びください。',
  'practices.lede': '領域ごとに言葉も実績も進め方も違います。いま痛みのあるところから入ってください。',
  'practices.see': 'この領域を見る',
  'practices.growth.desc': '広告運用（Meta Ads）、ブランディング、シネマティックな動画制作、専用の顧客ポータル。',
  'practices.end.desc': '超音波探傷レベルII、溶接およびレールの検査、そして出版済みの資格対策ガイド。',
  'practices.tech.desc': 'ウェブ開発、ポータルとウェブアプリ、業務自動化、CX、AIによるデータ活用。',

  'contact.eyebrow': 'お話ししましょう',
  'contact.title': '誰も解けずに止まっている案件はありませんか。',
  'contact.lede': 'ブランド、エンジニアリング、テクノロジー、データ——どの課題でもお送りください。実行する前に考える人が必要なら、ご連絡いただくだけで十分です。',
  'contact.wa': 'WhatsAppで送る',
  'contact.mail': 'メールを送る',

  'footer.tagline': 'ソリューション・ストラテジスト · 洞察 · 戦略 · 実行',
  'footer.privacy': 'プライバシーポリシー',

  // ---- /tech/ -------------------------------------------------------------
  'tech.nav.home': '‹ ホーム',
  'tech.nav.caps': '提供範囲',
  'tech.nav.how': '進め方',
  'tech.nav.proof': '稼働中の事例',
  'tech.nav.cta': 'はじめる →',

  'tech.hero.kicker': 'テクノロジー · データ＆AI',
  'tech.hero.title': 'テクノロジー＆<br>データ / AI',
  'tech.hero.sub': 'ウェブ · ポータル · 自動化 · CX · データ活用',
  'tech.hero.lead': '実行する前に考えるシステムを、設計からデプロイまで。分析と戦略と美意識が同じ場所にあります。',
  'tech.hero.cta1': 'プロジェクトを相談する →',
  'tech.hero.cta2': '提供範囲を見る',

  'tech.caps.title': '提供範囲',
  'tech.caps.lead': 'サイトからシステムまで——エンジニアリング、データ、美意識が一つの仕組みとして動きます。',
  'tech.tag.live': '対応中',
  'tech.tag.soon': '準備中',

  'tech.cap.web.n': 'ウェブ＆ポータル',
  'tech.cap.web.d': '受託のサイト、ウェブアプリ、<b>顧客ポータル</b>——設計からデプロイまで。インストール可能なPWA、技術SEO、構造化データ、そして計測された表示速度。',
  'tech.cap.aut.n': '自動化＆連携',
  'tech.cap.aut.d': '手作業をなくす流れをつくります。外部連携、Webhook、<i>サーバーレス</i>のバックエンド。いま表計算とコピー＆ペーストでやっていることが、ひとりでに進むようになります。',
  'tech.cap.dat.n': 'データ＆ホスティング',
  'tech.cap.dat.d': 'データベース、アプリケーションのホスティング、データ処理——<b>行単位のアクセス制御</b>、同意の記録、そして設計段階から組み込まれた個人情報保護。',
  'tech.cap.vid.n': '動画＆ポストプロダクション',
  'tech.cap.vid.d': '制作と編集：モーショングラフィックス、<b>同期字幕</b>、マスタリング済み音声、サウンドデザイン——編集体制のなかで、一定の頻度で。',
  'tech.cap.ges.n': '経営コンサルティング',
  'tech.cap.ges.d': 'コードを書く前に。どこで業務が詰まるのか、何を自動化する価値があり、何は手作業のままが良いのか。正しい答えが<b>ソフトウェアではない</b>こともあります。',
  'tech.cap.cx.n': 'カスタマーエクスペリエンス',
  'tech.cap.cx.d': '導線、対応、転換——人が実際にどう考えるかを仕組みが無視している箇所の摩擦を減らします。',
  'tech.cap.ia.n': 'データ＆AI',
  'tech.cap.ia.d': 'AIの評価と学習、プロンプト設計、品質分析、そして実務で使えるデータ活用。',
  'tech.cap.bi.n': 'ダッシュボード＆BI',
  'tech.cap.bi.d': 'リアルタイムのデータ画面と、判断につながるレポート。',
  'tech.cap.api.n': 'プロダクト＆API',
  'tech.cap.api.d': '小規模プロダクト、API、事業に合わせたツール。',

  'tech.how.title': '進め方',
  'tech.how.lead': '四つの段階。最初の段階はコードを一行も生みません——そしてそこで、残りをやる価値があるかが決まります。',
  'tech.how.s1.t': '診断',
  'tech.how.s1.d': 'いまどこで業務が詰まり、誰が何に触れ、手作業の本当の費用はいくらなのかを把握します。ここから出てくるのは範囲であって、ありきたりの見積もりではありません。',
  'tech.how.s2.t': '設計',
  'tech.how.s2.d': '構成、データモデル、誰が何を見てよいか——最初の画面より先に決めます。アクセスと privacy の判断は、後回しにせずこの段階で。',
  'tech.how.s3.t': '構築',
  'tech.how.s3.d': '最後にまとめて出す<i>一括リリース</i>ではなく、開いて使える単位で届けます。一歩ごとに検証したうえで公開します。',
  'tech.how.s4.t': '運用',
  'tech.how.s4.d': 'デプロイ、監視、技術サポート。リポジトリもインフラもお客様名義のまま、管理者権限もお客様が持ちます。',

  'tech.proof.title': '稼働中の事例',
  'tech.proof.lead': '実際に動いている二つのシステム。端から端まで構築したもので、<i>モックアップ</i>でも試作でもありません。',
  'tech.proof.a.tag': '顧客ポータル',
  'tech.proof.a.d': '制作の進行をお客様がリアルタイムで追える専用ポータル：工程ごとの承認、通知、作業履歴、メモ。<b>インストール可能なPWA</b>で、端末を選びません。',
  'tech.proof.a.l1': 'セッション単位のアクセスで、各アカウントは自分のデータのみ閲覧',
  'tech.proof.a.l2': '端末をまたいだリアルタイム更新',
  'tech.proof.a.l3': '個人情報の同意を日付と証跡つきで記録',
  'tech.proof.a.l4': '匿名アクセスからのデータベース書き込みを遮断',
  'tech.proof.a.go': 'ポータルを見る →',
  'tech.proof.b.tag': 'カタログ＋見積',
  'tech.proof.b.d': 'トレーニング用ウェイトのカタログに<b>見積作成機能</b>を搭載：商品と数量を選ぶと、内容がブラウザに保持され、整形された状態でWhatsAppに送られます。決済画面なし、カゴ落ちなし。',
  'tech.proof.b.l1': '6つの製品ラインを、商品ごとの仕様つきで掲載',
  'tech.proof.b.l2': 'ページを再読み込みしても消えない見積',
  'tech.proof.b.l3': '商品ごとの直接リンクで、一点だけ送ることも可能',
  'tech.proof.b.l4': 'お客様がすでに使っている連絡手段のなかで成約',
  'tech.proof.b.go': 'カタログを見る →',

  'tech.contact.title': 'はじめる',
  'tech.contact.lead': 'いま何が詰まっているか教えてください。答えがソフトウェアでない場合は、それもそのままお伝えします。',
  'tech.form.name': 'お名前',
  'tech.form.contact': 'WhatsApp またはメール',
  'tech.form.segment': 'ご希望の内容——サイト、ポータル、自動化、動画、データなど（任意）',
  'tech.form.segmentLabel': 'ご希望の内容',
  'tech.form.message': 'いま何が詰まっていますか（任意）',
  'tech.form.messageLabel': 'メッセージ',
  'tech.form.consent': '<a href="../privacidade.html">プライバシーポリシー</a>に基づく連絡および個人データの取り扱いに同意します。',
  'tech.form.submit': '送信',
  'tech.form.alt': '直接のご連絡はこちら：<a href="https://wa.me/5511996869309?text=Ol%C3%A1%20Rafael%2C%20vim%20pelo%20hub%20de%20Tecnologia%20%26%20Dados%2FIA." target="_blank" rel="noopener">WhatsApp →</a>',
  'tech.form.errFields': 'お名前と有効なご連絡先をご入力ください。',
  'tech.form.errConsent': '送信するには連絡への同意にチェックを入れてください。',
  'tech.form.sending': '送信中…',
  'tech.form.ok': '✓ 受け付けました。追ってご連絡します。',
  'tech.form.errSend': 'ただいま送信できませんでした。下のWhatsAppをお試しください。',

  'tech.faq.title': 'よくあるご質問',
  'tech.faq.q1': 'サイトだけですか、それとも裏側の仕組みも作りますか。',
  'tech.faq.a1': '両方です。受託開発、設定可能なソフトウェア、データベース、ホスティング、自動化、技術サポートまで対応します。サイトは、ポータルや認証やデータを備えたシステムの、目に見える層にすぎません。',
  'tech.faq.q2': 'プロジェクトはどう始まりますか。',
  'tech.faq.a2': '技術からではなく、業務の診断から始まります。まずどこで業務が詰まり、何を自動化する価値があるのかを把握します。何を作るか——そもそも作るべきか——を決めるのは、そのあとです。',
  'tech.faq.q3': '動画も対応していますか。',
  'tech.faq.a3': 'はい、制作と編集の両方です。モーショングラフィックス、同期字幕、音声マスタリング、サウンドデザイン。多くの場合、一定の頻度で回す編集体制と組み合わせます——ItsPower の事例がそれにあたります。',
  'tech.faq.q4': 'コードとシステムは自分のものになりますか。',
  'tech.faq.a4': 'はい。リポジトリもインフラもお客様名義で、管理者権限もお客様が持ちます。プロジェクトを続けるうえで特定の業者に縛られることはありません。',
  'tech.faq.q5': '納品物における個人情報保護はどう扱われますか。',
  'tech.faq.a5': '最後ではなく、設計の段階で扱います：法的根拠の明示、日付つきの同意記録、データベースの行単位アクセス制御、そして実際に取得する項目を記載したプライバシーポリシー——ありきたりの雛形ではありません。'
};
