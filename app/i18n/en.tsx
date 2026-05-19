import type { Translation } from './type'
import { defineComponent } from 'vue'
import NuxtLink from './NuxtLink'

export const en: Translation = {
  annualReport: {
    shareMyReport: 'Share My Report',
    reviewAnnualReport: 'Review Annual Report',
    userNotFound: 'User not found.',
    noData: 'No data available.',
    noDataAvailableFor: (year: number | string) => `No data available for ${year}.`,
    annualCodeTimeReport: (year: number | string) => `Annual Code Time Report for ${year}`,
    weekendCodingTimeRatio: 'Weekend Coding Time Ratio',
    averageDailyCodingTime: 'Average Daily Coding Time',
    activeDaysOfTheYear: 'Active Days of the Year',
    longestStreakOfTheYear: 'Longest Streak of the Year',
    busiestDayOfTheYear: 'Busiest Day of the Year',
    busiestMonthOfTheYear: 'Busiest Month of the Year',
    theMostProductiveHourOfTheYear: 'The Most Productive Hour of the Year',
    month: 'Month',
    hour: 'Hour',
    minutes: 'Minutes',
    theMostUsedLanguageOfTheYear: 'The Most Used Language of the Year',
    totalCodingTimeOfTheYear: 'Total Coding Time of the Year',
    priodOfDay: {
      morning: 'Morning',
      afternoon: 'Afternoon',
      evening: 'Evening',
      midnight: 'Midnight',
    },
  },
  meta: {
    title: 'CodeTime - Track your coding time automatically',
    description: 'CodeTime is an application designed for developers to help you track, analyze and improve your coding time management skills.',
    ogTitle: 'CodeTime - Track your coding time automatically',
    ogDescription: 'CodeTime is an application designed for developers to help you track, analyze and improve your coding time management skills.',
    twitterTitle: 'CodeTime - Track your coding time automatically',
    twitterDescription: 'CodeTime is an application designed for developers to help you track, analyze and improve your coding time management skills.',
  },
  general: {
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  landing: {
    login: 'Login',
    description: 'CodeTime is an application designed for developers to help you track and analyze your coding time.',
    toDashboard: 'Go to Dashboard',
    alreadyStatistical: 'Coding time already tracked',
    minutes: 'minutes',
    loginWithGithub: 'Login with GitHub',
    freeMessage: 'Free to start, no credit card required. Upgrade to Pro when you need it.',
    demo: 'Demo',
    heroBadge: 'focus · private · open',
    scroll: 'scroll',
    sections: {
      globalImpact: 'global · impact',
      visualization: 'visualization',
      alwaysSynced: 'always synced',
      openData: 'open data',
      editors: 'editors',
      agentTelemetry: 'agent · telemetry',
      widgets: 'widgets',
      pricing: 'pricing',
      startTracking: 'start tracking',
    },
    features: {
      visualization: {
        title: 'Data visualization',
        description: 'We are committed to providing the most visually pleasing modern dashboard to help you better understand your code time.',
      },
      save: {
        title: 'Save your coding time data forever.',
        description: 'We know the beauty of historical data. Nothing is more frustrating than having your own hard work erased. In order for all users to be able to review their growth history even after many years, we will save your data forever, until you actively destroy them, even if you have never paid.',
        statRetention: 'Forever retention',
        statResolution: 'Per-minute resolution',
        statCost: 'Free to keep',
      },
      export: {
        title: 'Support data export.',
        description: 'The safest place in the world is your own hard drive. Therefore, we support data export, you can quit at any time, and connect to other platforms or self-built services.',
      },
      editor: {
        title: 'Built for the editors you already use.',
        description: 'First-class plugins for VS Code and the full JetBrains family (IntelliJ IDEA, PyCharm, WebStorm, GoLand, CLion and more). VS Code-derived editors work out of the box too — including Cursor, Windsurf and Google Antigravity. More platforms on the way.',
        more: 'more',
      },
      widgets: {
        title: 'Embed your coding time anywhere.',
        description: 'Drop badges, language donuts, and live status cards into any README, blog, or personal site. Every widget is a single SVG — themeable, self-contained, and rendered on the fly from your latest data.',
        badge: 'Shields-style badge',
        donut: 'Language donut',
        status: 'Live status card',
        cta: 'Build a widget',
      },
      agent: {
        title: 'Track every AI agent session, not just keystrokes.',
        description: 'Install one CLI and Code Time captures sessions from Claude Code, Codex, OpenCode, and Pi — model calls, tokens, cache hit rate, estimated cost, and the projects they touched. Your prompt text and source code never leave your machine.',
        supports: 'Hooks into',
        kpiSessions: 'sessions',
        kpiCost: 'est. cost',
        kpiCalls: 'model calls',
        chartLegend: 'cost by agent · last 14 days',
        cta: 'Open the agent demo',
      },
    },
    pricing: {
      heading: 'Free to start. Pro when you need it',
      title: 'Pricing',
      description: 'Choose the plan that suits you.',
    },
    closing: {
      line1: 'The best time to plant a tree was thirty years ago',
      line2: 'The second best time is now',
    },
  },
  plan: {
    monthly: 'Monthly',
    yearly: 'Yearly',
    save25: 'Save 25%',
    oneTime: 'One-time',
    mostFlexible: 'Most Flexible',
    mostPopular: 'Most Popular',
    bestValue: 'Best Value',
    modal: {
      title: 'Upgrade Subscription',
      p1: 'We need your support to maintain our development enthusiasm, so as to provide richer data reports and better user experience.',
      p2: 'You can choose to upgrade to a Pro subscription to unlock more features.',
      p3: 'If you encounter any problems during the payment process, please contact us by email.',
    },
    status(str: string): string {
      switch (str) {
        case 'active': {
          return 'Active'
        }
        case 'cancelled': {
          return 'Cancelled'
        }
        case 'expired': {
          return 'Expired'
        }
        case 'on_trial': {
          return 'On Trial'
        }
        case 'paused': {
          return 'Paused'
        }
        case 'past_due': {
          return 'Past Due'
        }
        case 'unpaid': {
          return 'Unpaid'
        }
        default: {
          return 'Unknown'
        }
      }
    },
    basic: {
      title: 'Basic',
      forever: 'Forever',
      features: {
        title: 'Features',
        item: {
          saveHistory: 'Save historical data forever',
          browseRecent: 'Browse data for the last 90 days',
          codetimeTrend: 'Coding time trend report',
          codetimeLanguaeTrend: 'Programming language trend report',
          codetimeProjectTrend: 'Project trend report',
          badge: 'Generate badges for display',
          export: 'Data export',
          import: 'Data import',
          more: 'More reports',
          agent: 'Agent telemetry: cost, tokens, tools & rhythm',
        },
      },
      button: 'Free forever',
    },
    pro: {
      title: 'Pro',
      preMonth: '/ month',
      preYear: '/ year',
      features: {
        item: {
          include: 'Includes all features of the Basic plan',
          browseAll: 'Browse all historical data',
          workspace: 'Full historical data per workspace',
          widgetCustom: 'Detailed widget style and custom colors',
          widgetUnlimited: 'Unlimited widget days and languages',
          rule: 'Rule-based data processing',
          tag: 'Tag system',
        },
      },
      notYet: 'means not yet available',
      button: 'Subscribe Now',
    },
    needLogin: 'Need to log in',
  },
  demoBanner: {
    overviewPrefix: 'Sample data — sign in and connect the VS Code or JetBrains plugin via',
    overviewSuffix: 'to see your own.',
    agentPrefix: 'Sample data — sign in and pipe an agent through',
    agentSuffix: 'to see your own.',
  },
  dashboard: {
    loginRequired: 'Welcome to the CodeTime dashboard! Please log in to view your coding time data, or click the demo button below to experience the demo dashboard.',
    projectSelector: {
      placeholder: 'Select a project',
      noneText: 'Input your project name',
    },
    pageHeader: {
      userLatestEvent(project: string) {
        return `Working on ${project}`
      },
      title: {
        overview: 'Overview',
        badge: 'Badges',
        widget: 'Widgets',
        settings: 'Settings',
        leaderboard: 'Leaderboard',
        workspace: 'Workspace',
        tags: 'Tags',
        agent: 'Agents',
      },
      description: {
        overview: 'View all your CodeTime data.',
        badge: 'Display your coding time in your projects with concise, consistent, and clear badges.',
        widget: 'Embeddable badges, charts, and live status cards for your README or personal site.',
        settings: 'Manage your CodeTime settings, including appearance, language, data, etc.',
        leaderboard: 'View the CodeTime leaderboard of all users.',
        workspace: 'View your workspace details.',
        tags: 'Manage tags and rules for automatic workspace categorization.',
        agent: 'Turns, tools, and token usage from your AI coding agents.',
      },
    },
    overview: {
      rangeTitle: 'Date Range',
      activityTitle: 'Activity',
      topTitle: 'Top',
      codetimeTrendTitle: 'Coding Time Trend',
      codetimeLanguaeTrendTitle: 'Programming Language Trend',
      codetimeProjectTrendTitle: 'Project Trend',
      dailyCodingDistributionTitle: 'Daily Coding Distribution',
      dataRange: {
        title(days: number) {
          return `Past ${days} days`
        },
        allTime: 'All time',
        custom: 'Custom…',
        apply: 'Apply',
        cancel: 'Cancel',
        today: 'Today',
        last24h: 'Last 24 hours',
        thisWeek: 'This week',
        lastWeek: 'Last week',
        thisMonth: 'This month',
        lastMonth: 'Last month',
        yearToDate: 'Year to date',
        pickRange: 'Pick date range',
      },
      statistic: {
        timeTotal: 'Time/Total',
        timeToday: 'Time/Today',
        timeAverage: 'Time/Average',
        longestStreak: 'Streak/Largest',
        currentStreak: 'Streak/Current',
      },
      top: {
        language: 'Language',
        project: 'Project',
        platform: 'Platform',
        workspace: 'Workspace',
      },
      total: {
        time: 'Total Coding Time',
      },
      recent: {
        time: 'Recent Coding Time',
      },
      ranking: 'Ranking',
      hours: 'hours',
      active: {
        days: 'Active Days',
      },
      topLanguage: 'Top Language',
      noData: {
        notice: {
          title: 'No data yet',
          body: defineComponent({
            components: {
              NuxtLink,
            },
            setup() {
              return () => (
                <div class="text-sm">
                  <span class="text-surface-dimmed">
                    Currently, we have not yet successfully processed your codetime data. This application relies on the plugin for your code editor or integrated development environment (such as VSCode, JetBrains IDE). Please visit the
                  </span>
                  <NuxtLink
                    to="dashboard/settings"
                    class="text-primary-on px-2"
                  >
                    [ Settings ]
                  </NuxtLink>
                  <span class="text-surface-dimmed">
                    page and configure the necessary settings in the code editor that supports the plugin you are using. After receiving your data, we need about two minutes to process it. Thank you for your cooperation.
                  </span>
                </div>
              )
            },
          }),
        },
      },
    },
    pluginGuide: {
      title: 'Get Started with CodeTime',
      description: 'Install CodeTime plugin to automatically track your coding time',
      token: {
        title: 'Your Token',
        description: 'Copy this token and paste it into the plugin settings',
      },
      plugins: {
        title: 'Download Plugins',
      },
      vscode: {
        title: 'VSCode Family',
        description: 'Compatible with VSCode, Cursor, and Windsurf',
      },
      jetbrains: {
        title: 'JetBrains Family',
        description: 'Compatible with all JetBrains IDEs',
      },
      downloadPlugin: 'Download Plugin',
      setup: {
        title: 'Setup Instructions',
        step1: 'Download and install the plugin for your editor',
        step2: 'Open plugin settings in your editor',
        step3: 'Copy and paste your token above',
        step4: 'Start coding and data will appear in 2-3 minutes',
    },
  },
    agentGuide: {
      title: 'No vibe data yet',
      description: 'Once the codetime CLI is installed and configured on a machine, your Claude Code, Codex, OpenCode, and Pi sessions will start appearing here.',
      token: {
        title: 'Your Token',
        description: 'Copy this token. You will feed it into the CLI in the final step.',
      },
      install: {
        title: 'Install the CLI',
        description: 'Install codetime globally with npm (or your favorite Node package manager).',
      },
      configure: {
        title: 'Configure Token',
        description: 'Run this command. The CLI starts uploading on your next agent session.',
        hint: 'Replace <token> with the value copied above.',
      },
      hook: {
        title: 'Hook Into Agents',
        description: 'Run codetime install — the CLI auto-detects every supported AI agent on your machine and wires up the hooks for you.',
        supports: 'Currently supported:',
        latency: 'Use any agent normally. Sessions appear here within ~2 minutes of the agent finishing.',
      },
    },
    agent: {
      freeLimit: 'Free plan: showing sessions from the last 30 days. Upgrade to Pro for full history.',
      upgrade: 'Upgrade',
      sections: {
        overview: 'Overview',
        costTimeline: 'Cost · Timeline',
        rhythm: 'Rhythm · When',
        projects: 'Projects · Costs',
        models: 'Models · Costs',
        agents: 'Agents · Costs',
        tools: 'Tools',
        sessions: 'Sessions · List',
      },
      labels: {
        kpi: {
          events: 'events',
          sessions: 'sessions',
          tokens: 'tokens',
          cost: 'cost',
          time: 'time',
          linesNet: 'lines net',
          tools: 'tool',
          cmd: 'cmd',
          projects: 'projects',
          inSuffix: 'in',
          outSuffix: 'out',
          estimated: 'estimated',
          agentActive: 'agent active',
        },
        timeline: {
          cost: 'cost',
          modelCalls: 'model calls',
          cacheHit: 'cache hit',
          tokensFoot: (buckets: number, tokens: string) => `${buckets} buckets · ${tokens} tokens`,
          empty: 'no model usage in this window',
          tokens: 'tokens',
          metricCost: 'Cost',
          metricTokens: 'Tokens',
        },
        rhythm: {
          peakHour: 'Peak hour',
          peakDay: 'Peak day',
          active: 'Active',
          avgSlot: 'Avg/slot',
          ofWindow: 'of 24h × 7d',
          perSlot: 'calls per active slot',
          calls: 'calls',
          scaleLabel: 'cost',
          scaleLow: 'low → high',
          metaPrefix: 'calls · hour × weekday · local time',
        },
        table: {
          project: 'Project',
          model: 'Model',
          tool: 'Tool',
          agent: 'Agent',
          cost: 'Cost',
          share: 'Share',
          tokens: 'Tokens',
          cache: 'Cache',
          calls: 'Calls',
          time: 'Time',
          inputPct: 'In',
          outputPct: 'Out',
          fail: 'Fail%',
          total: 'Total',
          noProject: '— no project data in window —',
          noModel: '— no model usage in window —',
          noTool: '— no tool calls in window —',
          noAgent: '— no agent activity in window —',
        },
        sessions: {
          source: 'Source',
          project: 'Project',
          started: 'Started',
          duration: 'Duration',
          turns: 'Turns',
          tools: 'Tools',
          inTok: 'In tok',
          outTok: 'Out tok',
          lines: 'Lines +/-',
          loadMore: 'Load more',
          loading: 'Loading…',
          loaded: (n: number) => `${n} loaded`,
          empty: 'No sessions',
        },
        meta: {
          projects: (n: number) => `${n} projects`,
          agents: (n: number) => `${n} agents`,
          calls: (n: string) => `${n} calls`,
          estimatedBuckets: (bucket: string, range: string) => `estimated · ${bucket} · ${range}`,
          rhythmMeta: (range: string) => `hour × weekday · local time · ${range}`,
          bucketHour: '1h buckets',
          bucketDay: '1d buckets',
          bucketWeek: '1w buckets',
          allTime: 'all-time window',
        },
      },
    },
  profile: {
    identity: {
      title: 'Identity',
    },
    activity: {
      title: 'Activity',
    },
    languages: {
      title: 'Language Highlights',
      noData: 'No language data available yet.',
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
      configure: 'Configure',
      embed: 'Embed',
      preview: {
        title: 'Preview',
      },
      style: {
        flat: 'Flat',
        flatSquare: 'Flat Square',
        forTheBadge: 'For the Badge',
        plastic: 'Plastic',
        social: 'Social',
      },
      placeholder: {
        style: 'Style',
        language: 'Language',
        days: 'Days',
        project: 'Project',
        color: 'Color',
        tag: 'Tag',
        scope: 'Workspace or tag',
      },
      scope: {
        tag: 'Tag',
        workspace: 'Workspace',
      },
    },
    widget: {
      tab: {
        badge: 'Badge',
        donut: 'Languages',
        status: 'Status',
        calendar: 'Calendar',
        trend: 'Trend',
      },
      theme: {
        label: 'Theme',
        light: 'Light',
        dark: 'Dark',
      },
      donut: {
        title: 'Top languages',
        days: 'Days',
        limit: 'Languages',
      },
      calendar: {
        title: 'Activity calendar',
      },
      trend: {
        title: 'Daily trend',
        days: 'Days',
      },
      status: {
        title: 'Currently coding',
        primary: 'Primary slot',
        secondary: 'Secondary slot',
        style: 'Style',
        color: 'Accent color',
        colorDefault: 'Default',
        background: 'Background',
        fields: {
          project: 'Project',
          language: 'Language',
          editor: 'Editor',
          none: 'None',
        },
        styles: {
          minimal: 'Minimal',
          detailed: 'Detailed',
        },
      },
      limit: {
        upgrade: 'Upgrade',
        donutFree: 'Free plan: up to 30 days and 5 languages. Pro removes the cap.',
        donutExceeds: 'Free plan caps the chart at 30 days and 5 languages — values will be clamped.',
        statusFree: 'Free plan: pick project name OR language for the card. Pro shows both.',
        statusFreeStyle: 'Free plan: minimal style with default colors only. Pro unlocks the detailed card and custom accent / background colors.',
        calendarFree: 'Free plan shows the last 90 days. Pro unlocks the full 365-day calendar.',
        trendFree: 'Free plan: up to 90 days of trend. Pro extends the window to 365 days.',
        trendExceeds: 'Free plan caps the trend at 90 days — values will be clamped.',
      },
    },
    settings: {
      token: {
        title: 'Token',
        tip: 'Your token is used for access to the CodeTime API. Keep it private.',
        refresh: 'Refresh',
        refreshTip: 'If you suspect that your token has been leaked, you can regenerate a new token here.',
        refreshToken: 'Refresh Token',
        confirmRefresh: 'Are you sure you want to refresh the token? This will invalidate the token you have applied to the editor plugin. You need to enter a new token.',
        getPlugin: defineComponent({
          components: {
            NuxtLink,
          },
          setup() {
            return () => (
              <div class="text-surface-dimmed">
                <span>
                  In order for CodeTime to work properly, you need to install our plugin and configure the token in your development environment. Currently, we support
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
                  and
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
                .
              </div>
            )
          },
        }),
      },
      language: {
        title: 'Language',
        tip: 'Choose the language for your CodeTime Web UI.',
      },
      export: {
        title: 'Export',
        button: 'One-click Export',
        buttonExporting: 'Exporting...',
        buttonSucceed: 'Export Succeed',
        buttonFailed: 'Export Failed',
        download: 'Download',
        description: 'We support website data export to ensure secure backup, convenient migration, in-depth analysis, and compliance, while giving you complete control and transparency over your data.',
        tip: 'Export your data to a CSV file.',
      },
      theme: {
        title: 'Theme',
        tip: 'Choose the theme for your CodeTime Web UI.',
        dark: 'Dark',
        light: 'Light',
        system: 'System',
      },
      connections: {
        title: 'Sign-in Providers',
        description: 'Link multiple identities so you can sign in with any of them. At least one must remain connected.',
        connected: 'Connected',
        notConnected: 'Not connected',
        connect: 'Connect',
        disconnect: 'Disconnect',
        lastProviderHint: 'Disconnecting this would leave the account with no way to sign in.',
        feedback: {
          ok: 'Account linked.',
          conflict: 'That identity is already linked to a different Code Time account.',
          replace: 'Another identity is already linked for this provider. Disconnect it first.',
        },
      },
      dangerZone: {
        title: 'Danger Zone',
        description: 'These settings will permanently affect your data and cannot be undone. Please proceed with caution.',
        button: {
          removeAllData: 'Remove All Data',
          removeAllDataModal: {
            p1: 'Are you sure you want to delete all your data? This operation cannot be undone.',
            p2: 'Your data is very important, you can export the data first, and then delete the data.',
            p3: 'If you want to delete all data, please enter DELETE below, and then click Confirm.',
          },
          deleteAccount: 'Delete Account',
          deleteAccountModal: {
            p1: 'This will permanently delete your account and erase every record we hold for you — coding activity, agent sessions, machines, projects, tags, and the link to your Google / GitHub / Apple identities.',
            p2: 'This action cannot be undone. If you sign in again with the same provider afterward, you will start over as a new user.',
            p3: 'To confirm, type DELETE below and click Confirm.',
          },
        },
        subTitle: {
          removeData: 'Remove data',
          privacy: 'Privacy',
        },
      },
      account: {
        title: 'Account',
        description: 'Account settings.',
        expiresIn: 'Expires in',
        manageSubscription: 'Manage Subscription',
        subscribe: 'Subscribe',
        username: {
          edit: 'Edit username',
          title: 'Edit username',
          description: 'Choose a username between 3 and 32 characters. Letters, digits, underscore, and hyphen only.',
          placeholder: 'Enter a new username',
          errorEmpty: 'Username is required',
          errorLength: (min: number, max: number) => `Username must be ${min}-${max} characters`,
          errorChars: 'Only letters, digits, underscore, and hyphen are allowed',
          errorGeneric: 'Failed to update username',
        },
      },
      other: {
        title: 'Other',
        description: 'Other settings.',
        logout: 'Logout',
      },
      connect: {
        agent: {
          title: 'Connect AI Agents',
          meta: 'cli · claude · codex · opencode · pi',
        },
        vscode: {
          title: 'Connect VSCode',
          meta: 'vscode · cursor · windsurf',
        },
        jetbrains: {
          title: 'Connect JetBrains IDEs',
          meta: 'intellij · pycharm · webstorm · …',
        },
      },
    },
    workspace: {
      project: 'Project',
      topBranch: 'Top Branch',
      range: 'Date Range',
      noData: 'No data for this workspace.',
      select: {
        placeholder: 'Select a workspace',
        none: 'Input a workspace name',
        prompt: 'Select a project to begin.',
      },
      flameGraph: {
        title: 'Flame Graph',
        noData: 'No data yet',
      },
      fileList: {
        title: 'File List',
      },
    },
    leaderboard: {
      title(days: number) {
        return `Past ${days} Days Coding Time Leaderboard`
      },
      delta(string: string) {
        return `${string} behind`
      },
    },
    tags: {
      title: 'Tags',
      description: 'Manage tags and rules for automatic workspace categorization.',
      tagList: {
        title: 'Tag List',
        noTags: 'No tags found. Create your first tag to get started.',
        createTag: 'Create Tag',
        freeUserLimit: 'Free users can create up to',
        upgradeForMore: 'Upgrade to create more tags',
        editTag: 'Edit tag',
        deleteTag: 'Delete tag',
      },
      tagForm: {
        name: 'Name',
        namePlaceholder: 'Enter tag name',
        color: 'Color',
        colorPlaceholder: 'Choose a color',
        emoji: 'Emoji',
        emojiPlaceholder: 'Enter emoji (optional)',
        create: 'Create Tag',
        edit: 'Edit Tag',
        cancel: 'Cancel',
        save: 'Save',
      },
      tagRules: {
        title: 'Tag Rules',
        noRules: 'No rules found for this tag.',
        createRule: 'Create Rule',
        rule: 'Rule',
        enabled: 'Enabled',
        disabled: 'Disabled',
        delete: 'Delete',
        edit: 'Edit',
        selectTagPrompt: 'Select a tag to manage its rules',
        freeUserLimit: 'Free users can create up to',
        upgradeForMore: 'Upgrade to create more rules',
      },
      ruleForm: {
        name: 'Rule Name',
        namePlaceholder: 'Enter rule name',
        enabled: 'Enabled',
        conditions: 'Conditions',
        addCondition: 'Add Condition',
        field: 'Field',
        conditionType: 'Condition Type',
        value: 'Value',
        valuePlaceholder: 'Enter value',
        negate: 'Negate',
        create: 'Create Rule',
        edit: 'Edit Rule',
        cancel: 'Cancel',
        save: 'Save',
      },
      conditionTypes: {
        CONTAINS: 'Contains',
        EQUALS: 'Equals',
        STARTS_WITH: 'Starts with',
        ENDS_WITH: 'Ends with',
        REGEX: 'Regular expression',
        NOT_CONTAINS: 'Does not contain',
        NOT_EQUALS: 'Does not equal',
        NOT_STARTS_WITH: 'Does not start with',
        NOT_ENDS_WITH: 'Does not end with',
        NOT_REGEX: 'Does not match regex',
      },
      fields: {
        workspaceName: 'Workspace Name',
        language: 'Language',
        gitOrigin: 'Git Origin',
        gitBranch: 'Git Branch',
        platform: 'Platform',
        editor: 'Editor',
        absoluteFile: 'Absolute File Path',
        relativeFile: 'Relative File Path',
      },
      actions: {
        delete: 'Delete',
        edit: 'Edit',
        manageRules: 'Manage Rules',
        enable: 'Enable',
        disable: 'Disable',
      },
      deleteConfirm: {
        deleteTag: 'Delete Tag',
        deleteTagMessage: 'Are you sure you want to delete this tag? This action cannot be undone.',
        deleteRule: 'Delete Rule',
        deleteRuleMessage: 'Are you sure you want to delete this rule? This action cannot be undone.',
        cancel: 'Cancel',
        delete: 'Delete',
      },
      common: {
        not: 'not',
        optional: '(optional)',
        ruleRelationship: 'Rules are connected by OR logic, conditions by AND logic',
        freeUserRuleLimit: 'Free users can only create 1 rule per tag',
        upgradeForMoreRules: 'Upgrade to create more rules',
        ruleIdFormat: (id: string) => `Rule #${id.slice(-4)}`,
        editingMode: 'Editing Mode - Remember to save changes',
      },
      timeRange: {
        last7Days: 'Last 7 days',
        last30Days: 'Last 30 days',
        last90Days: 'Last 90 days',
      },
      stats: {
        title: 'Tag Statistics',
        viewAll: 'View All',
        noData: 'No tag data available',
        timeDistribution: 'Tag Coding Time Distribution',
        totalDuration: 'Total Duration',
        recordCount: 'Record Count',
        timeRange: 'Time Range',
        days: 'days',
        dailyAverage: 'Daily Average',
        timeTrend: 'Time Trend',
        noChartData: 'No chart data available',
        statisticsTitle: (tagName: string) => `${tagName} Statistics`,
      },
    },
  },
  common: {
    optional: 'optional',
  },
  button: {
    copy: 'Copy',
    copied: 'Copied',
    cancel: 'Cancel',
    confirm: 'Confirm',
  },
  plot: {
    label: {
      project: 'Project',
      timeHour: 'Time (hours)',
      language: 'Language',
      date: 'Date',
      duration: 'Duration',
      durationHours: 'Duration (hours)',
      other: 'Other',
      unknown: 'Unknown',
      currentTime: 'Current Time',
    },
  },
}
