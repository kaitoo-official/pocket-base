// サイト全体の表示文言(日本語/英語)をまとめた辞書。
// 英語版(en)は日本語版(ja)と全く同じキー構造にする必要がある(型でチェックされる)。
// ページ・コンポーネントごとにセクションを分けているので、追加する時は関連する
// セクションに足すこと。

export interface Dict {
  nav: {
    home: string;
    cards: string;
    packs: string;
    trade: string;
  };
  auth: {
    signIn: string;
    myPage: string;
    wishlist: string;
    collection: string;
    myDecks: string;
    tradeManagement: string;
    signOut: string;
  };
  footer: {
    disclaimer: string;
    dataCredit: string;
    nameCredit: string;
    tagline: string;
    feedbackLink: string;
  };
  cards: {
    title: string;
    resultCount: (n: string) => string;
    allCount: (n: string) => string;
  };
  filters: {
    openButton: string;
    close: string;
    all: string;
    apply: string;
    clear: string;
    category: string;
    type: string;
    stage: string;
    rarity: string;
    hp: string;
    moveDamage: string;
    min: string;
    max: string;
    retreatCost: string;
    other: string;
    acquisition: string;
    expansion: string;
  };
  home: {
    heroLine1: string;
    heroLine2: string;
    tagline: string;
    description: string;
    searchPlaceholder: string;
    browseCards: string;
    browsePacks: string;
    statCards: string;
    statPacks: string;
    statTrades: string;
    latestPack: string;
    viewAllPacks: string;
    exploreByType: string;
    exploreByRarity: string;
    tradeBoard: string;
    tradeBoardDescription: string;
    viewBoard: string;
    featuredCards: string;
    influencerVideos: string;
  };
  cardDetail: {
    backToList: string;
    evolvesFrom: string;
    hp: string;
    series: string;
    moves: string;
    ability: string;
    weakness: string;
    retreatCost: string;
    myCollection: string;
  };
  packs: {
    title: string;
    seriesCount: (n: string) => string;
    releaseDateUnknown: string;
    cardCount: (n: string) => string;
  };
  packDetail: {
    backToList: string;
    cardCount: (n: string) => string;
  };
  acquisition: {
    title: string;
    pack: string;
    series: string;
    category: string;
    promo: (pack: string) => string;
    packPull: string;
    craftPoints: string;
    trade: string;
    tradeAvailable: string;
    tradeAvailableWithCost: (cost: string) => string;
    tradeUnavailable: string;
    wonderPick: string;
    sendable: string;
    notSendable: string;
    relatedCards: string;
    relationBefore: string;
    relationAfter: string;
    relationVariant: string;
  };
  trade: {
    heroTitle: string;
    heroDescription1: string;
    heroDescription2: string;
    rarityNoteSuffix: string;
    board: {
      postsListTitle: string;
      postCount: (n: string) => string;
      loading: string;
      emptyTitle: string;
      emptyDescription: string;
      noMatchTitle: string;
      noMatchDescription: string;
    };
    composer: {
      offerCardsLabel: string;
      wantCardsLabel: string;
      cardHint: string;
      memoLabel: string;
      memoOptional: string;
      memoPlaceholder: string;
      memoPresets: string[];
      friendIdLabel: string;
      friendIdRequired: string;
      friendIdPlaceholder: (digits: string) => string;
      friendIdHint: string;
      friendIdError: (digits: string) => string;
      selectCardsError: string;
      postError: string;
      submitting: string;
      submit: string;
      postedTitle: string;
      postedDescription: string;
      postAnother: string;
      signInTitle: string;
      signInDescription: string;
      signInButton: string;
    };
    cardPicker: {
      addCard: string;
      maxCards: (n: string) => string;
      clear: string;
      cardCount: (n: string, max: string) => string;
      searchPlaceholder: string;
      clearSearch: string;
      typeAll: string;
      rarityAll: string;
      noResults: string;
      close: string;
      removeCard: (name: string) => string;
    };
    postCard: {
      offerLabel: string;
      wantLabel: string;
      undecided: string;
      friendId: string;
      copy: string;
      copied: string;
      commentButton: string;
      commentCount: (n: string) => string;
      new: string;
      lastUpdated: (date: string) => string;
      closed: string;
    };
    search: {
      placeholder: string;
      clearSearch: string;
      reset: string;
      typeAll: string;
      rarityAll: string;
    };
    sort: {
      new: string;
      old: string;
      comments: string;
    };
    comments: {
      loading: string;
      empty: string;
      nameLabel: string;
      anonymous: string;
      deleteConfirm: string;
      deleteFailed: string;
      deleteButton: string;
      commentMenuLabel: string;
      postCommentTitle: string;
      nameOptional: string;
      namePlaceholder: string;
      commentLabel: string;
      required: string;
      presets: string[];
      commentPlaceholder: string;
      submit: string;
      emptyCommentError: string;
      sendFailed: string;
    };
    drawer: {
      title: (n: string) => string;
      close: string;
      ariaLabel: string;
    };
    shareImage: {
      button: string;
      modalTitle: string;
      modalDescription: string;
      generating: string;
      generateError: string;
      downloadButton: string;
      shareButton: string;
      shareHint: string;
      shareText: string;
      close: string;
    };
  };
  feedback: {
    modalTitle: string;
    modalDescription: string;
    messageLabel: string;
    messagePlaceholder: string;
    contactLabel: string;
    contactOptional: string;
    contactPlaceholder: string;
    contactHint: string;
    submit: string;
    submitting: string;
    messageRequiredError: string;
    submitError: string;
    successTitle: string;
    successDescription: string;
    close: string;
  };
  pullRate: {
    sectionTitle: string;
    description: string;
    poolSize: (n: string) => string;
    probability: (pct: string) => string;
    average: (n: string) => string;
    confidence90: (n: string) => string;
  };
  wishlist: {
    title: string;
    description: string;
    empty: string;
    remove: string;
  };
  collection: {
    title: string;
    description: string;
    empty: string;
  };
  decks: {
    title: string;
    description: string;
    empty: string;
    newDeck: string;
    deckNamePlaceholder: string;
    cardsCount: (n: string) => string;
    save: string;
    cancel: string;
    delete: string;
    limitMessage: string;
  };
  mypage: {
    title: string;
    favoritesCount: string;
    wishlistCount: string;
    collectionCount: string;
    decksCount: string;
    tradePostsCount: string;
    shortcuts: string;
  };
  myTrades: {
    title: string;
    empty: string;
    offering: string;
    wanted: string;
    comments: string;
    close: string;
    reopen: string;
    closed: string;
    delete: string;
    deleteConfirm: string;
  };
  migrate: {
    title: string;
    description: string;
    migrate: string;
    skip: string;
    success: string;
  };
}

const ja: Dict = {
  nav: {
    home: "ホーム",
    cards: "カード",
    packs: "パック",
    trade: "トレード",
  },
  auth: {
    signIn: "Googleでログイン",
    myPage: "マイページ",
    wishlist: "Wishlist",
    collection: "マイコレクション",
    myDecks: "マイデッキ",
    tradeManagement: "トレード投稿管理",
    signOut: "ログアウト",
  },
  footer: {
    disclaimer: "本サイトは非公式のファンサイトです。Pokémon、Pokémon Trading Card Game Pocketの公式サービスではありません。",
    dataCredit: "カードデータ・画像",
    nameCredit: "ポケモンの日本語名",
    tagline: "CARD DATABASE PLATFORM",
    feedbackLink: "ご意見・ご要望はこちら",
  },
  cards: {
    title: "カードデータベース",
    resultCount: (n) => `検索結果: ${n}件`,
    allCount: (n) => `全${n}枚`,
  },
  filters: {
    openButton: "絞り込み",
    close: "閉じる",
    all: "すべて",
    apply: "絞り込む",
    clear: "条件をクリア",
    category: "カード種別",
    type: "タイプ",
    stage: "進化段階",
    rarity: "レアリティ",
    hp: "HP",
    moveDamage: "ワザのダメージ",
    min: "最小",
    max: "最大",
    retreatCost: "にげるエネルギー",
    other: "その他",
    acquisition: "入手方法",
    expansion: "拡張パック",
  },
  home: {
    heroLine1: "つながる、",
    heroLine2: "もっと広がる。",
    tagline: "好きなカードが、もっと見つかる。もっとつながる。",
    description: "Pokémon Trading Card Game Pocketのカードを検索・比較・発見できる、非公式カードデータベース。",
    searchPlaceholder: "カード名・技名・効果で検索(例: heal, poison)",
    browseCards: "カードを探す",
    browsePacks: "パックを見る",
    statCards: "総カード数",
    statPacks: "収録パック",
    statTrades: "トレード投稿",
    latestPack: "最新パック",
    viewAllPacks: "すべてのパックを見る",
    exploreByType: "タイプから探す",
    exploreByRarity: "レアリティから探す",
    tradeBoard: "トレード掲示板",
    tradeBoardDescription: "譲れるカードと欲しいカードを投稿して、トレード相手を探せます。",
    viewBoard: "掲示板を見る",
    featuredCards: "注目カード",
    influencerVideos: "注目プレイヤー",
  },
  cardDetail: {
    backToList: "カード一覧へ戻る",
    evolvesFrom: "進化前",
    hp: "HP",
    series: "シリーズ",
    moves: "技",
    ability: "特性",
    weakness: "弱点",
    retreatCost: "にげるエネルギー",
    myCollection: "マイコレクション",
  },
  packs: {
    title: "パックデータベース",
    seriesCount: (n) => `全${n}シリーズ`,
    releaseDateUnknown: "配信日未定",
    cardCount: (n) => `${n}枚`,
  },
  packDetail: {
    backToList: "パック一覧へ戻る",
    cardCount: (n) => `${n}枚収録`,
  },
  acquisition: {
    title: "入手方法",
    pack: "収録パック",
    series: "シリーズ",
    category: "区分",
    promo: (pack) => `プロモ(${pack})`,
    packPull: "パック排出",
    craftPoints: "クラフト必要ポイント",
    trade: "トレード",
    tradeAvailable: "可",
    tradeAvailableWithCost: (cost) => `可(必要トークン ${cost})`,
    tradeUnavailable: "不可",
    wonderPick: "ゲットチャレンジ",
    sendable: "送信可",
    notSendable: "送信不可",
    relatedCards: "関連カード",
    relationBefore: "進化前",
    relationAfter: "進化後",
    relationVariant: "収録違い",
  },
  trade: {
    heroTitle: "カードトレード募集",
    heroDescription1: "譲れるカードと欲しいカードを登録して、トレード相手を探せます。",
    heroDescription2: "実際のやり取りはゲーム内で行ってください。",
    rarityNoteSuffix: "のカードのみ選択できます。",
    board: {
      postsListTitle: "投稿一覧",
      postCount: (n) => `${n}件`,
      loading: "読み込み中...",
      emptyTitle: "まだトレード募集がありません",
      emptyDescription: "最初の募集を投稿してみましょう。",
      noMatchTitle: "条件に合う投稿が見つかりませんでした",
      noMatchDescription: "検索キーワードや絞り込み条件を変えてみてください。",
    },
    composer: {
      offerCardsLabel: "譲れるカード",
      wantCardsLabel: "欲しいカード",
      cardHint: "未選択のまま投稿すると「要相談」として表示されます",
      memoLabel: "メモ",
      memoOptional: "(任意)",
      memoPlaceholder: "例: 複数枚交換できます",
      memoPresets: ["コメントください。", "交渉余地あります。", "友達募集です。"],
      friendIdLabel: "フレンドID",
      friendIdRequired: "(必須)",
      friendIdPlaceholder: (digits) => `半角数字${digits}桁`,
      friendIdHint: "ゲーム内のフレンドIDを入力してください。",
      friendIdError: (digits) => `フレンドIDは${digits}桁の半角数字で入力してください`,
      selectCardsError: "譲れるカードか欲しいカードを、どちらか1枚以上選んでください",
      postError: "投稿に失敗しました。時間をおいて試してください",
      submitting: "投稿中...",
      submit: "トレード募集を投稿",
      postedTitle: "投稿が完了しました！",
      postedDescription: "画像でシェアして、トレード相手を見つけやすくしましょう。",
      postAnother: "続けて投稿する",
      signInTitle: "投稿にはログインが必要です",
      signInDescription: "Googleでログインすると、トレード募集を投稿できます(掲示板の閲覧はログイン不要です)。",
      signInButton: "Googleでログイン",
    },
    cardPicker: {
      addCard: "カードを追加",
      maxCards: (n) => `最大${n}枚`,
      clear: "クリア",
      cardCount: (n, max) => `${n}/${max}枚`,
      searchPlaceholder: "カード名で検索",
      clearSearch: "検索キーワードを消去",
      typeAll: "タイプ: すべて",
      rarityAll: "レアリティ: すべて",
      noResults: "見つかりませんでした",
      close: "閉じる",
      removeCard: (name) => `${name}を削除`,
    },
    postCard: {
      offerLabel: "譲れるカード",
      wantLabel: "欲しいカード",
      undecided: "要相談",
      friendId: "フレンドID",
      copy: "コピー",
      copied: "コピー済み",
      commentButton: "コメントする",
      commentCount: (n) => `${n}件`,
      new: "NEW",
      lastUpdated: (date) => `最終更新: ${date}`,
      closed: "募集終了",
    },
    search: {
      placeholder: "カード名で投稿を検索",
      clearSearch: "検索キーワードを消去",
      reset: "リセット",
      typeAll: "タイプ: すべて",
      rarityAll: "レアリティ: すべて",
    },
    sort: {
      new: "新しい順",
      old: "古い順",
      comments: "コメントが多い順",
    },
    comments: {
      loading: "読み込み中...",
      empty: "まだコメントはありません。",
      nameLabel: "名前",
      anonymous: "名無しさん",
      deleteConfirm: "このコメントを削除しますか?",
      deleteFailed: "コメントの削除に失敗しました。時間をおいて試してください",
      deleteButton: "削除",
      commentMenuLabel: "コメントのメニュー",
      postCommentTitle: "コメントを投稿",
      nameOptional: "(任意)",
      namePlaceholder: "名前を入力",
      commentLabel: "コメント",
      required: "(必須)",
      presets: ["相談したいです。", "交渉したいです。", "○○譲れます。", "○○が欲しいです。"],
      commentPlaceholder: "コメントを入力してください...",
      submit: "送信",
      emptyCommentError: "コメントを入力してください",
      sendFailed: "コメントの送信に失敗しました。時間をおいて試してください",
    },
    drawer: {
      title: (n) => `コメント ${n}件`,
      close: "閉じる",
      ariaLabel: "コメント",
    },
    shareImage: {
      button: "画像でシェア",
      modalTitle: "投稿成功！",
      modalDescription: "この画像をシェアして、トレード相手を見つけやすくしましょう。",
      generating: "画像を生成中...",
      generateError: "画像の生成に失敗しました。時間をおいて試してください",
      downloadButton: "画像を保存",
      shareButton: "シェア",
      shareHint: "うまくシェアできない場合は、保存した画像を手動で添付してください。",
      shareText: "Pocket Baseでトレード相手を探しています！",
      close: "閉じる",
    },
  },
  feedback: {
    modalTitle: "ご意見・ご要望",
    modalDescription: "サイトの改善につながるご意見・ご要望をお寄せください。",
    messageLabel: "内容",
    messagePlaceholder: "気になった点、追加してほしい機能などをお書きください",
    contactLabel: "連絡先",
    contactOptional: "(任意)",
    contactPlaceholder: "返信が必要な場合はメールアドレス等",
    contactHint: "返信が不要な場合は空欄で構いません。",
    submit: "送信する",
    submitting: "送信中...",
    messageRequiredError: "内容を入力してください",
    submitError: "送信に失敗しました。時間をおいて試してください",
    successTitle: "送信しました",
    successDescription: "貴重なご意見をありがとうございます！",
    close: "閉じる",
  },
  pullRate: {
    sectionTitle: "入手の目安",
    description: "パックの排出確率から計算した統計的な目安です。実際の結果を保証するものではありません。",
    poolSize: (n) => `同じレアリティのカードが${n}種類`,
    probability: (pct) => `1パックあたり ${pct}%`,
    average: (n) => `平均 ${n}パック`,
    confidence90: (n) => `90%の確率で ${n}パック以内`,
  },
  wishlist: {
    title: "Wishlist",
    description: "「欲しい」に追加したカードの一覧です。",
    empty: "まだ「欲しい」に追加したカードがありません。",
    remove: "削除",
  },
  collection: {
    title: "マイコレクション",
    description: "所持しているカードの枚数を記録できます。",
    empty: "まだコレクションに登録したカードがありません。",
  },
  decks: {
    title: "マイデッキ",
    description: "デッキを保存して管理できます。",
    empty: "まだ保存したデッキがありません。",
    newDeck: "デッキを作成",
    deckNamePlaceholder: "デッキ名を入力",
    cardsCount: (n) => `${n}枚`,
    save: "保存",
    cancel: "キャンセル",
    delete: "削除",
    limitMessage: "無料会員では3デッキまで保存できます",
  },
  mypage: {
    title: "マイページ",
    favoritesCount: "お気に入り",
    wishlistCount: "Wishlist",
    collectionCount: "コレクション登録数",
    decksCount: "保存デッキ数",
    tradePostsCount: "トレード投稿数",
    shortcuts: "ショートカット",
  },
  myTrades: {
    title: "トレード投稿管理",
    empty: "まだ投稿がありません。",
    offering: "譲れるカード",
    wanted: "欲しいカード",
    comments: "コメント",
    close: "募集終了にする",
    reopen: "募集を再開する",
    closed: "募集終了",
    delete: "削除",
    deleteConfirm: "この投稿を削除しますか？",
  },
  migrate: {
    title: "この端末のデータをアカウントに引き継ぎますか？",
    description: "ログイン前にこの端末に保存されていたお気に入り・仮デッキを、このアカウントに引き継げます。",
    migrate: "引き継ぐ",
    skip: "今はしない",
    success: "データを引き継ぎました。",
  },
};

const en: Dict = {
  nav: {
    home: "Home",
    cards: "Cards",
    packs: "Packs",
    trade: "Trade",
  },
  auth: {
    signIn: "Sign in with Google",
    myPage: "My Page",
    wishlist: "Wishlist",
    collection: "My Collection",
    myDecks: "My Decks",
    tradeManagement: "My Trade Posts",
    signOut: "Sign Out",
  },
  footer: {
    disclaimer:
      "This is an unofficial fan site. Not affiliated with or endorsed by Pokémon or Pokémon Trading Card Game Pocket.",
    dataCredit: "Card data & images",
    nameCredit: "Japanese Pokémon names",
    tagline: "CARD DATABASE PLATFORM",
    feedbackLink: "Send Feedback",
  },
  cards: {
    title: "Card Database",
    resultCount: (n) => `Results: ${n}`,
    allCount: (n) => `${n} cards total`,
  },
  filters: {
    openButton: "Filters",
    close: "Close",
    all: "All",
    apply: "Apply Filters",
    clear: "Clear Filters",
    category: "Category",
    type: "Type",
    stage: "Stage",
    rarity: "Rarity",
    hp: "HP",
    moveDamage: "Move Damage",
    min: "Min",
    max: "Max",
    retreatCost: "Retreat Cost",
    other: "Other",
    acquisition: "Acquisition",
    expansion: "Expansion",
  },
  home: {
    heroLine1: "Connect, ",
    heroLine2: "and discover more.",
    tagline: "Find the cards you love. Connect with more players.",
    description:
      "An unofficial card database for searching, comparing, and discovering Pokémon Trading Card Game Pocket cards.",
    searchPlaceholder: "Search by card name, move, or effect (e.g. heal, poison)",
    browseCards: "Browse Cards",
    browsePacks: "Browse Packs",
    statCards: "Total Cards",
    statPacks: "Packs",
    statTrades: "Trade Posts",
    latestPack: "Latest Pack",
    viewAllPacks: "View all packs",
    exploreByType: "Browse by Type",
    exploreByRarity: "Browse by Rarity",
    tradeBoard: "Trade Board",
    tradeBoardDescription: "Post cards you can offer and cards you want to find a trade partner.",
    featuredCards: "Featured Cards",
    influencerVideos: "Featured Players",
    viewBoard: "View board",
  },
  cardDetail: {
    backToList: "Back to card list",
    evolvesFrom: "Evolves from",
    hp: "HP",
    series: "Series",
    moves: "Moves",
    ability: "Ability",
    weakness: "Weakness",
    retreatCost: "Retreat Cost",
    myCollection: "My Collection",
  },
  packs: {
    title: "Pack Database",
    seriesCount: (n) => `${n} series total`,
    releaseDateUnknown: "TBA",
    cardCount: (n) => `${n} cards`,
  },
  packDetail: {
    backToList: "Back to pack list",
    cardCount: (n) => `${n} cards`,
  },
  acquisition: {
    title: "Acquisition",
    pack: "Pack",
    series: "Series",
    category: "Category",
    promo: (pack) => `Promo (${pack})`,
    packPull: "Pack pull",
    craftPoints: "Craft Cost",
    trade: "Trade",
    tradeAvailable: "Yes",
    tradeAvailableWithCost: (cost) => `Yes (${cost} tokens)`,
    tradeUnavailable: "No",
    wonderPick: "Wonder Pick",
    sendable: "Sendable",
    notSendable: "Not sendable",
    relatedCards: "Related Cards",
    relationBefore: "Evolves from",
    relationAfter: "Evolves into",
    relationVariant: "Other version",
  },
  trade: {
    heroTitle: "Trade Board",
    heroDescription1: "Post the cards you can offer and the cards you want to find a trade partner.",
    heroDescription2: "Actual trades must be completed in-game.",
    rarityNoteSuffix: "cards can be selected.",
    board: {
      postsListTitle: "Posts",
      postCount: (n) => `${n} posts`,
      loading: "Loading...",
      emptyTitle: "No trade posts yet",
      emptyDescription: "Be the first to post a trade.",
      noMatchTitle: "No posts match your search",
      noMatchDescription: "Try different keywords or filters.",
    },
    composer: {
      offerCardsLabel: "Cards to offer",
      wantCardsLabel: "Cards wanted",
      cardHint: "Leave unselected to show as \"Open to offers\"",
      memoLabel: "Memo",
      memoOptional: "(optional)",
      memoPlaceholder: "e.g. Can trade multiple cards",
      memoPresets: ["Please comment.", "Open to negotiation.", "Looking for friends."],
      friendIdLabel: "Friend ID",
      friendIdRequired: "(required)",
      friendIdPlaceholder: (digits) => `${digits} digits`,
      friendIdHint: "Enter your in-game Friend ID.",
      friendIdError: (digits) => `Friend ID must be ${digits} digits`,
      selectCardsError: "Select at least one card to offer or want",
      postError: "Failed to post. Please try again later",
      submitting: "Posting...",
      submit: "Post Trade",
      postedTitle: "Your post is live!",
      postedDescription: "Share it as an image to help find a trade partner.",
      postAnother: "Post another",
      signInTitle: "Sign in to post",
      signInDescription: "Sign in with Google to post a trade listing (browsing the board doesn't require sign-in).",
      signInButton: "Sign in with Google",
    },
    cardPicker: {
      addCard: "Add Card",
      maxCards: (n) => `Up to ${n} cards`,
      clear: "Clear",
      cardCount: (n, max) => `${n}/${max} cards`,
      searchPlaceholder: "Search by card name",
      clearSearch: "Clear search",
      typeAll: "Type: All",
      rarityAll: "Rarity: All",
      noResults: "No results found",
      close: "Close",
      removeCard: (name) => `Remove ${name}`,
    },
    postCard: {
      offerLabel: "Offering",
      wantLabel: "Wanted",
      undecided: "Open to offers",
      friendId: "Friend ID",
      copy: "Copy",
      copied: "Copied",
      commentButton: "Comment",
      commentCount: (n) => n,
      new: "NEW",
      lastUpdated: (date) => `Last updated: ${date}`,
      closed: "Closed",
    },
    search: {
      placeholder: "Search posts by card name",
      clearSearch: "Clear search",
      reset: "Reset",
      typeAll: "Type: All",
      rarityAll: "Rarity: All",
    },
    sort: {
      new: "Newest",
      old: "Oldest",
      comments: "Most comments",
    },
    comments: {
      loading: "Loading...",
      empty: "No comments yet.",
      nameLabel: "Name",
      anonymous: "Anonymous",
      deleteConfirm: "Delete this comment?",
      deleteFailed: "Failed to delete comment. Please try again later",
      deleteButton: "Delete",
      commentMenuLabel: "Comment menu",
      postCommentTitle: "Add a comment",
      nameOptional: "(optional)",
      namePlaceholder: "Enter your name",
      commentLabel: "Comment",
      required: "(required)",
      presets: ["I'd like to discuss.", "Open to negotiation.", "I can offer ___.", "I want ___."],
      commentPlaceholder: "Enter a comment...",
      submit: "Send",
      emptyCommentError: "Please enter a comment",
      sendFailed: "Failed to send comment. Please try again later",
    },
    drawer: {
      title: (n) => `${n} Comments`,
      close: "Close",
      ariaLabel: "Comments",
    },
    shareImage: {
      button: "Share as Image",
      modalTitle: "Post successful!",
      modalDescription: "Share this image to help find a trade partner.",
      generating: "Generating image...",
      generateError: "Failed to generate the image. Please try again later",
      downloadButton: "Save Image",
      shareButton: "Share",
      shareHint: "If sharing doesn't work, attach the saved image manually instead.",
      shareText: "Looking for a trade partner on Pocket Base!",
      close: "Close",
    },
  },
  feedback: {
    modalTitle: "Feedback",
    modalDescription: "Share any feedback or feature requests to help improve the site.",
    messageLabel: "Message",
    messagePlaceholder: "Let us know what's on your mind, or what you'd like to see added",
    contactLabel: "Contact",
    contactOptional: "(optional)",
    contactPlaceholder: "Email address, if you'd like a reply",
    contactHint: "Leave this blank if you don't need a reply.",
    submit: "Send",
    submitting: "Sending...",
    messageRequiredError: "Please enter a message",
    submitError: "Failed to send. Please try again later",
    successTitle: "Sent!",
    successDescription: "Thanks for the feedback!",
    close: "Close",
  },
  pullRate: {
    sectionTitle: "Pull Rate Estimate",
    description: "A statistical estimate based on official pack drop rates. Actual results may vary.",
    poolSize: (n) => `${n} cards share this rarity`,
    probability: (pct) => `${pct}% per pack`,
    average: (n) => `${n} packs on average`,
    confidence90: (n) => `90% chance within ${n} packs`,
  },
  wishlist: {
    title: "Wishlist",
    description: "Cards you've marked as wanted.",
    empty: "You haven't added any cards to your wishlist yet.",
    remove: "Remove",
  },
  collection: {
    title: "My Collection",
    description: "Track how many copies of each card you own.",
    empty: "You haven't added any cards to your collection yet.",
  },
  decks: {
    title: "My Decks",
    description: "Save and manage your decks.",
    empty: "You haven't saved any decks yet.",
    newDeck: "Create Deck",
    deckNamePlaceholder: "Enter a deck name",
    cardsCount: (n) => `${n} cards`,
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    limitMessage: "Free accounts can save up to 3 decks",
  },
  mypage: {
    title: "My Page",
    favoritesCount: "Favorites",
    wishlistCount: "Wishlist",
    collectionCount: "Collection entries",
    decksCount: "Saved decks",
    tradePostsCount: "Trade posts",
    shortcuts: "Shortcuts",
  },
  myTrades: {
    title: "My Trade Posts",
    empty: "You haven't posted anything yet.",
    offering: "Offering",
    wanted: "Wanted",
    comments: "Comments",
    close: "Mark as closed",
    reopen: "Reopen",
    closed: "Closed",
    delete: "Delete",
    deleteConfirm: "Delete this post?",
  },
  migrate: {
    title: "Transfer this device's data to your account?",
    description: "You can transfer favorites and draft decks saved on this device before you signed in.",
    migrate: "Transfer",
    skip: "Not now",
    success: "Your data has been transferred.",
  },
};

const dictionaries = { ja, en };

export function getDict(lang: "ja" | "en"): Dict {
  return dictionaries[lang];
}
