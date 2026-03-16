// Fallback latest updates – shown when API returns empty (e.g. before seed runs)
export const LATEST_UPDATES_FALLBACK = [
  {
    title: 'Welcome to Indian Reform Organisation',
    excerpt:
      'Reforming India, Together. Join the movement and be part of citizen-led change across every state and district.',
    imageUrl: undefined as string | undefined,
    publishedAt: new Date().toISOString(),
  },
  {
    title: 'IRO Expands to 25 States',
    excerpt:
      'Our network of reformers now spans 25 states and union territories. Volunteers are driving change at the grassroots level.',
    imageUrl: undefined as string | undefined,
    publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Youth Engagement Programme Launched',
    excerpt:
      'New initiative to engage young reformers through digital campaigns and campus outreach programmes.',
    imageUrl: undefined as string | undefined,
    publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'District-Level Reformer Meetups',
    excerpt:
      'Monthly meetups are being organized in districts to strengthen local networks and share best practices.',
    imageUrl: undefined as string | undefined,
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    title: 'Transparency in Governance – Our Mission',
    excerpt:
      'IRO advocates for greater transparency in government processes and citizen participation in decision-making.',
    imageUrl: undefined as string | undefined,
    publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
