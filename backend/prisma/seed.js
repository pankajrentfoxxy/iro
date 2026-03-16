import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        await prisma.$connect();
    }
    catch (err) {
        console.error('\n❌ Cannot connect to database. Please check:');
        console.error('   1. Is your Supabase project running? (Free tier may pause after inactivity)');
        console.error('   2. Is DATABASE_URL correct in .env?');
        console.error('   3. Can you reach db.ghhhzeosvoqnpjtddwkz.supabase.co from your network?\n');
        throw err;
    }
    // Create National Admin (use a placeholder - in prod, create via secure flow)
    const adminPhone = 'encrypted:admin'; // Replace with actual encrypted phone
    const existing = await prisma.user.findFirst({
        where: { role: 'NATIONAL_ADMIN' },
    });
    if (!existing) {
        await prisma.user.create({
            data: {
                phone: adminPhone,
                name: 'National Admin',
                role: 'NATIONAL_ADMIN',
                referralCode: 'ADMIN001',
                state: null,
                district: null,
                tehsil: null,
            },
        });
        console.log('Created National Admin placeholder');
    }
    // Create 5 sample latest updates for carousel
    const updateCount = await prisma.latestUpdate.count();
    if (updateCount === 0) {
        const updates = [
            {
                title: 'Welcome to Indian Reform Organisation',
                excerpt: 'Reforming India, Together. Join the movement and be part of citizen-led change across every state and district.',
                body: 'Indian Reform Organisation (IRO) is a citizen-led movement for transparent governance and reform across India.',
                imageUrl: null,
            },
            {
                title: 'IRO Expands to 25 States',
                excerpt: 'Our network of reformers now spans 25 states and union territories. Volunteers are driving change at the grassroots level.',
                body: 'The Indian Reform Organisation has expanded its presence to 25 states. Local coordinators are organizing community meetings and awareness drives.',
                imageUrl: null,
            },
            {
                title: 'Youth Engagement Programme Launched',
                excerpt: 'New initiative to engage young reformers through digital campaigns and campus outreach programmes.',
                body: 'The Youth Engagement Programme aims to connect with students and young professionals. Workshops on civic participation will be held across major cities.',
                imageUrl: null,
            },
            {
                title: 'District-Level Reformer Meetups',
                excerpt: 'Monthly meetups are being organized in districts to strengthen local networks and share best practices.',
                body: 'District coordinators are organizing monthly meetups. These gatherings help reformers connect, share experiences, and plan local initiatives.',
                imageUrl: null,
            },
            {
                title: 'Transparency in Governance – Our Mission',
                excerpt: 'IRO advocates for greater transparency in government processes and citizen participation in decision-making.',
                body: 'Transparency and accountability are at the core of our mission. We work with citizens and institutions to promote open governance.',
                imageUrl: null,
            },
        ];
        for (const u of updates) {
            await prisma.latestUpdate.create({
                data: {
                    ...u,
                    publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                },
            });
        }
        console.log('Created 5 sample latest updates');
    }
    console.log('Seed complete');
}
main()
    .catch((e) => {
    if (e.message?.includes('Can\'t reach database')) {
        console.error('\n💡 Tip: Restart your Supabase project at https://supabase.com/dashboard if it was paused.\n');
    }
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map