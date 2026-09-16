import type { ArticleSection } from '../../components/help/article-content';

export interface HelpArticleDefinition {
  slug: string;
  title: string;
  description: string;
  categorySlug: string;
  categoryTitle: string;
  featureSlug: string;
  seoTitle: string;
  seoDescription: string;
  sections: ArticleSection[];
  ctaHref?: string;
  ctaLabel?: string;
  tutorialId?: string;
}

export const HELP_ARTICLES: HelpArticleDefinition[] = [
  // 1. Getting Started: What is TUKUBI
  {
    slug: 'what-is-tukubi',
    title: 'What is TUKUBI? The Caribbean Connected',
    description: 'Learn about TUKUBI — the premier Caribbean and global diaspora social, creator, commerce, and discovery platform.',
    categorySlug: 'getting-started',
    categoryTitle: 'Getting Started',
    featureSlug: 'home',
    seoTitle: 'What is TUKUBI? — Caribbean Social, Cultural & Commerce Platform',
    seoDescription: 'Discover TUKUBI: connecting Caribbean culture, creators, businesses and the global diaspora in one unified digital ecosystem.',
    ctaHref: '/explore',
    ctaLabel: 'Explore TUKUBI Now',
    sections: [
      {
        type: 'intro',
        content: 'TUKUBI is "The Caribbean Connected." Built with Caribbean Futurism design principles, TUKUBI brings together island culture, creators, diaspora communities, authentic commerce, live broadcasting, and podcasting in a unified platform.',
      },
      {
        type: 'steps',
        title: 'Core Pillars of the TUKUBI Ecosystem',
        steps: [
          {
            number: 1,
            title: 'Social & Cultural Feed',
            content: 'Browse multimedia updates across Four Core Feed Streams: For You, Following, Caribbean Geographic, and Communities.',
            tip: 'You can toggle feed modes anytime at the top of your home screen.',
          },
          {
            number: 2,
            title: 'Creator Economy & Hubs',
            content: 'Share short-form Reels, host Podcasts, broadcast Live, and monetize directly with fan subscriptions and tips through the Financial Center.',
          },
          {
            number: 3,
            title: 'Authentic Caribbean Marketplace',
            content: 'Discover handcrafted Caribbean goods, fashion, music, spices, and services from verified island sellers and diaspora entrepreneurs.',
          },
          {
            number: 4,
            title: 'Geospatial Discovery & Diaspora Hubs',
            content: 'Filter content, creators, and events by specific island territory or global diaspora hubs including New York, Miami, Toronto, and London.',
          },
        ],
      },
      {
        type: 'tips',
        title: 'Getting the Most Out of TUKUBI',
        items: [
          'Complete your Caribbean cultural origin and current location in profile settings.',
          'Follow creators and join Diaspora Hubs matching your heritage or interests.',
          'Use the Caribbean Map to explore sounds and stories by geographic territory.',
        ],
      },
      {
        type: 'faqs',
        title: 'Frequently Asked Questions',
        faqs: [
          {
            question: 'Is TUKUBI free to use?',
            answer: 'Yes! Creating an account, browsing feeds, discovering music, and participating in public diaspora communities is completely free.',
          },
          {
            question: 'Can anyone join TUKUBI even if they do not live in the Caribbean?',
            answer: 'Absolutely. TUKUBI is built for the entire Caribbean region, the global diaspora, and anyone who appreciates Caribbean culture worldwide.',
          },
        ],
      },
      {
        type: 'cta',
        ctaHref: '/explore',
        ctaLabel: 'Explore Caribbean Culture',
      },
    ],
  },

  // 2. Getting Started: Creating Your Account
  {
    slug: 'creating-your-account',
    title: 'Creating and Setting Up Your TUKUBI Account',
    description: 'Step-by-step guide to signing up, email verification, and onboarding onto the TUKUBI platform.',
    categorySlug: 'getting-started',
    categoryTitle: 'Getting Started',
    featureSlug: 'auth',
    seoTitle: 'How to Create a TUKUBI Account — Getting Started Guide',
    seoDescription: 'Follow these steps to register for TUKUBI, verify your credentials, and start exploring Caribbean stories.',
    ctaHref: '/signup',
    ctaLabel: 'Sign Up for TUKUBI',
    sections: [
      {
        type: 'intro',
        content: 'Signing up for TUKUBI gives you full access to post moments, interact with creators, join diaspora communities, message friends, and buy or sell on Marketplace.',
      },
      {
        type: 'steps',
        title: 'How to Register on TUKUBI',
        steps: [
          {
            number: 1,
            title: 'Navigate to Sign Up',
            content: 'Click "Sign Up" in the navigation or visit /signup directly.',
          },
          {
            number: 2,
            title: 'Provide Your Details',
            content: 'Enter your Display Name, a unique @username, your email address, and a secure password.',
            tip: 'Your username can contain letters, numbers, and underscores. You can change your display name later.',
          },
          {
            number: 3,
            title: 'Select Cultural Heritage & Location (Optional)',
            content: 'Choose your Caribbean country of origin and your current home city or territory to customize your personalized recommendations.',
          },
          {
            number: 4,
            title: 'Verify Your Email Address',
            content: 'Check your email inbox for a confirmation link. Clicking this activates your account and enables full messaging and posting features.',
          },
        ],
      },
      {
        type: 'tips',
        title: 'Account Security Tips',
        items: [
          'Choose a strong, unique password not shared with other services.',
          'Keep your email address up to date to ensure account recovery access.',
          'Review your Notification Preferences in Settings after registration.',
        ],
      },
    ],
  },

  // 3. Setting Up Your Profile
  {
    slug: 'setting-up-your-profile',
    title: 'Setting Up Your Caribbean Profile & Identity',
    description: 'Personalize your avatar, header banner, cultural badges, bio, and social links.',
    categorySlug: 'getting-started',
    categoryTitle: 'Getting Started',
    featureSlug: 'profile',
    seoTitle: 'Setting Up Your Profile — TUKUBI Help Center',
    seoDescription: 'Learn how to edit your TUKUBI profile, set your avatar, add island flags, bio, and social links.',
    ctaHref: '/settings',
    ctaLabel: 'Edit Profile Settings',
    sections: [
      {
        type: 'intro',
        content: 'Your TUKUBI profile is your digital identity across the Caribbean ecosystem. It showcases your posts, reels, badges, community memberships, and cultural heritage.',
      },
      {
        type: 'steps',
        title: 'How to Customize Your Profile',
        steps: [
          {
            number: 1,
            title: 'Open Your Profile',
            content: 'Click on your profile avatar in the sidebar or bottom navigation bar, then select "Edit Profile".',
          },
          {
            number: 2,
            title: 'Upload Avatar and Banner Photos',
            content: 'Add a high-resolution square avatar (recommended 400x400) and an optional wide banner image.',
          },
          {
            number: 3,
            title: 'Write Your Bio',
            content: 'Share your story, Caribbean heritage, interests, or creator focus in up to 300 characters.',
          },
          {
            number: 4,
            title: 'Add External Social & Web Links',
            content: 'Connect your Instagram, YouTube, Spotify, or business website directly to your profile header.',
          },
        ],
      },
      {
        type: 'note',
        content: 'Official accounts, verified merchants, and recognized Caribbean creators receive distinct verification badges automatically displayed next to their names.',
      },
    ],
  },

  // 4. Understanding Your Home Feed
  {
    slug: 'understanding-your-home-feed',
    title: 'Understanding Your Home Feed & Feed Modes',
    description: 'Learn how the For You, Following, Caribbean, and Communities feed streams work on TUKUBI.',
    categorySlug: 'getting-started',
    categoryTitle: 'Getting Started',
    featureSlug: 'feed',
    seoTitle: 'Understanding Your Home Feed — TUKUBI Help Center',
    seoDescription: 'Master the four TUKUBI home feed modes: For You, Following, Caribbean geographic, and Communities.',
    ctaHref: '/',
    ctaLabel: 'Go to Home Feed',
    sections: [
      {
        type: 'intro',
        content: 'The TUKUBI Home Feed offers four distinct viewing modes tailored to different social and discovery needs. You can switch between them at any time using the tabs at the top of the feed.',
      },
      {
        type: 'steps',
        title: 'The Four Feed Streams',
        steps: [
          {
            number: 1,
            title: 'For You',
            content: 'An algorithmically ranked stream combining trending Caribbean posts, creator content, and topics aligned with your cultural interests.',
          },
          {
            number: 2,
            title: 'Following',
            content: 'A chronological timeline containing exclusively posts from the members, creators, and official accounts you follow.',
          },
          {
            number: 3,
            title: 'Caribbean (Geographic)',
            content: 'Location-tagged stories and posts from across the island nations and regional cultural hotspots.',
            tip: 'Use the country filter dropdown to view stories from a specific island, like Trinidad, Jamaica, Barbados, or Haiti.',
          },
          {
            number: 4,
            title: 'Communities',
            content: 'Aggregated updates, discussions, and media from all the private and public Diaspora Hubs you have joined.',
          },
        ],
      },
    ],
  },

  // 5. Members vs Friends vs Following
  {
    slug: 'members-friends-following',
    title: 'People on TUKUBI: Understanding Members, Friends & Following',
    description: 'A clear guide explaining the difference between platform Members, mutual Friends, and asymmetric Following on TUKUBI.',
    categorySlug: 'getting-started',
    categoryTitle: 'Getting Started',
    featureSlug: 'social',
    seoTitle: 'Members, Friends & Following Explained — TUKUBI Help Center',
    seoDescription: 'Learn how social connections work on TUKUBI: the difference between Following someone and becoming mutual Friends.',
    ctaHref: '/people',
    ctaLabel: 'Explore People & Network',
    sections: [
      {
        type: 'intro',
        content: 'TUKUBI supports both asymmetric following (like subscribing to a public creator) and bidirectional friendship (like personal friends and family). Understanding the difference helps you manage your network and privacy.',
      },
      {
        type: 'steps',
        title: 'Understanding Social Relationship Types',
        steps: [
          {
            number: 1,
            title: 'Members',
            content: '"Member" is the universal term for any registered person on TUKUBI. When you browse the Member Directory at /members, you are viewing fellow community participants.',
          },
          {
            number: 2,
            title: 'Following (Asymmetric)',
            content: 'When you click "Follow" on a profile, their public posts appear in your Following feed. They do NOT need to approve your request, and they do not automatically follow you back.',
            tip: 'Follow is ideal for creators, public figures, musicians, and businesses.',
          },
          {
            number: 3,
            title: 'Friends (Mutual Connection)',
            content: 'Friends require a two-way agreement. You send a Friend Request, and the other person must accept it. Friends can see reciprocal status and may receive direct messages without message request filters.',
          },
        ],
      },
      {
        type: 'tips',
        title: 'Managing Your Network',
        items: [
          'Visit /friends to see incoming friend requests and your current friends list.',
          'Visit /people to discover People You May Know based on shared communities and geography.',
          'You can unfollow someone without removing them as a friend.',
        ],
      },
    ],
  },

  // 6. Explore & Discovery: How Explore Works
  {
    slug: 'how-explore-works',
    title: 'How Explore Works: Caribbean Discovery, Vibes & Geography',
    description: 'Navigate the TUKUBI Explore hub to discover trending topics, island culture, vibes, and diaspora communities.',
    categorySlug: 'explore',
    categoryTitle: 'Explore TUKUBI',
    featureSlug: 'explore',
    seoTitle: 'How Explore Works — TUKUBI Caribbean Discovery Guide',
    seoDescription: 'Learn how to use TUKUBI Explore: search by territory, discover Caribbean vibes, and find regional trends.',
    ctaHref: '/explore',
    ctaLabel: 'Open Explore Hub',
    sections: [
      {
        type: 'intro',
        content: 'The TUKUBI Explore Hub (/explore) is the cultural discovery engine of the Caribbean. It brings together content categorized by island territory, mood or vibe, diaspora hub, and trending cultural signals.',
      },
      {
        type: 'steps',
        title: 'Ways to Explore TUKUBI',
        steps: [
          {
            number: 1,
            title: 'Geographic Discovery',
            content: 'Select any Caribbean country or territory to view top media, creators, local businesses, and upcoming events from that specific location.',
          },
          {
            number: 2,
            title: 'Caribbean Vibes',
            content: 'Filter by cultural energy: Carnival, Reggae & Dub, Soca Euphoria, Culinary Flavors, Island Serenity, Tech & Innovation, and more.',
          },
          {
            number: 3,
            title: 'Diaspora City Hubs',
            content: 'Explore Caribbean cultural life in major global cities including Brooklyn/NYC, Little Haiti/Miami, Brampton/Toronto, and Brixton/London.',
          },
        ],
      },
    ],
  },

  // 7. Using the Caribbean Map
  {
    slug: 'using-the-caribbean-map',
    title: 'Exploring with the Interactive Caribbean Map',
    description: 'Use the visual geospatial map to discover local stories, sounds, and events across the archipelago.',
    categorySlug: 'explore',
    categoryTitle: 'Explore TUKUBI',
    featureSlug: 'map',
    seoTitle: 'Interactive Caribbean Map Guide — TUKUBI Help Center',
    seoDescription: 'Discover how to use the TUKUBI geospatial map to find posts, music, and events by island coordinates.',
    ctaHref: '/map',
    ctaLabel: 'Open Caribbean Map',
    sections: [
      {
        type: 'intro',
        content: 'The Caribbean Geospatial Discovery Map (/map) provides an interactive visual representation of the entire Caribbean archipelago and coastal nations, letting you explore stories by zooming into specific islands.',
      },
      {
        type: 'steps',
        title: 'Using the Map',
        steps: [
          {
            number: 1,
            title: 'Zoom and Pan',
            content: 'Navigate through the Greater Antilles, Lesser Antilles, and mainland Caribbean nations (Guyana, Suriname, Belize).',
          },
          {
            number: 2,
            title: 'Click an Island Pin',
            content: 'Selecting an island territory reveals a Discovery Drawer with active live streams, popular reels, local merchants, and diaspora communities.',
          },
        ],
      },
    ],
  },

  // 8. Explore by Vibe
  {
    slug: 'explore-by-vibe',
    title: 'Discovering Content by Caribbean Vibe',
    description: 'Filter posts, sounds, and reels by curated Caribbean vibes and moods.',
    categorySlug: 'explore',
    categoryTitle: 'Explore TUKUBI',
    featureSlug: 'explore',
    seoTitle: 'Explore by Vibe — TUKUBI Help Center',
    seoDescription: 'Find music, food, carnival, and arts content using TUKUBI Vibe filters.',
    ctaHref: '/explore',
    ctaLabel: 'Browse Vibes',
    sections: [
      {
        type: 'intro',
        content: 'Caribbean culture is defined by distinct energies. The Vibe filter groups content across all formats based on cultural mood rather than simple hashtags.',
      },
      {
        type: 'steps',
        title: 'Popular TUKUBI Vibes',
        steps: [
          {
            number: 1,
            title: 'Carnival & Mas',
            content: 'Costume designs, road march highlights, steelpan performances, and J\'ouvert coverage from regional carnivals.',
          },
          {
            number: 2,
            title: 'Island Culinary & Rum',
            content: 'Authentic Caribbean recipes, street food vendors, chefs, and traditional cooking techniques.',
          },
          {
            number: 3,
            title: 'Sounds & Riddims',
            content: 'New music releases, sound system sessions, DJ mixes, and studio sessions.',
          },
        ],
      },
    ],
  },

  // 9. Global Diaspora Hubs
  {
    slug: 'global-diaspora-hubs',
    title: 'Connecting Across Global Diaspora Hubs',
    description: 'Discover Caribbean communities, events, and businesses in NYC, Miami, Toronto, London, and beyond.',
    categorySlug: 'explore',
    categoryTitle: 'Explore TUKUBI',
    featureSlug: 'diaspora',
    seoTitle: 'Global Diaspora Hubs — TUKUBI Help Center',
    seoDescription: 'Find your home away from home with TUKUBI Diaspora Portals in major international cities.',
    ctaHref: '/diaspora',
    ctaLabel: 'View Diaspora Portal',
    sections: [
      {
        type: 'intro',
        content: 'Over ten million people of Caribbean descent live in major urban diaspora centers worldwide. TUKUBI Diaspora Hubs (/diaspora) bridge the islands with community networks in North America and Europe.',
      },
      {
        type: 'tips',
        title: 'Diaspora Hub Features',
        items: [
          'Find authentic Caribbean groceries, bakeries, and restaurants in your city.',
          'Discover local cultural events, concerts, fetes, and Independence Day galas.',
          'Connect with diaspora professionals, student associations, and cultural groups.',
        ],
      },
    ],
  },

  // 10. Create & Publish: First Post
  {
    slug: 'creating-your-first-post',
    title: 'Creating Your First Post on TUKUBI',
    description: 'Learn how to publish text updates, attach photos, tag locations, and format your content.',
    categorySlug: 'create',
    categoryTitle: 'Create & Publish',
    featureSlug: 'create',
    seoTitle: 'Creating Your First Post — TUKUBI Help Center',
    seoDescription: 'Learn how to use the Universal Composer on TUKUBI to publish posts, stories, photos, and polls.',
    ctaHref: '/create',
    ctaLabel: 'Open Create Hub',
    sections: [
      {
        type: 'intro',
        content: 'The TUKUBI Universal Composer enables you to share updates with your network in seconds. You can access it directly at the top of your Home Feed or at /create.',
      },
      {
        type: 'steps',
        title: 'Steps to Publish a Post',
        steps: [
          {
            number: 1,
            title: 'Open the Composer',
            content: 'Click the "Create Post" card or navigate to /create.',
          },
          {
            number: 2,
            title: 'Compose Your Thought',
            content: 'Type your message. You can include hashtags (#Carnival2026) and mention other members with @username.',
          },
          {
            number: 3,
            title: 'Attach Media or Polls',
            content: 'Add up to 4 high-resolution photos, short video clips, or an interactive community poll.',
          },
          {
            number: 4,
            title: 'Add a Territory Tag & Set Visibility',
            content: 'Optionally tag the Caribbean island or city, choose visibility (Public, Followers Only, or Community), and click "Publish".',
          },
        ],
      },
    ],
  },

  // 11. Uploading Photos and Videos
  {
    slug: 'uploading-photos-and-videos',
    title: 'Uploading Photos, Media & Caribbean Moments',
    description: 'Guidelines on media formats, aspect ratios, file size limits, and expiring Moments stories.',
    categorySlug: 'create',
    categoryTitle: 'Create & Publish',
    featureSlug: 'create',
    seoTitle: 'Media Upload Guidelines — TUKUBI Help Center',
    seoDescription: 'Supported image and video formats, file sizes, and 24-hour Moments on TUKUBI.',
    ctaHref: '/create',
    ctaLabel: 'Upload Media',
    sections: [
      {
        type: 'intro',
        content: 'TUKUBI supports high-quality imagery and video optimized for island mobile connections with progressive encoding and CDN delivery.',
      },
      {
        type: 'tips',
        title: 'Recommended Media Specifications',
        items: [
          'Photos: JPEG, PNG, or WebP up to 15MB. Best aspect ratio: 1:1 square or 4:5 vertical.',
          'Videos: MP4 or MOV up to 500MB (up to 10 minutes for standard posts).',
          'Moments: 9:16 vertical stories that expire automatically after 24 hours.',
        ],
      },
    ],
  },

  // 12. Using the TUKUBI Camera
  {
    slug: 'using-the-tukubi-camera',
    title: 'Using the Universal TUKUBI Camera & Studio Controls',
    description: 'Capture photo and video directly in-app with Caribbean lens filters and caption overlays.',
    categorySlug: 'create',
    categoryTitle: 'Create & Publish',
    featureSlug: 'create',
    seoTitle: 'TUKUBI Camera Controls — Help Center',
    seoDescription: 'Learn how to capture and enhance photos and video using TUKUBI in-browser camera tools.',
    ctaHref: '/create',
    ctaLabel: 'Launch Camera',
    sections: [
      {
        type: 'intro',
        content: 'The TUKUBI camera tool integrates directly with your mobile or desktop webcam to record quick video clips, capture photos, and prepare Reels without external editing tools.',
      },
      {
        type: 'steps',
        title: 'Using In-App Capture',
        steps: [
          {
            number: 1,
            title: 'Grant Permissions',
            content: 'When prompted, allow camera and microphone access in your browser.',
          },
          {
            number: 2,
            title: 'Record or Snap',
            content: 'Hold the capture button for video recording or tap once for a still photo.',
          },
          {
            number: 3,
            title: 'Preview and Trim',
            content: 'Review your clip, add text overlays or sound tracks, and export directly to your post draft.',
          },
        ],
      },
    ],
  },

  // 13. Creating and Publishing a Reel
  {
    slug: 'creating-and-publishing-a-reel',
    title: 'Creating and Publishing a Caribbean Reel',
    description: 'Produce vertical short-form video reels with background audio tracks, tags, and captions.',
    categorySlug: 'reels-video',
    categoryTitle: 'Reels & Video',
    featureSlug: 'reels',
    seoTitle: 'Creating Caribbean Reels — TUKUBI Help Center',
    seoDescription: 'How to make, edit, and post vertical Reels on TUKUBI with authentic Caribbean sounds.',
    ctaHref: '/reels',
    ctaLabel: 'Go to Reels',
    sections: [
      {
        type: 'intro',
        content: 'Reels are 9:16 vertical short-form videos up to 90 seconds in length. They appear in the dedicated Reels theater at /reels and can be discovered by millions across the Caribbean diaspora.',
      },
      {
        type: 'steps',
        title: 'How to Publish a Reel',
        steps: [
          {
            number: 1,
            title: 'Navigate to Reels or Create Hub',
            content: 'In /reels, tap the camera/plus icon or visit /create and select the "Reel" format.',
          },
          {
            number: 2,
            title: 'Upload or Record Vertical Video',
            content: 'Select a 9:16 video clip up to 90 seconds in length.',
          },
          {
            number: 3,
            title: 'Select a Caribbean Sound',
            content: 'Browse the Caribbean Sounds directory to attach an official Soca, Dancehall, Kompa, or Reggae audio track.',
          },
          {
            number: 4,
            title: 'Tag Territory and Publish',
            content: 'Add an engaging title, credit performers, tag your island territory, and publish to the public feed.',
          },
        ],
      },
    ],
  },

  // 14. Reels Discovery & Experience
  {
    slug: 'reels-discovery-and-experience',
    title: 'Discovering, Watching & Interacting with Reels',
    description: 'Learn how to swipe through vertical video, like, comment, share, and save original Caribbean audio.',
    categorySlug: 'reels-video',
    categoryTitle: 'Reels & Video',
    featureSlug: 'reels',
    seoTitle: 'Watching & Interacting with Reels — TUKUBI Help',
    seoDescription: 'Navigate the full-screen TUKUBI Reels feed with gesture controls and audio bookmarks.',
    ctaHref: '/reels',
    ctaLabel: 'Watch Reels',
    sections: [
      {
        type: 'intro',
        content: 'The TUKUBI Reels feed at /reels offers an immersive vertical viewing experience with keyboard and gesture support.',
      },
      {
        type: 'tips',
        title: 'Reels Controls & Shortcuts',
        items: [
          'Swipe Up / Down (or use Arrow keys) to navigate between reels.',
          'Double-tap on the video to instantly like.',
          'Tap the Sound Pill at the bottom right to view all reels using that same Caribbean sound.',
          'Tap the Share icon to copy a direct link or send to a member via Direct Message.',
        ],
      },
    ],
  },

  // 15. Caribbean Sounds in Reels
  {
    slug: 'caribbean-sounds-in-reels',
    title: 'Adding Caribbean Sounds to Your Posts & Reels',
    description: 'Browse the Caribbean Sounds library, preview tracks, and attach authentic audio to your creations.',
    categorySlug: 'reels-video',
    categoryTitle: 'Reels & Video',
    featureSlug: 'sounds',
    seoTitle: 'Caribbean Sounds Directory Guide — TUKUBI Help',
    seoDescription: 'Discover how to use authentic Caribbean tracks and artist audio in your TUKUBI reels.',
    ctaHref: '/sounds',
    ctaLabel: 'Explore Caribbean Sounds',
    sections: [
      {
        type: 'intro',
        content: 'The Caribbean Sounds Directory (/sounds) catalogues verified audio tracks across Caribbean genres including Soca, Calypso, Dancehall, Reggae, Kompa, Zouk, Bouyon, and Parang.',
      },
      {
        type: 'steps',
        title: 'Using a Sound',
        steps: [
          {
            number: 1,
            title: 'Browse or Search Sounds',
            content: 'Visit /sounds and search by song title, producer, artist, or genre.',
          },
          {
            number: 2,
            title: 'Preview Audio',
            content: 'Tap the play button to hear a high-fidelity preview snippet.',
          },
          {
            number: 3,
            title: 'Click "Use This Sound"',
            content: 'This opens the Reel creator pre-loaded with the selected audio track.',
          },
        ],
      },
    ],
  },

  // 16. Live: Going Live on TUKUBI
  {
    slug: 'going-live-on-tukubi',
    title: 'Going Live on TUKUBI: Broadcast Guide',
    description: 'How to initiate an interactive live stream, manage chat, and host guest viewers.',
    categorySlug: 'live',
    categoryTitle: 'Live',
    featureSlug: 'live',
    seoTitle: 'How to Go Live on TUKUBI — Broadcaster Guide',
    seoDescription: 'Step-by-step instructions for streaming live video to Caribbean audiences on TUKUBI.',
    ctaHref: '/live',
    ctaLabel: 'Go to Live Hub',
    sections: [
      {
        type: 'intro',
        content: 'Live streaming on TUKUBI (/live) allows creators, musicians, cultural commentators, and businesses to connect in real time with diaspora audiences worldwide.',
      },
      {
        type: 'steps',
        title: 'Starting a Live Broadcast',
        steps: [
          {
            number: 1,
            title: 'Open the Live Broadcast Studio',
            content: 'Go to /live and select "Go Live" or navigate to /live/broadcast.',
          },
          {
            number: 2,
            title: 'Configure Stream Details',
            content: 'Enter a stream title, select a category (Culture, Music, Gaming, News, Food), and set optional territory tags.',
          },
          {
            number: 3,
            title: 'Check Camera & Audio Levels',
            content: 'Verify your microphone input and camera lighting before going public.',
          },
          {
            number: 4,
            title: 'Tap "Go Live"',
            content: 'Your stream is instantly published to the Live directory and your followers receive a notification.',
          },
        ],
      },
      {
        type: 'note',
        content: 'Viewers can send comments, heart reactions, and Live Gifts in real time, which credit your Creator balance in the Financial Center.',
      },
    ],
  },

  // 17. Discovering & Watching Live Streams
  {
    slug: 'discovering-and-watching-live-streams',
    title: 'Discovering & Interacting in Live Streams',
    description: 'Find active broadcasts, send live chat messages, and support broadcasters with gifts.',
    categorySlug: 'live',
    categoryTitle: 'Live',
    featureSlug: 'live',
    seoTitle: 'Watching Live Streams — TUKUBI Help Center',
    seoDescription: 'How to discover active Caribbean live broadcasts and participate in live chat.',
    ctaHref: '/live',
    ctaLabel: 'Browse Active Streams',
    sections: [
      {
        type: 'intro',
        content: 'Explore active broadcasts on the /live hub. Filter by island, genre, or search for your favorite creator.',
      },
      {
        type: 'tips',
        title: 'Viewer Guidelines & Chat Rules',
        items: [
          'Be respectful in live chat — hate speech and harassment result in immediate stream bans.',
          'Tap the heart icon repeatedly to send visual love to the broadcaster.',
          'Follow the broadcaster directly from the stream player header.',
        ],
      },
    ],
  },

  // 18. Podcasts Guide
  {
    slug: 'tukubi-podcasts-guide',
    title: 'TUKUBI Podcasts: Discover, Listen & Host Shows',
    description: 'Complete guide to the Caribbean Podcast Network: streaming episodes, following shows, and publishing your podcast.',
    categorySlug: 'podcasts',
    categoryTitle: 'Podcasts',
    featureSlug: 'podcasts',
    seoTitle: 'TUKUBI Podcast Network Guide — Help Center',
    seoDescription: 'Discover Caribbean audio shows, background playback, and podcast hosting on TUKUBI.',
    ctaHref: '/podcasts',
    ctaLabel: 'Browse Podcasts',
    sections: [
      {
        type: 'intro',
        content: 'The TUKUBI Podcasts Network (/podcasts) celebrates Caribbean oral storytelling, journalism, music history, and diaspora conversations.',
      },
      {
        type: 'steps',
        title: 'Listening to Podcasts',
        steps: [
          {
            number: 1,
            title: 'Browse by Category or Territory',
            content: 'Filter episodes across News & Politics, Soca & Dancehall History, Comedy, Business, and Culture.',
          },
          {
            number: 2,
            title: 'In-Browser Audio Player',
            content: 'Tap play on any episode to enjoy uninterrupted background playback while you continue browsing other pages.',
          },
          {
            number: 3,
            title: 'Host Your Own Show',
            content: 'Creators can publish episodes with MP3 audio, episode artwork, show notes, and automatically generated public RSS feeds.',
          },
        ],
      },
    ],
  },

  // 19. Joining & Participating in Communities
  {
    slug: 'joining-and-participating-in-communities',
    title: 'Finding, Joining & Participating in Communities',
    description: 'Learn how to discover Diaspora Hubs, join public and private groups, and participate in discussions.',
    categorySlug: 'communities',
    categoryTitle: 'Communities',
    featureSlug: 'communities',
    seoTitle: 'Communities & Diaspora Hubs Guide — TUKUBI Help',
    seoDescription: 'Join Caribbean communities based on island heritage, profession, arts, or hometown.',
    ctaHref: '/communities',
    ctaLabel: 'Find Communities',
    sections: [
      {
        type: 'intro',
        content: 'TUKUBI Communities (/communities) are diaspora hubs organized around shared islands, interests, university alumni, and regional causes.',
      },
      {
        type: 'steps',
        title: 'Community Join Policies',
        steps: [
          {
            number: 1,
            title: 'Public Hubs',
            content: 'Anyone can join instantly by clicking "Join Community". All posts are visible to members.',
          },
          {
            number: 2,
            title: 'Private Hubs',
            content: 'Requires submitting a join request to community moderators. Content is only visible to approved members.',
          },
          {
            number: 3,
            title: 'Invite Only',
            content: 'Requires an invitation from an existing member or administrator.',
          },
        ],
      },
    ],
  },

  // 20. Finding and Messaging a Member
  {
    slug: 'finding-and-messaging-a-member',
    title: 'Finding and Messaging a Caribbean Member',
    description: 'How to search for people, start direct messages, and manage message requests.',
    categorySlug: 'messaging',
    categoryTitle: 'Messaging',
    featureSlug: 'messages',
    seoTitle: 'Direct Messaging Guide — TUKUBI Help Center',
    seoDescription: 'Start private conversations, send photos and voice notes on TUKUBI Messages.',
    ctaHref: '/messages',
    ctaLabel: 'Open Messages',
    sections: [
      {
        type: 'intro',
        content: 'TUKUBI Messages (/messages) provides encrypted, realtime communication between members with voice notes, photo sharing, and group chats.',
      },
      {
        type: 'steps',
        title: 'Starting a Conversation',
        steps: [
          {
            number: 1,
            title: 'From a Member Profile',
            content: 'Visit any member\'s profile page and click the "Message" button.',
          },
          {
            number: 2,
            title: 'From the Messages Center',
            content: 'Go to /messages, tap the new message compose icon, and search for a member by display name or @username.',
          },
          {
            number: 3,
            title: 'Voice Notes & Media',
            content: 'Tap the microphone icon to record a voice message, or the paperclip icon to send images.',
          },
        ],
      },
    ],
  },

  // 21. Group Conversations Guide
  {
    slug: 'group-conversations-guide',
    title: 'Starting & Managing Group Conversations',
    description: 'Create group chats with friends, event organizers, or community members on TUKUBI.',
    categorySlug: 'messaging',
    categoryTitle: 'Messaging',
    featureSlug: 'messages',
    seoTitle: 'Group Chat Guide — TUKUBI Help Center',
    seoDescription: 'How to create and manage group direct messages with up to 50 Caribbean members.',
    ctaHref: '/messages',
    ctaLabel: 'Go to Messages',
    sections: [
      {
        type: 'intro',
        content: 'Group chats allow multiple members to coordinate event plans, discuss carnival troupes, or organize business collaborations.',
      },
      {
        type: 'steps',
        title: 'Creating a Group Chat',
        steps: [
          {
            number: 1,
            title: 'Select "New Group"',
            content: 'In /messages, choose "New Group" from the conversation menu.',
          },
          {
            number: 2,
            title: 'Add Participants',
            content: 'Select friends or members from your contacts list.',
          },
          {
            number: 3,
            title: 'Name Your Group',
            content: 'Give your group an identifiable name (e.g. "Trinidad Carnival 2026 Crew").',
          },
        ],
      },
    ],
  },

  // 22. Message Requests & Privacy
  {
    slug: 'message-requests-and-privacy',
    title: 'Message Requests, Notifications & Privacy',
    description: 'Control who can send you direct messages and how to handle incoming message requests from people you do not follow.',
    categorySlug: 'messaging',
    categoryTitle: 'Messaging',
    featureSlug: 'messages',
    seoTitle: 'Message Privacy & Requests — TUKUBI Help',
    seoDescription: 'Protect your inbox with TUKUBI Message Requests and privacy filters.',
    ctaHref: '/settings',
    ctaLabel: 'Manage Privacy Settings',
    sections: [
      {
        type: 'intro',
        content: 'To prevent unwanted spam and maintain a respectful community, messages from users you do not follow or who are not mutual friends are routed to your "Message Requests" tab.',
      },
      {
        type: 'tips',
        title: 'Managing Message Requests',
        items: [
          'Preview messages without the sender knowing you have read them.',
          'Click "Accept" to move the thread into your primary inbox.',
          'Click "Decline" or "Block" to prevent further communication.',
        ],
      },
    ],
  },

  // 23. Creator Hub Overview
  {
    slug: 'creator-hub-overview',
    title: 'TUKUBI Creator Hub: Your Creative Home & Audience Base',
    description: 'Explore the Creator Hub at /creator-hub — manage your creator identity, view audience metrics, and find brand deals.',
    categorySlug: 'creators',
    categoryTitle: 'Creators',
    featureSlug: 'creator-hub',
    seoTitle: 'Creator Hub Overview — TUKUBI Creator Ecosystem',
    seoDescription: 'Your home base for Caribbean creators: audience growth, brand sponsorships, and creative identity.',
    ctaHref: '/creator-hub',
    ctaLabel: 'Open Creator Hub',
    sections: [
      {
        type: 'intro',
        content: 'The TUKUBI Creator Hub (/creator-hub) is the community, audience, and commercial gateway for Caribbean digital pioneers. It serves as your public creator presence and provides a high-level summary of your earnings, subscribers, and brand partnerships.',
      },
      {
        type: 'steps',
        title: 'Four Core Pillars of Creator Hub',
        steps: [
          {
            number: 1,
            title: 'Creator Identity',
            content: 'Manage your creator category (Storyteller, Musician, Chef, Podcaster, Visual Artist) and KYC verification status.',
          },
          {
            number: 2,
            title: 'Creator Network',
            content: 'Monitor follower growth, active subscriber counts, total likes received, and audience geography.',
          },
          {
            number: 3,
            title: 'Creator Business',
            content: 'Check your available balance, payout thresholds, active subscription tiers, and ledger settlement status.',
          },
          {
            number: 4,
            title: 'Brand Briefs & Opportunities',
            content: 'Review and apply for sponsorship campaigns posted by Caribbean tourism boards, telecommunications providers, and regional brands.',
          },
        ],
      },
    ],
  },

  // 24. Creator Studio Workspace
  {
    slug: 'creator-studio-workspace',
    title: 'TUKUBI Creator Studio: Professional Content Workspace',
    description: 'Master the professional studio at /creator-studio: manage videos, monitor podcast analytics, and automate repurposing with CaribAI.',
    categorySlug: 'creators',
    categoryTitle: 'Creators',
    featureSlug: 'creator-studio',
    seoTitle: 'Creator Studio Workspace Guide — TUKUBI Help',
    seoDescription: 'Manage multi-format publications, audience retention, and AI tools in TUKUBI Creator Studio.',
    ctaHref: '/creator-studio',
    ctaLabel: 'Enter Creator Studio',
    sections: [
      {
        type: 'intro',
        content: 'While Creator Hub is your home base, TUKUBI Creator Studio (/creator-studio) is your professional content operating system. It provides granular management across all published and drafted videos, podcasts, and livestreams.',
      },
      {
        type: 'tips',
        title: 'Key Creator Studio Tools',
        items: [
          'Drafts Manager: Save multi-format posts and edit before scheduling.',
          'Repurpose with CaribAI: Transform long-form podcasts and streams into bite-sized Reels and quotes automatically.',
          'Monetization Manager: Configure fan tiers and track double-entry ledger transactions.',
        ],
      },
    ],
  },

  // 25. Creator Hub vs Creator Studio
  {
    slug: 'creator-hub-vs-creator-studio',
    title: 'Creator Hub vs. Creator Studio: Understanding the Difference',
    description: 'Learn when to use Creator Hub (/creator-hub) and when to use Creator Studio (/creator-studio).',
    categorySlug: 'creators',
    categoryTitle: 'Creators',
    featureSlug: 'creators',
    seoTitle: 'Creator Hub vs Creator Studio — What is the Difference?',
    seoDescription: 'Clarifying the two creator surfaces on TUKUBI: audience home base vs professional production studio.',
    ctaHref: '/creator-hub',
    ctaLabel: 'Explore Creator Hub',
    sections: [
      {
        type: 'intro',
        content: 'TUKUBI has two distinct creator surfaces designed for different phases of your creative journey. Here is how they compare.',
      },
      {
        type: 'steps',
        title: 'Comparing the Two Experiences',
        steps: [
          {
            number: 1,
            title: 'Creator Hub (/creator-hub)',
            content: 'Your public identity, audience statistics, brand deals, onboarding, and Creator Academy resources. Think of it as your Creator Profile and Business Dashboard.',
          },
          {
            number: 2,
            title: 'Creator Studio (/creator-studio)',
            content: 'Your working desk: editing video drafts, scheduling podcast releases, viewing viewer retention drop-off graphs, and automated video repurposing.',
          },
        ],
      },
    ],
  },

  // 26. Creator Monetization & Subscriptions
  {
    slug: 'creator-monetization-and-subscriptions',
    title: 'Fan Subscriptions, Tipping & Creator Monetization',
    description: 'How to monetize your Caribbean creative content with tiered memberships, direct tips, and payouts.',
    categorySlug: 'creators',
    categoryTitle: 'Creators',
    featureSlug: 'monetization',
    seoTitle: 'Creator Monetization & Fan Subscriptions — TUKUBI Help',
    seoDescription: 'Learn how to set up paid subscriber tiers, receive tips, and withdraw funds to your bank account.',
    ctaHref: '/financial-center/creator',
    ctaLabel: 'Open Financial Center',
    sections: [
      {
        type: 'intro',
        content: 'TUKUBI provides multiple direct monetization channels built on a secure double-entry financial ledger.',
      },
      {
        type: 'steps',
        title: 'Monetization Channels',
        steps: [
          {
            number: 1,
            title: 'Fan Subscriptions',
            content: 'Set up recurring monthly tiers ($2.99 to $9.99/mo) granting subscribers exclusive badge colors, private community access, and behind-the-scenes posts.',
          },
          {
            number: 2,
            title: 'Creator Tips',
            content: 'Fans can send one-time tips directly on your posts, profile, or podcast episodes using credit/debit cards or supported digital wallets.',
          },
          {
            number: 3,
            title: 'Live Stream Gifts',
            content: 'Viewers purchase virtual gifts during live broadcasts that convert directly to ledger credits.',
          },
        ],
      },
    ],
  },

  // 27. Browsing and Buying on Marketplace
  {
    slug: 'browsing-and-buying-on-marketplace',
    title: 'Browsing & Buying Authentic Goods on Marketplace',
    description: 'Find authentic Caribbean fashion, spices, craft goods, and services on the TUKUBI Marketplace.',
    categorySlug: 'marketplace',
    categoryTitle: 'Marketplace',
    featureSlug: 'marketplace',
    seoTitle: 'Marketplace Buyer Guide — TUKUBI Help Center',
    seoDescription: 'How to browse, search, and safely purchase authentic Caribbean goods on TUKUBI.',
    ctaHref: '/marketplace',
    ctaLabel: 'Open Marketplace',
    sections: [
      {
        type: 'intro',
        content: 'TUKUBI Marketplace (/marketplace) connects buyers worldwide with verified artisans, designers, authors, and merchants across the Caribbean region.',
      },
      {
        type: 'steps',
        title: 'How to Purchase an Item',
        steps: [
          {
            number: 1,
            title: 'Search or Filter by Island Territory',
            content: 'Find authentic Jamaican coffee, Trinidadian hot sauces, Barbadian fashion, or Haitian art.',
          },
          {
            number: 2,
            title: 'Review Product & Seller Details',
            content: 'Check seller ratings, verified merchant status, shipping policies, and estimated delivery times.',
          },
          {
            number: 3,
            title: 'Secure Checkout',
            content: 'Pay safely using major credit/debit cards or connected digital payment methods. All payments are protected by escrow and buyer dispute guarantees.',
          },
        ],
      },
    ],
  },

  // 28. Selling on TUKUBI Marketplace
  {
    slug: 'selling-on-tukubi-marketplace',
    title: 'Becoming a Merchant & Selling on TUKUBI Marketplace',
    description: 'Register as a seller, list products, configure shipping, and open your bespoke storefront.',
    categorySlug: 'marketplace',
    categoryTitle: 'Marketplace',
    featureSlug: 'marketplace',
    seoTitle: 'Seller & Merchant Guide — TUKUBI Marketplace',
    seoDescription: 'Start selling Caribbean products to local and global diaspora customers on TUKUBI.',
    ctaHref: '/marketplace/seller-center',
    ctaLabel: 'Open Seller Center',
    sections: [
      {
        type: 'intro',
        content: 'Whether you run an island boutique or an international diaspora shipping business, TUKUBI Seller Center gives you the tools to list products, manage inventory, and receive secure payouts.',
      },
      {
        type: 'steps',
        title: 'Opening Your Storefront',
        steps: [
          {
            number: 1,
            title: 'Apply for Merchant Verification',
            content: 'Visit /marketplace/seller-center and provide basic business information and payout details.',
          },
          {
            number: 2,
            title: 'Create Your Product Listings',
            content: 'Upload high-resolution photos, describe dimensions, materials, and set inventory counts.',
          },
          {
            number: 3,
            title: 'Customize Your Storefront',
            content: 'Configure your custom storefront URL at /store/[your-brand] with branded banners and featured collections.',
          },
        ],
      },
    ],
  },

  // 29. Managing Orders and Payments
  {
    slug: 'managing-orders-and-payments',
    title: 'Managing Orders, Customer Requests & Delivery',
    description: 'Track shipments, fulfill customer orders, manage refunds, and handle buyer inquiries.',
    categorySlug: 'marketplace',
    categoryTitle: 'Marketplace',
    featureSlug: 'marketplace',
    seoTitle: 'Order Fulfillment & Dispute Resolution — TUKUBI Help',
    seoDescription: 'Guide to order management, shipping tracking, and resolution policies for TUKUBI sellers.',
    ctaHref: '/marketplace/orders',
    ctaLabel: 'View Orders',
    sections: [
      {
        type: 'intro',
        content: 'Keep buyers satisfied and build a 5-star seller reputation by tracking fulfillment promptly at /marketplace/orders.',
      },
      {
        type: 'tips',
        title: 'Fulfillment Best Practices',
        items: [
          'Update tracking numbers within 48 hours of receiving an order.',
          'Respond to buyer messages within 24 business hours.',
          'In case of shipping delays, proactively notify the buyer through TUKUBI Messages.',
        ],
      },
    ],
  },

  // 30. Financial Center Overview
  {
    slug: 'financial-center-overview',
    title: 'Your Financial Center: Double-Entry Ledger & Balances',
    description: 'An overview of the TUKUBI Financial Center — ledger accounts, transaction histories, and security standards.',
    categorySlug: 'financial-center',
    categoryTitle: 'Financial Center',
    featureSlug: 'financial-center',
    seoTitle: 'Financial Center Overview — TUKUBI Help Center',
    seoDescription: 'Understand your TUKUBI Financial Center ledger accounts, transaction safety, and balance records.',
    ctaHref: '/financial-center',
    ctaLabel: 'Open Financial Center',
    sections: [
      {
        type: 'intro',
        content: 'The TUKUBI Financial Center (/financial-center) is the unified command center for all monetary activity on TUKUBI. It replaces legacy fragmented wallets with an enterprise-grade double-entry accounting ledger.',
      },
      {
        type: 'steps',
        title: 'Financial Center Structure',
        steps: [
          {
            number: 1,
            title: 'Double-Entry Ledger Architecture',
            content: 'Every single dollar or cent transacted on TUKUBI is backed by paired credit/debit records with strict cryptographic audit trails. Account balances are never mutable columns.',
          },
          {
            number: 2,
            title: 'Account Types',
            content: 'View separate ledger accounts for Buyer balances, Creator Pending balances, and Merchant settlements.',
          },
          {
            number: 3,
            title: 'Statements & Tax Records',
            content: 'Export monthly PDF statements and transaction records for accounting and tax compliance.',
          },
        ],
      },
      {
        type: 'note',
        content: 'TUKUBI strictly enforces Fortune-100 financial security. We never store raw credit card numbers or private CVVs on our servers.',
      },
    ],
  },

  // 31. Understanding Transactions & Payouts
  {
    slug: 'understanding-transactions-and-payouts',
    title: 'Managing Payment Methods, Transactions & Creator Payouts',
    description: 'Learn how to add payment methods, initiate bank transfers, and track settlement timelines.',
    categorySlug: 'financial-center',
    categoryTitle: 'Financial Center',
    featureSlug: 'financial-center',
    seoTitle: 'Transactions & Payouts Guide — TUKUBI Financial Center',
    seoDescription: 'How to manage payment methods, withdrawal schedules, and bank account connections on TUKUBI.',
    ctaHref: '/financial-center/transactions',
    ctaLabel: 'View Transactions',
    sections: [
      {
        type: 'intro',
        content: 'Manage your payment methods and withdrawal destinations at /financial-center/payment-methods and /financial-center/transfers.',
      },
      {
        type: 'steps',
        title: 'How Payouts Work',
        steps: [
          {
            number: 1,
            title: 'Reach Payout Threshold',
            content: 'Creator accounts have a default minimum payout threshold (typically $50 USD). Once your available balance exceeds this amount, you can request a transfer.',
          },
          {
            number: 2,
            title: 'Supported Payout Rails',
            content: 'Funds can be transferred to connected local Caribbean bank accounts (via WiPay, CX Pay, or direct ACH/wire) or international bank accounts.',
          },
          {
            number: 3,
            title: 'Settlement Timelines',
            content: 'Standard electronic bank transfers typically clear within 2 to 5 business days depending on your local financial institution.',
          },
        ],
      },
    ],
  },

  // 32. Privacy, Security & Troubleshooting
  {
    slug: 'privacy-security-and-blocking',
    title: 'Privacy Controls, Account Security & Reporting Content',
    description: 'Keep your account safe: two-factor authentication, blocking and muting members, and submitting moderation reports.',
    categorySlug: 'privacy-security',
    categoryTitle: 'Privacy & Security',
    featureSlug: 'settings',
    seoTitle: 'Privacy, Security & Reporting — TUKUBI Help Center',
    seoDescription: 'Comprehensive guide to security, blocking abusive accounts, and submitting content reports on TUKUBI.',
    ctaHref: '/settings',
    ctaLabel: 'Go to Security Settings',
    sections: [
      {
        type: 'intro',
        content: 'TUKUBI is dedicated to fostering a welcoming, culturally respectful, and secure digital environment for all Caribbean people and allies. You have full control over your visibility and safety.',
      },
      {
        type: 'steps',
        title: 'Safety Tools & Actions',
        steps: [
          {
            number: 1,
            title: 'Blocking an Account',
            content: 'When you block a user, they cannot view your profile, see your posts, or send you messages. Visit their profile, tap the three dots menu, and select "Block Member".',
          },
          {
            number: 2,
            title: 'Reporting Abusive Content',
            content: 'Tap the report icon on any post, comment, reel, or message to flag hate speech, harassment, fraud, or copyright violations to the TUKUBI Trust & Safety team.',
          },
          {
            number: 3,
            title: 'Private Account Mode',
            content: 'In /settings, toggle "Private Profile" to require manual approval for all new followers.',
          },
        ],
      },
      {
        type: 'troubleshooting',
        title: 'Common Security & Access Questions',
        faqs: [
          {
            question: 'I forgot my password. How do I reset it?',
            answer: 'Navigate to /forgot-password, enter your registered email address, and click "Send Reset Link". You will receive an email with instructions to choose a new password.',
          },
          {
            question: 'How do I change my email address or phone number?',
            answer: 'Go to Settings > Account (/settings) to update your registered email or notification phone number.',
          },
        ],
      },
    ],
  },
];

export function getArticleBySlug(slug: string): HelpArticleDefinition | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(categorySlug: string): HelpArticleDefinition[] {
  return HELP_ARTICLES.filter((a) => a.categorySlug === categorySlug);
}

export function searchArticles(query: string, limit = 10): HelpArticleDefinition[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return HELP_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.categoryTitle.toLowerCase().includes(q) ||
      a.slug.includes(q) ||
      a.sections.some(
        (s) =>
          (s.content && s.content.toLowerCase().includes(q)) ||
          (s.steps && s.steps.some((st) => st.title.toLowerCase().includes(st.title) || st.content.toLowerCase().includes(q)))
      )
  ).slice(0, limit);
}
