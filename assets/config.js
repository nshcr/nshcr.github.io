try {
  cacheKey;
} catch {
  cacheKey = '';
}

vnoConfig = {
  siteName: '酸味苦水',
  dateFormat: 'YYYY-MM-DD',
  smartQuotes: '',
  replacer: [],
  cdn: '',
  cacheKey,
  paths: {
    favicon: '/uploads/images/favicon.png',
    index: '/index.md',
    readme: '/README.md',
    archive: '/archives.md',
    category: '/categories.md',
    search: '/search.md',
    common: '/common.md',
  },
  messages: {
    home: 'HOME',
    raw: 'Raw',
    footnotes: 'Footnotes:',
    returnHome: 'Return to home',
    lastUpdated: 'Last updated',
    untagged: 'untagged',
    pageError: '[+](/error.md)',
    searching: 'Searching...',
    searchNothing: 'Nothing.',
    showBacklinks: 'Show backlinks',
    noBacklinks: 'No backlinks.',
    loading: 'Loading...',
    redirectFrom: 'Redirect from: ',
  },
  defaultConf: '',
  multiConf: {},
};
