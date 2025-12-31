import type { Translation } from './type'
import { defineComponent } from 'vue'
import NuxtLink from './NuxtLink'

export const ms: Partial<Translation> = {
  annualReport: {
    shareMyReport: 'Kongsi Laporan Saya',
    reviewAnnualReport: 'Semak Laporan Tahunan',
    userNotFound: 'Pengguna tidak dijumpai.',
    noData: 'Tiada data tersedia.',
    noDataAvailableFor: (year: number | string) => `Tiada data tersedia untuk ${year}.`,
    annualCodeTimeReport: (year: number | string) => `Laporan Masa Kod Tahunan untuk ${year}`,
    weekendCodingTimeRatio: 'Nisbah Masa Pengekodan Hujung Minggu',
    averageDailyCodingTime: 'Purata Masa Pengekodan Harian',
    activeDaysOfTheYear: 'Hari aktif sepanjang tahun',
    longestStreakOfTheYear: 'Rentetan terpanjang tahun ini',
    busiestDayOfTheYear: 'Hari Paling Sibuk dalam Setahun',
    busiestMonthOfTheYear: 'Bulan Paling Sibuk dalam Setahun',
    theMostProductiveHourOfTheYear: 'Jam Paling Produktif dalam Setahun',
    month: 'Bulan',
    hour: 'Jam',
    minutes: 'Minit',
    theMostUsedLanguageOfTheYear: 'Bahasa Paling Banyak Digunakan dalam Setahun',
    totalCodingTimeOfTheYear: 'Jumlah Masa Pengekodan dalam Setahun',
    priodOfDay: {
      morning: 'Pagi',
      afternoon: 'Petang',
      evening: 'Malam',
      midnight: 'Tengah malam',
    },
  },
  meta: {
    title: 'CodeTime - Lacak masa kod anda',
    description: 'CodeTime adalah aplikasi yang direka untuk pembangun bagi membantu anda menjejaki, menganalisis, dan meningkatkan kemahiran pengurusan masa kod anda.',
    ogTitle: 'CodeTime - Lacak masa kod anda',
    ogDescription: 'CodeTime adalah aplikasi yang direka untuk pembangun bagi membantu anda menjejaki, menganalisis, dan meningkatkan kemahiran pengurusan masa kod anda.',
    twitterTitle: 'CodeTime - Lacak masa kod anda',
    twitterDescription: 'CodeTime adalah aplikasi yang direka untuk pembangun bagi membantu anda menjejaki, menganalisis, dan meningkatkan kemahiran pengurusan masa kod anda.',
  },
  general: {
    cancel: 'Batal',
    confirm: 'Sahkan',
  },
  landing: {
    login: 'Log masuk',
    description: 'CodeTime adalah aplikasi yang direka untuk pembangun bagi membantu anda menjejaki dan menganalisis masa kod anda.',
    toDashboard: 'Pergi ke Papan Pemuka',
    alreadyStatistical: 'Masa kod sudah dijejaki',
    minutes: 'minit',
    loginWithGithub: 'Log masuk dengan GitHub',
    freeMessage: 'Sekarang sepenuhnya percuma, tiada kad kredit diperlukan',
    demo: 'Demo',
    features: {
      visualization: {
        title: 'Visualisasi data',
        description: 'Kami berkomitmen untuk menyediakan papan pemuka moden yang paling memuaskan secara visual untuk membantu anda memahami masa kod anda dengan lebih baik.',
      },
      save: {
        title: 'Simpan data masa kod anda selamanya.',
        description: 'Kami tahu keindahan data sejarah. Tiada yang lebih frustrasi daripada melihat hasil kerja keras anda dipadamkan. Untuk membolehkan semua pengguna menilai sejarah pertumbuhan mereka walaupun selepas beberapa tahun, kami akan menyimpan data anda selamanya, sehingga anda menghapuskan mereka secara aktif, walaupun anda tidak pernah membayar.',
      },
      export: {
        title: 'Sokong eksport data.',
        description: 'Tempat yang paling selamat di dunia adalah cakera keras anda sendiri. Oleh itu, kami menyokong eksport data, anda boleh berhenti pada bila-bila masa, dan menyambung ke platform lain atau perkhidmatan yang dibina sendiri.',
      },
      editor: {
        title: 'Sokong pelbagai editor.',
        description: 'Kami adalah pasukan yang sangat kecil. Ini bermakna kami tidak dapat menyokong semua IDE atau editor kod. Walau bagaimanapun, kami kini menyokong VSCode dan IDE siri JetBrain. Kami percaya bahawa mereka merangkumi keperluan pengguna kebanyakan. Kami akan berusaha sebaik mungkin untuk menyokong lebih banyak platform dan manfaatkan lebih banyak orang.',
      },
    },
    pricing: {
      title: 'Harga',
      description: 'Pilih rancangan yang sesuai dengan anda.',
    },
  },
  plan: {
    monthly: 'Bulanan',
    yearly: 'Tahunan',
    save25: 'Jimat 25%',
    oneTime: 'Sekali',
    mostFlexible: 'Paling Fleksibel',
    mostPopular: 'Paling Popular',
    bestValue: 'Nilai Terbaik',
    modal: {
      title: 'Naik Taraf Langganan',
      p1: 'Kami memerlukan sokongan anda untuk mengekalkan semangat pembangunan kami, untuk menyediakan laporan data yang lebih kaya dan pengalaman pengguna yang lebih baik.',
      p2: 'Anda boleh memilih untuk menaik taraf kepada langganan Pro untuk membuka lebih banyak ciri.',
      p3: 'Jika anda menghadapi sebarang masalah semasa proses pembayaran, sila hubungi kami melalui e-mel.',
    },
    status(str: string) {
      switch (str) {
        case 'active': {
          return 'Aktif'
        }
        case 'cancelled': {
          return 'Dibatalkan'
        }
        case 'expired': {
          return 'Luput'
        }
        case 'on_trial': {
          return 'Ujian'
        }
        case 'paused': {
          return 'Dijeda'
        }
        case 'past_due': {
          return 'Lewat'
        }
        case 'unpaid': {
          return 'Belum Dibayar'
        }
        default: {
          return str
        }
      }
    },
    basic: {
      title: 'Asas',
      forever: 'Selamanya',
      features: {
        title: 'Ciri-ciri',
        item: {
          saveHistory: 'Simpan data sejarah selamanya',
          browseRecent: 'Lihat data untuk 90 hari terakhir',
          codetimeTrend: 'Laporan trend masa kod',
          codetimeLanguaeTrend: 'Laporan trend bahasa pengaturcaraan',
          codetimeProjectTrend: 'Laporan trend projek',
          badge: 'Hasilkan lencana untuk paparan',
          export: 'Eksport data',
          import: 'Import data',
          more: 'Lebih banyak laporan',
        },
      },
      button: 'Percuma selamanya',
    },
    pro: {
      title: 'Pro',
      preMonth: '/ bulan',
      preYear: '/ tahun',
      features: {
        item: {
          include: 'Termasuk semua ciri-ciri rancangan Asas',
          browseAll: 'Lihat semua data sejarah',
          rule: 'Pemprosesan data berdasarkan peraturan',
          tag: 'Sistem tag',
        },
      },
      notYet: 'bukan lagi tersedia',
      button: 'Langgan Sekarang',
    },
    needLogin: 'Perlu log masuk',
  },
  dashboard: {
    loginRequired: 'Selamat datang ke papan pemuka CodeTime! Sila log masuk untuk melihat data masa kod anda, atau klik butang demo di bawah untuk mengalami papan pemuka demo.',
    projectSelector: {
      placeholder: 'Pilih Ruang Kerja',
      noneText: 'Masukkan Nama Ruang Kerja',
    },
    pageHeader: {
      userLatestEvent(project: string) {
        return `Bekerja pada ${project}`
      },
      title: {
        overview: 'Tinjauan',
        badge: 'Lencana',
        settings: 'Tetapan',
        leaderboard: 'Papan Kepimpinan',
        workspace: 'Ruang Kerja',
        tags: 'Tags',
      },
      description: {
        overview: 'Lihat semua data CodeTime anda.',
        badge: 'Paparkan masa kod anda dalam projek anda dengan lencana yang ringkas, konsisten, dan jelas.',
        settings: 'Uruskan tetapan CodeTime anda, termasuk penampilan, bahasa, data, dan sebagainya.',
        leaderboard: 'Lihat papan kepimpinan CodeTime semua pengguna.',
        workspace: 'Lihat data masa kod, fail, dan grafik API untuk ruang kerja yang dipilih.',
        tags: 'Manage tags and rules for automatic workspace categorization.',
      },
    },
    overview: {
      codetimeTrendTitle: 'Trend Masa Kod',
      codetimeLanguaeTrendTitle: 'Trend Bahasa Pengaturcaraan',
      codetimeProjectTrendTitle: 'Trend Projek',
      dailyCodingDistributionTitle: 'Taburan Masa Kod Harian',
      dataRange: {
        title(days: number) {
          return `Masa ${days} hari yang lalu`
        },
        allTime: 'Semua Masa',
      },
      statistic: {
        timeTotal: 'Masa/Jumlah',
        timeToday: 'Masa/Hari Ini',
        timeAverage: 'Masa/Purata',
        longestStreak: 'Streak/Terbesar',
        currentStreak: 'Streak/Semasa',
      },
      top: {
        language: 'Bahasa',
        project: 'Projek',
        platform: 'Platform',
        workspace: 'Ruang kerja',
      },
      total: {
        time: 'Jumlah Masa Pengkodan',
      },
      recent: {
        time: 'Masa Pengkodan Terkini',
      },
      ranking: 'Kedudukan',
      hours: 'jam',
      active: {
        days: 'Hari Aktif',
      },
      topLanguage: 'Bahasa Utama',
      noData: {
        notice: {
          title: 'Tiada data lagi',
          body: defineComponent({
            components: {
              NuxtLink,
            },
            setup() {
              return () => (
                <div class="text-sm">
                  <span class="text-surface-dimmed">
                    Buat masa ini, kami belum berjaya memproses data masa kod anda. Aplikasi ini bergantung pada plugin untuk editor kod anda atau persekitaran pembangunan bersepadu (seperti VSCode, JetBrains IDE). Sila lawati
                  </span>
                  <NuxtLink
                    to="dashboard/settings"
                    class="text-primary-on px-2"
                  >
                    [ Tetapan ]
                  </NuxtLink>
                  <span class="text-surface-dimmed">
                    laman dan konfigurasi tetapan yang diperlukan dalam editor kod yang menyokong plugin yang anda gunakan. Selepas menerima data anda, kami memerlukan lebih kurang dua minit untuk memprosesnya. Terima kasih atas kerjasama anda.
                  </span>
                </div>
              )
            },
          }),
        },
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
    badge: {
      preview: {
        title: 'Pratonton',
      },
      style: {
        flat: 'Datar',
        flatSquare: 'Datar Persegi',
        forTheBadge: 'Untuk Lencana',
        plastic: 'Plastik',
        social: 'Sosial',
      },
      placeholder: {
        style: 'Gaya',
        language: 'Bahasa',
        days: 'Hari',
        project: 'Projek',
        color: 'Warna',
      },
    },
    settings: {
      token: {
        title: 'Token',
        tip: 'Token anda digunakan untuk akses ke API CodeTime. Simpan ia secara peribadi.',
        refresh: 'Segar',
        refreshTip: 'Jika anda mengesyaki token anda telah tersebar, anda boleh menjana token baru di sini.',
        refreshToken: 'Segar Token',
        confirmRefresh: 'Adakah anda pasti ingin menyegarkan token? Ini akan membatalkan token yang anda gunakan pada plugin editor. Anda perlu memasukkan token baru.',
        getPlugin: defineComponent({
          components: {
            NuxtLink,
          },
          setup() {
            return () => (
              <div class="text-surface-dimmed">
                <span>
                  Untuk CodeTime berfungsi dengan betul, anda perlu memasang plugin kami dan mengkonfigurasi token dalam persekitaran pembangunan anda. Pada masa ini, kami menyokong
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
                  dan
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
        title: 'Bahasa',
        tip: 'Pilih bahasa untuk antara muka web CodeTime anda.',
      },
      export: {
        title: 'Eksport',
        button: 'Eksport dengan Sekali Klik',
        buttonExporting: 'Sedang Eksport...',
        buttonSucceed: 'Eksport Berjaya',
        buttonFailed: 'Eksport Gagal',
        download: 'Muat Turun',
        description: 'Kami menyokong eksport data laman web untuk memastikan penyimpanan data yang selamat, migrasi yang mudah, analisis mendalam, dan pematuhan, sambil memberikan anda kawalan penuh dan ketelusan penuh terhadap data anda.',
        tip: 'Eksport data anda ke fail CSV.',
      },
      theme: {
        title: 'Tema',
        tip: 'Pilih tema untuk antara muka web CodeTime anda.',
        dark: 'Gelap',
        light: 'Terang',
        system: 'Sistem',
      },
      dangerZone: {
        title: 'Zon Berbahaya',
        description: 'Tetapan ini akan mempengaruhi data anda secara kekal dan tidak dapat dibatalkan. Sila berjalan dengan berhati-hati.',
        button: {
          removeAllData: 'Padam Semua Data',
          removeAllDataModal: {
            p1: 'Adakah anda pasti ingin memadamkan semua data anda? Tindakan ini tidak dapat dibatalkan.',
            p2: 'Data anda sangat penting, anda boleh eksport data terlebih dahulu, dan kemudian padamkan data tersebut.',
            p3: 'Jika anda ingin memadamkan semua data, sila masukkan PADAM di bawah, dan kemudian klik Sahkan.',
          },
        },
        subTitle: {
          removeData: 'Padam Semua Data',
          privacy: 'Privasi',
        },
      },
      account: {
        title: 'Akaun',
        description: 'Tetapan akaun.',
        expiresIn: 'Tamat Tempoh dalam',
        manageSubscription: 'Urus Langganan',
        subscribe: 'Langgan',
      },
      other: {
        title: 'Lain-lain',
        description: 'Tetapan lain-lain.',
        logout: 'Log Keluar',
      },
    },
    workspace: {
      select: {
        placeholder: 'Pilih Ruang Kerja',
        none: 'Masukkan Nama Ruang Kerja',
      },
      flameGraph: {
        title: 'Graf Api',
        noData: 'Tiada Data',
      },
      fileList: {
        title: 'Senarai Fail',
      },
    },
    leaderboard: {
      title(days: number) {
        return `Papan Kepimpinan Masa Kod ${days} Hari yang Lalu`
      },
      delta(string: string) {
        return `${string} ketinggalan`
      },
    },
    tags: {
      title: 'Tag',
      description: 'Urus tag dan peraturan untuk pengkategorian ruang kerja automatik.',
      tagList: {
        title: 'Senarai Tag',
        noTags: 'Tiada tag dijumpai. Cipta tag pertama anda untuk bermula.',
        createTag: 'Cipta Tag',
        freeUserLimit: 'Pengguna percuma boleh mencipta sehingga',
        upgradeForMore: 'Naik taraf untuk mencipta lebih banyak tag',
      },
      tagForm: {
        name: 'Nama',
        namePlaceholder: 'Masukkan nama tag',
        color: 'Warna',
        colorPlaceholder: 'Pilih warna',
        emoji: 'Emoji',
        emojiPlaceholder: 'Masukkan emoji (pilihan)',
        create: 'Cipta Tag',
        edit: 'Edit Tag',
        cancel: 'Batal',
        save: 'Simpan',
      },
      tagRules: {
        title: 'Peraturan Tag',
        noRules: 'Tiada peraturan dijumpai untuk tag ini.',
        createRule: 'Cipta Peraturan',
        rule: 'Peraturan',
        enabled: 'Diaktifkan',
        disabled: 'Dimatikan',
        delete: 'Padam',
        edit: 'Edit',
        selectTagPrompt: 'Pilih tag untuk mengurus peraturannya',
        freeUserLimit: 'Pengguna percuma boleh mencipta sehingga',
        upgradeForMore: 'Naik taraf untuk mencipta lebih banyak peraturan',
      },
      ruleForm: {
        name: 'Nama Peraturan',
        namePlaceholder: 'Masukkan nama peraturan',
        enabled: 'Diaktifkan',
        conditions: 'Syarat',
        addCondition: 'Tambah Syarat',
        field: 'Medan',
        conditionType: 'Jenis Syarat',
        value: 'Nilai',
        valuePlaceholder: 'Masukkan nilai',
        negate: 'Nafi',
        create: 'Cipta Peraturan',
        edit: 'Edit Peraturan',
        cancel: 'Batal',
        save: 'Simpan',
      },
      conditionTypes: {
        CONTAINS: 'Mengandungi',
        EQUALS: 'Sama',
        STARTS_WITH: 'Bermula dengan',
        ENDS_WITH: 'Berakhir dengan',
        REGEX: 'Ungkapan nalar',
        NOT_CONTAINS: 'Tidak mengandungi',
        NOT_EQUALS: 'Tidak sama',
        NOT_STARTS_WITH: 'Tidak bermula dengan',
        NOT_ENDS_WITH: 'Tidak berakhir dengan',
        NOT_REGEX: 'Tidak sepadan regex',
      },
      fields: {
        workspaceName: 'Nama Ruang Kerja',
        language: 'Bahasa',
        gitOrigin: 'Asal Git',
        gitBranch: 'Cawangan Git',
        platform: 'Platform',
        editor: 'Editor',
        absoluteFile: 'Laluan Fail Mutlak',
        relativeFile: 'Laluan Fail Relatif',
      },
      actions: {
        delete: 'Padam',
        edit: 'Edit',
        manageRules: 'Urus Peraturan',
        enable: 'Aktifkan',
        disable: 'Matikan',
      },
      deleteConfirm: {
        deleteTag: 'Padam Tag',
        deleteTagMessage: 'Adakah anda pasti untuk memadam tag ini? Tindakan ini tidak boleh dibatalkan.',
        deleteRule: 'Padam Peraturan',
        deleteRuleMessage: 'Adakah anda pasti untuk memadam peraturan ini? Tindakan ini tidak boleh dibatalkan.',
        cancel: 'Batal',
        delete: 'Padam',
      },
      common: {
        not: 'bukan',
        optional: '(pilihan)',
        ruleRelationship: 'Peraturan disambungkan dengan logik ATAU, syarat dengan logik DAN',
        freeUserRuleLimit: 'Pengguna percuma hanya boleh membuat 1 peraturan per tag',
        upgradeForMoreRules: 'Naik taraf untuk membuat lebih banyak peraturan',
        ruleIdFormat: (id: string) => `Peraturan #${id.slice(-4)}`,
        editingMode: 'Mod Penyuntingan - Ingat untuk menyimpan perubahan',
      },
      timeRange: {
        last7Days: '7 hari terakhir',
        last30Days: '30 hari terakhir',
        last90Days: '90 hari terakhir',
      },
      stats: {
        title: 'Statistik Tag',
        viewAll: 'Lihat Semua',
        noData: 'Tiada data tag tersedia',
        timeDistribution: 'Pengedaran Masa Kod mengikut Tag',
        totalDuration: 'Jumlah Tempoh',
        recordCount: 'Bilangan Rekod',
        timeRange: 'Julat Masa',
        days: 'hari',
        dailyAverage: 'Purata Harian',
        timeTrend: 'Trend Masa',
        noChartData: 'Tiada data carta tersedia',
        statisticsTitle: (tagName: string) => `Statistik ${tagName}`,
      },
    },
    pluginGuide: {
      title: 'Bermula dengan CodeTime',
      description: 'Pasang plugin CodeTime untuk menjejaki masa pengaturcaraan anda secara automatik',
      token: {
        title: 'Token Anda',
        description: 'Salin token ini dan tampal ke dalam tetapan plugin',
      },
      plugins: {
        title: 'Muat Turun Plugin',
      },
      vscode: {
        title: 'Keluarga VSCode',
        description: 'Serasi dengan VSCode, Cursor, dan Windsurf',
      },
      jetbrains: {
        title: 'Keluarga JetBrains',
        description: 'Serasi dengan semua IDE JetBrains',
      },
      downloadPlugin: 'Muat Turun Plugin',
      setup: {
        title: 'Arahan Pemasangan',
        step1: 'Muat turun dan pasang plugin untuk editor anda',
        step2: 'Buka tetapan plugin dalam editor anda',
        step3: 'Salin dan tampal token anda di atas',
        step4: 'Mula mengaturcara dan data akan muncul dalam 2-3 minit',
      },
    },
  },
  button: {
    copy: 'Salin',
    copied: 'Disalin',
    cancel: 'Batal',
    confirm: 'Sahkan',
  },
  plot: {
    label: {
      project: 'Projek',
      timeHour: 'Masa (jam)',
      language: 'Bahasa',
      date: 'Tarikh',
      duration: 'Tempoh',
      durationHours: 'Tempoh (jam)',
      other: 'Lain-lain',
      unknown: 'Tidak diketahui',
      currentTime: 'Masa Semasa',
    },
  },
}
