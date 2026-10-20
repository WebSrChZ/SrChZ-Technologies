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
      },
      privacy: {
        title: 'プライバシーポリシー — SrChZ Technologies',
        description: 'srchz-technologies.com.br で取得した個人データを SrChZ Technologies がブラジル個人データ保護法（LGPD、法律第13.709/2018号）に基づきどのように取り扱うかについて。'
      },
      privacyEnd: {
        title: 'プライバシーポリシー — SrChZ · 非破壊検査',
        description: 'エンジニアリング＆非破壊検査セクションで取得した個人データを SrChZ Technologies がブラジル個人データ保護法（LGPD、法律第13.709/2018号）に基づきどのように取り扱うかについて。'
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
  'tech.faq.a5': '最後ではなく、設計の段階で扱います：法的根拠の明示、日付つきの同意記録、データベースの行単位アクセス制御、そして実際に取得する項目を記載したプライバシーポリシー——ありきたりの雛形ではありません。',

  // ---- /privacidade.html --------------------------------------------------
  'priv.h1': 'プライバシーポリシー',
  'priv.meta': 'SrChZ Technologies · 法人番号（CNPJ）68.371.698/0001-95 — 最終更新：2026年10月',
  'priv.langNote': '<strong>参考訳です。</strong>本ポリシーはブラジル法に準拠し、相違がある場合は <a href="?lang=pt">/privacidade.html</a> のポルトガル語版が優先します。ここに記載する権利と期限は、LGPD（法律第13.709/2018号）が定めるものです。',
  'priv.intro': '本ポリシーは、<strong>SrChZ Technologies</strong>（法人番号 CNPJ <strong>68.371.698/0001-95</strong>）が <strong>srchz-technologies.com.br</strong> で取得した個人データを、<strong>ブラジル個人データ保護法（LGPD — 法律第13.709/2018号）</strong>に基づきどのように取り扱うかを説明するものです。',
  'priv.scope': '対象は、統合サイト、<a href="growth/">ブランディング＆グロース</a>のセクション、および<a href="tech/">テクノロジー＆データ/AI</a>のセクションです。エンジニアリング＆非破壊検査のセクションには <a href="end/privacidade.html">/end/privacidade.html</a> に独自のポリシーがあります。',

  'priv.h2.1': '1. 管理者について',
  'priv.controller': '<strong>SRCHZ TECHNOLOGIES SOLUCOES LTDA</strong>（屋号：SrChZ Technologies）<br>法人番号（CNPJ）：<strong>68.371.698/0001-95</strong><br>所在地：Alameda Rio Negro, 503, Sala 2020 — Alphaville Centro Industrial e Empresarial, Barueri/SP, 06454-000, ブラジル<br>代表者：Rafael Henrique Cordeiro Santos<br>管理者の連絡先：<a href="mailto:rafaelhenriquecsantosz@gmail.com">rafaelhenriquecsantosz@gmail.com</a>',
  'priv.controllerNote': '第6項に記載する権利の行使も、このメールアドレスで受け付けます。15日以内に回答します。',

  'priv.h2.2': '2. 取得するデータ',
  'priv.collect': '取得するのは、お問い合わせフォームにご入力いただいた内容のみです——<a href="growth/">グロース</a>のセクションのフォームと、<a href="tech/">テクノロジー＆データ/AI</a>のセクションのフォームです。項目も保存先も同じで、違いは送信元の区別だけで、それも併せて記録されます。トラッキングCookie、広告ピクセル、アクセス解析ツールは一切使用していません。',
  'priv.tbl.h1': 'データ',
  'priv.tbl.h2': '取得元',
  'priv.tbl.h3': '必須',
  'priv.tbl.r1': 'お名前',
  'priv.tbl.r2': '連絡先（WhatsApp またはメール）',
  'priv.tbl.r3': '業種',
  'priv.tbl.r4': 'メッセージ',
  'priv.tbl.r5': 'ユーザーエージェント（ブラウザとOS）',
  'priv.tbl.byYou': 'ご入力',
  'priv.tbl.byBrowser': 'ブラウザが送信',
  'priv.tbl.yes': 'はい',
  'priv.tbl.no': 'いいえ',
  'priv.tbl.auto': '自動',
  'priv.ua': '<strong>ユーザーエージェント</strong>は、自動送信（スパム）を見分けるためだけに記録します。閲覧履歴のプロファイルを作ることも、サイトをまたいで追跡することもありません。',

  'priv.h2.3': '3. 利用目的と法的根拠',
  'priv.basis1': '<strong>お問い合わせへの回答</strong>とご提案の提示——法的根拠：<strong>同意</strong>（チェックボックスにチェックしてフォームを送信することによる）。',
  'priv.basis2': '<strong>スパムの抑止</strong>（ユーザーエージェント）——法的根拠：連絡手段を機能させ続けることへの<strong>正当な利益</strong>。',
  'priv.noSell': '第三者のマーケティング目的でお客様のデータを販売、貸与、共有することはありません。自動化された意思決定にも使用しません。',

  'priv.h2.4': '4. データの保管場所',
  'priv.where': '送信内容は <strong>Supabase</strong>（マネージドPostgreSQL）の<strong>南米・サンパウロ（sa-east-1）</strong>リージョンに保存され、同社は<em>処理者</em>として扱われます。書き込みには挿入のみに制限された公開鍵を使用します。サイトは <strong>GitHub Pages</strong> でホストされ、HTTPSが強制されています。',
  'priv.fonts': '書体は Google Fonts から読み込まれるため、ページ表示時にお客様のIPアドレスが Google に渡ります——CDNとして一般的な挙動であり、当方で個人を特定することはありません。',

  'priv.h2.5': '5. 保存期間',
  'priv.retention': '商談に関する連絡先は、最後のご連絡から最長<strong>24か月</strong>保存し、その後削除します。それより前に削除をご希望の場合は、<strong>15日以内</strong>に削除します。',

  'priv.h2.6': '6. お客様の権利',
  'priv.rights': 'LGPD は次の権利を保障しています：取り扱いの<strong>確認</strong>、<strong>開示</strong>、<strong>訂正</strong>、<strong>匿名化または削除</strong>、<strong>データポータビリティ</strong>、共有に関する<strong>情報提供</strong>、そしていつでも可能な<strong>同意の撤回</strong>。',
  'priv.rightsHow': '<a href="mailto:rafaelhenriquecsantosz@gmail.com">rafaelhenriquecsantosz@gmail.com</a> までご連絡ください——15日以内に回答します。同意の撤回は、撤回前に行われた取り扱いの適法性に影響しません。',

  'priv.h2.7': '7. セキュリティ',
  'priv.security': 'サイト全体でHTTPSを使用し、データベースへのアクセスは行単位のセキュリティで制限し、フォームが使う鍵には最小権限の原則を適用しています。完全な仕組みは存在しません。お客様のデータに重大なリスクを伴うセキュリティ事故が発生した場合は、LGPD第48条に従い、お客様とブラジルのデータ保護当局（ANPD）に通知します。',

  'priv.h2.8': '8. 未成年者について',
  'priv.minors': '本フォームは18歳未満の方を対象としておらず、児童・青少年のデータを意図的に取得することはありません。',

  'priv.h2.9': '9. 本ポリシーの変更',
  'priv.changes': '重要な変更は、上部に表示された公開日から有効になります。変更履歴は<a href="https://github.com/WebSrChZ/SrChZ-Technologies" target="_blank" rel="noopener">サイトのリポジトリ</a>で公開しています。',
  'priv.back': '← ホームに戻る',

  // ---- /end/privacidade.html ----------------------------------------------
  'pend.h1': 'プライバシーポリシー',
  'pend.meta': 'SrChZ Technologies · 非破壊検査 · 法人番号（CNPJ）68.371.698/0001-95 — 最終更新：2026年10月',
  'pend.langNote': '<strong>参考訳です。</strong>本ポリシーはブラジル法に準拠し、相違がある場合は <a href="?lang=pt">/end/privacidade.html</a> のポルトガル語版が優先します。',
  'pend.intro': '本ポリシーは、<strong>SrChZ Technologies</strong>（Rafael Cordeiro）が本サイトで取得した個人データを、<strong>ブラジル個人データ保護法（LGPD — 法律第13.709/2018号）</strong>に基づきどのように取り扱うかを説明するものです。',

  'pend.h2.1': '1. 取得するデータ',
  'pend.forms': '本セクションにはフォームが二つあり、取得する内容はそれぞれ異なります。',
  'pend.form1': '<b>ガイドの無料サンプル</b>（<i>/end/USN2/</i>）：お名前、メールアドレス、任意で WhatsApp。',
  'pend.form2': '<b>検査のご依頼</b>（<i>/end/</i>）：お名前、ご連絡先（WhatsApp またはメール）、そしてご記入いただいた場合は対象部材と適用規格、範囲、納期。この項目は技術的な内容ですが、貴社を特定しうるため、同じ配慮の対象とします。',
  'pend.ua': 'いずれのフォームも、自動送信の抑止と同意の証跡保持のために、<b>ブラウザの識別子（ユーザーエージェント）</b>と本ポリシーへの<b>同意日時</b>を記録します。トラッキングCookieや広告ピクセルは使用していません。',

  'pend.h2.2': '2. 利用目的',
  'pend.purp1': 'ご請求いただいた資料（無料サンプル／ガイド）のお届け。',
  'pend.purp2': '検査のご依頼に対し、範囲・手法・納期をお示しして回答すること。',
  'pend.purp3': '製品および非破壊検査の学習コンテンツに関する関連情報のご案内。',
  'pend.purp4': 'サイトとユーザー体験の改善。',
  'pend.noSell': 'マーケティング目的で第三者にデータを販売・共有することはありません。',

  'pend.h2.3': '3. 法的根拠',
  'pend.basis': '取り扱いは、同意欄にチェックしてフォームを送信することによる<b>同意</b>と、関連製品についてご案内することへの<b>正当な利益</b>に基づきます。同意はいつでも撤回できます。',

  'pend.h2.31': '3.1. データの保管場所',
  'pend.where': '両フォームの送信内容は <b>Supabase</b>（マネージドPostgreSQL）の<b>南米・サンパウロ</b>リージョンに保存され、同社は<i>処理者</i>として扱われます。書き込みには挿入のみに制限された公開鍵を使用しており、レコードの送信はできてもデータベースの読み取りはできません。サイトは <b>GitHub Pages</b> でホストされています。',

  'pend.h2.4': '4. お客様の権利（LGPD）',
  'pend.rights': '開示、訂正、データポータビリティ、<b>削除</b>をご請求いただけるほか、配信停止も可能です。マーケティングメールにはすべて<b>配信停止</b>リンクを記載しています。',

  'pend.h2.5': '5. 保存とセキュリティ',
  'pend.retention': 'データは上記の目的に必要な期間のみ保存し、相応のセキュリティ対策を講じています。インフラ提供者（ホスティング／メール）が処理者としてデータを取り扱う場合があります。',

  'pend.h2.6': '6. 管理者の連絡先',
  'pend.controller': '管理者：<strong>SRCHZ TECHNOLOGIES SOLUCOES LTDA</strong>（屋号：SrChZ Technologies）— 法人番号（CNPJ）<strong>68.371.698/0001-95</strong>、所在地 Alameda Rio Negro, 503, Sala 2020 — Alphaville Centro Industrial e Empresarial, Barueri/SP, 06454-000, ブラジル、代表者 Rafael Henrique Cordeiro Santos。',
  'pend.contact': '権利の行使やお問い合わせは <a href="mailto:rafaelhenriquecsantosz@gmail.com">rafaelhenriquecsantosz@gmail.com</a> まで。15日以内に回答します。',

  'pend.trademarks': '本サイトは独立した学習教材です。ABENDI および ASNT は各権利者の商標です。',
  'pend.back': '← ガイドに戻る'
};
