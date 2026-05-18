import type { Translation } from './type'
import { defineComponent } from 'vue'
import NuxtLink from './NuxtLink'

export const it: Partial<Translation> = {
  annualReport: {
    shareMyReport: 'Condividi il mio report',
    reviewAnnualReport: 'Controlla il report annuale',
    userNotFound: 'Utente non trovato.',
    noData: 'Nessun dato disponibile.',
    noDataAvailableFor: (year: number | string) => `Nessun dato disponibile per ${year}.`,
    annualCodeTimeReport: (year: number | string) => `Report annuale del tempo di codice per ${year}`,
    weekendCodingTimeRatio: 'Rapporto del tempo di codifica del fine settimana',
    averageDailyCodingTime: 'Tempo medio di codifica giornaliero',
    activeDaysOfTheYear: 'Giorni attivi dell\'anno',
    longestStreakOfTheYear: 'Serie più lunga dell\'anno',
    busiestDayOfTheYear: 'Giorno più impegnativo dell\'anno',
    busiestMonthOfTheYear: 'Mese più impegnativo dell\'anno',
    theMostProductiveHourOfTheYear: 'L\'ora più produttiva dell\'anno',
    month: 'Mese',
    hour: 'Ora',
    minutes: 'Minuti',
    theMostUsedLanguageOfTheYear: 'Linguaggio più utilizzato dell\'anno',
    totalCodingTimeOfTheYear: 'Tempo totale di codifica dell\'anno',
    priodOfDay: {
      morning: 'Mattina',
      afternoon: 'Pomeriggio',
      evening: 'Sera',
      midnight: 'Mezzanotte',
    },
  },
  meta: {
    title: 'CodeTime - Registra il tuo tempo di programmazione',
    description: 'CodeTime è un\'applicazione progettata per gli sviluppatori che ti aiuta a tenere traccia, analizzare e migliorare le tue abilità di gestione del tempo di programmazione.',
    ogTitle: 'CodeTime - Registra il tuo tempo di programmazione',
    ogDescription: 'CodeTime è un\'applicazione progettata per gli sviluppatori che ti aiuta a tenere traccia, analizzare e migliorare le tue abilità di gestione del tempo di programmazione.',
    twitterTitle: 'CodeTime - Registra il tuo tempo di programmazione',
    twitterDescription: 'CodeTime è un\'applicazione progettata per gli sviluppatori che ti aiuta a tenere traccia, analizzare e migliorare le tue abilità di gestione del tempo di programmazione.',
  },
  general: {
    cancel: 'Annulla',
    confirm: 'Conferma',
  },
  landing: {
    login: 'Accedi',
    description: 'CodeTime è un\'applicazione progettata per gli sviluppatori che ti aiuta a tenere traccia e analizzare il tuo tempo di programmazione.',
    toDashboard: 'Vai alla Dashboard',
    alreadyStatistical: 'Tempo di programmazione già registrato',
    minutes: 'minuti',
    loginWithGithub: 'Accedi con GitHub',
    freeMessage: 'Attualmente completamente gratuito, non è richarta la carta di credito',
    demo: 'Demo',
    heroBadge: 'focus · privacy · aperto',
    scroll: 'scorri',

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
        title: 'Visualizzazione dei dati',
        description: 'Ci impegniamo a fornire il dashboard moderno più piacevole alla vista per aiutarti a capire meglio il tuo tempo di programmazione.',
      },
      save: {
        title: 'Salva i tuoi dati di tempo di programmazione per sempre.',
        description: 'Sappiamo la bellezza dei dati storici. Niente è più frustrante che cancellare il tuo duro lavoro. Per consentire a tutti gli utenti di poter rivedere la loro storia di crescita anche dopo molti anni, salveremo i tuoi dati per sempre, fino a quando non li distruggerai attivamente, anche se non hai mai pagato.',
      },
      export: {
        title: 'Supporta l\'esportazione dei dati.',
        description: 'Il posto più sicuro al mondo è il tuo hard disk. Pertanto, supportiamo l\'esportazione dei dati, puoi smettere in qualsiasi momento e connetterti ad altre piattaforme o servizi self-built.',
      },
      editor: {
        title: 'Supporta più editor.',
        description: 'Siamo un team molto piccolo. Ciò significa che non possiamo supportare tutti gli IDE o gli editor di codice. Tuttavia, attualmente supportiamo gli IDE della serie VSCode e JetBrain. Crediamo che coprano la maggior parte delle esigenze degli utenti. Faremo del nostro meglio per supportare più piattaforme e beneficiare più persone.',
      },
      widgets: {
        title: 'Incorpora il tuo tempo di programmazione ovunque.',
        description: 'Aggiungi badge, donut di linguaggi e schede di stato live a qualsiasi README, blog o sito personale. Ogni widget è un singolo SVG — personalizzabile, autonomo e generato al volo dai tuoi dati più recenti.',
        badge: 'Badge in stile Shields',
        donut: 'Donut dei linguaggi',
        status: 'Scheda di stato live',
        cta: 'Crea un widget',
      },
    },
    pricing: {
      heading: 'Inizia gratuitamente. Pro quando ne hai bisogno',
      title: 'Prezzi',
      description: 'Scegli il piano che fa per te.',
    },
    closing: {
      line1: 'Il momento migliore per piantare un albero era trent\'anni fa',
      line2: 'Il secondo momento migliore è adesso',
    },
  },
  plan: {
    monthly: 'Mensile',
    yearly: 'Annuale',
    save25: 'Risparmia il 25%',
    oneTime: 'Una tantum',
    mostFlexible: 'Più flessibile',
    mostPopular: 'Più popolare',
    bestValue: 'Miglior valore',
    modal: {
      title: 'Aggiorna l\'abbonamento',
      p1: 'Abbiamo bisogno del tuo supporto per mantenere il nostro entusiasmo per lo sviluppo, in modo da fornire report di dati più ricchi e una migliore esperienza utente.',
      p2: 'Puoi scegliere di aggiornare a un abbonamento Pro per sbloccare più funzionalità.',
      p3: 'Se incontri problemi durante il processo di pagamento, contattaci via email.',
    },
    status(str: string): string {
      switch (str) {
        case 'active': {
          return 'Attivo'
        }
        case 'cancelled': {
          return 'Annullato'
        }
        case 'expired': {
          return 'Scaduto'
        }
        case 'on_trial': {
          return 'In prova'
        }
        case 'paused': {
          return 'In pausa'
        }
        case 'past_due': {
          return 'Scaduto'
        }
        case 'unpaid': {
          return 'Non pagato'
        }
        default: {
          return 'Sconosciuto'
        }
      }
    },
    basic: {
      title: 'Base',
      forever: 'Per sempre',
      features: {
        title: 'Funzionalità',
        item: {
          saveHistory: 'Salva i dati storici per sempre',
          browseRecent: 'Sfoglia i dati degli ultimi 90 giorni',
          codetimeTrend: 'Report sulla tendenza del tempo di programmazione',
          codetimeLanguaeTrend: 'Report sulla tendenza del linguaggio di programmazione',
          codetimeProjectTrend: 'Report sulla tendenza del progetto',
          badge: 'Genera badge per la visualizzazione',
          export: 'Esporta dati',
          import: 'Importa dati',
          more: 'Altri report',
          agent: 'Telemetria Agent: costo, token, strumenti e ritmo',
        },
      },
      button: 'Gratis per sempre',
    },
    pro: {
      title: 'Pro',
      preMonth: '/ mese',
      preYear: '/ anno',
      features: {
        item: {
          include: 'Include tutte le funzionalità del piano Basic',
          browseAll: 'Sfoglia tutti i dati storici',
          workspace: 'Cronologia completa per area di lavoro',
          widgetCustom: 'Stile dettagliato del widget e colori personalizzati',
          widgetUnlimited: 'Nessun limite di giorni e lingue sui widget',
          rule: 'Elaborazione dati basata su regole',
          tag: 'Sistema di tag',
        },
      },
      notYet: 'significa non ancora disponibile',
      button: 'Abbonati ora',
    },
    needLogin: 'Devi effettuare l\'accesso',
  },
  demoBanner: {
    overviewPrefix: 'Dati di esempio — accedi e collega il plugin VS Code o JetBrains tramite',
    overviewSuffix: 'per vedere i tuoi.',
    agentPrefix: 'Dati di esempio — accedi e instrada un agente tramite',
    agentSuffix: 'per vedere i tuoi.',
  },
  dashboard: {
    loginRequired: 'Benvenuto nella dashboard di CodeTime! Accedi per visualizzare i tuoi dati di tempo di programmazione, o fai clic sul pulsante demo qui sotto per provare la dashboard demo.',
    projectSelector: {
      placeholder: 'Seleziona uno spazio di lavoro',
      noneText: 'Inserisci il nome dello spazio di lavoro',
    },
    pageHeader: {
      userLatestEvent(project: string) {
        return `Lavorando su ${project}`
      },
      title: {
        overview: 'Panoramica',
        badge: 'Badge',
        settings: 'Impostazioni',
        leaderboard: 'Classifica',
        workspace: 'Spazio di lavoro',
        tags: 'Tag',
      },
      description: {
        overview: 'Visualizza tutti i tuoi dati di CodeTime.',
        badge: 'Visualizza il tuo tempo di programmazione nei tuoi progetti con badge concisi, coerenti e chiari.',
        settings: 'Gestisci le tue impostazioni di CodeTime, inclusi aspetto, lingua, dati, ecc.',
        leaderboard: 'Visualizza la classifica di CodeTime di tutti gli utenti.',
        workspace: 'Visualizza i tuoi dati di CodeTime per uno spazio di lavoro specifico.',
        tags: 'Gestire tag e regole per la categorizzazione automatica dello spazio di lavoro.',
      },
    },
    overview: {
      rangeTitle: 'Intervallo date',
      activityTitle: 'Attività',
      topTitle: 'Top',
      codetimeTrendTitle: 'Tendenza del tempo di programmazione',
      codetimeLanguaeTrendTitle: 'Tendenza del linguaggio di programmazione',
      codetimeProjectTrendTitle: 'Tendenza del progetto',
      dailyCodingDistributionTitle: 'Distribuzione giornaliera del tempo di programmazione',
      dataRange: {
        title(days: number): string {
          return `Ultimi ${days} giorni`
        },
        allTime: 'Sempre',
        custom: 'Personalizzato…',
        apply: 'Applica',
        cancel: 'Annulla',
        thisMonth: 'Questo mese',
        lastMonth: 'Mese scorso',
        yearToDate: 'Anno in corso',
        pickRange: 'Scegli periodo',
      },
      statistic: {
        timeTotal: 'Tempo/Totali',
        timeToday: 'Tempo/Oggi',
        timeAverage: 'Tempo/Media',
        longestStreak: 'Streak/Più lungo',
        currentStreak: 'Streak/Corrente',
      },
      top: {
        language: 'Linguaggio',
        project: 'Progetto',
        platform: 'Piattaforma',
        workspace: 'Area di lavoro',
      },
      total: {
        time: 'Tempo Totale di Programmazione',
      },
      recent: {
        time: 'Tempo di Codifica Recente',
      },
      ranking: 'Classifica',
      hours: 'ore',
      active: {
        days: 'Giorni Attivi',
      },
      topLanguage: 'Linguaggio Principale',
      noData: {
        notice: {
          title: 'Ancora nessun dato',
          body: defineComponent({
            components: {
              NuxtLink,
            },
            setup() {
              return () => (
                <div class="text-sm">
                  <span class="text-surface-dimmed">
                    Al momento non abbiamo ancora elaborato correttamente i tuoi dati di codetime. Questa applicazione si basa sul plugin per il tuo editor di codice o ambiente di sviluppo integrato (come VSCode, IDE JetBrains). Visita la
                  </span>
                  <NuxtLink
                    to="dashboard/settings"
                    class="text-primary-on px-2"
                  >
                    [ Impostazioni ]
                  </NuxtLink>
                  <span class="text-surface-dimmed">
                    pagina e configura le impostazioni necessarie nell\'editor di codice che supporta il plugin che stai utilizzando. Dopo aver ricevuto i tuoi dati, abbiamo bisogno di circa due minuti per elaborarli. Grazie per la collaborazione.
                  </span>
                </div>
              )
            },
          }),
        },
      },
    },
    badge: {
      configure: 'Configura',
      embed: 'Incorpora',
      preview: {
        title: 'Anteprima',
      },
      style: {
        flat: 'Flat',
        flatSquare: 'Flat Square',
        forTheBadge: 'For the Badge',
        plastic: 'Plastic',
        social: 'Social',
      },
      placeholder: {
        style: 'Stile',
        language: 'Linguaggio',
        days: 'Giorni',
        project: 'Progetto',
        color: 'Colore',
        tag: 'Tag',
        scope: 'Progetto o tag',
      },
      scope: {
        tag: 'Tag',
        workspace: 'Progetto',
      },
    },
    widget: {
      tab: {
        badge: 'Badge',
        donut: 'Linguaggi',
        status: 'Stato',
        calendar: 'Calendario',
        trend: 'Tendenza',
      },
      theme: {
        label: 'Tema',
        light: 'Chiaro',
        dark: 'Scuro',
      },
      donut: {
        title: 'Linguaggi principali',
        days: 'Giorni',
        limit: 'Linguaggi',
      },
      status: {
        title: 'Sto programmando',
        primary: 'Area principale',
        secondary: 'Area secondaria',
        style: 'Stile',
        color: 'Colore d\'accento',
        colorDefault: 'Predefinito',
        background: 'Sfondo',
        fields: {
          project: 'Progetto',
          language: 'Linguaggio',
          editor: 'Editor',
          none: 'Nessuno',
        },
        styles: {
          minimal: 'Minimale',
          detailed: 'Dettagliato',
        },
      },
      limit: {
        upgrade: 'Passa a Pro',
        donutFree: 'Piano free: fino a 30 giorni e 5 linguaggi. Pro rimuove il limite.',
        donutExceeds: 'Il piano free limita a 30 giorni e 5 linguaggi — i valori verranno ridotti.',
        statusFree: 'Piano free: scegli nome progetto O linguaggio. Pro mostra entrambi.',
        statusFreeStyle: 'Piano free: solo stile minimale con colori predefiniti. Pro sblocca lo stile dettagliato e colori d\'accento / sfondo personalizzati.',
      },
    },
    settings: {
      token: {
        title: 'Token',
        tip: 'Il tuo token viene utilizzato per l\'accesso all\'API CodeTime. Tienilo privato.',
        refresh: 'Aggiorna',
        refreshTip: 'Se sospetti che il tuo token sia stato divulgato, puoi rigenerare un nuovo token qui.',
        refreshToken: 'Aggiorna Token',
        confirmRefresh: 'Sei sicuro di voler aggiornare il token? Questo renderà non valido il token che hai applicato al plugin dell\'editor. Devi inserire un nuovo token.',
        getPlugin: defineComponent({
          components: {
            NuxtLink,
          },
          setup() {
            return () => (
              <div class="text-surface-dimmed">
                <span>
                  Per far funzionare CodeTime correttamente, è necessario installare il nostro plugin e configurare il token nel tuo ambiente di sviluppo. Attualmente supportiamo
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
                  e
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
        title: 'Lingua',
        tip: 'Scegli la lingua per la tua interfaccia utente Web CodeTime.',
      },
      export: {
        title: 'Esporta',
        button: 'Esporta con un clic',
        buttonExporting: 'Esportazione in corso...',
        buttonSucceed: 'Esportazione riuscita',
        buttonFailed: 'Esportazione fallita',
        download: 'Scarica',
        description: 'Supportiamo l\'esportazione dei dati del sito Web per garantire il backup sicuro, la migrazione conveniente, l\'analisi approfondita e la conformità, garantendo al contempo il controllo e la trasparenza completi sui dati.',
        tip: 'Esporta i tuoi dati in un file CSV.',
      },
      theme: {
        title: 'Tema',
        tip: 'Scegli il tema per la tua interfaccia utente Web CodeTime.',
        dark: 'Scuro',
        light: 'Chiaro',
        system: 'Sistema',
      },
      dangerZone: {
        title: 'Zona pericolosa',
        description: 'Queste impostazioni influenzeranno permanentemente i tuoi dati e non potranno essere annullate. Procedere con cautela.',
        button: {
          removeAllData: 'Rimuovi tutti i dati',
          removeAllDataModal: {
            p1: 'Sei sicuro di voler eliminare tutti i tuoi dati? Questa operazione non può essere annullata.',
            p2: 'I tuoi dati sono molto importanti, puoi prima esportare i dati e quindi cancellarli.',
            p3: 'Se vuoi eliminare tutti i dati, inserisci DELETE di seguito e fai clic su Conferma.',
          },
        },
        subTitle: {
          removeData: 'Rimuovi tutti i dati',
          privacy: 'Privacy',
        },
      },
      account: {
        title: 'Account',
        description: 'Impostazioni dell\'account.',
        expiresIn: 'Scade in',
        manageSubscription: 'Gestisci abbonamento',
        subscribe: 'Abbonati',
      },
      other: {
        title: 'Altro',
        description: 'Altre impostazioni.',
        logout: 'Esci',
      },
    },
    workspace: {
      project: 'Progetto',
      topBranch: 'Branch principale',
      range: 'Intervallo date',
      noData: 'Nessun dato per questo spazio di lavoro.',
      select: {
        placeholder: 'Seleziona uno spazio di lavoro',
        none: 'Inserisci il nome dello spazio di lavoro',
        prompt: 'Seleziona un progetto per iniziare.',
      },
      flameGraph: {
        title: 'Grafico a fiamma',
        noData: 'Nessun dato',
      },
      fileList: {
        title: 'Elenco dei file',
      },
    },
    leaderboard: {
      title(days: number): string {
        return `Classifica del tempo di programmazione degli ultimi ${days} giorni`
      },
      delta(string: string): string {
        return `${string} dietro`
      },
    },
    tags: {
      title: 'Tag',
      description: 'Gestire tag e regole per la categorizzazione automatica dello spazio di lavoro.',
      tagList: {
        title: 'Elenco dei tag',
        noTags: 'Nessun tag trovato. Crea il tuo primo tag per iniziare.',
        createTag: 'Crea tag',
        freeUserLimit: 'Gli utenti gratuiti possono creare fino a',
        upgradeForMore: 'Aggiorna per creare più tag',
        editTag: 'Modifica tag',
        deleteTag: 'Elimina tag',
      },
      tagForm: {
        name: 'Nome',
        namePlaceholder: 'Inserisci il nome del tag',
        color: 'Colore',
        colorPlaceholder: 'Scegli un colore',
        emoji: 'Emoji',
        emojiPlaceholder: 'Inserisci emoji (opzionale)',
        create: 'Crea tag',
        edit: 'Modifica tag',
        cancel: 'Annulla',
        save: 'Salva',
      },
      tagRules: {
        title: 'Regole del tag',
        noRules: 'Nessuna regola trovata per questo tag.',
        createRule: 'Crea regola',
        rule: 'Regola',
        enabled: 'Abilitato',
        disabled: 'Disabilitato',
        delete: 'Elimina',
        edit: 'Modifica',
        selectTagPrompt: 'Seleziona un tag per gestire le sue regole',
        freeUserLimit: 'Gli utenti gratuiti possono creare fino a',
        upgradeForMore: 'Aggiorna per creare più regole',
      },
      ruleForm: {
        name: 'Nome della regola',
        namePlaceholder: 'Inserisci il nome della regola',
        enabled: 'Abilitato',
        conditions: 'Condizioni',
        addCondition: 'Aggiungi condizione',
        field: 'Campo',
        conditionType: 'Tipo di condizione',
        value: 'Valore',
        valuePlaceholder: 'Inserisci il valore',
        negate: 'Nega',
        create: 'Crea regola',
        edit: 'Modifica regola',
        cancel: 'Annulla',
        save: 'Salva',
      },
      conditionTypes: {
        CONTAINS: 'Contiene',
        EQUALS: 'Uguale',
        STARTS_WITH: 'Inizia con',
        ENDS_WITH: 'Finisce con',
        REGEX: 'Espressione regolare',
        NOT_CONTAINS: 'Non contiene',
        NOT_EQUALS: 'Non uguale',
        NOT_STARTS_WITH: 'Non inizia con',
        NOT_ENDS_WITH: 'Non finisce con',
        NOT_REGEX: 'Non corrisponde a regex',
      },
      fields: {
        workspaceName: 'Nome dello spazio di lavoro',
        language: 'Linguaggio',
        gitOrigin: 'Origine Git',
        gitBranch: 'Ramo Git',
        platform: 'Piattaforma',
        editor: 'Editor',
        absoluteFile: 'Percorso assoluto del file',
        relativeFile: 'Percorso relativo del file',
      },
      actions: {
        delete: 'Elimina',
        edit: 'Modifica',
        manageRules: 'Gestisci regole',
        enable: 'Abilita',
        disable: 'Disabilita',
      },
      deleteConfirm: {
        deleteTag: 'Elimina tag',
        deleteTagMessage: 'Sei sicuro/a di voler eliminare questo tag? Questa azione non può essere annullata.',
        deleteRule: 'Elimina regola',
        deleteRuleMessage: 'Sei sicuro/a di voler eliminare questa regola? Questa azione non può essere annullata.',
        cancel: 'Annulla',
        delete: 'Elimina',
      },
      common: {
        not: 'non',
        optional: '(opzionale)',
        ruleRelationship: 'Le regole sono collegate da logica OR, le condizioni da logica AND',
        freeUserRuleLimit: 'Gli utenti gratuiti possono creare solo 1 regola per tag',
        upgradeForMoreRules: 'Aggiorna per creare più regole',
        ruleIdFormat: (id: string) => `Regola #${id.slice(-4)}`,
        editingMode: 'Modalità di modifica - Ricorda di salvare le modifiche',
      },
      timeRange: {
        last7Days: 'Ultimi 7 giorni',
        last30Days: 'Ultimi 30 giorni',
        last90Days: 'Ultimi 90 giorni',
      },
      stats: {
        title: 'Statistiche tag',
        viewAll: 'Visualizza tutto',
        noData: 'Nessun dato tag disponibile',
        timeDistribution: 'Distribuzione del Tempo di Codifica per Tag',
        totalDuration: 'Durata totale',
        recordCount: 'Numero di record',
        timeRange: 'Intervallo di tempo',
        days: 'giorni',
        dailyAverage: 'Media giornaliera',
        timeTrend: 'Tendenza temporale',
        noChartData: 'Nessun dato grafico disponibile',
        statisticsTitle: (tagName: string) => `Statistiche di ${tagName}`,
      },
    },
    profile: {
      identity: {
        title: 'Identità',
      },
      activity: {
        title: 'Attività',
      },
      languages: {
        title: 'Language Highlights',
        noData: 'Nessun dato linguistico disponibile.',
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
      title: 'Inizia con CodeTime',
      description: 'Installa il plugin CodeTime per tracciare automaticamente il tuo tempo di programmazione',
      token: {
        title: 'Il Tuo Token',
        description: 'Copia questo token e incollalo nelle impostazioni del plugin',
      },
      plugins: {
        title: 'Scarica Plugin',
      },
      vscode: {
        title: 'Famiglia VSCode',
        description: 'Compatibile con VSCode, Cursor e Windsurf',
      },
      jetbrains: {
        title: 'Famiglia JetBrains',
        description: 'Compatibile con tutti gli IDE JetBrains',
      },
      downloadPlugin: 'Scarica Plugin',
      setup: {
        title: 'Istruzioni di Configurazione',
        step1: 'Scarica e installa il plugin per il tuo editor',
        step2: 'Apri le impostazioni del plugin nel tuo editor',
        step3: 'Copia e incolla il tuo token qui sopra',
        step4: 'Inizia a programmare e i dati appariranno in 2-3 minuti',
      },
    },
    agentGuide: {
      title: 'Traccia le tue sessioni AI Agent',
      description: 'Installa il CLI codetime per catturare automaticamente ogni sessione Claude Code.',
      token: {
        title: 'Il Tuo Token',
        description: 'Copia questo token. Lo inserirai nel CLI nell\'ultimo passaggio.',
      },
      install: {
        title: 'Installa il CLI',
        description: 'Installa codetime globalmente con npm (o il tuo gestore di pacchetti Node preferito).',
      },
      configure: {
        title: 'Configura Token',
        description: 'Esegui questo comando. Il CLI inizierà a caricare dalla tua prossima sessione agent.',
        hint: 'Sostituisci <token> con il valore copiato sopra.',
      },
      hook: {
        title: 'Aggancia gli Agent',
        description: 'Esegui codetime install — il CLI rileva automaticamente ogni AI agent supportato sulla tua macchina e configura gli hook per te.',
        supports: 'Attualmente supportati:',
        latency: 'Usa qualsiasi agent normalmente. Le sessioni appaiono qui entro ~2 minuti dalla fine.',
      },
    },
    agent: {
      freeLimit: 'Piano gratuito: mostrando le sessioni degli ultimi 30 giorni. Passa a Pro per la cronologia completa.',
      upgrade: 'Aggiorna',
      sections: {
        overview: 'Panoramica',
        costTimeline: 'Costo · Cronologia',
        rhythm: 'Ritmo · Quando',
        projects: 'Progetti · Costi',
        models: 'Modelli · Costi',
        tools: 'Strumenti',
        sessions: 'Sessioni · Elenco',
      },
      labels: {
        kpi: {
          events: 'eventi',
          sessions: 'sessioni',
          tokens: 'token',
          cost: 'costo',
          time: 'tempo',
          linesNet: 'righe nette',
          tools: 'strumento',
          cmd: 'cmd',
          projects: 'progetti',
          inSuffix: 'in',
          outSuffix: 'out',
          estimated: 'stimato',
          agentActive: 'agent attivo',
        },
        timeline: {
          cost: 'costo',
          modelCalls: 'chiamate al modello',
          cacheHit: 'cache colpita',
          tokensFoot: (buckets: number, tokens: string) => `${buckets} blocchi · ${tokens} token`,
          empty: 'nessun uso di modelli in questa finestra',
        },
        rhythm: {
          peakHour: 'Ora di punta',
          peakDay: 'Giorno di punta',
          active: 'Attivo',
          avgSlot: 'Media/slot',
          ofWindow: 'su 24h × 7g',
          perSlot: 'chiamate per slot attivo',
          calls: 'chiamate',
          scaleLabel: 'costo',
          scaleLow: 'basso → alto',
          metaPrefix: 'chiamate · ora × giorno · ora locale',
        },
        table: {
          project: 'Progetto',
          model: 'Modello',
          tool: 'Strumento',
          cost: 'Costo',
          share: 'Quota',
          tokens: 'Token',
          cache: 'Cache',
          calls: 'Chiamate',
          time: 'Tempo',
          inputPct: 'In',
          outputPct: 'Out',
          fail: 'Errore%',
          total: 'Totale',
          noProject: '— nessun dato di progetto nella finestra —',
          noModel: '— nessun uso di modelli nella finestra —',
          noTool: '— nessuna chiamata a strumenti nella finestra —',
        },
        sessions: {
          source: 'Origine',
          project: 'Progetto',
          started: 'Inizio',
          duration: 'Durata',
          turns: 'Turni',
          tools: 'Strumenti',
          inTok: 'tok in',
          outTok: 'tok out',
          lines: 'Righe +/-',
          loadMore: 'Carica altro',
          loading: 'Caricamento…',
          loaded: (n: number) => `${n} caricate`,
          empty: 'Nessuna sessione',
        },
        meta: {
          projects: (n: number) => `${n} progetti`,
          calls: (n: string) => `${n} chiamate`,
          estimatedBuckets: (bucket: string, range: string) => `stimato · ${bucket} · ${range}`,
          rhythmMeta: (range: string) => `ora × giorno · ora locale · ${range}`,
          bucketHour: 'blocchi 1h',
          bucketDay: 'blocchi 1g',
          bucketWeek: 'blocchi 1sett',
          allTime: 'tutto il tempo',
        },
      },
    },
  },
  button: {
    copy: 'Copia',
    copied: 'Copiato',
    cancel: 'Annulla',
    confirm: 'Conferma',
  },
  plot: {
    label: {
      project: 'Progetto',
      timeHour: 'Tempo (ore)',
      language: 'Linguaggio',
      date: 'Data',
      duration: 'Durata',
      durationHours: 'Durata (ore)',
      other: 'Altro',
      unknown: 'Sconosciuto',
      currentTime: 'Ora Attuale',
    },
  },
}
