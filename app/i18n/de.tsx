import type { Translation } from './type'
import { defineComponent } from 'vue'
import NuxtLink from './NuxtLink'

export const de: Partial<Translation> = {
  annualReport: {
    shareMyReport: 'Meinen Bericht teilen',
    reviewAnnualReport: 'Jahresbericht überprüfen',
    userNotFound: 'Benutzer nicht gefunden.',
    noData: 'Keine Daten verfügbar.',
    noDataAvailableFor: (year: number | string) => `Keine Daten für ${year} verfügbar.`,
    annualCodeTimeReport: (year: number | string) => `Jährlicher Codezeitbericht für ${year}`,
    weekendCodingTimeRatio: 'Verhältnis der Codezeit am Wochenende',
    averageDailyCodingTime: 'Durchschnittliche tägliche Codezeit',
    activeDaysOfTheYear: 'Aktive Tage des Jahres',
    longestStreakOfTheYear: 'Längste Serie des Jahres',
    busiestDayOfTheYear: 'Der geschäftigste Tag des Jahres',
    busiestMonthOfTheYear: 'Der geschäftigste Monat des Jahres',
    theMostProductiveHourOfTheYear: 'Die produktivste Stunde des Jahres',
    month: 'Monat',
    hour: 'Stunde',
    minutes: 'Minuten',
    theMostUsedLanguageOfTheYear: 'Die am häufigsten verwendete Sprache des Jahres',
    totalCodingTimeOfTheYear: 'Gesamtcodezeit des Jahres',
    priodOfDay: {
      morning: 'Morgen',
      afternoon: 'Nachmittag',
      evening: 'Abend',
      midnight: 'Mitternacht',
    },
  },
  meta: {
    title: 'CodeTime - Verfolgen Sie Ihre Codierungszeit',
    description: 'CodeTime ist eine Anwendung, die für Entwickler entwickelt wurde, um Ihnen bei der Verfolgung, Analyse und Verbesserung Ihrer Codierungszeitmanagementfähigkeiten zu helfen.',
    ogTitle: 'CodeTime - Verfolgen Sie Ihre Codierungszeit',
    ogDescription: 'CodeTime ist eine Anwendung, die für Entwickler entwickelt wurde, um Ihnen bei der Verfolgung, Analyse und Verbesserung Ihrer Codierungszeitmanagementfähigkeiten zu helfen.',
    twitterTitle: 'CodeTime - Verfolgen Sie Ihre Codierungszeit',
    twitterDescription: 'CodeTime ist eine Anwendung, die für Entwickler entwickelt wurde, um Ihnen bei der Verfolgung, Analyse und Verbesserung Ihrer Codierungszeitmanagementfähigkeiten zu helfen.',
  },
  general: {
    cancel: 'Stornieren',
    confirm: 'Bestätigen',
  },
  landing: {
    login: 'Anmelden',
    description: 'CodeTime ist eine Anwendung, die für Entwickler entwickelt wurde, um Ihnen bei der Verfolgung und Analyse Ihrer Codierungszeit zu helfen.',
    toDashboard: 'Zum Dashboard',
    alreadyStatistical: 'Codierungszeit bereits verfolgt',
    minutes: 'Protokoll',
    loginWithGithub: 'Mit GitHub anmelden',
    freeMessage: 'Derzeit völlig kostenlos, keine Kreditkarte erforderlich',
    demo: 'Demo',
    heroBadge: 'v3 · Analyse',
    scroll: 'Scrollen',

    sections: {
      globalImpact: 'global · impact',
      visualization: 'visualization',
      alwaysSynced: 'always synced',
      openData: 'open data',
      editors: 'editors',
      pricing: 'pricing',
      startTracking: 'start tracking',
    },
    features: {
      visualization: {
        title: 'Datenvisualisierung',
        description: 'Wir sind bestrebt, das optisch ansprechendste moderne Dashboard bereitzustellen, um Ihnen zu helfen, Ihre Codierungszeit besser zu verstehen.',
      },
      save: {
        title: 'Speichern Sie Ihre Codierungszeitdaten für immer.',
        description: 'Wir kennen die Schönheit historischer Daten. Nichts ist frustrierender, als wenn Ihre eigene harte Arbeit gelöscht wird. Damit alle Benutzer auch nach vielen Jahren ihr Wachstum nachverfolgen können, speichern wir Ihre Daten für immer, bis Sie diese aktiv zerstören, auch wenn Sie noch nie bezahlt haben.',
      },
      export: {
        title: 'Unterstützung für Datenexport.',
        description: 'Der sicherste Ort der Welt ist Ihre eigene Festplatte. Aus diesem Grund unterstützen wir den Datenexport. Sie können jederzeit aussteigen und sich mit anderen Plattformen oder selbstgebauten Diensten verbinden.',
      },
      editor: {
        title: 'Unterstützung mehrerer Editoren.',
        description: 'Wir sind ein sehr kleines Team. Dies bedeutet, dass wir nicht alle IDEs oder Code-Editoren unterstützen können. Derzeit unterstützen wir jedoch VSCode und JetBrain-Serien-IDEs. Wir glauben, dass sie die meisten Benutzeranforderungen abdecken. Wir werden unser Bestes tun, um mehr Plattformen zu unterstützen und mehr Menschen zu begünstigen.',
      },
    },
    pricing: {
      heading: 'Kostenlos starten. Pro wenn nötig.',
      title: 'Preisgestaltung',
      description: 'Wählen Sie den für Sie passenden Plan aus.',
    },
    closing: {
      heading: 'Lass jede Minute zählen.',
    },
  },
  plan: {
    monthly: 'Monatlich',
    yearly: 'Jährlich',
    save25: '25% sparen',
    oneTime: 'Einmalig',
    mostFlexible: 'Am flexibelsten',
    mostPopular: 'Am beliebtesten',
    bestValue: 'Bester Wert',
    modal: {
      title: 'Upgrade-Abonnement',
      p1: 'Wir benötigen Ihre Unterstützung, um unsere Entwicklungsbegeisterung aufrechtzuerhalten, um reichhaltigere Datensätze und eine bessere Benutzererfahrung zu bieten.',
      p2: 'Sie können ein Upgrade auf ein Pro-Abonnement durchführen, um weitere Funktionen freizuschalten.',
      p3: 'Wenn Sie während des Zahlungsvorgangs Probleme haben, kontaktieren Sie uns bitte per E-Mail.',
    },
    status(str: string): string {
      switch (str) {
        case 'active': {
          return 'Aktiv'
        }
        case 'cancelled': {
          return 'Abgebrochen'
        }
        case 'expired': {
          return 'Abgelaufen'
        }
        case 'on_trial': {
          return 'In der Testphase'
        }
        case 'paused': {
          return 'Pausiert'
        }
        case 'past_due': {
          return 'Überfällig'
        }
        case 'unpaid': {
          return 'Unbezahlt'
        }
        default: {
          return 'Unbekannt'
        }
      }
    },
    basic: {
      title: 'Grundlegend',
      forever: 'Für immer',
      features: {
        title: 'Eigenschaften',
        item: {
          saveHistory: 'Historische Daten für immer speichern',
          browseRecent: 'Daten der letzten 90 Tage durchsuchen',
          codetimeTrend: 'Codierungszeit-Trendbericht',
          codetimeLanguaeTrend: 'Programmiersprachen-Trendbericht',
          codetimeProjectTrend: 'Projekt-Trendbericht',
          badge: 'Erstellen Sie Abzeichen zur Anzeige',
          export: 'Datenexport',
          import: 'Daten importieren',
          more: 'Weitere Berichte',
        },
      },
      button: 'Für immer kostenlos',
    },
    pro: {
      title: 'Pro',
      preMonth: '/ Monat',
      preYear: '/ Jahr',
      features: {
        item: {
          include: 'Enthält alle Funktionen des Basic-Plans',
          browseAll: 'Durchsuchen Sie alle historischen Daten',
          rule: 'Regelbasierte Datenverarbeitung',
          tag: 'Tag-System',
        },
      },
      notYet: 'bedeutet noch nicht verfügbar',
      button: 'Jetzt abonnieren',
    },
    needLogin: 'Einloggen',
  },
  dashboard: {
    projectSelector: {
      placeholder: 'Projektname',
      noneText: 'Kein Projekt',
    },
    loginRequired: 'Willkommen beim CodeTime-Dashboard! Bitte melden Sie sich an, um Ihre Codierungszeitdaten anzuzeigen, oder klicken Sie unten auf die Schaltfläche Demo, um das Demo-Dashboard zu erleben.',
    pageHeader: {
      userLatestEvent(project: string) {
        return `Arbeiten an ${project}`
      },
      title: {
        overview: 'Übersicht',
        badge: 'Abzeichen',
        settings: 'Einstellungen',
        leaderboard: 'Bestenliste',
        workspace: 'Arbeitsbereich',
        tags: 'Tags',
      },
      description: {
        overview: 'Zeigen Sie alle Ihre CodeTime-Daten an.',
        badge: 'Zeigen Sie Ihre Codierungszeit in Ihren Projekten mit prägnanten, konsistenten und klaren Abzeichen an.',
        settings: 'Verwalten Sie Ihre CodeTime-Einstellungen, einschließlich Aussehen, Sprache, Daten usw.',
        leaderboard: 'Zeigen Sie die CodeTime-Bestenliste aller Benutzer an.',
        workspace: 'Zeigen Sie Ihre Arbeitsbereichdetails an.',
        tags: 'Verwalten Sie Tags und Regeln für die automatische Arbeitsbereichkategorisierung.',
      },
    },
    overview: {
      rangeTitle: 'Zeitraum',
      activityTitle: 'Aktivität',
      topTitle: 'Top',
      codetimeTrendTitle: 'Codierungszeit Trend',
      codetimeLanguaeTrendTitle: 'Programmiersprachen Trend',
      codetimeProjectTrendTitle: 'Projekt Trend',
      dailyCodingDistributionTitle: 'Tägliche Codierungsverteilung',
      dataRange: {
        title(days: number) {
          return `Vergangene ${days} Tage`
        },
        allTime: 'Ganze Zeit',
      },
      statistic: {
        timeTotal: 'Zeit/Insgesamt',
        timeToday: 'Zeit/Heute',
        timeAverage: 'Zeit/Durchschnitt',
        longestStreak: 'Streak/Größte',
        currentStreak: 'Streak/Aktuell',
      },
      top: {
        language: 'Sprache',
        project: 'Projekt',
        platform: 'Plattform',
        workspace: 'Arbeitsbereich',
      },
      total: {
        time: 'Gesamte Codierungszeit',
      },
      recent: {
        time: 'Kürzliche Programmierzeit',
      },
      ranking: 'Rangfolge',
      hours: 'Stunden',
      active: {
        days: 'Aktive Tage',
      },
      topLanguage: 'Top-Sprache',
      noData: {
        notice: {
          title: 'Noch keine Daten',
          body: defineComponent({
            components: {
              NuxtLink,
            },
            setup() {
              return () => (
                <div class="text-sm">
                  <span class="text-surface-dimmed">
                    Derzeit haben wir Ihre Codierungszeitdaten noch nicht erfolgreich verarbeitet. Diese Anwendung basiert auf dem Plugin für Ihren Code-Editor oder Ihre integrierte Entwicklungsumgebung (z. B. VSCode, JetBrains IDE). Bitte besuchen Sie die
                  </span>
                  <NuxtLink
                    to="dashboard/settings"
                    class="text-primary-on px-2"
                  >
                    [ Einstellungen ]
                  </NuxtLink>
                  <span class="text-surface-dimmed">
                    Seite und konfigurieren Sie die erforderlichen Einstellungen im Code-Editor, der das von Ihnen verwendete Plugin unterstützt. Nachdem wir Ihre Daten erhalten haben, benötigen wir etwa zwei Minuten, um sie zu verarbeiten. Vielen Dank für Ihre Mitarbeit.
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
        title: 'Identität',
      },
      activity: {
        title: 'Aktivität',
      },
      languages: {
        title: 'Language Highlights',
        noData: 'Noch keine Sprachdaten verfügbar.',
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
      configure: 'Konfigurieren',
      embed: 'Einbetten',
      preview: {
        title: 'Vorschau',
      },
      style: {
        flat: 'Flach',
        flatSquare: 'Flach Quadrat',
        forTheBadge: 'Für das Abzeichen',
        plastic: 'Plastik',
        social: 'Sozial',
      },
      placeholder: {
        style: 'Stil',
        language: 'Sprache',
        days: 'Tage',
        project: 'Projekt',
        color: 'Farbe',
      },
    },
    settings: {
      token: {
        title: 'Token',
        tip: 'Ihr Token wird für den Zugriff auf die CodeTime-API verwendet. Halten Sie es privat.',
        refresh: 'Aktualisierung',
        refreshTip: 'Wenn Sie vermuten, dass Ihr Token kompromittiert wurde, können Sie hier ein neues Token generieren.',
        refreshToken: 'Token aktualisieren',
        confirmRefresh: 'Sind Sie sicher, dass Sie das Token aktualisieren möchten? Dadurch wird das Token ungültig, das Sie auf das Editor-Plugin angewendet haben. Sie müssen ein neues Token eingeben.',
        getPlugin: defineComponent({
          components: {
            NuxtLink,
          },
          setup() {
            return () => (
              <div class="text-surface-dimmed">
                <span>
                  Um CodeTime ordnungsgemäß zu verwenden, müssen Sie unser Plugin installieren und das Token in Ihrer Entwicklungsumgebung konfigurieren. Derzeit unterstützen wir
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
                  und
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
        title: 'Sprache',
        tip: 'Wählen Sie die Sprache für Ihre CodeTime Web UI.',
      },
      export: {
        title: 'Export',
        button: 'Ein-Klick-Export',
        buttonExporting: 'Exportieren...',
        buttonSucceed: 'Export erfolgreich',
        buttonFailed: 'Export fehlgeschlagen',
        download: 'Herunterladen',
        description: 'Wir unterstützen den Export von Website-Daten, um eine sichere Sicherung, eine bequeme Migration, eine tiefgreifende Analyse und die Einhaltung zu gewährleisten und Ihnen gleichzeitig die vollständige Kontrolle und Transparenz über Ihre Daten zu geben.',
        tip: 'Exportieren Sie Ihre Daten in eine CSV-Datei.',
      },
      theme: {
        title: 'Thema',
        tip: 'Wählen Sie das Thema für Ihre CodeTime Web UI.',
        dark: 'Dunkel',
        light: 'Licht',
        system: 'System',
      },
      dangerZone: {
        title: 'Gefahrenzone',
        description: 'Diese Einstellungen wirken sich dauerhaft auf Ihre Daten aus und können nicht rückgängig gemacht werden. Bitte gehen Sie vorsichtig vor.',
        button: {
          removeAllData: 'Alle Daten entfernen',
          removeAllDataModal: {
            p1: 'Sind Sie sicher, dass Sie alle Ihre Daten löschen möchten? Dieser Vorgang kann nicht rückgängig gemacht werden.',
            p2: 'Ihre Daten sind sehr wichtig. Sie können die Daten zuerst exportieren und dann die Daten löschen.',
            p3: 'Wenn Sie alle Daten löschen möchten, geben Sie unten DELETE ein und klicken Sie dann auf Bestätigen.',
          },
        },
        subTitle: {
          removeData: 'Daten entfernen',
          privacy: 'Datenschutz',
        },
      },
      account: {
        title: 'Konto',
        description: 'Kontoeinstellungen.',
        expiresIn: 'Läuft in ab',
        manageSubscription: 'Abonnement verwalten',
        subscribe: 'Abonnieren',
      },
      other: {
        title: 'Andere',
        description: 'Andere Einstellungen.',
        logout: 'Ausloggen',
      },
    },
    workspace: {
      project: 'Projekt',
      topBranch: 'Top-Branch',
      range: 'Zeitraum',
      noData: 'Keine Daten für diesen Arbeitsbereich.',
      select: {
        placeholder: 'Wählen Sie einen Arbeitsbereich',
        none: 'Geben Sie einen Arbeitsbereichsnamen ein',
        prompt: 'Wählen Sie ein Projekt aus.',
      },
      flameGraph: {
        title: 'Flammen-Graph',
        noData: 'Noch keine Daten',
      },
      fileList: {
        title: 'Dateiliste',
      },
    },
    leaderboard: {
      title(days: number) {
        return `CodeTime Leaderboard der letzten ${days} Tage`
      },
      delta(string: string) {
        return `${string} hinter`
      },
    },
    tags: {
      title: 'Tags',
      description: 'Tags und Regeln für die automatische Arbeitsbereichkategorisierung verwalten.',
      tagList: {
        title: 'Tag-Liste',
        noTags: 'Keine Tags gefunden. Erstellen Sie Ihren ersten Tag, um zu beginnen.',
        createTag: 'Tag erstellen',
        freeUserLimit: 'Kostenlose Benutzer können bis zu',
        upgradeForMore: 'Upgrade für mehr Tags',
      },
      tagForm: {
        name: 'Name',
        namePlaceholder: 'Tag-Name eingeben',
        color: 'Farbe',
        colorPlaceholder: 'Farbe wählen',
        emoji: 'Emoji',
        emojiPlaceholder: 'Emoji eingeben (optional)',
        create: 'Tag erstellen',
        edit: 'Tag bearbeiten',
        cancel: 'Abbrechen',
        save: 'Speichern',
      },
      tagRules: {
        title: 'Tag-Regeln',
        noRules: 'Keine Regeln für diesen Tag gefunden.',
        createRule: 'Regel erstellen',
        rule: 'Regel',
        enabled: 'Aktiviert',
        disabled: 'Deaktiviert',
        delete: 'Löschen',
        edit: 'Bearbeiten',
        selectTagPrompt: 'Wählen Sie einen Tag aus, um seine Regeln zu verwalten',
        freeUserLimit: 'Kostenlose Benutzer können bis zu',
        upgradeForMore: 'Upgrade für mehr Regeln',
      },
      ruleForm: {
        name: 'Regelname',
        namePlaceholder: 'Regelname eingeben',
        enabled: 'Aktiviert',
        conditions: 'Bedingungen',
        addCondition: 'Bedingung hinzufügen',
        field: 'Feld',
        conditionType: 'Bedingungstyp',
        value: 'Wert',
        valuePlaceholder: 'Wert eingeben',
        negate: 'Negieren',
        create: 'Regel erstellen',
        edit: 'Regel bearbeiten',
        cancel: 'Abbrechen',
        save: 'Speichern',
      },
      conditionTypes: {
        CONTAINS: 'Enthält',
        EQUALS: 'Gleich',
        STARTS_WITH: 'Beginnt mit',
        ENDS_WITH: 'Endet mit',
        REGEX: 'Regulärer Ausdruck',
        NOT_CONTAINS: 'Enthält nicht',
        NOT_EQUALS: 'Nicht gleich',
        NOT_STARTS_WITH: 'Beginnt nicht mit',
        NOT_ENDS_WITH: 'Endet nicht mit',
        NOT_REGEX: 'Entspricht nicht regex',
      },
      fields: {
        workspaceName: 'Arbeitsbereichname',
        language: 'Sprache',
        gitOrigin: 'Git-Origin',
        gitBranch: 'Git-Branch',
        platform: 'Plattform',
        editor: 'Editor',
        absoluteFile: 'Absoluter Dateipfad',
        relativeFile: 'Relativer Dateipfad',
      },
      actions: {
        delete: 'Löschen',
        edit: 'Bearbeiten',
        manageRules: 'Regeln verwalten',
        enable: 'Aktivieren',
        disable: 'Deaktivieren',
      },
      deleteConfirm: {
        deleteTag: 'Tag löschen',
        deleteTagMessage: 'Sind Sie sicher, dass Sie diesen Tag löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
        deleteRule: 'Regel löschen',
        deleteRuleMessage: 'Sind Sie sicher, dass Sie diese Regel löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
        cancel: 'Abbrechen',
        delete: 'Löschen',
      },
      common: {
        not: 'nicht',
        optional: '(optional)',
        ruleRelationship: 'Regeln sind durch ODER-Logik verbunden, Bedingungen durch UND-Logik',
        freeUserRuleLimit: 'Kostenlose Benutzer können nur 1 Regel pro Tag erstellen',
        upgradeForMoreRules: 'Upgrade für mehr Regeln',
        ruleIdFormat: (id: string) => `Regel #${id.slice(-4)}`,
        editingMode: 'Bearbeitungsmodus - Denken Sie daran, Änderungen zu speichern',
      },
      timeRange: {
        last7Days: 'Letzte 7 Tage',
        last30Days: 'Letzte 30 Tage',
        last90Days: 'Letzte 90 Tage',
      },
      stats: {
        title: 'Tag-Statistiken',
        viewAll: 'Alle anzeigen',
        noData: 'Keine Tag-Daten verfügbar',
        timeDistribution: 'Tag-Codierungszeit-Verteilung',
        totalDuration: 'Gesamtdauer',
        recordCount: 'Anzahl Datensätze',
        timeRange: 'Zeitbereich',
        days: 'Tage',
        dailyAverage: 'Täglicher Durchschnitt',
        timeTrend: 'Zeittrend',
        noChartData: 'Keine Diagrammdaten verfügbar',
        statisticsTitle: (tagName: string) => `${tagName} Statistiken`,
      },
    },
    pluginGuide: {
      title: 'Mit CodeTime beginnen',
      description: 'Installieren Sie das CodeTime-Plugin, um Ihre Programmierzeit automatisch zu verfolgen',
      token: {
        title: 'Ihr Token',
        description: 'Kopieren Sie diesen Token und fügen Sie ihn in die Plugin-Einstellungen ein',
      },
      plugins: {
        title: 'Plugins herunterladen',
      },
      vscode: {
        title: 'VSCode Familie',
        description: 'Kompatibel mit VSCode, Cursor und Windsurf',
      },
      jetbrains: {
        title: 'JetBrains Familie',
        description: 'Kompatibel mit allen JetBrains IDEs',
      },
      downloadPlugin: 'Plugin herunterladen',
      setup: {
        title: 'Einrichtungsanweisungen',
        step1: 'Laden Sie das Plugin für Ihren Editor herunter und installieren Sie es',
        step2: 'Öffnen Sie die Plugin-Einstellungen in Ihrem Editor',
        step3: 'Kopieren Sie Ihren Token oben und fügen Sie ihn ein',
        step4: 'Beginnen Sie zu programmieren und die Daten erscheinen in 2-3 Minuten',
      },
    },
  },
  button: {
    copy: 'Kopieren',
    copied: 'Kopiert',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
  },
  plot: {
    label: {
      project: 'Projekt',
      timeHour: 'Zeit (Stunden)',
      language: 'Sprache',
      date: 'Datum',
      duration: 'Dauer',
      durationHours: 'Dauer (Stunden)',
      other: 'Andere',
      unknown: 'Unbekannt',
      currentTime: 'Aktuelle Zeit',
    },
  },
}
