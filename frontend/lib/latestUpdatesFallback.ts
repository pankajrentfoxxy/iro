// Fallback latest updates – shown when API returns empty (e.g. before seed runs)
export const LATEST_UPDATES_FALLBACK = [
  {
    id: 'up-assembly-expansion',
    title: 'Groups in Every Assembly Constituency — Uttar Pradesh',
    excerpt:
      'IRO announces a major expansion: dedicated groups will be formed in every assembly constituency across every district of Uttar Pradesh. Join us in building an empowered, organised society.',
    imageUrl: '/images/updates/up-assembly-expansion.png',
    publishedAt: new Date().toISOString(),
  },
  {
    id: 'up-team-recruitment',
    title: 'IRO Needs Active Teams in Every District of UP',
    excerpt:
      'We are building teams of 20–25 active members in every district of Uttar Pradesh. Take a step towards social reform — become part of this campaign for change. Contact: 9409889944 | 9409889955',
    imageUrl: '/images/updates/up-team-recruitment.png',
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'national-event',
    title: 'IRO National Event — Reforming Society Together',
    excerpt:
      'Leaders and members of the Indian Reformers Organisation come together at a national gathering to strengthen the movement for transparent governance and citizen-led reform.',
    imageUrl: '/images/updates/national-event.png',
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'movement-in-action',
    title: 'The Movement on the Ground',
    excerpt:
      'From public rallies to grassroots outreach, IRO reformers are actively working across communities — raising voices, building awareness, and driving change at every level.',
    imageUrl: '/images/updates/movement-in-action.png',
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
