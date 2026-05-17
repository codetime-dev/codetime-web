import type { Translation } from './type'
import { defineComponent } from 'vue'
import NuxtLink from './NuxtLink'

export const fr: Partial<Translation> = {
  annualReport: {
    shareMyReport: 'Partager mon rapport',
    reviewAnnualReport: 'Vérifier le rapport annuel',
    userNotFound: 'Utilisateur non trouvé.',
    noData: 'Aucune donnée disponible.',
    noDataAvailableFor: (year: number | string) => `Aucune donnée disponible pour ${year}.`,
    annualCodeTimeReport: (year: number | string) => `Rapport annuel du temps de code pour ${year}`,
    weekendCodingTimeRatio: 'Ratio du temps de codage le week-end',
    averageDailyCodingTime: 'Temps moyen de codage quotidien',
    activeDaysOfTheYear: 'Jours actifs de l\'année',
    longestStreakOfTheYear: 'Plus longue série de l\'année',
    busiestDayOfTheYear: 'Jour le plus chargé de l\'année',
    busiestMonthOfTheYear: 'Mois le plus chargé de l\'année',
    theMostProductiveHourOfTheYear: 'L\'heure la plus productive de l\'année',
    month: 'Mois',
    hour: 'Heure',
    minutes: 'Minutes',
    theMostUsedLanguageOfTheYear: 'Langage le plus utilisé de l\'année',
    totalCodingTimeOfTheYear: 'Temps total de codage de l\'année',
    priodOfDay: {
      morning: 'Matin',
      afternoon: 'Après-midi',
      evening: 'Soir',
      midnight: 'Minuit',
    },
  },
  meta: {
    title: 'CodeTime - Suivez votre temps de codage',
    description: 'CodeTime est une application conçue pour les développeurs pour vous aider à suivre, analyser et améliorer vos compétences en matière de gestion du temps de codage.',
    ogTitle: 'CodeTime - Suivez votre temps de codage',
    ogDescription: 'CodeTime est une application conçue pour les développeurs pour vous aider à suivre, analyser et améliorer vos compétences en matière de gestion du temps de codage.',
    twitterTitle: 'CodeTime - Suivez votre temps de codage',
    twitterDescription: 'CodeTime est une application conçue pour les développeurs pour vous aider à suivre, analyser et améliorer vos compétences en matière de gestion du temps de codage.',
  },
  general: {
    cancel: 'Annuler',
    confirm: 'Confirmer',
  },
  landing: {
    login: 'Se connecter',
    description: 'CodeTime est une application conçue pour les développeurs pour vous aider à suivre et analyser votre temps de codage.',
    toDashboard: 'Aller au tableau de bord',
    alreadyStatistical: 'Temps de codage déjà suivi',
    minutes: 'minutes',
    loginWithGithub: 'Se connecter avec GitHub',
    freeMessage: 'Actuellement complètement gratuit, aucune carte de crédit requise',
    demo: 'Démo',
    heroBadge: 'focus · privé · ouvert',
    scroll: 'défiler',

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
        title: 'Visualisation des données',
        description: 'Nous nous engageons à fournir le tableau de bord moderne le plus esthétique pour vous aider à mieux comprendre votre temps de codage.',
      },
      save: {
        title: 'Sauvegardez vos données de temps de codage pour toujours.',
        description: 'Nous connaissons la beauté des données historiques. Rien n\'est plus frustrant que d\'avoir votre propre dur labeur effacé. Afin que tous les utilisateurs puissent revoir leur historique de croissance même après de nombreuses années, nous sauvegarderons vos données pour toujours, jusqu\'à ce que vous les détruisez activement, même si vous n\'avez jamais payé.',
      },
      export: {
        title: 'Prise en charge de l\'exportation de données.',
        description: 'L\'endroit le plus sûr au monde est votre propre disque dur. Par conséquent, nous prenons en charge l\'exportation de données, vous pouvez quitter à tout moment, et vous connecter à d\'autres plateformes ou services auto-construits.',
      },
      editor: {
        title: 'Prise en charge de plusieurs éditeurs.',
        description: 'Nous sommes une très petite équipe. Cela signifie que nous ne pouvons pas prendre en charge tous les IDE ou éditeurs de code. Cependant, nous prenons actuellement en charge VSCode et JetBrain séries IDE. Nous pensons qu\'ils couvrent la plupart des besoins des utilisateurs. Nous ferons de notre mieux pour prendre en charge plus de plates-formes et profiter à plus de gens.',
      },
      widgets: {
        title: 'Intégrez votre temps de code partout.',
        description: 'Ajoutez des badges, des anneaux de langages et des cartes de statut en direct à n\'importe quel README, blog ou site personnel. Chaque widget est un SVG unique — thématisable, autonome et généré à la volée à partir de vos données les plus récentes.',
        badge: 'Badge style Shields',
        donut: 'Anneau de langages',
        status: 'Carte de statut en direct',
        cta: 'Créer un widget',
      },
    },
    pricing: {
      heading: 'Gratuit pour commencer. Pro quand vous en avez besoin',
      title: 'Tarification',
      description: 'Choisissez le plan qui vous convient.',
    },
    closing: {
      line1: 'Le meilleur moment pour planter un arbre était il y a trente ans',
      line2: 'Le deuxième meilleur moment, c\'est maintenant',
    },
  },
  plan: {
    monthly: 'Mensuel',
    yearly: 'Annuel',
    save25: 'Économisez 25%',
    oneTime: 'One-time',
    mostFlexible: 'Le plus flexible',
    mostPopular: 'Le plus populaire',
    bestValue: 'Meilleur rapport qualité-prix',
    modal: {
      title: 'Mise à niveau de l\'abonnement',
      p1: 'Nous avons besoin de votre soutien pour maintenir notre enthousiasme pour le développement, afin de fournir des rapports de données plus riches et une meilleure expérience utilisateur.',
      p2: 'Vous pouvez choisir de passer à un abonnement Pro pour déverrouiller plus de fonctionnalités.',
      p3: 'Si vous rencontrez des problèmes lors du processus de paiement, veuillez nous contacter par e-mail.',
    },
    status(str: string): string {
      switch (str) {
        case 'active': {
          return 'Actif'
        }
        case 'cancelled': {
          return 'Annulé'
        }
        case 'expired': {
          return 'Expiré'
        }
        case 'on_trial': {
          return 'En cours'
        }
        case 'paused': {
          return 'En pause'
        }
        case 'past_due': {
          return 'En souffrance'
        }
        case 'unpaid': {
          return 'Non payé'
        }
        default: {
          return 'Inconnu'
        }
      }
    },
    basic: {
      title: 'Base',
      forever: 'Pour toujours',
      features: {
        title: 'Fonctionnalités',
        item: {
          saveHistory: 'Sauvegarder les données historiques pour toujours',
          browseRecent: 'Parcourir les données des 90 derniers jours',
          codetimeTrend: 'Rapport de tendance du temps de codage',
          codetimeLanguaeTrend: 'Rapport de tendance de langage de programmation',
          codetimeProjectTrend: 'Rapport de tendance de projet',
          badge: 'Générer des badges pour l\'affichage',
          export: 'Export de données',
          import: 'Importation de données',
          more: 'Plus de rapports',
        },
      },
      button: 'Gratuit pour toujours',
    },
    pro: {
      title: 'Pro',
      preMonth: '/ mois',
      preYear: '/ an',
      features: {
        item: {
          include: 'Inclut toutes les fonctionnalités du plan de base',
          browseAll: 'Parcourir toutes les données historiques',
          workspace: 'Historique complet par espace de travail',
          widgetCustom: 'Style détaillé du widget et couleurs personnalisées',
          widgetUnlimited: 'Pas de limite de jours et de langues sur les widgets',
          rule: 'Traitement des données basé sur des règles',
          tag: 'Système de balises',
        },
      },
      notYet: 'signifie pas encore disponible',
      button: 'Souscrire maintenant',
    },
    needLogin: 'Besoin de se connecter',
  },
  dashboard: {
    loginRequired: 'Bienvenue dans le tableau de bord CodeTime! Veuillez vous connecter pour afficher vos données de temps de codage, ou cliquez sur le bouton de démonstration ci-dessous pour découvrir le tableau de bord de démonstration.',
    projectSelector: {
      placeholder: 'Sélectionnez un espace de travail',
      noneText: 'Entrez le nom de l\'espace de travail',
    },
    pageHeader: {
      userLatestEvent(project: string) {
        return `Travailler sur ${project}`
      },
      title: {
        overview: 'Aperçu',
        badge: 'Badges',
        settings: 'Paramètres',
        leaderboard: 'Classement',
        workspace: 'Espace de travail',
        tags: 'Étiquettes',
      },
      description: {
        overview: 'Affichez toutes vos données CodeTime.',
        badge: 'Affichez votre temps de codage dans vos projets avec des badges concis, cohérents et clairs.',
        settings: 'Gérez vos paramètres CodeTime, y compris l\'apparence, la langue, les données, etc.',
        leaderboard: 'Afficher le classement CodeTime de tous les utilisateurs.',
        workspace: 'Affichez les données d\'un espace de travail spécifique.',
        tags: 'Gérer les étiquettes et les règles pour la catégorisation automatique de l\'espace de travail.',
      },
    },
    overview: {
      rangeTitle: 'Plage de dates',
      activityTitle: 'Activité',
      topTitle: 'Top',
      codetimeTrendTitle: 'Tendance du temps de codage',
      codetimeLanguaeTrendTitle: 'Tendance des langages de programmation',
      codetimeProjectTrendTitle: 'Tendance du projet',
      dailyCodingDistributionTitle: 'Répartition quotidienne du codage',
      dataRange: {
        title(days: number) {
          return `Les ${days} derniers jours`
        },
        allTime: 'Tout le temps',
      },
      statistic: {
        timeTotal: 'Temps/Total',
        timeToday: 'Temps/Aujourd\'hui',
        timeAverage: 'Temps/Moyenne',
        longestStreak: 'Série/La plus grande',
        currentStreak: 'Série/Actuelle',
      },
      top: {
        language: 'Langage',
        project: 'Projet',
        platform: 'Plateforme',
        workspace: 'Espace de travail',
      },
      total: {
        time: 'Temps Total de Codage',
      },
      recent: {
        time: 'Temps de Codage Récent',
      },
      ranking: 'Classement',
      hours: 'heures',
      active: {
        days: 'Jours Actifs',
      },
      topLanguage: 'Langage Principal',
      noData: {
        notice: {
          title: 'Aucune donnée pour le moment',
          body: defineComponent({
            components: {
              NuxtLink,
            },
            setup() {
              return () => (
                <div class="text-sm">
                  <span class="text-surface-dimmed">
                    Actuellement, nous n\'avons pas encore traité avec succès vos données de temps de codage. Cette application dépend du plugin pour votre éditeur de code ou environnement de développement intégré (comme VSCode, JetBrains IDE). Veuillez visiter le
                  </span>
                  <NuxtLink
                    to="dashboard/settings"
                    class="text-primary-on px-2"
                  >
                    [ Paramètres ]
                  </NuxtLink>
                  <span class="text-surface-dimmed">
                    page et configurez les paramètres nécessaires dans l\'éditeur de code qui prend en charge le plugin que vous utilisez. Après avoir reçu vos données, nous avons besoin d\'environ deux minutes pour les traiter. Merci pour votre coopération.
                  </span>
                </div>
              )
            },
          }),
        },
      },
    },
    badge: {
      configure: 'Configurer',
      embed: 'Intégrer',
      preview: {
        title: 'Aperçu',
      },
      style: {
        flat: 'Plat',
        flatSquare: 'Plat Carré',
        forTheBadge: 'Pour le Badge',
        plastic: 'Plastique',
        social: 'Social',
      },
      placeholder: {
        style: 'Style',
        language: 'Langage',
        days: 'Jours',
        project: 'Projet',
        color: 'Couleur',
        tag: 'Étiquette',
        scope: 'Projet ou étiquette',
      },
      scope: {
        tag: 'Étiquette',
        workspace: 'Projet',
      },
    },
    widget: {
      tab: {
        badge: 'Badge',
        donut: 'Langages',
        status: 'État',
        calendar: 'Calendrier',
        trend: 'Tendance',
      },
      theme: {
        label: 'Thème',
        light: 'Clair',
        dark: 'Sombre',
      },
      donut: {
        title: 'Langages principaux',
        days: 'Jours',
        limit: 'Langages',
      },
      status: {
        title: 'En train de coder',
        primary: 'Zone principale',
        secondary: 'Zone secondaire',
        style: 'Style',
        color: 'Couleur d\'accent',
        colorDefault: 'Par défaut',
        background: 'Arrière-plan',
        fields: {
          project: 'Projet',
          language: 'Langage',
          editor: 'Éditeur',
          none: 'Aucun',
        },
        styles: {
          minimal: 'Minimal',
          detailed: 'Détaillé',
        },
      },
      limit: {
        upgrade: 'Passer à Pro',
        donutFree: 'Plan gratuit : jusqu\'à 30 jours et 5 langages. Pro lève cette limite.',
        donutExceeds: 'Le plan gratuit plafonne à 30 jours et 5 langages — les valeurs seront ajustées.',
        statusFree: 'Plan gratuit : choisissez nom de projet OU langage. Pro affiche les deux.',
        statusFreeStyle: 'Plan gratuit : style minimal et couleurs par défaut uniquement. Pro débloque le style détaillé ainsi que les couleurs d\'accent et d\'arrière-plan personnalisées.',
      },
    },
    settings: {
      token: {
        title: 'Jeton',
        tip: 'Votre jeton est utilisé pour accéder à l\'API CodeTime. Gardez-le privé.',
        refresh: 'Rafraîchir',
        refreshTip: 'Si vous soupçonnez que votre jeton a été divulgué, vous pouvez en générer un nouveau ici.',
        refreshToken: 'Actualiser le jeton',
        confirmRefresh: 'Êtes-vous sûr de vouloir actualiser le jeton? Cela invalidera le jeton que vous avez appliqué au plugin de l\'éditeur. Vous devez saisir un nouveau jeton.',
        getPlugin: defineComponent({
          components: {
            NuxtLink,
          },
          setup() {
            return () => (
              <div class="text-surface-dimmed">
                <span>
                  Pour que CodeTime fonctionne correctement, vous devez installer notre plugin et configurer le jeton dans votre environnement de développement. Actuellement, nous prenons en charge
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
                  et
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
        title: 'Langue',
        tip: 'Choisissez la langue pour votre interface utilisateur Web CodeTime.',
      },
      export: {
        title: 'Exportation',
        button: 'Exportation en un clic',
        buttonExporting: 'Exportation...',
        buttonSucceed: 'Exportation réussie',
        buttonFailed: 'Exportation échouée',
        download: 'Télécharger',
        description: 'Nous prenons en charge l\'exportation des données du site Web pour assurer une sauvegarde sécurisée, une migration pratique, une analyse approfondie et la conformité, tout en vous donnant un contrôle complet et une transparence sur vos données.',
        tip: 'Exportez vos données vers un fichier CSV.',
      },
      theme: {
        title: 'Thème',
        tip: 'Choisissez le thème de votre interface Web CodeTime.',
        dark: 'Sombre',
        light: 'Lumière',
        system: 'Système',
      },
      dangerZone: {
        title: 'Zone de danger',
        description: 'Ces paramètres affecteront définitivement vos données et ne pourront pas être annulés. Veuillez procéder avec prudence.',
        button: {
          removeAllData: 'Supprimer toutes les données',
          removeAllDataModal: {
            p1: 'Êtes-vous sûr de vouloir supprimer toutes vos données? Cette opération ne peut pas être annulée.',
            p2: 'Vos données sont très importantes, vous pouvez d\'abord exporter les données, puis supprimer les données.',
            p3: 'Si vous souhaitez supprimer toutes les données, veuillez saisir DELETE ci-dessous, puis cliquez sur Confirmer.',
          },
        },
        subTitle: {
          removeData: 'Supprimer les données',
          privacy: 'Vie privée',
        },
      },
      account: {
        title: 'Compte',
        description: 'Paramètres du compte.',
        expiresIn: 'Expire dans',
        manageSubscription: 'Gérer l\'abonnement',
        subscribe: 'Souscrire',
      },
      other: {
        title: 'Autre',
        description: 'Autres paramètres.',
        logout: 'Déconnexion',
      },
    },
    workspace: {
      project: 'Projet',
      topBranch: 'Branche principale',
      range: 'Plage de dates',
      noData: 'Aucune donnée pour cet espace de travail.',
      select: {
        placeholder: 'Sélectionnez un espace de travail',
        none: 'Entrez le nom de l\'espace de travail',
        prompt: 'Sélectionnez un projet pour commencer.',
      },
      flameGraph: {
        title: 'Graphique en flammes',
        noData: 'Pas de données',
      },
      fileList: {
        title: 'Liste de fichiers',
      },
    },
    leaderboard: {
      title(days: number) {
        return `Classement du temps de codage des ${days} derniers jours`
      },
      delta(string: string) {
        return `${string} derrière`
      },
    },
    tags: {
      title: 'Étiquettes',
      description: 'Gérer les étiquettes et les règles pour la catégorisation automatique de l\'espace de travail.',
      tagList: {
        title: 'Liste des étiquettes',
        noTags: 'Aucune étiquette trouvée. Créez votre première étiquette pour commencer.',
        createTag: 'Créer une étiquette',
        freeUserLimit: 'Les utilisateurs gratuits peuvent créer jusqu\'à',
        upgradeForMore: 'Mettre à jour pour créer plus d\'étiquettes',
        editTag: 'Modifier l\'étiquette',
        deleteTag: 'Supprimer l\'étiquette',
      },
      tagForm: {
        name: 'Nom',
        namePlaceholder: 'Entrez le nom de l\'étiquette',
        color: 'Couleur',
        colorPlaceholder: 'Choisissez une couleur',
        emoji: 'Emoji',
        emojiPlaceholder: 'Entrez emoji (optionnel)',
        create: 'Créer une étiquette',
        edit: 'Modifier l\'étiquette',
        cancel: 'Annuler',
        save: 'Enregistrer',
      },
      tagRules: {
        title: 'Règles d\'étiquettes',
        noRules: 'Aucune règle trouvée pour cette étiquette.',
        createRule: 'Créer une règle',
        rule: 'Règle',
        enabled: 'Activé',
        disabled: 'Désactivé',
        delete: 'Supprimer',
        edit: 'Modifier',
        selectTagPrompt: 'Sélectionnez une étiquette pour gérer ses règles',
        freeUserLimit: 'Les utilisateurs gratuits peuvent créer jusqu\'à',
        upgradeForMore: 'Mettre à jour pour créer plus de règles',
      },
      ruleForm: {
        name: 'Nom de la règle',
        namePlaceholder: 'Entrez le nom de la règle',
        enabled: 'Activé',
        conditions: 'Conditions',
        addCondition: 'Ajouter une condition',
        field: 'Champ',
        conditionType: 'Type de condition',
        value: 'Valeur',
        valuePlaceholder: 'Entrez la valeur',
        negate: 'Négation',
        create: 'Créer une règle',
        edit: 'Modifier la règle',
        cancel: 'Annuler',
        save: 'Enregistrer',
      },
      conditionTypes: {
        CONTAINS: 'Contient',
        EQUALS: 'Égal',
        STARTS_WITH: 'Commence par',
        ENDS_WITH: 'Se termine par',
        REGEX: 'Expression régulière',
        NOT_CONTAINS: 'Ne contient pas',
        NOT_EQUALS: 'N\'est pas égal',
        NOT_STARTS_WITH: 'Ne commence pas par',
        NOT_ENDS_WITH: 'Ne se termine pas par',
        NOT_REGEX: 'Ne correspond pas à regex',
      },
      fields: {
        workspaceName: 'Nom de l\'espace de travail',
        language: 'Langage',
        gitOrigin: 'Origine Git',
        gitBranch: 'Branche Git',
        platform: 'Plateforme',
        editor: 'Éditeur',
        absoluteFile: 'Chemin absolu du fichier',
        relativeFile: 'Chemin relatif du fichier',
      },
      actions: {
        delete: 'Supprimer',
        edit: 'Modifier',
        manageRules: 'Gérer les règles',
        enable: 'Activer',
        disable: 'Désactiver',
      },
      deleteConfirm: {
        deleteTag: 'Supprimer le tag',
        deleteTagMessage: 'Êtes-vous sûr(e) de vouloir supprimer ce tag ? Cette action ne peut pas être annulée.',
        deleteRule: 'Supprimer la règle',
        deleteRuleMessage: 'Êtes-vous sûr(e) de vouloir supprimer cette règle ? Cette action ne peut pas être annulée.',
        cancel: 'Annuler',
        delete: 'Supprimer',
      },
      common: {
        not: 'ne pas',
        optional: '(optionnel)',
        ruleRelationship: 'Les règles sont connectées par la logique OU, les conditions par la logique ET',
        freeUserRuleLimit: 'Les utilisateurs gratuits ne peuvent créer que 1 règle par tag',
        upgradeForMoreRules: 'Mettre à niveau pour créer plus de règles',
        ruleIdFormat: (id: string) => `Règle #${id.slice(-4)}`,
        editingMode: 'Mode d\'édition - N\'oubliez pas de sauvegarder les modifications',
      },
      timeRange: {
        last7Days: '7 derniers jours',
        last30Days: '30 derniers jours',
        last90Days: '90 derniers jours',
      },
      stats: {
        title: 'Statistiques des étiquettes',
        viewAll: 'Voir tout',
        noData: 'Aucune donnée d\'étiquette disponible',
        timeDistribution: 'Distribution du Temps de Codage par Tags',
        totalDuration: 'Durée totale',
        recordCount: 'Nombre d\'enregistrements',
        timeRange: 'Période',
        days: 'jours',
        dailyAverage: 'Moyenne quotidienne',
        timeTrend: 'Tendance temporelle',
        noChartData: 'Aucune donnée de graphique disponible',
        statisticsTitle: (tagName: string) => `Statistiques de ${tagName}`,
      },
    },
    profile: {
      identity: {
        title: 'Identité',
      },
      activity: {
        title: 'Activité',
      },
      languages: {
        title: 'Language Highlights',
        noData: 'Aucune donnée de langue disponible.',
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
      title: 'Commencer avec CodeTime',
      description: 'Installez le plugin CodeTime pour suivre automatiquement votre temps de programmation',
      token: {
        title: 'Votre Token',
        description: 'Copiez ce token et collez-le dans les paramètres du plugin',
      },
      plugins: {
        title: 'Télécharger les Plugins',
      },
      vscode: {
        title: 'Famille VSCode',
        description: 'Compatible avec VSCode, Cursor et Windsurf',
      },
      jetbrains: {
        title: 'Famille JetBrains',
        description: 'Compatible avec tous les IDEs JetBrains',
      },
      downloadPlugin: 'Télécharger le Plugin',
      setup: {
        title: 'Instructions de Configuration',
        step1: 'Téléchargez et installez le plugin pour votre éditeur',
        step2: 'Ouvrez les paramètres du plugin dans votre éditeur',
        step3: 'Copiez et collez votre token ci-dessus',
        step4: 'Commencez à programmer et les données apparaîtront en 2-3 minutes',
      },
    },
    agentGuide: {
      title: 'Suivez vos sessions d\'agent IA',
      description: 'Installez l\'outil CLI codetime pour capturer automatiquement chaque session Claude Code.',
      token: {
        title: 'Votre Token',
        description: 'Copiez ce token. Vous le saisirez dans le CLI à la dernière étape.',
      },
      install: {
        title: 'Installer le CLI',
        description: 'Installez codetime globalement avec npm (ou votre gestionnaire de paquets Node préféré).',
      },
      configure: {
        title: 'Configurer le token',
        description: 'Exécutez cette commande. Le CLI commencera à téléverser dès votre prochaine session.',
        hint: 'Remplacez <token> par la valeur copiée ci-dessus.',
      },
      hook: {
        title: 'Brancher les agents',
        description: 'Exécutez codetime install — le CLI détecte automatiquement chaque agent IA pris en charge sur votre machine et configure les hooks pour vous.',
        supports: 'Actuellement pris en charge :',
        latency: 'Utilisez n\'importe quel agent normalement. Les sessions apparaissent ici dans les 2 minutes suivant la fin de l\'agent.',
      },
    },
    agent: {
      freeLimit: 'Plan gratuit : affichage des sessions des 30 derniers jours. Passez à Pro pour l\'historique complet.',
      upgrade: 'Mettre à niveau',
      sections: {
        overview: 'Aperçu',
        costTimeline: 'Coût · Chronologie',
        rhythm: 'Rythme · Quand',
        projects: 'Projets · Coûts',
        models: 'Modèles · Coûts',
        tools: 'Outils',
        sessions: 'Sessions · Liste',
      },
      labels: {
        kpi: {
          events: 'événements',
          sessions: 'sessions',
          tokens: 'tokens',
          cost: 'coût',
          time: 'durée',
          linesNet: 'lignes nettes',
          tools: 'outil',
          cmd: 'cmd',
          projects: 'projets',
          inSuffix: 'ent',
          outSuffix: 'sor',
          estimated: 'estimé',
          agentActive: 'agent actif',
        },
        timeline: {
          cost: 'coût',
          modelCalls: 'appels modèle',
          cacheHit: 'cache touché',
          tokensFoot: (buckets: number, tokens: string) => `${buckets} blocs · ${tokens} tokens`,
          empty: 'aucune utilisation de modèle dans cette fenêtre',
        },
        rhythm: {
          peakHour: 'Heure de pointe',
          peakDay: 'Jour de pointe',
          active: 'Actif',
          avgSlot: 'Moy./créneau',
          ofWindow: 'sur 24h × 7j',
          perSlot: 'appels par créneau actif',
          calls: 'appels',
          scaleLabel: 'coût',
          scaleLow: 'bas → haut',
          metaPrefix: 'appels · heure × jour · heure locale',
        },
        table: {
          project: 'Projet',
          model: 'Modèle',
          tool: 'Outil',
          cost: 'Coût',
          share: 'Part',
          tokens: 'Tokens',
          cache: 'Cache',
          calls: 'Appels',
          time: 'Durée',
          inputPct: 'Ent',
          outputPct: 'Sor',
          fail: 'Échec%',
          total: 'Total',
          noProject: '— aucune donnée de projet dans la fenêtre —',
          noModel: '— aucune utilisation de modèle dans la fenêtre —',
          noTool: '— aucun appel d\'outil dans la fenêtre —',
        },
        sessions: {
          source: 'Source',
          project: 'Projet',
          started: 'Début',
          duration: 'Durée',
          turns: 'Tours',
          tools: 'Outils',
          inTok: 'tok ent',
          outTok: 'tok sor',
          lines: 'Lignes +/-',
          loadMore: 'Charger plus',
          loading: 'Chargement…',
          loaded: (n: number) => `${n} chargées`,
          empty: 'Aucune session',
        },
        meta: {
          projects: (n: number) => `${n} projets`,
          calls: (n: string) => `${n} appels`,
          estimatedBuckets: (bucket: string, range: string) => `estimé · ${bucket} · ${range}`,
          rhythmMeta: (range: string) => `heure × jour · heure locale · ${range}`,
          bucketHour: 'blocs 1h',
          bucketDay: 'blocs 1j',
          bucketWeek: 'blocs 1sem',
          allTime: 'tout le temps',
        },
      },
    },
  },
  button: {
    copy: 'Copier',
    copied: 'Copié',
    cancel: 'Annuler',
    confirm: 'Confirmer',
  },
  plot: {
    label: {
      project: 'Projet',
      timeHour: 'Temps (heures)',
      language: 'Langage',
      date: 'Date',
      duration: 'Durée',
      durationHours: 'Durée (heures)',
      other: 'Autre',
      unknown: 'Inconnu',
      currentTime: 'Heure Actuelle',
    },
  },
}
