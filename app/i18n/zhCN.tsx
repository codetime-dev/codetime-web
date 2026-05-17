import type { Translation } from './type'
import { defineComponent } from 'vue'
import NuxtLink from './NuxtLink'

export const zhCN: Partial<Translation> = {
  annualReport: {
    shareMyReport: '分享我的报告',
    reviewAnnualReport: '查看年度报告',
    userNotFound: '用户未找到。',
    noData: '暂无数据。',
    noDataAvailableFor: (year: number | string) => `${year} 年暂无数据。`,
    annualCodeTimeReport: (year: number | string) => `${year} 年年度代码时间报告`,
    weekendCodingTimeRatio: '周末编码时间占比',
    averageDailyCodingTime: '平均每日编码时间',
    activeDaysOfTheYear: '全年活跃天数',
    longestStreakOfTheYear: '全年最长连续天数',
    busiestDayOfTheYear: '年度最忙碌的一天',
    busiestMonthOfTheYear: '年度最忙碌的一个月',
    theMostProductiveHourOfTheYear: '年度最高效的一小时',
    month: '月',
    hour: '小时',
    minutes: '分钟',
    theMostUsedLanguageOfTheYear: '年度最常用语言',
    totalCodingTimeOfTheYear: '年度总编码时间',
    priodOfDay: {
      morning: '上午',
      afternoon: '下午',
      evening: '傍晚',
      midnight: '午夜',
    },
  },
  meta: {
    title: 'CodeTime - 追迹你的编程时间',
    description: 'CodeTime 是一款专为开发者设计的应用，帮助您追踪、分析和提高您的编程时间管理技能。',
    ogTitle: 'CodeTime - 追迹你的编程时间',
    ogDescription: 'CodeTime 是一款专为开发者设计的应用，帮助您追踪、分析和提高您的编程时间管理技能。',
    twitterTitle: 'CodeTime - 追迹你的编程时间',
    twitterDescription: 'CodeTime 是一款专为开发者设计的应用，帮助您追踪、分析和提高您的编程时间管理技能。',
  },
  general: {
    cancel: '取消',
    confirm: '确认',
  },
  landing: {
    login: '登录',
    description: 'CodeTime 是一款专为开发者设计的应用，帮助您追踪、分析您的编程时间。',
    toDashboard: '前往仪表盘',
    alreadyStatistical: '已统计编程时间',
    minutes: '分钟',
    loginWithGithub: '使用 GitHub 登录',
    freeMessage: '免费开始使用，无需信用卡。Pro 订阅按需开通',
    demo: '演示',
    heroBadge: '专注 · 隐私 · 开放',
    scroll: '滚动',

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
        title: '数据可视化',
        description: '我们致力于提供最美观的现代化仪表盘，帮助您更好地了解您的编程时间。',
      },
      save: {
        title: '永久保存您的编程时间数据。',
        description: '我们知道历史数据的美好。没有什么比自己的辛勤劳动被抹去更令人沮丧的了。为了让所有用户都能够在多年之后回顾自己的成长历史，我们会永久保存您的数据，直到您主动销毁它们，即使您从未付费。',
        statRetention: '永久保留',
        statResolution: '分钟级精度',
        statCost: '免费保存',
      },
      export: {
        title: '支持数据导出。',
        description: '世界上最安全的地方就是您自己的硬盘。因此，我们支持数据导出，您可以随时退出，并连接到其他平台或自建服务。',
      },
      editor: {
        title: '支持多种编辑器。',
        description: '官方支持 VS Code 与 JetBrains 全家桶（IntelliJ IDEA、PyCharm、WebStorm、GoLand、CLion 等）。基于 VS Code 的衍生编辑器也开箱即用，包括 Cursor、Windsurf、Google Antigravity 等。我们将持续扩展更多平台。',
        more: '更多',
      },
      widgets: {
        title: '把编程时间嵌入任意角落。',
        description: '将徽章、语言环图与实时状态卡片放进 README、博客或个人主页。每个组件都是一张独立 SVG，主题可定制，根据最新数据动态渲染。',
        badge: 'Shields 风格徽章',
        donut: '语言占比环图',
        status: '实时状态卡',
        cta: '生成组件',
      },
    },
    pricing: {
      heading: '免费开始，按需升级 Pro',
      title: '定价',
      description: '选择适合您的计划。',
    },
    closing: {
      line1: '种下一棵树最好的时候是三十年前',
      line2: '其次是现在',
    },
  },
  plan: {
    monthly: '月付',
    yearly: '年付',
    save25: '省 25%',
    oneTime: '一次性',
    mostFlexible: '最灵活',
    mostPopular: '最受欢迎',
    bestValue: '最超值',
    modal: {
      title: '升级订阅',
      p1: '我们需要您的支持来保持我们的开发热情，从而提供更丰富的数据报告和更好的用户体验。',
      p2: '您可以选择升级到 Pro 订阅以解锁更多功能。',
      p3: '如果您在支付过程中遇到任何问题，请通过电子邮件与我们联系。',
    },
    status(str: string) {
      switch (str) {
        case 'active': {
          return '有效'
        }
        case 'cancelled': {
          return '已取消'
        }
        case 'expired': {
          return '已过期'
        }
        case 'on_trial': {
          return '试用中'
        }
        case 'paused': {
          return '已暂停'
        }
        case 'past_due': {
          return '已逾期'
        }
        case 'unpaid': {
          return '未支付'
        }
        default: {
          return '未知'
        }
      }
    },
    basic: {
      title: 'Basic',
      forever: '永久',
      features: {
        title: '功能',
        item: {
          saveHistory: '永久保存历史数据',
          browseRecent: '浏览最近 90 天的数据',
          codetimeTrend: '编程时间趋势报告',
          codetimeLanguaeTrend: '编程语言趋势报告',
          codetimeProjectTrend: '项目趋势报告',
          badge: '生成展示徽章',
          export: '数据导出',
          import: '数据导入',
          more: '更多报告',
        },
      },
      button: '永久免费',
    },
    pro: {
      title: 'Pro',
      preMonth: '/ 月',
      preYear: '/ 年',
      features: {
        item: {
          include: '包含 Basic 计划的所有功能',
          browseAll: '浏览所有历史数据',
          workspace: '工作区全量历史数据',
          widgetCustom: 'Widget 详细样式与自定义配色',
          widgetUnlimited: '解除 Widget 天数与语言上限',
          rule: '基于规则的数据处理',
          tag: '标签系统',
        },
      },
      notYet: '表示尚未开放',
      button: '立即订阅',
    },
    needLogin: '需要登录',
  },
  dashboard: {
    loginRequired: '欢迎访问 CodeTime 仪表板！请登录以查看你的编程时间数据，或者点击下方的演示按钮体验演示仪表盘。',
    projectSelector: {
      placeholder: '选择一个工作区',
      noneText: '输入工作区名称',
    },
    pageHeader: {
      userLatestEvent(project: string) {
        return `正忙于「${project}」`
      },
      title: {
        overview: '概览',
        badge: '徽章',
        widget: '小部件',
        settings: '设置',
        leaderboard: '排行榜',
        workspace: '工作区',
        tags: '标签',
        agent: 'Agents',
      },
      description: {
        overview: '查看您的所有 CodeTime 数据。',
        badge: '在你的项目中用简明、一致、清晰的徽章展示你的编程时间。',
        widget: '生成可嵌入到 README、个人网站等的徽章、图表与状态卡片。',
        settings: '管理您的 CodeTime 设置，包含外观、语言、数据等。',
        leaderboard: '查看 CodeTime 用户的排行榜。',
        workspace: '查看特定工作区的数据。',
        tags: '管理标签和规则，实现工作区的自动分类。',
        agent: 'AI 编程 agent 的 turn、tool 与 token 用量统计。',
      },
    },
    overview: {
      rangeTitle: '日期范围',
      activityTitle: '活动',
      topTitle: '排行',
      codetimeTrendTitle: '编程时间趋势',
      codetimeLanguaeTrendTitle: '编程语言趋势',
      codetimeProjectTrendTitle: '项目趋势',
      dailyCodingDistributionTitle: '编程时间分布',
      dataRange: {
        title(days: number) {
          return `过去 ${days} 天`
        },
        allTime: '全部时间',
        custom: '自定义',
        apply: '应用',
        cancel: '取消',
        thisMonth: '本月',
        lastMonth: '上月',
      },
      statistic: {
        timeTotal: '编程时间/总计',
        timeToday: '编程时间/今日',
        timeAverage: '编程时间/平均',
        longestStreak: '连续天数/最大',
        currentStreak: '连续天数/当前',
      },
      top: {
        language: '语言',
        project: '项目',
        platform: '平台',
        workspace: '工作区',
      },
      total: {
        time: '总编程时间',
      },
      recent: {
        time: '最近编程时间',
      },
      ranking: '排名',
      hours: '小时',
      active: {
        days: '活跃天数',
      },
      topLanguage: '最常用语言',
      noData: {
        notice: {
          title: '还没有数据',
          body: defineComponent({
            components: {
              NuxtLink,
            },
            setup() {
              return () => (
                <div class="text-sm">
                  <span class="text-surface-dimmed">
                    目前，我们尚未收到您的编码时间记录。我们的应用程序依赖于代码编辑器或集成开发环境（例如 VSCode、JetBrains IDE ）的插件。为了确保正常运作，请您前往
                  </span>
                  <NuxtLink
                    to="dashboard/settings"
                    class="text-primary-on"
                  >
                    [ 设置 ]
                  </NuxtLink>
                  <span class="text-surface-dimmed">
                    页面并在您所使用的支持插件的代码编辑器中进行相应配置。感谢您的合作。
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
        title: '身份',
      },
      activity: {
        title: '活动',
      },
      languages: {
        title: '语言亮点',
        noData: '暂无语言数据。',
        topPercent: (percent: number) => `TOP ${percent}%`,
      },
      stats: {
        title: '账号概览',
        plan: '订阅计划',
        timezone: '所在时区',
        timezoneUnset: '未设置',
        joined: '加入时间',
        updated: '最近更新',
      },
      bio: {
        title: '个人简介',
        subtitle: '分享你的技术栈、兴趣或正在推进的项目',
        edit: '编辑简介',
        placeholder: '用几句话介绍你的背景、语言偏好或想分享的故事…',
        empty: '这个用户还没有填写简介。',
        limitExceeded: '已超出限制',
        save: '保存',
        saving: '保存中…',
        saveSuccess: '已保存新的简介',
        saveError: '保存失败，请稍后重试',
      },
    },
    pluginGuide: {
      title: '开始使用 CodeTime',
      description: '安装 CodeTime 插件，自动追踪您的编程时间',
      token: {
        title: '您的令牌',
        description: '复制此令牌并粘贴到插件设置中',
      },
      plugins: {
        title: '下载插件',
      },
      vscode: {
        title: 'VSCode 系列',
        description: '兼容 VSCode、Cursor 和 Windsurf',
      },
      jetbrains: {
        title: 'JetBrains 系列',
        description: '兼容所有 JetBrains IDE',
      },
      downloadPlugin: '下载插件',
      setup: {
        title: '设置说明',
        step1: '为您的编辑器下载并安装插件',
        step2: '在编辑器中打开插件设置',
        step3: '复制并粘贴上方的令牌',
        step4: '开始编程，数据将在 2-3 分钟内显示',
      },
    },
    agentGuide: {
      title: '尚未收到 vibe 数据',
      description: '在任一台机器上安装并配置 codetime CLI 后，您的 Claude Code、Codex、OpenCode、Pi 会话即会出现在此。',
      token: {
        title: '您的令牌',
        description: '复制此令牌，最后一步将其填入 CLI。',
      },
      install: {
        title: '安装 CLI',
        description: '使用 npm 全局安装 codetime（或您喜欢的 Node 包管理器）。',
      },
      configure: {
        title: '配置令牌',
        description: '运行此命令，下次 agent 会话开始即自动上传。',
        hint: '将 <token> 替换为上方复制的值。',
      },
      hook: {
        title: '挂钩到 Agent',
        description: '运行 codetime install，CLI 会自动检测本机所有支持的 AI agent，并自动配置钩子。',
        supports: '目前支持以下 Agent：',
        latency: '正常使用任意 agent。会话结束后约 2 分钟内即可在此查看。',
      },
    },
    agent: {
      freeLimit: '免费版仅显示最近 30 天的会话。升级 Pro 可查看完整历史。',
      upgrade: '升级',
      sections: {
        overview: '概览',
        costTimeline: '成本 · 时间线',
        rhythm: '节奏 · 时段',
        projects: '项目 · 成本',
        models: '模型 · 成本',
        tools: '工具',
        sessions: '会话 · 列表',
      },
    },
    badge: {
      configure: '配置',
      embed: '嵌入',
      preview: {
        title: '预览',
      },
      style: {
        flat: '扁平(Flat)',
        flatSquare: '扁平方形(Flat Square)',
        forTheBadge: 'For the Badge',
        plastic: '塑料(Plastic)',
        social: '社交(Social)',
      },
      placeholder: {
        style: '样式',
        language: '语言',
        days: '天数',
        project: '项目',
        color: '颜色',
        tag: '标签',
        scope: '项目或标签',
      },
      scope: {
        tag: '标签',
        workspace: '项目',
      },
    },
    widget: {
      tab: {
        badge: '徽章',
        donut: '语言占比',
        status: '编码状态',
      },
      theme: {
        label: '主题',
        light: '亮色',
        dark: '暗色',
      },
      donut: {
        title: '语言占比',
        days: '统计天数',
        limit: '语言数量',
      },
      status: {
        title: '正在编码',
        primary: '主区域',
        secondary: '副区域',
        style: '样式',
        color: '强调色',
        colorDefault: '默认',
        background: '背景色',
        fields: {
          project: '项目名',
          language: '语言',
          editor: '编辑器',
          none: '不显示',
        },
        styles: {
          minimal: '极简',
          detailed: '详细',
        },
      },
      limit: {
        upgrade: '升级 Pro',
        donutFree: '免费计划：最多 30 天与 5 种语言。升级 Pro 解锁完整范围。',
        donutExceeds: '当前选择超出免费计划上限（30 天 / 5 种语言），将自动回退到上限。',
        statusFree: '免费计划：项目名与语言只能显示其一。Pro 可同时显示。',
        statusFreeStyle: '免费计划：仅可使用极简样式与默认配色。Pro 解锁详细样式与自定义强调色、背景色。',
      },
    },
    settings: {
      token: {
        title: '令牌',
        tip: '您的令牌用于 CodeTime API 的访问，请保持它的私密性。您可以在此处生成新的令牌。',
        refresh: '刷新',
        refreshTip: '如果您怀疑令牌泄露，您可以在此处生成新的令牌。',
        refreshToken: '刷新令牌',
        confirmRefresh: '您确定要刷新令牌吗？这将使您已应用于编辑器插件的令牌失效。您需要输入新的令牌。',
        getPlugin: defineComponent({
          components: {
            NuxtLink,
          },
          setup() {
            return () => (
              <div class="text-surface-dimmed">
                <span>
                  为了使 CodeTime 正常工作，您需要安装我们的插件，并在开发环境中配置令牌。目前，我们支持
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
                  和
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
                。
              </div>
            )
          },
        }),
      },
      language: {
        title: '语言 (Language)',
        tip: '选择您的 CodeTime Web UI 的语言。',
      },
      export: {
        title: '导出',
        button: '一键导出',
        buttonExporting: '数据导出中',
        buttonSucceed: '数据导出成功',
        buttonFailed: '数据导出失败',
        download: '下载',
        description: '我们支持网站数据导出功能，以确保数据的安全备份、便捷迁移、深入分析与合规性，同时赋予您对其数据完全的控制权和透明度。',
        tip: '导出您的数据到 CSV 文件。',
      },
      theme: {
        title: '主题',
        tip: '选择您的 CodeTime Web UI 的主题。',
        dark: '暗色',
        light: '亮色',
        system: '跟随系统',
      },
      dangerZone: {
        title: '危险区域',
        description: '这些设置会永久影响你的数据，不可恢复。请谨慎操作。',
        button: {
          removeAllData: '删除所有数据',
          removeAllDataModal: {
            p1: '您确定要删除所有数据吗？此操作不可撤销。',
            p2: '您的数据非常重要，您可以先导出数据，再删除数据。',
            p3: '如果您要删除所有数据，请在下方输入 DELETE，然后点击确定。',
          },
        },
        subTitle: {
          removeData: '删除数据',
          privacy: '隐私',
        },
      },
      account: {
        title: '账户',
        description: '账户设置。',
        expiresIn: '过期时间',
        manageSubscription: '管理订阅',
        subscribe: '订阅',
        username: {
          edit: '修改用户名',
          title: '修改用户名',
          description: '用户名长度需为 3-32 个字符，仅支持字母、数字、下划线和短横线。',
          placeholder: '请输入新的用户名',
          errorEmpty: '用户名不能为空',
          errorLength: (min: number, max: number) => `用户名长度需为 ${min}-${max} 个字符`,
          errorChars: '仅支持字母、数字、下划线和短横线',
          errorGeneric: '修改用户名失败',
        },
      },
      other: {
        title: '其他',
        description: '其他设置。',
        logout: '登出',
      },
    },
    workspace: {
      project: '项目',
      topBranch: '热门分支',
      range: '日期范围',
      noData: '该工作区暂无数据。',
      select: {
        placeholder: '选择工作区',
        none: '输入工作区名称',
        prompt: '请选择一个项目开始。',
      },
      flameGraph: {
        title: '火焰图',
        noData: '暂无数据',
      },
      fileList: {
        title: '文件列表',
      },
    },
    leaderboard: {
      title(days: number) {
        return `过去 ${days} 天编程时间排行榜`
      },
      delta(string: string) {
        return `相差 ${string}`
      },
    },
    tags: {
      title: '标签',
      description: '管理标签和规则，实现工作区的自动分类。',
      tagList: {
        title: '标签列表',
        noTags: '暂无标签。创建您的第一个标签开始使用。',
        createTag: '创建标签',
        freeUserLimit: '免费用户限制：',
        upgradeForMore: '升级以创建更多标签',
        editTag: '编辑标签',
        deleteTag: '删除标签',
      },
      tagForm: {
        name: '名称',
        namePlaceholder: '输入标签名称',
        color: '颜色',
        colorPlaceholder: '选择颜色',
        emoji: 'Emoji',
        emojiPlaceholder: '输入 emoji（可选）',
        create: '创建标签',
        edit: '编辑标签',
        cancel: '取消',
        save: '保存',
      },
      tagRules: {
        title: '标签规则',
        noRules: '该标签暂无规则。',
        createRule: '创建规则',
        rule: '规则',
        enabled: '已启用',
        disabled: '已禁用',
        delete: '删除',
        edit: '编辑',
        selectTagPrompt: '选择一个标签来管理其规则',
        freeUserLimit: '免费用户限制：',
        upgradeForMore: '升级以创建更多规则',
      },
      ruleForm: {
        name: '规则名称',
        namePlaceholder: '输入规则名称',
        enabled: '启用',
        conditions: '条件',
        addCondition: '添加条件',
        field: '字段',
        conditionType: '条件类型',
        value: '值',
        valuePlaceholder: '输入值',
        negate: '取反',
        create: '创建规则',
        edit: '编辑规则',
        cancel: '取消',
        save: '保存',
      },
      conditionTypes: {
        CONTAINS: '包含',
        EQUALS: '等于',
        STARTS_WITH: '开始于',
        ENDS_WITH: '结束于',
        REGEX: '正则表达式',
        NOT_CONTAINS: '不包含',
        NOT_EQUALS: '不等于',
        NOT_STARTS_WITH: '不开始于',
        NOT_ENDS_WITH: '不结束于',
        NOT_REGEX: '不匹配正则',
      },
      fields: {
        workspaceName: '工作区名称',
        language: '编程语言',
        gitOrigin: 'Git 源',
        gitBranch: 'Git 分支',
        platform: '平台',
        editor: '编辑器',
        absoluteFile: '绝对文件路径',
        relativeFile: '相对文件路径',
      },
      actions: {
        delete: '删除',
        edit: '编辑',
        manageRules: '管理规则',
        enable: '启用',
        disable: '禁用',
      },
      stats: {
        title: '标签统计',
        viewAll: '查看全部',
        noData: '暂无标签数据',
        timeDistribution: '标签编程时间分布',
        totalDuration: '总时长',
        recordCount: '记录数',
        timeRange: '时间范围',
        days: '天',
        dailyAverage: '日均时长',
        timeTrend: '时间趋势',
        noChartData: '暂无图表数据',
        statisticsTitle: (tagName: string) => `${tagName} 统计`,
      },
      timeRange: {
        last7Days: '最近 7 天',
        last30Days: '最近 30 天',
        last90Days: '最近 90 天',
      },
      deleteConfirm: {
        deleteTag: '删除标签',
        deleteTagMessage: '确定要删除这个标签吗？此操作无法撤销。',
        deleteRule: '删除规则',
        deleteRuleMessage: '确定要删除这个规则吗？此操作无法撤销。',
        cancel: '取消',
        delete: '删除',
      },
      common: {
        not: '不',
        optional: '（可选）',
        ruleRelationship: '规则间为 OR 关系，条件间为 AND 关系',
        freeUserRuleLimit: '免费用户每个标签只能创建 1 个规则',
        upgradeForMoreRules: '升级以创建更多规则',
        ruleIdFormat: (id: string) => `规则 #${id.slice(-4)}`,
        editingMode: '编辑模式 - 请记得保存更改',
      },
    },
  },
  common: {
    optional: '可选',
  },
  button: {
    copy: '复制',
    copied: '已复制',
    cancel: '取消',
    confirm: '确认',
  },
  plot: {
    label: {
      project: '项目',
      timeHour: '时间（小时）',
      language: '语言',
      date: '日期',
      duration: '时间',
      durationHours: '时长 (小时)',
      other: '其他',
      unknown: '未知',
      currentTime: '当前时间',
    },
  },
}
