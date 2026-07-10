/** Shared design-system class strings */
export const themeClasses = {
  page: 'min-h-screen bg-background',
  card: 'iro-card',
  cardHover: 'iro-card hover:shadow-card-lg transition-shadow duration-200',
  btnPrimary: 'iro-btn-primary',
  btnOutline: 'iro-btn-outline',
  btnGhost: 'iro-btn-ghost',
  input: 'iro-input',
  label: 'iro-label',
  sectionTitle: 'iro-section-title',
  sectionAccent: 'iro-section-accent',
  hero:
    'relative overflow-hidden bg-card border-b border-border py-16 md:py-24 px-4',
  heroGlow:
    'absolute inset-0 opacity-30 pointer-events-none bg-[radial-gradient(circle_at_30%_40%,rgba(255,153,51,0.15)_0%,transparent_50%)]',
  mutedText: 'text-muted-foreground',
} as const;
