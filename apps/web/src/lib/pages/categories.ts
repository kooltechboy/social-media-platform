export interface UniversalPageCategory {
  id: string;
  groupKey: PageCategoryGroupKey;
  groupName: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
}

export type PageCategoryGroupKey =
  | 'creator'
  | 'business'
  | 'media'
  | 'community'
  | 'education'
  | 'institution'
  | 'sports'
  | 'faith'
  | 'events'
  | 'travel'
  | 'technology'
  | 'other';

export interface PageCategoryGroup {
  key: PageCategoryGroupKey;
  name: string;
  description: string;
  iconName: string;
  categories: UniversalPageCategory[];
}

export const UNIVERSAL_CATEGORY_GROUPS: PageCategoryGroup[] = [
  {
    key: 'creator',
    name: 'People & Creator',
    description: 'Artists, musicians, performers, authors, influencers, and independent professionals.',
    iconName: 'Sparkles',
    categories: [
      { id: 'creator-general', groupKey: 'creator', groupName: 'People & Creator', slug: 'creator-general', name: 'Creator', description: 'Digital creators and cultural storytellers', iconName: 'Sparkles' },
      { id: 'artist', groupKey: 'creator', groupName: 'People & Creator', slug: 'artist', name: 'Artist & Visualist', description: 'Painters, sculptors, visual artists, and designers', iconName: 'Palette' },
      { id: 'musician', groupKey: 'creator', groupName: 'People & Creator', slug: 'musician', name: 'Musician & DJ', description: 'Reggae, Soca, Dancehall, Calypso, and global performers', iconName: 'Music' },
      { id: 'producer', groupKey: 'creator', groupName: 'People & Creator', slug: 'producer', name: 'Music & Audio Producer', description: 'Beatmakers, audio engineers, and sound innovators', iconName: 'Radio' },
      { id: 'writer-author', groupKey: 'creator', groupName: 'People & Creator', slug: 'writer-author', name: 'Writer & Author', description: 'Poets, authors, journalists, and diaspora chroniclers', iconName: 'BookOpen' },
      { id: 'influencer-personality', groupKey: 'creator', groupName: 'People & Creator', slug: 'influencer-personality', name: 'Public Figure & Personality', description: 'Personalities, speakers, and public ambassadors', iconName: 'UserCheck' },
      { id: 'professional-freelancer', groupKey: 'creator', groupName: 'People & Creator', slug: 'professional-freelancer', name: 'Professional & Consultant', description: 'Independent advisors, culinary chefs, and specialists', iconName: 'Briefcase' },
    ],
  },
  {
    key: 'business',
    name: 'Business & Commerce',
    description: 'Enterprises, island brands, restaurants, retail shops, hotels, and service providers.',
    iconName: 'Building2',
    categories: [
      { id: 'business-company', groupKey: 'business', groupName: 'Business & Commerce', slug: 'business-company', name: 'Business & Company', description: 'Caribbean commercial enterprises and agencies', iconName: 'Building2' },
      { id: 'brand', groupKey: 'business', groupName: 'Business & Commerce', slug: 'brand', name: 'Brand & Product Line', description: 'Apparel, rum distillers, artisan goods, and lifestyle labels', iconName: 'Tag' },
      { id: 'retail-store', groupKey: 'business', groupName: 'Business & Commerce', slug: 'retail-store', name: 'Store & Shop', description: 'Retail storefronts, boutiques, and island markets', iconName: 'Store' },
      { id: 'restaurant-cafe', groupKey: 'business', groupName: 'Business & Commerce', slug: 'restaurant-cafe', name: 'Restaurant & Café', description: 'Island dining, bakeries, jerk centres, and bistros', iconName: 'Utensils' },
      { id: 'food-beverage', groupKey: 'business', groupName: 'Business & Commerce', slug: 'food-beverage', name: 'Food & Beverage Producer', description: 'Specialty coffee, sauces, sea moss, and food craft', iconName: 'Wine' },
      { id: 'service-provider', groupKey: 'business', groupName: 'Business & Commerce', slug: 'service-provider', name: 'Service Provider', description: 'Maintenance, trade crafts, salons, and beauty services', iconName: 'Wrench' },
      { id: 'real-estate-construction', groupKey: 'business', groupName: 'Business & Commerce', slug: 'real-estate-construction', name: 'Real Estate & Construction', description: 'Property developers, brokers, and island contractors', iconName: 'Home' },
      { id: 'transport-logistics', groupKey: 'business', groupName: 'Business & Commerce', slug: 'transport-logistics', name: 'Transportation & Logistics', description: 'Shipping lines, barrel services, couriers, and taxi charters', iconName: 'Truck' },
      { id: 'hospitality-hotel', groupKey: 'business', groupName: 'Business & Commerce', slug: 'hospitality-hotel', name: 'Hospitality & Resort', description: 'Boutique hotels, villas, guest houses, and eco-lodges', iconName: 'Hotel' },
    ],
  },
  {
    key: 'media',
    name: 'Media & Entertainment',
    description: 'Newsrooms, radio stations, podcasts, record labels, and entertainment channels.',
    iconName: 'Tv',
    categories: [
      { id: 'media-org', groupKey: 'media', groupName: 'Media & Entertainment', slug: 'media-org', name: 'Media Organization & News', description: 'Island publications, digital journalism, and broadcast news', iconName: 'Tv' },
      { id: 'podcast-show', groupKey: 'media', groupName: 'Media & Entertainment', slug: 'podcast-show', name: 'Podcast & Show', description: 'Diaspora discussions, audio series, and talk programs', iconName: 'Mic' },
      { id: 'radio-station', groupKey: 'media', groupName: 'Media & Entertainment', slug: 'radio-station', name: 'Radio Station', description: 'Online and FM stations streaming Caribbean riddims', iconName: 'Radio' },
      { id: 'record-label', groupKey: 'media', groupName: 'Media & Entertainment', slug: 'record-label', name: 'Record Label & Music House', description: 'Music imprints, sound systems, and management houses', iconName: 'Disc' },
      { id: 'film-production', groupKey: 'media', groupName: 'Media & Entertainment', slug: 'film-production', name: 'Film & Production Company', description: 'Video studios, cinema directors, and documentary creators', iconName: 'Film' },
    ],
  },
  {
    key: 'community',
    name: 'Community & Culture',
    description: 'Heritage foundations, carnival mas bands, steelpan orchestras, and diaspora clubs.',
    iconName: 'Users',
    categories: [
      { id: 'community-group', groupKey: 'community', groupName: 'Community & Culture', slug: 'community-group', name: 'Community Organization', description: 'Civic associations, diaspora hubs, and social clubs', iconName: 'Users' },
      { id: 'heritage-arts', groupKey: 'community', groupName: 'Community & Culture', slug: 'heritage-arts', name: 'Carnival Mas Band & Steel Orchestra', description: 'Carnival troupes, pan yards, and cultural preservation trusts', iconName: 'Flag' },
      { id: 'diaspora-org', groupKey: 'community', groupName: 'Community & Culture', slug: 'diaspora-org', name: 'Diaspora Association', description: 'Organizations linking Caribbean islanders in North America & Europe', iconName: 'Globe' },
    ],
  },
  {
    key: 'education',
    name: 'Education',
    description: 'Schools, universities, research academies, training organizations, and educational initiatives.',
    iconName: 'GraduationCap',
    categories: [
      { id: 'school-university', groupKey: 'education', groupName: 'Education', slug: 'school-university', name: 'School & University', description: 'Primary, secondary, and tertiary academic institutions', iconName: 'GraduationCap' },
      { id: 'training-academy', groupKey: 'education', groupName: 'Education', slug: 'training-academy', name: 'Training Academy & Course', description: 'Vocational training, tech bootcamps, and cultural workshops', iconName: 'Award' },
    ],
  },
  {
    key: 'institution',
    name: 'Organizations & Institutions',
    description: 'Non-profits, humanitarian charities, civic bodies, and public government services.',
    iconName: 'Landmark',
    categories: [
      { id: 'nonprofit-ngo', groupKey: 'institution', groupName: 'Organizations & Institutions', slug: 'nonprofit-ngo', name: 'Nonprofit & Foundation', description: 'Philanthropic trusts, charity relief, and global NGOs', iconName: 'HeartHandshake' },
      { id: 'civic-public', groupKey: 'institution', groupName: 'Organizations & Institutions', slug: 'civic-public', name: 'Government & Public Service', description: 'Civic councils, tourism boards, embassies, and public agencies', iconName: 'Landmark' },
    ],
  },
  {
    key: 'sports',
    name: 'Sports & Fitness',
    description: 'Cricket clubs, track & field teams, football leagues, athletes, and fitness centres.',
    iconName: 'Trophy',
    categories: [
      { id: 'sports-team-club', groupKey: 'sports', groupName: 'Sports & Fitness', slug: 'sports-team-club', name: 'Sports Team & Club', description: 'Cricket, track, football, basketball, and sailing clubs', iconName: 'Trophy' },
      { id: 'fitness-recreation', groupKey: 'sports', groupName: 'Sports & Fitness', slug: 'fitness-recreation', name: 'Fitness & Marine Recreation', description: 'Gyms, water sports, diving centres, and athletic coaches', iconName: 'Activity' },
    ],
  },
  {
    key: 'faith',
    name: 'Faith & Spirituality',
    description: 'Churches, ministries, congregations, and spiritual fellowships across the islands.',
    iconName: 'Compass',
    categories: [
      { id: 'faith-congregation', groupKey: 'faith', groupName: 'Faith & Spirituality', slug: 'faith-congregation', name: 'Faith Organization & Ministry', description: 'Congregations, fellowships, ministries, and community faith hubs', iconName: 'Compass' },
    ],
  },
  {
    key: 'events',
    name: 'Events & Festivals',
    description: 'Carnival organizers, food & rum festivals, music fests, and conference summits.',
    iconName: 'Calendar',
    categories: [
      { id: 'event-festival', groupKey: 'events', groupName: 'Events & Festivals', slug: 'event-festival', name: 'Festival & Event Organizer', description: 'Annual carnivals, regattas, tech expos, and concert promoters', iconName: 'Calendar' },
    ],
  },
  {
    key: 'travel',
    name: 'Travel & Places',
    description: 'Tourist attractions, natural sanctuaries, tour operators, and destination landmarks.',
    iconName: 'MapPin',
    categories: [
      { id: 'destination-attraction', groupKey: 'travel', groupName: 'Travel & Places', slug: 'destination-attraction', name: 'Destination & Landmark', description: 'Beaches, waterfalls, historic forts, and ecological parks', iconName: 'MapPin' },
      { id: 'tour-operator', groupKey: 'travel', groupName: 'Travel & Places', slug: 'tour-operator', name: 'Tour Operator & Island Guide', description: 'Catamaran charters, island safari tours, and culinary walks', iconName: 'Compass' },
    ],
  },
  {
    key: 'technology',
    name: 'Technology',
    description: 'Caribbean tech startups, software studios, developer communities, and innovation labs.',
    iconName: 'Laptop',
    categories: [
      { id: 'tech-company-startup', groupKey: 'technology', groupName: 'Technology', slug: 'tech-company-startup', name: 'Technology Startup & Software', description: 'Fintech, healthtech, creative software, and island incubators', iconName: 'Laptop' },
    ],
  },
  {
    key: 'other',
    name: 'Other & Initiatives',
    description: 'Civic initiatives, special diaspora campaigns, student groups, and general projects.',
    iconName: 'Sparkles',
    categories: [
      { id: 'project-initiative', groupKey: 'other', groupName: 'Other & Initiatives', slug: 'project-initiative', name: 'Project or Initiative', description: 'Temporary campaigns, cultural projects, and independent initiatives', iconName: 'Sparkles' },
    ],
  },
];

export const ALL_UNIVERSAL_CATEGORIES: UniversalPageCategory[] = UNIVERSAL_CATEGORY_GROUPS.flatMap(
  (group) => group.categories
);

export function findCategoryBySlug(slug: string): UniversalPageCategory | undefined {
  return ALL_UNIVERSAL_CATEGORIES.find((c) => c.slug === slug);
}

export function searchCategories(query: string): UniversalPageCategory[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL_UNIVERSAL_CATEGORIES;
  return ALL_UNIVERSAL_CATEGORIES.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.groupName.toLowerCase().includes(q) ||
      c.slug.toLowerCase().includes(q)
  );
}
