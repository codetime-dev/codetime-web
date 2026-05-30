import type { Translation } from './type'
import { defineComponent } from 'vue'
import NuxtLink from './NuxtLink'

export const ja: Partial<Translation> = {
  annualReport: {
    shareMyReport: 'レポートを共有',
    reviewAnnualReport: '年間レポートを確認',
    userNotFound: 'ユーザーが見つかりません。',
    noData: 'データがありません。',
    noDataAvailableFor: (year: number | string) => `${year} 年のデータはありません。`,
    annualCodeTimeReport: (year: number | string) => `${year} 年の年間コーディング時間レポート`,
    weekendCodingTimeRatio: '週末のコーディング時間比率',
    averageDailyCodingTime: '1日あたりの平均コーディング時間',
    activeDaysOfTheYear: '年間アクティブ日数',
    longestStreakOfTheYear: '年間最長連続日数',
    busiestDayOfTheYear: '年間で最も忙しい日',
    busiestMonthOfTheYear: '年間で最も忙しい月',
    theMostProductiveHourOfTheYear: '年間で最も生産性の高い時間',
    month: '月',
    hour: '時間',
    minutes: '分',
    theMostUsedLanguageOfTheYear: '年間で最も使用された言語',
    totalCodingTimeOfTheYear: '年間の合計コーディング時間',
    priodOfDay: {
      morning: '午前',
      afternoon: '午後',
      evening: '夕方',
      midnight: '深夜',
    },
  },
  meta: {
    title: 'CodeTime - コーディング時間を追跡',
    description: 'CodeTime は開発者にぴったりのアプリで、コーディングにかけた時間を正確に記録し、深い洞察を得るのに役立ちます。',
    ogTitle: 'CodeTime - コーディング時間を追跡',
    ogDescription: 'CodeTime は開発者にぴったりのアプリで、コーディングにかけた時間を正確に記録し、深い洞察を得るのに役立ちます。',
    twitterTitle: 'CodeTime - コーディング時間を追跡',
    twitterDescription: 'CodeTime は開発者にぴったりのアプリで、コーディングにかけた時間を正確に記録し、深い洞察を得るのに役立ちます。',
  },
  general: {
    cancel: 'キャンセル',
    confirm: '確認',
  },
  landing: {
    login: 'ログイン',
    description: 'CodeTime は開発者にぴったりのアプリで、コーディングにかけた時間を正確に記録し、深い洞察を得るのに役立ちます。',
    toDashboard: 'ダッシュボードへ',
    alreadyStatistical: '統計済み',
    minutes: '分',
    loginWithGithub: 'GitHub でログイン',
    freeMessage: '現在完全無料、クレジットカード不要',
    demo: 'デモ',
    heroBadge: '集中 · プライバシー · オープン',
    scroll: 'スクロール',

    sections: {
      globalImpact: 'global · impact',
      visualization: 'visualization',
      alwaysSynced: 'always synced',
      openData: 'open data',
      editors: 'editors',
      widgets: 'widgets',
      pricing: 'pricing',
      startTracking: 'start tracking',
    },
    features: {
      visualization: {
        title: 'データ可視化',
        description: 'コーディング時間をより良く理解するために、最も美しいモダンなダッシュボードを提供することに専念しています。',
      },
      save: {
        title: 'コーディング時間のデータを永久に保存。',
        description: '歴史的データの美しさを深く理解し、尽力が無駄になることの悔しさを知っています。年月が経過しても、ユーザーが成長の軌跡を振り返れるよう、データは永遠に保存されます。意図的な削除がない限り、保護は続き、費用が発生しなくても変わりません。',
      },
      export: {
        title: 'データのエクスポートをサポート。',
        description: '世界で最も安全な場所は、あなた自身のハードドライブです。そのため、データのエクスポートをサポートしています。いつでもやめることができます。他のプラットフォームや自己構築サービスに接続します。',
      },
      editor: {
        title: '複数のエディタをサポート。',
        description: '小規模なチームであり、すべてのIDEやコードエディタのサポートは不可能です。しかし、現在はVSCodeとJetBrainsシリーズのIDEに対応しており、これにより多くのユーザーの要望に応えていると考えています。さらに多くのプラットフォームへの対応を目指し、より広範な利用者に利益を提供するために努力しています。',
      },
      widgets: {
        title: 'コーディング時間をどこにでも埋め込み。',
        description: 'バッジ、言語ドーナツ、ライブステータスカードを README、ブログ、個人サイトに配置できます。すべてのウィジェットは単一の SVG — テーマ変更可能で、独立しており、最新データから即座に描画されます。',
        badge: 'Shields スタイルのバッジ',
        donut: '言語ドーナツ',
        status: 'ライブステータスカード',
        cta: 'ウィジェットを作成',
      },
    },
    pricing: {
      heading: '無料で始めよう。必要に応じてProへ',
      title: '価格',
      description: 'あなたに合ったプランを選択してください。',
    },
    closing: {
      line1: '木を植えるのに最も良い時は30年前だった',
      line2: '次に良いのは今だ',
    },
  },
  plan: {
    monthly: '月額',
    yearly: '年額',
    savePercent: (p: number) => `${p}% オフ`,
    oneTime: '一度きり',
    mostFlexible: '最も柔軟',
    mostPopular: '最も人気',
    bestValue: '最高の価値',
    modal: {
      title: 'アップグレード',
      p1: '私たちは、開発の情熱を維持し、より豊富なデータレポートとより良いユーザーエクスペリエンスを提供するために、あなたのサポートが必要です。',
      p2: 'あなたは Pro サブスクリプションにアップグレードして、より多くの機能をアンロックすることができます。',
      p3: '支払いプロセスで問題が発生した場合は、メールでお問い合わせください。',
    },
    status(str: string) {
      switch (str) {
        case 'active': {
          return '有効'
        }
        case 'cancelled': {
          return 'キャンセル済み'
        }
        case 'expired': {
          return '期限切れ'
        }
        case 'on_trial': {
          return 'トライアル中'
        }
        case 'paused': {
          return '一時停止'
        }
        case 'past_due': {
          return '期限切れ'
        }
        case 'unpaid': {
          return '未払い'
        }
        default: {
          return '不明'
        }
      }
    },
    basic: {
      title: '基本',
      forever: '永久',
      features: {
        title: '機能',
        item: {
          saveHistory: '永久に履歴データを保存',
          browseRecent: '過去 90 日間のデータを閲覧',
          codetimeTrend: 'コーディング時間のトレンドレポート',
          codetimeLanguaeTrend: 'コーディング言語のトレンドレポート',
          codetimeProjectTrend: 'プロジェクトのトレンドレポート',
          badge: 'バッジを生成して表示',
          export: 'データのエクスポート',
          import: 'データのインポート',
          more: 'その他のレポート',
          agent: 'Agent テレメトリ：コスト、トークン、ツール、リズム',
        },
      },
      button: '永久に無料',
    },
    pro: {
      title: 'Pro',
      preMonth: '/ 月',
      preYear: '/ 年',
      features: {
        item: {
          include: '基本プランのすべての機能を含む',
          browseAll: 'すべての履歴データを閲覧',
          workspace: 'ワークスペースごとの全履歴データ',
          widgetCustom: 'ウィジェットの詳細スタイルとカスタムカラー',
          widgetUnlimited: 'ウィジェットの日数と言語の上限を解除',
          rule: 'ルールベースのデータ処理',
          tag: 'タグシステム',
        },
      },
      notYet: 'まだ利用できません',
      button: '今すぐ購読',
    },
    needLogin: 'ログインが必要です',
  },
  demoBanner: {
    overviewPrefix: 'サンプルデータ — ログインして VS Code / JetBrains プラグインを',
    overviewSuffix: 'に接続すると自分のデータが表示されます。',
    agentPrefix: 'サンプルデータ — ログインしてエージェントを',
    agentSuffix: 'に接続すると自分のデータが表示されます。',
  },
  dashboard: {
    loginRequired: 'CodeTime ダッシュボードへようこそ！\n コーディング時間のデータを閲覧するには、ログインしていただくか、下のデモボタンをクリックしてデモダッシュボードをお試しいただけます。',
    projectSelector: {
      placeholder: 'ワークスペースを選択',
      noneText: 'ワークスペース名を入力',
    },
    pageHeader: {
      userLatestEvent(project: string) {
        return `「${project}」で作業中`
      },
      title: {
        overview: '概観',
        badge: 'シールド',
        settings: '設定',
        leaderboard: 'リーダーボード',
        workspace: 'ワークスペース',
        tags: 'タグ',
      },
      description: {
        overview: 'すべての CodeTime データを見る。',
        badge: 'あなたのプロジェクトでスマート、統一感のある、明瞭なシールドで CodeTime を表示。',
        settings: 'CodeTime の設定を管理する、外観、言語、データ等を含む。',
        leaderboard: 'CodeTime ユーザーのリーダーボードを見る。',
        workspace: 'ワークスペースのデータを見る。',
        tags: 'ワークスペースの自動分類のためのタグとルールを管理。',
      },
    },
    overview: {
      rangeTitle: '期間',
      activityTitle: 'アクティビティ',
      topTitle: 'トップ',
      codetimeTrendTitle: 'コーディング時間のトレンド',
      codetimeLanguaeTrendTitle: 'コーディング言語のトレンド',
      codetimeProjectTrendTitle: 'プロジェクトのトレンド',
      dailyCodingDistributionTitle: 'コーディング時間の分布',
      dataRange: {
        title(days: number) {
          return `${days} 日間`
        },
        allTime: 'すべての時間',
        custom: 'カスタム…',
        apply: '適用',
        cancel: 'キャンセル',
        thisWeek: '今週',
        lastWeek: '先週',
        thisMonth: '今月',
        lastMonth: '先月',
        yearToDate: '今年',
        pickRange: '期間を選択',
      },
      statistic: {
        timeTotal: 'コーディング時間/合計',
        timeToday: 'コーディング時間/今日',
        timeAverage: 'コーディング時間/平均',
        longestStreak: '連続日数/最大',
        currentStreak: '連続日数/現在',
      },
      top: {
        language: '言語',
        project: 'プロジェクト',
        platform: 'プラットフォーム',
        workspace: 'ワークスペース',
      },
      total: {
        time: '総コーディング時間',
      },
      recent: {
        time: '最近のコーディング時間',
      },
      ranking: 'ランキング',
      hours: '時間',
      active: {
        days: 'アクティブ日数',
      },
      topLanguage: 'トップ言語',
      noData: {
        notice: {
          title: 'まだデータがありません',
          body: defineComponent({
            components: {
              NuxtLink,
            },
            setup() {
              return () => (
                <div class="text-sm">
                  <span class="text-surface-dimmed">
                    現在、あなたのコーディング時間の記録を受け取っていません。このアプリケーションは、コードエディタまたは統合開発環境（ VSCode、JetBrains IDEなど ）のプラグインに依存しています。正常に動作するようにするには、
                  </span>
                  <NuxtLink
                    to="dashboard/settings"
                    class="text-primary-on px-2"
                  >
                    [ 設定 ]
                  </NuxtLink>
                  <span class="text-surface-dimmed">
                    ページに移動し、使用しているプラグインをサポートするコードエディタで対応する設定を行ってください。ご協力ありがとうございます。
                  </span>
                </div>
              )
            },
          }),
        },
      },
    },
    profile: {
      identity: {
        title: 'プロフィール',
      },
      activity: {
        title: 'アクティビティ',
      },
      languages: {
        title: 'Language Highlights',
        noData: '言語データがありません。',
        topPercent: (percent: number) => `TOP ${percent}%`,
      },
      stats: {
        title: 'Account Overview',
        plan: 'Subscription',
        timezone: 'Timezone',
        timezoneUnset: 'Not set',
        joined: 'Joined',
        updated: 'Last updated',
      },
      bio: {
        title: 'Bio',
        subtitle: 'Share your stack, interests, or current focus.',
        edit: 'Edit bio',
        placeholder: 'Describe your background, favorite tools, or current projects…',
        empty: 'This user has not written a bio yet.',
        limitExceeded: 'Character limit exceeded',
        save: 'Save',
        saving: 'Saving…',
        saveSuccess: 'Bio updated successfully',
        saveError: 'Failed to save bio. Please try again.',
      },
    },
    badge: {
      configure: '設定',
      embed: '埋め込み',
      preview: {
        title: 'プレビュー',
      },
      style: {
        flat: 'フラット(Flat)',
        flatSquare: 'フラットスクエア(Flat Square)',
        forTheBadge: 'フォーバッジ(For The Badge)',
        plastic: 'プラスチック(Plastic)',
        social: 'ソーシャル(Social)',
      },
      placeholder: {
        style: 'スタイル',
        language: '言語',
        days: '日数',
        project: 'プロジェクト',
        color: '色',
        tag: 'タグ',
        scope: 'プロジェクトまたはタグ',
      },
      scope: {
        tag: 'タグ',
        workspace: 'プロジェクト',
      },
    },
    widget: {
      tab: {
        badge: 'バッジ',
        donut: '言語比率',
        status: 'コーディング状態',
        calendar: 'カレンダー',
        trend: 'トレンド',
      },
      theme: {
        label: 'テーマ',
        light: 'ライト',
        dark: 'ダーク',
      },
      donut: {
        title: '主要言語',
        days: '日数',
        limit: '言語数',
      },
      status: {
        title: 'コーディング中',
        primary: 'メイン枠',
        secondary: 'サブ枠',
        style: 'スタイル',
        color: 'アクセントカラー',
        colorDefault: 'デフォルト',
        background: '背景色',
        fields: {
          project: 'プロジェクト',
          language: '言語',
          editor: 'エディタ',
          none: '非表示',
        },
        styles: {
          minimal: 'ミニマル',
          detailed: '詳細',
        },
      },
      limit: {
        upgrade: 'Pro にアップグレード',
        donutFree: '無料プラン：最大 30 日 / 5 言語。Pro で上限解除。',
        donutExceeds: '無料プランは 30 日・5 言語が上限で自動的に丸められます。',
        statusFree: '無料プラン：プロジェクト名と言語はどちらか一方のみ表示可能。Pro は両方表示できます。',
        statusFreeStyle: '無料プラン：ミニマルスタイル＋既定色のみ。Pro で詳細スタイルおよびアクセント／背景色のカスタマイズが解放されます。',
      },
    },
    settings: {
      token: {
        title: 'トークン',
        tip: 'あなたのトークンは CodeTime API へのアクセスに使用されるので、それを秘密に保ってください。ここで新しいトークンを生成できます。',
        refresh: '更新',
        refreshTip: 'トークンが漏洩したと疑われる場合は、ここで新しいトークンを生成できます。',
        refreshToken: 'トークンを更新',
        confirmRefresh: 'トークンを更新してもよろしいですか？これにより、エディタプラグインに適用したトークンが無効になります。新しいトークンを入力する必要があります。',
        getPlugin: defineComponent({
          components: {
            NuxtLink,
          },
          setup() {
            return () => (
              <div class="text-surface-dimmed">
                <span>
                  CodeTime の正常な動作のためには、プラグインをインストールして開発環境でトークンを設定する必要があります。現在、
                </span>
                <NuxtLink
                  to="https://marketplace.visualstudio.com/items?itemName=jannchie.codetime"
                  class="text-primary-on px-2 inline-flex gap-1 items-center"
                  style="baseline-source: last;"
                >
                  <i class="i-tabler-brand-vscode" />
                  <span>
                    VSCode
                  </span>
                </NuxtLink>
                <span>
                  と
                </span>
                <NuxtLink
                  to="https://plugins.jetbrains.com/plugin/25617-codetime"
                  class="text-primary-on px-2 inline-flex gap-1 items-center"
                  style="baseline-source: last;"
                >
                  <i class="i-devicon-plain-jetbrains pr-2" />
                  <span>
                    Jetbrains
                  </span>
                </NuxtLink>
                がサポートされています。
              </div>
            )
          },
        }),
      },
      language: {
        title: '言語 (Language)',
        tip: 'CodeTime Web UI の言語を選択します。',
      },
      export: {
        title: 'エクスポート',
        button: 'ワンクリックエクスポート',
        buttonExporting: 'エクスポート中',
        buttonSucceed: 'エクスポート成功',
        buttonFailed: 'エクスポート失敗',
        download: 'ダウンロード',
        description: 'データの安全なバックアップ、便利な移行、深い分析とコンプライアンスを確保するためのデータのエクスポート機能をサポートしています。また、データの完全なコントロールと透明性を提供します。',
        tip: 'あなたのデータを CSV ファイルにエクスポート。',
      },
      theme: {
        title: 'テーマ',
        tip: 'CodeTime Web UI のテーマを選択してください。',
        dark: 'ダーク',
        light: 'ライト',
        system: 'システム',
      },
      dangerZone: {
        title: '危険ゾーン',
        description: 'これらの設定はあなたのデータに永続的な影響を与え、また、回復不可能です。注意して操作してください。',
        button: {
          removeAllData: 'すべてのデータを削除する',
          removeAllDataModal: {
            p1: 'すべてのデータを削除してもよろしいですか？この操作は元に戻すことはできません。',
            p2: 'あなたのデータはとても重要です。データをエクスポートしてから、データを削除してください。',
            p3: 'すべてのデータを削除する場合は、以下に DELETE を入力し、確認をクリックしてください。',
          },
        },
        subTitle: {
          removeData: 'データを削除',
          privacy: 'プライバシー',
        },
      },
      account: {
        title: 'アカウント',
        description: 'アカウントの設定。',
        expiresIn: '有効期限',
        manageSubscription: 'サブスクリプションを管理',
        subscribe: '購読',
      },
      other: {
        title: 'その他',
        description: 'その他の設定。',
        logout: 'ログアウト',
      },
    },
    workspace: {
      project: 'プロジェクト',
      topBranch: '上位ブランチ',
      range: '期間',
      noData: 'このワークスペースのデータがありません。',
      select: {
        placeholder: 'ワークスペースを選択',
        none: 'ワークスペース名を入力',
        prompt: 'プロジェクトを選択してください。',
      },
      flameGraph: {
        title: 'フレームグラフ',
        noData: 'データがありません',
      },
      fileList: {
        title: 'ファイルリスト',
      },
    },
    tags: {
      title: 'タグ',
      description: 'ワークスペースの自動分類のためのタグとルールを管理。',
      tagList: {
        title: 'タグリスト',
        noTags: 'タグが見つかりません。最初のタグを作成して開始してください。',
        createTag: 'タグを作成',
        freeUserLimit: '無料ユーザーは最大',
        upgradeForMore: 'より多くのタグを作成するにはアップグレード',
        editTag: 'タグを編集',
        deleteTag: 'タグを削除',
      },
      tagForm: {
        name: '名前',
        namePlaceholder: 'タグ名を入力',
        color: '色',
        colorPlaceholder: '色を選択',
        emoji: 'Emoji',
        emojiPlaceholder: 'emoji を入力（オプション）',
        create: 'タグを作成',
        edit: 'タグを編集',
        cancel: 'キャンセル',
        save: '保存',
      },
      tagRules: {
        title: 'タグルール',
        noRules: 'このタグのルールが見つかりません。',
        createRule: 'ルールを作成',
        rule: 'ルール',
        enabled: '有効',
        disabled: '無効',
        delete: '削除',
        edit: '編集',
        selectTagPrompt: 'ルールを管理するタグを選択してください',
        freeUserLimit: '無料ユーザーは最大',
        upgradeForMore: 'より多くのルールを作成するにはアップグレード',
      },
      ruleForm: {
        name: 'ルール名',
        namePlaceholder: 'ルール名を入力',
        enabled: '有効',
        conditions: '条件',
        addCondition: '条件を追加',
        field: 'フィールド',
        conditionType: '条件タイプ',
        value: '値',
        valuePlaceholder: '値を入力',
        negate: '否定',
        create: 'ルールを作成',
        edit: 'ルールを編集',
        cancel: 'キャンセル',
        save: '保存',
      },
      conditionTypes: {
        CONTAINS: '含む',
        EQUALS: '等しい',
        STARTS_WITH: '開始する',
        ENDS_WITH: '終了する',
        REGEX: '正規表現',
        NOT_CONTAINS: '含まない',
        NOT_EQUALS: '等しくない',
        NOT_STARTS_WITH: '開始しない',
        NOT_ENDS_WITH: '終了しない',
        NOT_REGEX: '正規表現に一致しない',
      },
      fields: {
        workspaceName: 'ワークスペース名',
        language: '言語',
        gitOrigin: 'Git オリジン',
        gitBranch: 'Git ブランチ',
        platform: 'プラットフォーム',
        editor: 'エディタ',
        absoluteFile: '絶対ファイルパス',
        relativeFile: '相対ファイルパス',
      },
      actions: {
        delete: '削除',
        edit: '編集',
        manageRules: 'ルールを管理',
        enable: '有効化',
        disable: '無効化',
      },
      deleteConfirm: {
        deleteTag: 'タグを削除',
        deleteTagMessage: 'このタグを削除してもよろしいですか？この操作は取り消せません。',
        deleteRule: 'ルールを削除',
        deleteRuleMessage: 'このルールを削除してもよろしいですか？この操作は取り消せません。',
        cancel: 'キャンセル',
        delete: '削除',
      },
      common: {
        not: 'でない',
        optional: '（オプション）',
        ruleRelationship: 'ルール間はOR論理で接続、条件間はAND論理で接続',
        freeUserRuleLimit: '無料ユーザーはタグごとに1つのルールのみ作成可能',
        upgradeForMoreRules: 'より多くのルールを作成するにはアップグレード',
        ruleIdFormat: (id: string) => `ルール #${id.slice(-4)}`,
        editingMode: '編集モード - 変更を保存することを忘れないでください',
      },
      timeRange: {
        last7Days: '過去7日間',
        last30Days: '過去30日間',
        last90Days: '過去90日間',
      },
      stats: {
        title: 'タグ統計',
        viewAll: 'すべて表示',
        noData: 'タグデータがありません',
        timeDistribution: 'タグプログラミング時間分布',
        totalDuration: '総時間',
        recordCount: '記録数',
        timeRange: '時間範囲',
        days: '日',
        dailyAverage: '日平均',
        timeTrend: '時間トレンド',
        noChartData: 'チャートデータがありません',
        statisticsTitle: (tagName: string) => `${tagName} 統計`,
      },
    },
    pluginGuide: {
      title: 'CodeTimeを始める',
      description: 'CodeTimeプラグインをインストールして、コーディング時間を自動的に追跡しましょう',
      token: {
        title: 'あなたのトークン',
        description: 'このトークンをコピーしてプラグイン設定に貼り付けてください',
      },
      plugins: {
        title: 'プラグインをダウンロード',
      },
      vscode: {
        title: 'VSCodeファミリー',
        description: 'VSCode、Cursor、Windsurfと互換性があります',
      },
      jetbrains: {
        title: 'JetBrainsファミリー',
        description: 'すべてのJetBrains IDEと互換性があります',
      },
      downloadPlugin: 'プラグインをダウンロード',
      setup: {
        title: 'セットアップ手順',
        step1: 'エディター用のプラグインをダウンロードしてインストールします',
        step2: 'エディターでプラグイン設定を開きます',
        step3: '上記のトークンをコピーして貼り付けます',
        step4: 'コーディングを開始すると、2〜3分でデータが表示されます',
      },
    },
    agentGuide: {
      title: 'AIエージェントセッションを追跡',
      description: 'codetime CLIをインストールして、Claude Codeセッションを自動的に記録しましょう。',
      token: {
        title: 'あなたのトークン',
        description: 'このトークンをコピーしてください。最終ステップでCLIに入力します。',
      },
      install: {
        title: 'CLIをインストール',
        description: 'npmでcodetimeをグローバルにインストールします（お好みのNodeパッケージマネージャーでも可）。',
      },
      configure: {
        title: 'トークンを設定',
        description: 'このコマンドを実行します。次回のエージェントセッションから自動的にアップロードされます。',
        hint: '<token>を上記でコピーした値に置き換えてください。',
      },
      hook: {
        title: 'エージェントにフック',
        description: 'codetime install を実行すると、CLI がマシン上のサポート対象 AI エージェントを自動検出し、フックを自動設定します。',
        supports: '現在サポートしている Agent：',
        latency: 'エージェントを通常通り使用してください。セッション終了から約 2 分以内にここに表示されます。',
      },
    },
    agent: {
      freeLimit: '無料プランでは過去30日間のセッションのみ表示されます。Proにアップグレードすると全履歴を表示できます。',
      upgrade: 'アップグレード',
      sections: {
        overview: '概要',
        costTimeline: 'コスト · タイムライン',
        rhythm: 'リズム · 時間帯',
        projects: 'プロジェクト · コスト',
        models: 'モデル · コスト',
        tools: 'ツール',
        sessions: 'セッション · 一覧',
      },
      labels: {
        kpi: {
          events: 'イベント',
          sessions: 'セッション',
          tokens: 'トークン',
          cost: 'コスト',
          time: '時間',
          linesNet: '行数差',
          tools: 'ツール',
          cmd: 'コマンド',
          projects: 'プロジェクト',
          inSuffix: '入',
          outSuffix: '出',
          estimated: '推定',
          agentActive: 'agent アクティブ',
        },
        timeline: {
          cost: 'コスト',
          modelCalls: 'モデル呼び出し',
          cacheHit: 'キャッシュヒット',
          tokensFoot: (buckets: number, tokens: string) => `${buckets} バケット · ${tokens} トークン`,
          empty: 'この期間にモデル使用なし',
        },
        rhythm: {
          peakHour: 'ピーク時間',
          peakDay: 'ピーク曜日',
          active: 'アクティブ',
          avgSlot: '平均/スロット',
          ofWindow: '24h × 7d 中',
          perSlot: 'アクティブスロットあたりの呼び出し',
          calls: '回',
          scaleLabel: 'コスト',
          scaleLow: '低 → 高',
          metaPrefix: '呼び出し · 時間 × 曜日 · ローカル時間',
        },
        table: {
          project: 'プロジェクト',
          model: 'モデル',
          tool: 'ツール',
          cost: 'コスト',
          share: 'シェア',
          tokens: 'トークン',
          cache: 'キャッシュ',
          calls: '呼び出し',
          time: '時間',
          inputPct: '入',
          outputPct: '出',
          fail: '失敗率',
          total: '合計',
          noProject: '— 期間内にプロジェクトデータなし —',
          noModel: '— 期間内にモデル使用なし —',
          noTool: '— 期間内にツール呼び出しなし —',
        },
        sessions: {
          source: 'ソース',
          project: 'プロジェクト',
          started: '開始',
          duration: '時間',
          turns: 'ターン',
          tools: 'ツール',
          inTok: '入力 tok',
          outTok: '出力 tok',
          lines: '行 +/-',
          loadMore: 'もっと読み込む',
          loading: '読み込み中…',
          loaded: (n: number) => `${n} 件読み込み済み`,
          empty: 'セッションなし',
        },
        meta: {
          projects: (n: number) => `${n} 件のプロジェクト`,
          calls: (n: string) => `${n} 回の呼び出し`,
          estimatedBuckets: (bucket: string, range: string) => `推定 · ${bucket} · ${range}`,
          rhythmMeta: (range: string) => `時間 × 曜日 · ローカル時間 · ${range}`,
          bucketHour: '1 時間バケット',
          bucketDay: '1 日バケット',
          bucketWeek: '1 週バケット',
          allTime: '全期間',
        },
      },
    },
    leaderboard: {
      title(days: number) {
        return `${days} 日間のコーディング時間リーダーボード`
      },
      delta(string: string) {
        return `差：${string}`
      },
    },
  },
  button: {
    copy: 'コピー',
    copied: 'コピー済み',
    cancel: 'キャンセル',
    confirm: '確認',
  },
  plot: {
    label: {
      project: 'プロジェクト',
      timeHour: '時間',
      language: '言語',
      date: '日付',
      duration: '時間',
      durationHours: '時間 (時間)',
      other: 'その他',
      unknown: '不明',
      currentTime: '現在時刻',
    },
  },
}
