import type { Translation } from './type'
import { defineComponent } from 'vue'
import NuxtLink from './NuxtLink'

export const ua: Partial<Translation> = {
  annualReport: {
    shareMyReport: 'Поділитися моїм звітом',
    reviewAnnualReport: 'Перегляд річного звіту',
    userNotFound: 'Користувач не знайдений.',
    noData: 'Дані відсутні.',
    noDataAvailableFor: (year: number | string) => `Дані за ${year} рік відсутні.`,
    annualCodeTimeReport: (year: number | string) => `Річний звіт про час кодування за ${year} рік`,
    weekendCodingTimeRatio: 'Співвідношення часу кодування у вихідні дні',
    averageDailyCodingTime: 'Середній щоденний час кодування',
    activeDaysOfTheYear: 'Активні дні року',
    longestStreakOfTheYear: 'Найдовша серія року',
    busiestDayOfTheYear: 'Найбільш завантажений день року',
    busiestMonthOfTheYear: 'Найбільш завантажений місяць року',
    theMostProductiveHourOfTheYear: 'Найбільш продуктивна година року',
    month: 'Місяць',
    hour: 'Година',
    minutes: 'Хвилини',
    theMostUsedLanguageOfTheYear: 'Найбільш використовувана мова року',
    totalCodingTimeOfTheYear: 'Загальний час кодування за рік',
    priodOfDay: {
      morning: 'Ранок',
      afternoon: 'День',
      evening: 'Вечір',
      midnight: 'Північ',
    },
  },
  meta: {
    title: 'CodeTime - Відстежуйте свій час програмування',
    description:
      'CodeTime - це програма, призначена для розробників, яка допоможе вам відстежувати, аналізувати та покращувати свої навички управління часом програмування.',
    ogTitle: 'CodeTime - Відстежуйте свій час програмування',
    ogDescription:
      'CodeTime - це програма, призначена для розробників, яка допоможе вам відстежувати, аналізувати та покращувати свої навички управління часом програмування.',
    twitterTitle: 'CodeTime - Відстежуйте свій час програмування',
    twitterDescription:
      'CodeTime - це програма, призначена для розробників, яка допоможе вам відстежувати, аналізувати та покращувати свої навички управління часом програмування.',
  },
  general: {
    cancel: 'Скасувати',
    confirm: 'Підтвердити',
  },
  landing: {
    login: 'Увійти',
    description:
      'CodeTime - це програма, призначена для розробників, яка допоможе вам відстежувати та аналізувати свій час програмування.',
    toDashboard: 'Перейти до панелі інструментів',
    alreadyStatistical: 'Час програмування вже відстежується',
    minutes: 'хвилин',
    loginWithGithub: 'Увійти за допомогою GitHub',
    freeMessage: 'Наразі повністю безкоштовно, кредитна картка не потрібна',
    demo: 'Демо',
    heroBadge: 'фокус · приватність · відкритість',
    scroll: 'прокрутка',

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
        title: 'Візуалізація даних',
        description:
          'Ми прагнемо надати найбільш привабливу сучасну панель інструментів, щоб допомогти вам краще розуміти ваш час програмування.',
      },
      save: {
        title: 'Зберігайте ваші дані про час програмування назавжди.',
        description:
          'Ми знаємо цінність історії. Ніщо так не засмучує, як втратити свою працю. Щоб усі користувачі могли переглядати свою історію прогресу навіть через багато років, ми зберігатимемо ваші дані завжди, поки ви не видалите їх самостійно, навіть якщо ви ніколи не платили.',
      },
      export: {
        title: 'Підтримка експорту даних.',
        description:
          'Найбезпечніше місце у світі - це ваш власний жорсткий диск. Тому ми підтримуємо експорт даних, ви можете вийти в будь-який час і підключитися до інших платформ або власних сервісів.',
      },
      editor: {
        title: 'Підтримка декількох редакторів.',
        description:
          'Ми - дуже мала команда. Це означає, що ми не можемо підтримувати всі IDE або редактори коду. Однак наразі ми підтримуємо IDE VSCode та JetBrain. Ми вважаємо, що вони охоплюють більшість потреб користувачів. Ми зробимо все можливе, щоб підтримати більше платформ і забезпечити користь для більшої кількості людей.',
      },
      widgets: {
        title: 'Вбудовуйте свій час кодингу будь-куди.',
        description: 'Додавайте бейджі, кільцеві діаграми мов і живі статус-картки до будь-якого README, блогу чи особистого сайту. Кожен віджет — це один SVG: з підтримкою тем, самодостатній і відмальовується на льоту з ваших найсвіжіших даних.',
        badge: 'Бейдж у стилі Shields',
        donut: 'Кільце мов',
        status: 'Жива статус-картка',
        cta: 'Створити віджет',
      },
    },
    pricing: {
      heading: 'Почни безкоштовно. Pro коли потрібно',
      title: 'Ціни',
      description: 'Виберіть план, який підходить вам.',
    },
    closing: {
      line1: 'Найкращий час посадити дерево був тридцять років тому',
      line2: 'Другий найкращий час — зараз',
    },
  },
  plan: {
    monthly: 'Щомісячний',
    yearly: 'Щорічний',
    savePercent: (p: number) => `Знижка ${p}%`,
    oneTime: 'Одноразова',
    mostFlexible: 'Найбільш гнучкий',
    mostPopular: 'Найбільш популярний',
    bestValue: 'Найкраща ціна',
    modal: {
      title: 'Оновити підписку',
      p1: 'Ми потребуємо вашої підтримки, щоб зберегти наш ентузіазм до розробки та забезпечити більш якісне обслуговування користувачів з більш повними звітами даних.',
      p2: 'Ви можете обрати підписку Pro, щоб розблокувати більше можливостей.',
      p3: 'Якщо ви зіткнетеся з якими-небудь проблемами під час оплати, будь ласка, зв\'яжіться з нами по електронній пошті.',
    },
    status(
      str: string,
    ): string {
      switch (str) {
        case 'active': {
          return 'Активний'
        }
        case 'cancelled': {
          return 'Скасовано'
        }
        case 'expired': {
          return 'Термін дії закінчився'
        }
        case 'on_trial': {
          return 'Пробний період'
        }
        case 'paused': {
          return 'Призупинено'
        }
        case 'past_due': {
          return 'Закінчився термін дії'
        }
        case 'unpaid': {
          return 'Неоплачений'
        }
        default: {
          return 'Невідомий'
        }
      }
    },
    basic: {
      title: 'Базовий',
      forever: 'Назавжди',
      features: {
        title: 'Особливості',
        item: {
          saveHistory: 'Збережіть історію назавжди',
          browseRecent: 'Перегляньте дані за останні 90 днів',
          codetimeTrend: 'Звіт про тенденцію часу програмування',
          codetimeLanguaeTrend: 'Звіт про тенденцію мов програмування',
          codetimeProjectTrend: 'Звіт про тенденцію проектів',
          badge: 'Створіть значки для відображення',
          export: 'Експорт даних',
          import: 'Імпорт даних',
          more: 'Інші звіти',
          agent: 'Телеметрія Agent: вартість, токени, інструменти та ритм',
        },
      },
      button: 'Безкоштовно назавжди',
    },
    pro: {
      title: 'Професійний',
      preMonth: '/ місяць',
      preYear: '/ рік',
      features: {
        item: {
          include: 'Включає всі функції базового плану',
          browseAll: 'Перегляд усієї історії даних',
          workspace: 'Повна історія за робочою областю',
          widgetCustom: 'Детальний стиль віджета та власні кольори',
          widgetUnlimited: 'Без обмежень днів і мов у віджетах',
          rule: 'Обробка даних на основі правил',
          tag: 'Система тегів',
        },
      },
      notYet: 'Ще не доступно',
      button: 'Підписатися зараз',
    },
    needLogin: 'Потрібно увійти у систему',
  },
  demoBanner: {
    overviewPrefix: 'Демо-дані — увійдіть та підключіть плагін VS Code або JetBrains через',
    overviewSuffix: ', щоб побачити свої.',
    agentPrefix: 'Демо-дані — увійдіть та направте агента через',
    agentSuffix: ', щоб побачити свої.',
  },
  dashboard: {
    loginRequired:
      'Ласкаво просимо до панелі інструментів CodeTime! Будь ласка, увійдіть, щоб переглянути дані часу програмування або натисніть кнопку демо нижче, щоб використати демо-панель інструментів.',
    projectSelector: {
      placeholder: 'Оберіть робочий простір',
      noneText: 'Введіть назву робочого простору',
    },
    pageHeader: {
      userLatestEvent(project: string) {
        return `Працюємо над проектом «${project}»`
      },
      title: {
        overview: 'Огляд',
        badge: 'Значки',
        settings: 'Налаштування',
        leaderboard: 'Таблиця лідерів',
        workspace: 'Робочий простір',
        tags: 'Tags',
      },
      description: {
        overview: 'Перегляд усіх даних CodeTime.',
        badge:
          'Відображайте час програмування у ваших проектах за допомогою зрозумілих, послідовних та чітких значків.',
        settings:
          'Керуйте налаштуваннями CodeTime, включаючи вигляд, мову, дані тощо.',
        leaderboard: 'Перегляньте таблицю лідерів CodeTime.',
        workspace: 'Перегляньте дані конкретного робочого простору.',
        tags: 'Manage tags and rules for automatic workspace categorization.',
      },
    },
    overview: {
      rangeTitle: 'Діапазон дат',
      activityTitle: 'Активність',
      topTitle: 'Топ',
      codetimeTrendTitle: 'Тенденція часу програмування',
      codetimeLanguaeTrendTitle: 'Тенденція мов програмування',
      codetimeProjectTrendTitle: 'Тенденція проектів',
      dailyCodingDistributionTitle: 'Розподіл часу кодування',
      dataRange: {
        title(days: number) {
          return `Останні ${days} днів`
        },
        allTime: 'За весь час',
        custom: 'Власний…',
        apply: 'Застосувати',
        cancel: 'Скасувати',
        thisMonth: 'Цей місяць',
        lastMonth: 'Минулий місяць',
        yearToDate: 'З початку року',
        pickRange: 'Обрати діапазон',
      },
      statistic: {
        timeTotal: 'Всього',
        timeToday: 'Сьогодні',
        timeAverage: 'Середній',
        longestStreak: 'Найбільша серія',
        currentStreak: 'Поточна серія',
      },
      top: {
        language: 'Мова',
        project: 'Проект',
        platform: 'Платформа',
        workspace: 'Робочий простір',
      },
      total: {
        time: 'Загальний час програмування',
      },
      recent: {
        time: 'Нещодавній час програмування',
      },
      ranking: 'Рейтинг',
      hours: 'годин',
      active: {
        days: 'Активні дні',
      },
      topLanguage: 'Основна мова',
      noData: {
        notice: {
          title: 'Ще немає даних',
          body: defineComponent({
            components: {
              NuxtLink,
            },
            setup() {
              return () => (
                <div class="text-sm">
                  <span class="text-surface-dimmed">
                    Наразі ми ще не обробили успішно ваші дані часу
                    программування. Ця програма підтримується плагіном вашого
                    редактора коду або IDE (наприклад, VSCode, JetBrains IDE).
                    Відвідайте сторінку
                  </span>
                  <NuxtLink
                    to="dashboard/settings"
                    class="text-primary-on px-2"
                  >
                    [ Налаштування ]
                  </NuxtLink>
                  <span class="text-surface-dimmed">
                    {' '}
                    і конфігуруйте необхідні параметри в редакторі коду, який
                    підтримує плагін, який ви використовуєте. Після отримання
                    даних нам потрібно кілька хвилин для їх обробки. Дякуємо за
                    співпрацю.
                  </span>
                </div>
              )
            },
          }),
        },
      },
    },
    badge: {
      configure: 'Налаштування',
      embed: 'Вбудувати',
      preview: {
        title: 'Попередній перегляд',
      },
      style: {
        flat: 'Плоский',
        flatSquare: 'Плаский квадрат',
        forTheBadge: 'Для значка',
        plastic: 'Пластик',
        social: 'Соціальний',
      },
      placeholder: {
        style: 'Стиль',
        language: 'Мова',
        days: 'Дні',
        project: 'Проект',
        color: 'Колір',
        tag: 'Тег',
        scope: 'Проект або тег',
      },
      scope: {
        tag: 'Тег',
        workspace: 'Проект',
      },
    },
    widget: {
      tab: {
        badge: 'Бейдж',
        donut: 'Мови',
        status: 'Статус',
        calendar: 'Календар',
        trend: 'Тренд',
      },
      theme: {
        label: 'Тема',
        light: 'Світла',
        dark: 'Темна',
      },
      donut: {
        title: 'Топ мови',
        days: 'Днів',
        limit: 'Мов',
      },
      status: {
        title: 'Зараз кодить',
        primary: 'Основна область',
        secondary: 'Додаткова область',
        style: 'Стиль',
        color: 'Акцентний колір',
        colorDefault: 'За замовчуванням',
        background: 'Фон',
        fields: {
          project: 'Проєкт',
          language: 'Мова',
          editor: 'Редактор',
          none: 'Немає',
        },
        styles: {
          minimal: 'Мінімальний',
          detailed: 'Детальний',
        },
      },
      limit: {
        upgrade: 'Перейти на Pro',
        donutFree: 'Безкоштовний план: до 30 днів і 5 мов. Pro знімає обмеження.',
        donutExceeds: 'Безкоштовний план обмежує 30 днями і 5 мовами — значення будуть обрізані.',
        statusFree: 'Безкоштовний план: виберіть назву проєкту АБО мову. Pro показує обидва.',
        statusFreeStyle: 'Безкоштовний план: лише мінімальний стиль із кольорами за замовчуванням. Pro відкриває детальний стиль та користувацькі акцентний / фоновий кольори.',
      },
    },
    settings: {
      token: {
        title: 'Токен',
        tip: 'Ваш токен використовується для доступу до API CodeTime. Зберігайте його в таємниці.',
        refresh: 'Оновити',
        refreshTip:
          'Якщо ви підозрюєте, що ваш токен став відомий, ви можете згенерувати новий токен тут.',
        refreshToken: 'Оновити токен',
        confirmRefresh:
          'Ви впевнені, що хочете оновити токен? Це призведе до недійсності токена, який ви застосували до плагіна редактора. Вам потрібно буде ввести новий токен.',
        getPlugin: defineComponent({
          components: {
            NuxtLink,
          },
          setup() {
            return () => (
              <div class="text-surface-dimmed">
                <span>
                  Для правильної роботи CodeTime вам потрібно встановити наш плагін і налаштувати токен у вашому середовищі розробки. Наразі ми підтримуємо
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
                  та
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
        title: 'Мова',
        tip: 'Оберіть мову для вашого веб-інтерфейсу CodeTime.',
      },
      export: {
        title: 'Експорт',
        button: 'Експорт одним кліком',
        buttonExporting: 'Експорт...',
        buttonSucceed: 'Експорт успішно',
        buttonFailed: 'Експорт не вдалося',
        download: 'Завантажити',
        description:
          'Ми підтримуємо експорт даних веб-сайту, щоб забезпечити надійне резервне копіювання, зручну міграцію, глибокий аналіз і відповідність вимогам, а також повний контроль і прозорість ваших даних.',
        tip: 'Експорт даних у файл CSV.',
      },
      theme: {
        title: 'Тема',
        tip: 'Виберіть тему для вашого веб-інтерфейсу CodeTime.',
        dark: 'Темна',
        light: 'Світла',
        system: 'Системна',
      },
      dangerZone: {
        title: 'Небезпечна зона',
        description: 'Ці налаштування назавжди вплинуть на ваші дані і не можуть бути скасовані. Будь ласка, дійте обережно.',
        button: {
          removeAllData: 'Видалити всі дані',
          removeAllDataModal: {
            p1: 'Ви дійсно хочете видалити всі ваші дані? Ця операція не може бути скасована.',
            p2: 'Ваші дані дуже важливі. Ви можете спочатку експортувати дані, а потім видалити їх.',
            p3: 'Якщо ви хочете видалити всі дані, введіть DELETE нижче, а потім натисніть кнопку Підтвердити.',
          },
        },
        subTitle: {
          removeData: 'Видалити всі дані',
          privacy: 'Політика конфіденційності',
        },
      },
      account: {
        title: 'Обліковий запис',
        description: 'Налаштування облікового запису.',
        expiresIn: 'Термін дії закінчується',
        manageSubscription: 'Керуйте підпискою',
        subscribe: 'Підписатися',
      },
      other: {
        title: 'Інше',
        description: 'Інші налаштування.',
        logout: 'Вийти',
      },
    },
    workspace: {
      project: 'Проект',
      topBranch: 'Основна гілка',
      range: 'Діапазон дат',
      noData: 'Немає даних для цього робочого простору.',
      select: {
        placeholder: 'Оберіть робочий простір',
        none: 'Введіть назву робочого простору',
        prompt: 'Оберіть проект для початку.',
      },
      flameGraph: {
        title: 'Графік пламенів',
        noData: 'Немає даних',
      },
      fileList: {
        title: 'Список файлів',
      },
    },
    leaderboard: {
      title(days: number) {
        return `Рейтинг часу кодування за останні ${days} днів`
      },
      delta(string: string) {
        return `${string} позаду`
      },
    },
    tags: {
      title: 'Теги',
      description: 'Управляйте тегами та правилами для автоматичної категоризації робочих просторів.',
      tagList: {
        title: 'Список тегів',
        noTags: 'Теги не знайдено. Створіть свій перший тег для початку.',
        createTag: 'Створити тег',
        freeUserLimit: 'Безкоштовні користувачі можуть створити до',
        upgradeForMore: 'Оновіть для створення більшої кількості тегів',
        editTag: 'Редагувати тег',
        deleteTag: 'Видалити тег',
      },
      tagForm: {
        name: 'Назва',
        namePlaceholder: 'Введіть назву тегу',
        color: 'Колір',
        colorPlaceholder: 'Оберіть колір',
        emoji: 'Emoji',
        emojiPlaceholder: 'Введіть emoji (необов\'язково)',
        create: 'Створити тег',
        edit: 'Редагувати тег',
        cancel: 'Скасувати',
        save: 'Зберегти',
      },
      tagRules: {
        title: 'Правила тегів',
        noRules: 'Правила для цього тегу не знайдено.',
        createRule: 'Створити правило',
        rule: 'Правило',
        enabled: 'Увімкнено',
        disabled: 'Вимкнено',
        delete: 'Видалити',
        edit: 'Редагувати',
        selectTagPrompt: 'Оберіть тег для управління його правилами',
        freeUserLimit: 'Безкоштовні користувачі можуть створити до',
        upgradeForMore: 'Оновіть для створення більшої кількості правил',
      },
      ruleForm: {
        name: 'Назва правила',
        namePlaceholder: 'Введіть назву правила',
        enabled: 'Увімкнено',
        conditions: 'Умови',
        addCondition: 'Додати умову',
        field: 'Поле',
        conditionType: 'Тип умови',
        value: 'Значення',
        valuePlaceholder: 'Введіть значення',
        negate: 'Заперечення',
        create: 'Створити правило',
        edit: 'Редагувати правило',
        cancel: 'Скасувати',
        save: 'Зберегти',
      },
      conditionTypes: {
        CONTAINS: 'Містить',
        EQUALS: 'Дорівнює',
        STARTS_WITH: 'Починається з',
        ENDS_WITH: 'Закінчується на',
        REGEX: 'Регулярний вираз',
        NOT_CONTAINS: 'Не містить',
        NOT_EQUALS: 'Не дорівнює',
        NOT_STARTS_WITH: 'Не починається з',
        NOT_ENDS_WITH: 'Не закінчується на',
        NOT_REGEX: 'Не відповідає regex',
      },
      fields: {
        workspaceName: 'Назва робочого простору',
        language: 'Мова',
        gitOrigin: 'Git Origin',
        gitBranch: 'Git Branch',
        platform: 'Платформа',
        editor: 'Редактор',
        absoluteFile: 'Абсолютний шлях до файлу',
        relativeFile: 'Відносний шлях до файлу',
      },
      actions: {
        delete: 'Видалити',
        edit: 'Редагувати',
        manageRules: 'Керувати правилами',
        enable: 'Увімкнути',
        disable: 'Вимкнути',
      },
      deleteConfirm: {
        deleteTag: 'Видалити тег',
        deleteTagMessage: 'Ви впевнені, що хочете видалити цей тег? Цю дію неможливо скасувати.',
        deleteRule: 'Видалити правило',
        deleteRuleMessage: 'Ви впевнені, що хочете видалити це правило? Цю дію неможливо скасувати.',
        cancel: 'Скасувати',
        delete: 'Видалити',
      },
      common: {
        not: 'не',
        optional: '(опціонально)',
        ruleRelationship: 'Правила з\'єднані логікою АБО, умови логікою ТА',
        freeUserRuleLimit: 'Безкоштовні користувачі можуть створити лише 1 правило на тег',
        upgradeForMoreRules: 'Оновіться, щоб створити більше правил',
        ruleIdFormat: (id: string) => `Правило #${id.slice(-4)}`,
        editingMode: 'Режим редагування - Не забудьте зберегти зміни',
      },
      timeRange: {
        last7Days: 'Останні 7 днів',
        last30Days: 'Останні 30 днів',
        last90Days: 'Останні 90 днів',
      },
      stats: {
        title: 'Статистика тегів',
        viewAll: 'Переглянути все',
        noData: 'Дані по тегах недоступні',
        timeDistribution: 'Розподіл часу програмування за тегами',
        totalDuration: 'Загальна тривалість',
        recordCount: 'Кількість записів',
        timeRange: 'Часовий діапазон',
        days: 'днів',
        dailyAverage: 'Середнє за день',
        timeTrend: 'Часова тенденція',
        noChartData: 'Дані графіка недоступні',
        statisticsTitle: (tagName: string) => `Статистика ${tagName}`,
      },
    },
    profile: {
      identity: {
        title: 'Профіль',
      },
      activity: {
        title: 'Активність',
      },
      languages: {
        title: 'Language Highlights',
        noData: 'Даних про мови ще немає.',
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
      title: 'Почати з CodeTime',
      description: 'Встановіть плагін CodeTime для автоматичного відстеження часу програмування',
      token: {
        title: 'Ваш токен',
        description: 'Скопіюйте цей токен і вставте у налаштування плагіна',
      },
      plugins: {
        title: 'Завантажити плагіни',
      },
      vscode: {
        title: 'Сімейство VSCode',
        description: 'Сумісно з VSCode, Cursor та Windsurf',
      },
      jetbrains: {
        title: 'Сімейство JetBrains',
        description: 'Сумісно з усіма IDE JetBrains',
      },
      downloadPlugin: 'Завантажити плагін',
      setup: {
        title: 'Інструкції з налаштування',
        step1: 'Завантажте та встановіть плагін для вашого редактора',
        step2: 'Відкрийте налаштування плагіна у вашому редакторі',
        step3: 'Скопіюйте та вставте ваш токен зверху',
        step4: 'Почніть програмувати і дані з\'являться через 2-3 хвилини',
      },
    },
    agentGuide: {
      title: 'Відстежуйте сесії AI-агента',
      description: 'Встановіть CLI codetime, щоб автоматично записувати кожну сесію Claude Code.',
      token: {
        title: 'Ваш токен',
        description: 'Скопіюйте цей токен. Ви вставите його в CLI на останньому кроці.',
      },
      install: {
        title: 'Встановити CLI',
        description: 'Встановіть codetime глобально за допомогою npm (або вашого улюбленого менеджера пакетів Node).',
      },
      configure: {
        title: 'Налаштувати токен',
        description: 'Виконайте цю команду. CLI почне завантаження з вашої наступної сесії агента.',
        hint: 'Замініть <token> на скопійоване вище значення.',
      },
      hook: {
        title: 'Підключити агентів',
        description: 'Виконайте codetime install — CLI автоматично виявить усі підтримувані AI-агенти на вашій машині та налаштує хуки.',
        supports: 'Підтримуються:',
        latency: 'Використовуйте будь-який агент як зазвичай. Сесії з\'являться тут протягом ~2 хвилин після завершення.',
      },
    },
    agent: {
      freeLimit: 'Безкоштовний план: показано сесії за останні 30 днів. Перейдіть на Pro для повної історії.',
      upgrade: 'Оновити',
      sections: {
        overview: 'Огляд',
        costTimeline: 'Вартість · Хронологія',
        rhythm: 'Ритм · Коли',
        projects: 'Проєкти · Вартість',
        models: 'Моделі · Вартість',
        tools: 'Інструменти',
        sessions: 'Сесії · Список',
      },
      labels: {
        kpi: {
          events: 'події',
          sessions: 'сесії',
          tokens: 'токени',
          cost: 'вартість',
          time: 'час',
          linesNet: 'рядки нетто',
          tools: 'інструмент',
          cmd: 'команда',
          projects: 'проєкти',
          inSuffix: 'вх',
          outSuffix: 'вих',
          estimated: 'оцінка',
          agentActive: 'agent активний',
        },
        timeline: {
          cost: 'вартість',
          modelCalls: 'виклики моделі',
          cacheHit: 'влучання в кеш',
          tokensFoot: (buckets: number, tokens: string) => `${buckets} кошиків · ${tokens} токенів`,
          empty: 'немає використання моделей у цьому вікні',
        },
        rhythm: {
          peakHour: 'Пікова година',
          peakDay: 'Піковий день',
          active: 'Активно',
          avgSlot: 'Середнє/слот',
          ofWindow: 'з 24г × 7д',
          perSlot: 'викликів на активний слот',
          calls: 'викликів',
          scaleLabel: 'вартість',
          scaleLow: 'низ → вис',
          metaPrefix: 'викликів · година × день · місцевий час',
        },
        table: {
          project: 'Проєкт',
          model: 'Модель',
          tool: 'Інструмент',
          cost: 'Вартість',
          share: 'Частка',
          tokens: 'Токени',
          cache: 'Кеш',
          calls: 'Виклики',
          time: 'Час',
          inputPct: 'Вх',
          outputPct: 'Вих',
          fail: 'Помилка%',
          total: 'Усього',
          noProject: '— немає даних проєкту у вікні —',
          noModel: '— немає використання моделей у вікні —',
          noTool: '— немає викликів інструментів у вікні —',
        },
        sessions: {
          source: 'Джерело',
          project: 'Проєкт',
          started: 'Початок',
          duration: 'Тривалість',
          turns: 'Раунди',
          tools: 'Інструменти',
          inTok: 'tok вх',
          outTok: 'tok вих',
          lines: 'Рядки +/-',
          loadMore: 'Завантажити ще',
          loading: 'Завантаження…',
          loaded: (n: number) => `Завантажено ${n}`,
          empty: 'Немає сесій',
        },
        meta: {
          projects: (n: number) => `${n} проєктів`,
          calls: (n: string) => `${n} викликів`,
          estimatedBuckets: (bucket: string, range: string) => `оцінка · ${bucket} · ${range}`,
          rhythmMeta: (range: string) => `година × день · місцевий час · ${range}`,
          bucketHour: 'кошики 1г',
          bucketDay: 'кошики 1д',
          bucketWeek: 'кошики 1тиж',
          allTime: 'весь час',
        },
      },
    },
  },
  button: {
    copy: 'Копіювати',
    copied: 'Скопійовано',
    cancel: 'Скасувати',
    confirm: 'Підтвердити',
  },
  plot: {
    label: {
      project: 'Проект',
      timeHour: 'Час (години)',
      language: 'Мова',
      date: 'Дата',
      duration: 'Тривалість',
      durationHours: 'Тривалість (години)',
      other: 'Інше',
      unknown: 'Невідомо',
      currentTime: 'Поточний час',
    },
  },
}
