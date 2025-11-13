import type { Translation } from './type'
import { defineComponent } from 'vue'
import NuxtLink from './NuxtLink'

export const ru: Partial<Translation> = {
  annualReport: {
    shareMyReport: 'Поделиться моим отчетом',
    reviewAnnualReport: 'Просмотреть годовой отчет',
    userNotFound: 'Пользователь не найден.',
    noData: 'Нет доступных данных.',
    noDataAvailableFor: (year: number | string) => `Нет данных за ${year} год.`,
    annualCodeTimeReport: (year: number | string) => `Годовой отчет о времени кодирования за ${year} год`,
    weekendCodingTimeRatio: 'Соотношение времени кодирования в выходные дни',
    averageDailyCodingTime: 'Среднее ежедневное время кодирования',
    busiestDayOfTheYear: 'Самый загруженный день года',
    busiestMonthOfTheYear: 'Самый загруженный месяц года',
    theMostProductiveHourOfTheYear: 'Самый продуктивный час года',
    month: 'Месяц',
    hour: 'Час',
    minutes: 'Минуты',
    theMostUsedLanguageOfTheYear: 'Самый используемый язык года',
    totalCodingTimeOfTheYear: 'Общее время кодирования за год',
    priodOfDay: {
      morning: 'Утро',
      afternoon: 'День',
      evening: 'Вечер',
      midnight: 'Полночь',
    },
  },
  meta: {
    title: 'CodeTime - Отслеживайте свое время программирования',
    description:
      'CodeTime - это приложение, разработанное для разработчиков, чтобы помочь вам отслеживать, анализировать и улучшать свои навыки управления временем программирования.',
    ogTitle: 'CodeTime - Отслеживайте свое время программирования',
    ogDescription:
      'CodeTime - это приложение, разработанное для разработчиков, чтобы помочь вам отслеживать, анализировать и улучшать свои навыки управления временем программирования.',
    twitterTitle: 'CodeTime - Отслеживайте свое время программирования',
    twitterDescription:
      'CodeTime - это приложение, разработанное для разработчиков, чтобы помочь вам отслеживать, анализировать и улучшать свои навыки управления временем программирования.',
  },
  general: {
    cancel: 'Отменить',
    confirm: 'Подтвердить',
  },
  landing: {
    login: 'Войти',
    description:
      'CodeTime - это приложение, разработанное для разработчиков, чтобы помочь вам отслеживать и анализировать свое время программирования.',
    toDashboard: 'Перейти к панели инструментов',
    alreadyStatistical: 'Время программирования уже отслеживается',
    minutes: 'минут',
    loginWithGithub: 'Войти с помощью GitHub',
    freeMessage:
      'В настоящее время полностью бесплатно, кредитная карта не требуется',
    demo: 'Демо',
    features: {
      visualization: {
        title: 'Визуализация данных',
        description:
          'Мы стремимся предоставить наиболее красивую современную панель инструментов, чтобы помочь вам лучше понять свое время программирования.',
      },
      save: {
        title: 'Сохраняйте свои данные о времени программирования навсегда.',
        description:
          'Мы знаем ценность истории. Ничто так не расстраивает, как потерять свои труды. Чтобы все пользователи могли просматривать свою историю прогресса даже спустя много лет, мы будем хранить ваши данные всегда, пока вы не удалите их самостоятельно, даже если вы никогда не платили.',
      },
      export: {
        title: 'Поддержка экспорта данных.',
        description:
          'Самое безопасное место в мире - ваш собственный жесткий диск. Поэтому мы поддерживаем экспорт данных: вы можете выйти в любое время и подключиться к другим платформам или собственным сервисам.',
      },
      editor: {
        title: 'Поддержка нескольких редакторов.',
        description:
          'Мы очень маленькая команда. Это означает, что мы не можем поддерживать все IDE или редакторы кода. Однако в настоящее время мы поддерживаем IDE VSCode и JetBrain. Мы считаем, что они покрывают большинство потребностей пользователей. Мы постараемся поддерживать больше платформ и принести пользу большему числу людей.',
      },
    },
    pricing: {
      title: 'Цены',
      description: 'Выберите план, который подходит вам.',
    },
  },
  plan: {
    monthly: 'Ежемесячно',
    yearly: 'Ежегодно',
    save25: 'Сэкономьте 25%',
    oneTime: 'Единоразово',
    mostFlexible: 'Самый гибкий',
    mostPopular: 'Самый популярный',
    bestValue: 'Лучшее предложение',
    modal: {
      title: 'Обновить подписку',
      p1: 'Мы нуждаемся в вашей поддержке, чтобы сохранить наш энтузиазм к разработке и обеспечить более качественное обслуживание пользователей с более полными отчетами данных.',
      p2: 'Вы можете выбрать обновление до подписки Pro, чтобы разблокировать больше возможностей.',
      p3: 'Если у вас возникли проблемы во время оплаты, свяжитесь с нами по электронной почте.',
    },
    status(
      str: string,
    ): string {
      switch (str) {
        case 'active': {
          return 'Активный'
        }
        case 'cancelled': {
          return 'Отменен'
        }
        case 'expired': {
          return 'Просроченный'
        }
        case 'on_trial': {
          return 'Пробный период'
        }
        case 'paused': {
          return 'Приостановленный'
        }
        case 'past_due': {
          return 'Просроченный'
        }
        case 'unpaid': {
          return 'Неоплаченный'
        }
        default: {
          return 'Неизвестный'
        }
      }
    },
    basic: {
      title: 'Основной',
      forever: 'Навсегда',
      features: {
        title: 'Особенности',
        item: {
          saveHistory: 'Сохраняйте историю навсегда',
          browseRecent: 'Просматривайте данные за последние 90 дней',
          codetimeTrend: 'Отчет о тенденции времени программирования',
          codetimeLanguaeTrend: 'Отчет о тенденции языка программирования',
          codetimeProjectTrend: 'Отчет о тенденции проектов',
          badge: 'Генерировать значки для отображения',
          export: 'Экспорт данных',
          import: 'Импорт данных',
          more: 'Другие отчеты',
        },
      },
      button: 'Бесплатно навсегда',
    },
    pro: {
      title: 'Профессиональный',
      preMonth: '/ месяц',
      preYear: '/ год',
      features: {
        item: {
          include: 'Включает все функции базового плана',
          browseAll: 'Просмотр всей истории данных',
          rule: 'Обработка данных на основе правил',
          tag: 'Система тегов',
        },
      },
      notYet: 'Еще не доступно',
      button: 'Подписаться сейчас',
    },
    needLogin: 'Необходимо войти в систему',
  },
  dashboard: {
    loginRequired:
      'Добро пожаловать в панель инструментов CodeTime! Пожалуйста, войдите в систему, чтобы просмотреть данные о времени программирования, или нажмите кнопку демо ниже, чтобы ознакомиться с демо-панелью инструментов.',
    projectSelector: {
      placeholder: 'Выберите рабочую область',
      noneText: 'Введите название рабочей области',
    },
    pageHeader: {
      userLatestEvent(project: string) {
        return `Работа в проекте «${project}»`
      },
      title: {
        overview: 'Обзор',
        badge: 'Значки',
        settings: 'Настройки',
        leaderboard: 'Таблица лидеров',
        workspace: 'Рабочая область',
        tags: 'Tags',
      },
      description: {
        overview: 'Просмотр всех ваших данных CodeTime.',
        badge:
          'Отображение времени программирования в ваших проектах с помощью ясных, последовательных и понятных значков.',
        settings:
          'Управление настройками CodeTime, включая внешний вид, язык, данные и т.д.',
        leaderboard: 'Просмотр таблицы лидеров CodeTime.',
        workspace: 'Просмотр данных конкретной рабочей области.',
        tags: 'Manage tags and rules for automatic workspace categorization.',
      },
    },
    overview: {
      codetimeTrendTitle: 'Тенденция времени программирования',
      codetimeLanguaeTrendTitle: 'Тенденция языка программирования',
      codetimeProjectTrendTitle: 'Тенденция проектов',
      dailyCodingDistributionTitle: 'Распределение времени программирования',
      dataRange: {
        title(days: number) {
          return `Прошедшие ${days} дней`
        },
        allTime: 'За все время',
      },
      statistic: {
        timeTotal: 'Всего',
        timeToday: 'Сегодня',
        timeAverage: 'Среднее',
        longestStreak: 'Самая большой серия',
        currentStreak: 'Текущая серия',
      },
      top: {
        language: 'Язык',
        project: 'Проект',
        platform: 'Платформа',
        workspace: 'Рабочая область',
      },
      total: {
        time: 'Общее время программирования',
      },
      recent: {
        time: 'Недавнее время программирования',
      },
      ranking: 'Рейтинг',
      hours: 'часов',
      active: {
        days: 'Активные дни',
      },
      topLanguage: 'Основной язык',
      noData: {
        notice: {
          title: 'Пока нет данных',
          body: defineComponent({
            components: {
              NuxtLink,
            },
            setup() {
              return () => (
                <div class="text-sm">
                  <span class="text-surface-dimmed">
                    В настоящее время мы еще не обработали успешно ваши данные о
                    времени программирования. Это приложение зависит от плагина
                    для вашего редактора кода или IDE (например, VSCode,
                    JetBrains IDE). Посетите страницу
                  </span>
                  <NuxtLink
                    to="dashboard/settings"
                    class="text-primary-on px-2"
                  >
                    [ Настройки ]
                  </NuxtLink>
                  <span class="text-surface-dimmed">
                    {' '}
                    и сконфигурируйте необходимые параметры в редакторе кода,
                    поддерживающем используемый вами плагин. После получения
                    ваших данных нам понадобится пару минут для их обработки.
                    Спасибо за сотрудничество.
                  </span>
                </div>
              )
            },
          }),
        },
      },
    },
    badge: {
      preview: {
        title: 'Предварительный просмотр',
      },
      style: {
        flat: 'Плоский',
        flatSquare: 'Плоский квадрат',
        forTheBadge: 'Для значка',
        plastic: 'Пластик',
        social: 'Социальный',
      },
      placeholder: {
        style: 'Стиль',
        language: 'Язык',
        days: 'Дни',
        project: 'Проект',
        color: 'Цвет',
      },
    },
    settings: {
      token: {
        title: 'Токен',
        tip: 'Ваш токен используется для доступа к API CodeTime. Держите его в тайне.',
        refresh: 'Обновить',
        refreshTip:
          'Если вы подозреваете, что ваш токен был скомпрометирован, вы можете сгенерировать новый токен здесь.',
        refreshToken: 'Обновить токен',
        confirmRefresh:
          'Вы уверены, что хотите обновить токен? Это сделает недействительным токен, который вы применили к плагину редактора. Вам нужно будет ввести новый токен.',
        getPlugin: defineComponent({
          components: {
            NuxtLink,
          },
          setup() {
            return () => (
              <div class="text-surface-dimmed">
                <span>
                  Для правильной работы CodeTime вам необходимо установить наш плагин и настроить токен в вашей среде разработки. В настоящее время мы поддерживаем
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
                  и
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
        title: 'Язык',
        tip: 'Выберите язык для своего веб-интерфейса CodeTime.',
      },
      export: {
        title: 'Экспорт',
        button: 'Экспорт одним нажатием',
        buttonExporting: 'Экспорт...',
        buttonSucceed: 'Экспорт успешно завершен',
        buttonFailed: 'Ошибка экспорта',
        download: 'Скачать',
        description:
          'Мы поддерживаем экспорт данных веб-сайта, чтобы обеспечить безопасное резервное копирование, удобную миграцию, углублённый анализ и соответствие, а также дать вам полный контроль и прозрачность над вашими данными.',
        tip: 'Экспортируйте свои данные в файл CSV.',
      },
      theme: {
        title: 'Тема',
        tip: 'Выберите тему для своего веб-интерфейса CodeTime.',
        dark: 'Темный',
        light: 'Свет',
        system: 'Системная',
      },
      dangerZone: {
        title: 'Опасная зона',
        description: 'Эти настройки навсегда повлияют на ваши данные и не могут быть отменены. Пожалуйста, будьте осторожны.',
        button: {
          removeAllData: 'Удалить все данные',
          removeAllDataModal: {
            p1: 'Вы уверены, что хотите удалить все свои данные? Эта операция не может быть отменена.',
            p2: 'Ваши данные очень важны, вы можете сначала экспортировать данные, а затем удалить их.',
            p3: 'Если вы хотите удалить все данные, введите DELETE ниже, а затем нажмите Подтвердить.',
          },
        },
        subTitle: {
          removeData: 'Удалить все данные',
          privacy: 'Политика конфиденциальности',
        },
      },
      account: {
        title: 'Аккаунт',
        description: 'Настройки аккаунта.',
        expiresIn: 'Истекает через',
        manageSubscription: 'Управление подпиской',
        subscribe: 'Подписаться',
      },
      other: {
        title: 'Другой',
        description: 'Другие настройки.',
        logout: 'Выйти',
      },
    },
    workspace: {
      select: {
        placeholder: 'Выберите рабочую область',
        none: 'Введите название рабочей области',
      },
      flameGraph: {
        title: 'График пламени',
        noData: 'Нет данных',
      },
      fileList: {
        title: 'Список файл',
      },
    },
    leaderboard: {
      title(days: number) {
        return `Таблица лидеров CodeTime за последние ${days} дней`
      },
      delta(string: string) {
        return `отстает ${string}`
      },
    },
    tags: {
      title: 'Теги',
      description: 'Управление тегами и правилами для автоматической категоризации рабочих областей.',
      tagList: {
        title: 'Список тегов',
        noTags: 'Теги не найдены. Создайте свой первый тег для начала.',
        createTag: 'Создать тег',
        freeUserLimit: 'Бесплатные пользователи могут создать до',
        upgradeForMore: 'Обновить для создания большего количества тегов',
      },
      tagForm: {
        name: 'Название',
        namePlaceholder: 'Введите название тега',
        color: 'Цвет',
        colorPlaceholder: 'Выберите цвет',
        emoji: 'Emoji',
        emojiPlaceholder: 'Введите emoji (необязательно)',
        create: 'Создать тег',
        edit: 'Редактировать тег',
        cancel: 'Отменить',
        save: 'Сохранить',
      },
      tagRules: {
        title: 'Правила тегов',
        noRules: 'Правила для этого тега не найдены.',
        createRule: 'Создать правило',
        rule: 'Правило',
        enabled: 'Включено',
        disabled: 'Отключено',
        delete: 'Удалить',
        edit: 'Редактировать',
        selectTagPrompt: 'Выберите тег для управления его правилами',
        freeUserLimit: 'Бесплатные пользователи могут создать до',
        upgradeForMore: 'Обновить для создания большего количества правил',
      },
      ruleForm: {
        name: 'Название правила',
        namePlaceholder: 'Введите название правила',
        enabled: 'Включено',
        conditions: 'Условия',
        addCondition: 'Добавить условие',
        field: 'Поле',
        conditionType: 'Тип условия',
        value: 'Значение',
        valuePlaceholder: 'Введите значение',
        negate: 'Отрицание',
        create: 'Создать правило',
        edit: 'Редактировать правило',
        cancel: 'Отменить',
        save: 'Сохранить',
      },
      conditionTypes: {
        CONTAINS: 'Содержит',
        EQUALS: 'Равно',
        STARTS_WITH: 'Начинается с',
        ENDS_WITH: 'Заканчивается на',
        REGEX: 'Регулярное выражение',
        NOT_CONTAINS: 'Не содержит',
        NOT_EQUALS: 'Не равно',
        NOT_STARTS_WITH: 'Не начинается с',
        NOT_ENDS_WITH: 'Не заканчивается на',
        NOT_REGEX: 'Не соответствует regex',
      },
      fields: {
        workspaceName: 'Название рабочей области',
        language: 'Язык',
        gitOrigin: 'Git Origin',
        gitBranch: 'Git Branch',
        platform: 'Платформа',
        editor: 'Редактор',
        absoluteFile: 'Абсолютный путь к файлу',
        relativeFile: 'Относительный путь к файлу',
      },
      actions: {
        delete: 'Удалить',
        edit: 'Редактировать',
        manageRules: 'Управлять правилами',
        enable: 'Включить',
        disable: 'Отключить',
      },
      deleteConfirm: {
        deleteTag: 'Удалить тег',
        deleteTagMessage: 'Вы уверены, что хотите удалить этот тег? Это действие нельзя отменить.',
        deleteRule: 'Удалить правило',
        deleteRuleMessage: 'Вы уверены, что хотите удалить это правило? Это действие нельзя отменить.',
        cancel: 'Отменить',
        delete: 'Удалить',
      },
      common: {
        not: 'не',
        optional: '(опционально)',
        ruleRelationship: 'Правила связаны логикой ИЛИ, условия логикой И',
        freeUserRuleLimit: 'Бесплатные пользователи могут создать только 1 правило на тег',
        upgradeForMoreRules: 'Обновитесь, чтобы создать больше правил',
        ruleIdFormat: (id: string) => `Правило #${id.slice(-4)}`,
        editingMode: 'Режим редактирования - Не забудьте сохранить изменения',
      },
      timeRange: {
        last7Days: 'Последние 7 дней',
        last30Days: 'Последние 30 дней',
        last90Days: 'Последние 90 дней',
      },
      stats: {
        title: 'Статистика тегов',
        viewAll: 'Посмотреть все',
        noData: 'Данные по тегам недоступны',
        timeDistribution: 'Распределение времени программирования по тегам',
        totalDuration: 'Общая продолжительность',
        recordCount: 'Количество записей',
        timeRange: 'Временной диапазон',
        days: 'дней',
        dailyAverage: 'Среднее за день',
        timeTrend: 'Временная тенденция',
        noChartData: 'Данные графика недоступны',
        statisticsTitle: (tagName: string) => `Статистика ${tagName}`,
      },
    },
    profile: {
      languages: {
        title: 'Language Highlights',
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
    pluginGuide: {
      title: 'Начать с CodeTime',
      description: 'Установите плагин CodeTime для автоматического отслеживания времени программирования',
      token: {
        title: 'Ваш токен',
        description: 'Скопируйте этот токен и вставьте в настройки плагина',
      },
      plugins: {
        title: 'Скачать плагины',
      },
      vscode: {
        title: 'Семейство VSCode',
        description: 'Совместимо с VSCode, Cursor и Windsurf',
      },
      jetbrains: {
        title: 'Семейство JetBrains',
        description: 'Совместимо со всеми IDE JetBrains',
      },
      downloadPlugin: 'Скачать плагин',
      setup: {
        title: 'Инструкции по настройке',
        step1: 'Скачайте и установите плагин для вашего редактора',
        step2: 'Откройте настройки плагина в вашем редакторе',
        step3: 'Скопируйте и вставьте ваш токен сверху',
        step4: 'Начните программировать и данные появятся через 2-3 минуты',
      },
    },
  },
  button: {
    copy: 'Копировать',
    copied: 'Скопировано',
    cancel: 'Отменить',
    confirm: 'Подтвердить',
  },
  plot: {
    label: {
      project: 'Проект',
      timeHour: 'Время (часы)',
      language: 'Язык',
      date: 'Дата',
      duration: 'Длительность',
      durationHours: 'Длительность (часы)',
      other: 'Другие',
      unknown: 'Неизвестный',
      currentTime: 'Текущее время',
    },
  },
}
