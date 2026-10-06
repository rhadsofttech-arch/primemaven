/* Admin dashboard schema: describes every editable part of the site.
   Field types: text, textarea, markdown, image, url, number, bool, select, tags, list, object */
(function () {
  var ICONS = ['mic', 'home', 'grid', 'users', 'code', 'layers', 'shield', 'search', 'map', 'pin', 'card', 'zero', 'ai', 'phone', 'iot', 'chat', 'book', 'cal', 'car', 'check', 'star', 'mail', 'tel'];
  var HL = 'Highlight words: ==word== blue block, ~~word~~ underline, __word__ soft shape.';
  var MD = 'Formatting: **bold**, *italic*, [link text](https://...), "## " for a subheading, "- " for bullets, "> " for a quote.';
  var heading = function (label) { return { key: 'heading', label: label || 'Heading', type: 'text', help: HL }; };
  var eyebrow = { key: 'eyebrow', label: 'Small label above heading', type: 'text' };

  window.SCHEMA = [
    { id: 'overview', group: 'Start', title: 'Overview', icon: '◎', special: 'overview' },

    { id: 'profile', group: 'Home page', title: 'Profile & contact', icon: '👤', path: 'profile', view: '/', fields: [
      { key: 'name', label: 'First name (hero greeting)', type: 'text' },
      { key: 'fullName', label: 'Full name', type: 'text' },
      { key: 'shortName', label: 'Short name (bylines)', type: 'text' },
      { key: 'handle', label: 'Brand / handle', type: 'text' },
      { key: 'titles', label: 'Titles', type: 'tags', help: 'Shown in the footer, author box and SEO data.' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'phones', label: 'Phone numbers', type: 'tags' },
      { key: 'whatsapp', label: 'WhatsApp number (digits only, with country code)', type: 'text', help: 'e.g. 2348156655091. Leave empty to hide WhatsApp buttons.' },
      { key: 'linkedin', label: 'LinkedIn URL', type: 'url' },
      { key: 'x', label: 'X (Twitter) URL', type: 'url' },
      { key: 'xHandle', label: 'X handle', type: 'text' },
      { key: 'github', label: 'GitHub URL', type: 'url', help: 'Leave empty to hide.' },
      { key: 'photo', label: 'Profile photo', type: 'image' },
      { key: 'logo', label: 'Logo (full)', type: 'image' },
      { key: 'mark', label: 'Logo mark (round icon in the menu bar)', type: 'image' },
      { key: 'footerBlurb', label: 'Footer description', type: 'textarea' }
    ]},

    { id: 'hero', group: 'Home page', title: 'Hero', icon: '★', path: 'hero', view: '/', fields: [
      { key: 'status', label: 'Availability badge', type: 'text', help: 'Leave empty to hide.' },
      { key: 'heading', label: 'Greeting', type: 'text' },
      { key: 'highlight', label: 'Highlighted name', type: 'text' },
      { key: 'chips', label: 'Role badges', type: 'list', itemLabel: 'text', fields: [{ key: 'icon', label: 'Symbol', type: 'text' }, { key: 'text', label: 'Text', type: 'text' }] },
      { key: 'lede', label: 'Intro paragraph', type: 'textarea' },
      { key: 'primaryCta', label: 'Main button', type: 'object', fields: [{ key: 'label', label: 'Label', type: 'text' }, { key: 'link', label: 'Link', type: 'url' }] },
      { key: 'secondaryCta', label: 'Second button', type: 'object', fields: [{ key: 'label', label: 'Label', type: 'text' }, { key: 'link', label: 'Link', type: 'url' }] },
      { key: 'floatChips', label: 'Floating badges on photo (max 2)', type: 'list', itemLabel: 'text', fields: [{ key: 'badge', label: 'Badge', type: 'text' }, { key: 'text', label: 'Text', type: 'text' }] },
      { key: 'cardFacts', label: 'Facts under photo', type: 'list', itemLabel: 'label', fields: [{ key: 'label', label: 'Label', type: 'text' }, { key: 'value', label: 'Value', type: 'text' }] }
    ]},

    { id: 'stats', group: 'Home page', title: 'Numbers strip', icon: '#', path: 'stats', view: '/', listRoot: true, itemLabel: 'label', fields: [{ key: 'value', label: 'Number', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }] },

    { id: 'about', group: 'Home page', title: 'About', icon: 'ℹ', path: 'about', view: '/#about', fields: [
      eyebrow, heading(), { key: 'body', label: 'About text', type: 'markdown', help: MD },
      { key: 'highlights', label: 'Highlight cards', type: 'list', itemLabel: 'title', fields: [{ key: 'icon', label: 'Icon', type: 'select', options: ICONS }, { key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'textarea' }] }
    ]},

    { id: 'ventures', group: 'Home page', title: 'Ventures', icon: '🏢', path: 'ventures', view: '/#ventures', fields: [
      eyebrow, heading(), { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'items', label: 'Companies', type: 'list', itemLabel: 'name', fields: [
        { key: 'style', label: 'Card colour', type: 'select', options: ['dark', 'blue'] },
        { key: 'tag', label: 'Tag', type: 'text' }, { key: 'name', label: 'Name', type: 'text' }, { key: 'text', label: 'Description', type: 'textarea' },
        { key: 'points', label: 'Key points', type: 'tags' }, { key: 'link', label: 'Link (e.g. /mypropify)', type: 'url' }] }
    ]},

    { id: 'press', group: 'Home page', title: 'Featured strip', icon: '📰', path: 'press', view: '/', fields: [
      { key: 'label', label: 'Label', type: 'text' },
      { key: 'items', label: 'Items', type: 'list', itemLabel: 'text', fields: [
        { key: 'text', label: 'Name', type: 'text' }, { key: 'style', label: 'Style', type: 'select', options: ['', 'tedx', 'placeholder'], optionLabels: ['Normal', 'TEDx style', 'Placeholder (dashed)'] },
        { key: 'logo', label: 'Logo (optional)', type: 'image' }] }
    ]},

    { id: 'skills', group: 'Home page', title: 'Skills', icon: '⚙', path: 'skills', view: '/#skills', fields: [
      eyebrow, heading(), { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'groups', label: 'Skill groups', type: 'list', itemLabel: 'name', fields: [{ key: 'name', label: 'Group name', type: 'text' }, { key: 'items', label: 'Skills', type: 'tags' }] }
    ]},

    { id: 'projects', group: 'Home page', title: 'Projects', icon: '🗂', path: 'projects', view: '/#projects', fields: [
      eyebrow, heading(), { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'items', label: 'Projects', type: 'list', itemLabel: 'name', fields: [
        { key: 'name', label: 'Project name', type: 'text' }, { key: 'org', label: 'Company / context', type: 'text' },
        { key: 'status', label: 'Status colour', type: 'select', options: ['live', 'build', 'plan'], optionLabels: ['Green (live)', 'Blue (in build)', 'Purple (planned)'] },
        { key: 'statusLabel', label: 'Status text', type: 'text' }, { key: 'title', label: 'Card title', type: 'text' },
        { key: 'text', label: 'Description', type: 'textarea' }, { key: 'tags', label: 'Tags', type: 'tags' },
        { key: 'link', label: 'Live site link', type: 'url' }, { key: 'image', label: 'Screenshot (optional)', type: 'image' },
        { key: 'colorFrom', label: 'Card colour 1', type: 'color' }, { key: 'colorTo', label: 'Card colour 2', type: 'color' }] }
    ]},

    { id: 'process', group: 'Home page', title: 'How I work', icon: '↻', path: 'process', view: '/#process', fields: [
      eyebrow, heading(), { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'steps', label: 'Steps', type: 'list', itemLabel: 'title', fields: [{ key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'textarea' }, { key: 'note', label: 'Small note', type: 'text' }] }
    ]},

    { id: 'experience', group: 'Home page', title: 'Experience', icon: '💼', path: 'experience', view: '/#experience', fields: [
      eyebrow, heading(),
      { key: 'items', label: 'Roles', type: 'list', itemLabel: 'badge', fields: [
        { key: 'badge', label: 'Company badge', type: 'text' }, { key: 'label', label: 'Label under badge', type: 'text' },
        { key: 'title', label: 'Role title', type: 'text' }, { key: 'place', label: 'Company · location', type: 'text' }, { key: 'points', label: 'Bullet points', type: 'tags', long: true }] }
    ]},

    { id: 'speakingTeaser', group: 'Home page', title: 'Speaking (home)', icon: '🎤', path: 'speakingTeaser', view: '/#speaking', fields: [
      eyebrow, heading(), { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'roles', label: 'Role cards', type: 'list', itemLabel: 'title', fields: [{ key: 'style', label: 'Icon', type: 'select', options: ['tedx', 'mic', 'chat', 'users', 'star'] }, { key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'text' }] },
      { key: 'ctaTitle', label: 'Box title', type: 'text' }, { key: 'ctaText', label: 'Box text', type: 'text' }
    ]},

    { id: 'community', group: 'Home page', title: 'Community', icon: '🤝', path: 'community', view: '/#community', fields: [
      eyebrow, heading(), { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'cardTag', label: 'Card tag', type: 'text' }, { key: 'cardTitle', label: 'Card title', type: 'text' }, { key: 'cardText', label: 'Card text', type: 'textarea' },
      { key: 'joinLabel', label: 'Button label', type: 'text' }, { key: 'joinLink', label: 'Button link', type: 'url' },
      { key: 'items', label: 'Activities', type: 'list', itemLabel: 'title', fields: [{ key: 'icon', label: 'Icon', type: 'select', options: ICONS }, { key: 'title', label: 'Title', type: 'text' }, { key: 'text', label: 'Text', type: 'textarea' }] }
    ]},

    { id: 'testimonials', group: 'Home page', title: 'Testimonials', icon: '❝', path: 'testimonials', view: '/#testimonials', fields: [
      eyebrow, heading(),
      { key: 'items', label: 'Testimonials', type: 'list', itemLabel: 'name', fields: [
        { key: 'quote', label: 'Quote', type: 'textarea' }, { key: 'name', label: 'Name', type: 'text' }, { key: 'role', label: 'Role · Company', type: 'text' },
        { key: 'photo', label: 'Photo (optional)', type: 'image' }, { key: 'placeholder', label: 'Show as placeholder (dashed, "replace" tag)', type: 'bool' }] }
    ]},

    { id: 'companies', group: 'Home page', title: 'Companies', icon: '🏷', path: 'companies', view: '/#companies', fields: [
      eyebrow, heading(),
      { key: 'items', label: 'Companies', type: 'list', itemLabel: 'name', fields: [
        { key: 'name', label: 'Company name', type: 'text' }, { key: 'logo', label: 'Logo', type: 'image', help: 'Upload a logo to replace the text badge.' },
        { key: 'line1', label: 'Text badge: line 1', type: 'text' }, { key: 'line2', label: 'Text badge: line 2', type: 'text' }] }
    ]},

    { id: 'contact', group: 'Home page', title: 'Contact section', icon: '✉', path: 'contact', view: '/#contact', fields: [
      eyebrow, heading(), { key: 'text', label: 'Text', type: 'textarea' },
      { key: 'formTitle', label: 'Form title', type: 'text' }, { key: 'formIntro', label: 'Form intro', type: 'text' },
      { key: 'projectTypes', label: 'Project type options', type: 'tags' }
    ]},

    { id: 'caseStudies', group: 'Pages', title: 'Case studies', icon: '📘', path: 'caseStudies', listRoot: true, itemLabel: 'crumb', viewItem: function (it) { return '/' + it.slug; }, fields: [
      { key: 'crumb', label: 'Name', type: 'text' },
      { key: 'slug', label: 'Web address', type: 'text', prefix: '/', help: 'Lowercase letters, numbers and hyphens only.' },
      { key: 'seoTitle', label: 'SEO title', type: 'text' }, { key: 'seoDescription', label: 'SEO description', type: 'textarea' },
      { key: 'title', label: 'Big title', type: 'text', help: HL }, { key: 'ghost', label: 'Faint background word', type: 'text' },
      { key: 'tagline', label: 'Tagline', type: 'text' }, { key: 'intro', label: 'Intro', type: 'textarea' }, { key: 'chips', label: 'Info chips', type: 'tags' },
      { key: 'siteLabel', label: 'Website button label', type: 'text' }, { key: 'siteLink', label: 'Website link', type: 'url' },
      { key: 'stats', label: 'Numbers strip (optional)', type: 'list', itemLabel: 'label', fields: [{ key: 'value', label: 'Number', type: 'text' }, { key: 'label', label: 'Label', type: 'text' }] },
      { key: 'blocks', label: 'Page sections', type: 'list', itemLabel: 'heading', addLabel: 'Add section', fields: [
        { key: 'type', label: 'Section type', type: 'select', options: ['problem', 'verify', 'cards', 'tags', 'quote', 'roleRoadmap', 'text'], optionLabels: ['Problem list (red crosses)', 'Step-by-step process (dark)', 'Cards grid', 'Tags / names', 'Text + quote', 'Text + timeline', 'Rich text'] },
        { key: 'alt', label: 'White background', type: 'bool', showIf: ['cards', 'tags', 'quote', 'roleRoadmap', 'text'] },
        eyebrow, heading(),
        { key: 'text', label: 'Text', type: 'textarea', help: 'For "Rich text" sections you can use formatting: ' + MD },
        { key: 'quote', label: 'Quote', type: 'textarea', showIf: ['quote'] }, { key: 'quoteBy', label: 'Quote by', type: 'text', showIf: ['quote'] },
        { key: 'points', label: 'Tick points', type: 'tags', long: true, showIf: ['roleRoadmap'] },
        { key: 'roadEyebrow', label: 'Timeline label', type: 'text', showIf: ['roleRoadmap'] }, { key: 'roadHeading', label: 'Timeline heading', type: 'text', showIf: ['roleRoadmap'] },
        { key: 'items', label: 'Items', type: 'list', itemLabel: 'title', showIf: ['problem', 'verify', 'cards', 'tags', 'roleRoadmap'], fields: [
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'text', label: 'Text', type: 'textarea', showIfParent: ['verify', 'cards', 'roleRoadmap'] },
          { key: 'icon', label: 'Icon', type: 'select', options: ICONS, showIfParent: ['cards'] },
          { key: 'badge', label: 'Badge (e.g. Live, Coming soon)', type: 'text', showIfParent: ['cards'] },
          { key: 'note', label: 'Small label (step note / date)', type: 'text', showIfParent: ['verify', 'roleRoadmap'] },
          { key: 'done', label: 'Completed (filled dot)', type: 'bool', showIfParent: ['roleRoadmap'] }] }
      ]},
      { key: 'ctaHeading', label: 'Closing banner heading', type: 'text' }, { key: 'ctaLabel', label: 'Closing button label', type: 'text' }, { key: 'ctaLink', label: 'Closing button link', type: 'url' }
    ], newItem: function () { return { slug: 'new-case-study', crumb: 'New case study', seoTitle: '', seoDescription: '', title: 'New ==case study==', ghost: '', tagline: '', intro: '', chips: [], siteLabel: '', siteLink: '', stats: [], blocks: [], ctaHeading: 'Want to work together?', ctaLabel: 'Contact me', ctaLink: '/#contact' }; } },

    { id: 'speaking', group: 'Pages', title: 'Speaker page', icon: '🎙', path: 'speaking', view: '/speaking', fields: [
      { key: 'seoTitle', label: 'SEO title', type: 'text' }, { key: 'seoDescription', label: 'SEO description', type: 'textarea' },
      { key: 'title', label: 'Big title', type: 'text', help: HL }, { key: 'tagline', label: 'Tagline', type: 'text' }, { key: 'intro', label: 'Intro', type: 'textarea' }, { key: 'chips', label: 'Info chips', type: 'tags' },
      { key: 'topicsHeading', label: 'Topics heading', type: 'text', help: HL }, { key: 'topicsIntro', label: 'Topics intro', type: 'textarea' },
      { key: 'topics', label: 'Talk topics', type: 'list', itemLabel: 'title', fields: [{ key: 'title', label: 'Topic', type: 'text' }, { key: 'text', label: 'Description', type: 'textarea' }, { key: 'formats', label: 'Formats', type: 'tags' }] },
      { key: 'formats', label: 'Formats offered', type: 'tags' },
      { key: 'shortBio', label: 'Short bio', type: 'textarea' }, { key: 'longBio', label: 'Long bio', type: 'markdown', help: MD },
      { key: 'pastEvents', label: 'Past events', type: 'list', itemLabel: 'title', fields: [
        { key: 'kind', label: 'Type (e.g. TEDx, Panel)', type: 'text' }, { key: 'title', label: 'Event name', type: 'text' }, { key: 'detail', label: 'Talk title / city / year', type: 'text' },
        { key: 'role', label: 'Your role', type: 'text' }, { key: 'placeholder', label: 'Show as placeholder (dashed)', type: 'bool' }] },
      { key: 'bookingHeading', label: 'Booking heading', type: 'text', help: HL }, { key: 'bookingText', label: 'Booking text', type: 'textarea' }
    ]},

    { id: 'gallery', group: 'Pages', title: 'Gallery', icon: '🖼', path: 'gallery', view: '/gallery', fields: [
      { key: 'seoTitle', label: 'SEO title', type: 'text' }, { key: 'seoDescription', label: 'SEO description', type: 'textarea' }, { key: 'intro', label: 'Intro', type: 'textarea' },
      { key: 'events', label: 'Photos', type: 'list', itemLabel: 'title', addLabel: 'Add photo', fields: [
        { key: 'src', label: 'Photo', type: 'image' }, { key: 'title', label: 'Title', type: 'text' }, { key: 'detail', label: 'Caption (role · event · year)', type: 'text' },
        { key: 'type', label: 'Category', type: 'select', options: ['speaking', 'moderating', 'community'] },
        { key: 'size', label: 'Tile size', type: 'select', options: ['', 'wide', 'tall', 'wide tall'], optionLabels: ['Normal', 'Wide', 'Tall', 'Large'] }] }
    ]},

    { id: 'blog', group: 'Pages', title: 'Blog posts', icon: '✎', path: 'blog.posts', listRoot: true, itemLabel: 'title', viewItem: function (it) { return '/blog/' + it.slug; }, fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'slug', label: 'Web address', type: 'text', prefix: '/blog/', help: 'Lowercase letters, numbers and hyphens only.', slugFrom: 'title' },
      { key: 'published', label: 'Published (untick to hide as a draft)', type: 'bool' },
      { key: 'tag', label: 'Category tag', type: 'text' }, { key: 'date', label: 'Date', type: 'date' }, { key: 'minutes', label: 'Reading time (minutes)', type: 'number' },
      { key: 'excerpt', label: 'Summary (also the SEO description)', type: 'textarea' },
      { key: 'cover', label: 'Cover image (optional)', type: 'image' },
      { key: 'colorFrom', label: 'Card colour 1', type: 'color' }, { key: 'colorTo', label: 'Card colour 2', type: 'color' },
      { key: 'body', label: 'Article', type: 'markdown', help: MD, tall: true }
    ], newItem: function () { return { slug: 'new-post-' + Date.now().toString(36), title: 'New post', tag: 'Insights', date: new Date().toISOString().slice(0, 10), minutes: 4, excerpt: '', cover: '', colorFrom: '#2E6BFF', colorTo: '#0A1A42', published: false, body: '' }; } },

    { id: 'blogPage', group: 'Pages', title: 'Blog page settings', icon: '⚑', path: 'blog', view: '/blog', fields: [
      { key: 'seoTitle', label: 'SEO title', type: 'text' }, { key: 'seoDescription', label: 'SEO description', type: 'textarea' }, { key: 'intro', label: 'Intro', type: 'textarea' }
    ]},

    { id: 'seo', group: 'Settings', title: 'SEO & integrations', icon: '⚙', path: 'seo', view: '/', fields: [
      { key: 'siteUrl', label: 'Site address', type: 'url', help: 'Used in SEO tags and the sitemap, e.g. https://primemaven.zevcloud.app' },
      { key: 'siteName', label: 'Site name', type: 'text' },
      { key: 'title', label: 'Home page title (browser tab & Google)', type: 'text' },
      { key: 'description', label: 'Home page description (Google)', type: 'textarea' },
      { key: 'keywords', label: 'Keywords', type: 'textarea' },
      { key: 'shareTitle', label: 'Share title (WhatsApp, LinkedIn, X)', type: 'text' },
      { key: 'shareDescription', label: 'Share description', type: 'textarea' },
      { key: 'ogImage', label: 'Share image (1200×630)', type: 'image' },
      { key: 'twitterHandle', label: 'X handle', type: 'text' },
      { key: 'formEndpoint', label: 'Formspree endpoint', type: 'url', help: 'From formspree.io, e.g. https://formspree.io/f/abcdwxyz. Powers the contact and booking forms.' },
      { key: 'googleAnalyticsId', label: 'Google Analytics 4 ID', type: 'text', help: 'e.g. G-ABC123XYZ. Leave empty to turn analytics off.' },
      { key: 'searchConsoleToken', label: 'Google Search Console verification code', type: 'text', help: 'The content="..." value from the HTML tag method.' }
    ]}
  ];
})();
