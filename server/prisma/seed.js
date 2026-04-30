const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.resolve(__dirname, '../dev.db');
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('Seeding database...');

    // Create categories/skills (admin-managed) with aliases and parent groups
    const skillData = [
        { name: 'Tennis', parentGroup: 'Sport', aliases: ['tennis coach', 'tennis lessons', 'tennis instructor'] },
        { name: 'Piano', parentGroup: 'Music', aliases: ['piano lessons', 'keyboard', 'piano tutor'] },
        { name: 'Guitar', parentGroup: 'Music', aliases: ['guitar lessons', 'acoustic guitar', 'electric guitar'] },
        { name: 'Swimming', parentGroup: 'Sport', aliases: ['swim coach', 'swimming lessons', 'swimming instructor'] },
        { name: 'Yoga', parentGroup: 'Wellness', aliases: ['yoga instructor', 'yoga teacher', 'yoga class'] },
        { name: 'Photography', parentGroup: 'Creative', aliases: ['photography lessons', 'camera course', 'photo class'] },
        { name: 'Cooking', parentGroup: 'Lifestyle', aliases: ['cooking class', 'cooking lessons', 'chef tutor'] },
        { name: 'Spanish', parentGroup: 'Languages', aliases: ['spanish lessons', 'spanish tutor', 'learn spanish'] },
        { name: 'Maths', parentGroup: 'Academic Tutoring', aliases: ['mathematics', 'math tutor', 'algebra', 'calculus'] },
        { name: 'Coding', parentGroup: 'Technology', aliases: ['programming', 'coding lessons', 'learn to code', 'software'] },
        { name: 'English', parentGroup: 'Academic Tutoring', aliases: ['english tutor', 'english lessons', 'essay writing'] },
        { name: 'Boxing', parentGroup: 'Sport', aliases: ['boxing coach', 'boxing trainer', 'boxing class'] },
        { name: 'Dance', parentGroup: 'Creative', aliases: ['dance lessons', 'dance class', 'dance teacher', 'salsa', 'bachata'] },
        { name: 'Surfing', parentGroup: 'Sport', aliases: ['surf lessons', 'surf coach', 'learn to surf'] },
    ];
    const createdSkills = {};

    for (const sd of skillData) {
        const skill = await prisma.skill.upsert({
            where: { name: sd.name },
            create: { name: sd.name, enabled: true, parentGroup: sd.parentGroup },
            update: { parentGroup: sd.parentGroup },
        });
        createdSkills[sd.name] = skill;

        // Seed aliases
        for (const alias of sd.aliases) {
            await prisma.skillAlias.upsert({
                where: { skillId_alias: { skillId: skill.id, alias } },
                create: { skillId: skill.id, alias },
                update: {},
            });
        }
    }
    console.log(`Created ${skillData.length} skills with aliases`);

    const hashedPassword = await bcrypt.hash('password123', 10);
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);

    // Create admin user
    const admin = await prisma.user.upsert({
        where: { email: process.env.ADMIN_EMAIL || 'admin@coachfinder.com' },
        create: {
            email: process.env.ADMIN_EMAIL || 'admin@coachfinder.com',
            password: adminPassword,
            name: 'Admin',
            slug: 'admin',
            isLearner: false,
            isCoach: false,
            isAdmin: true,
            emailVerified: true,
        },
        update: {},
    });
    console.log('Created admin user:', admin.email);

    // Create approved coaches with proper Australian suburb data
    const coaches = [
        {
            email: 'sarah.tennis@example.com', name: 'Sarah Mitchell',
            headline: 'Certified Tennis Coach — All Levels',
            bio: 'Certified tennis coach with 10+ years of experience. Former national-level player. I specialise in one-on-one coaching for beginners through to advanced players.',
            hourlyRate: 75, suburb: 'Bondi', state: 'NSW', postcode: '2026',
            lat: -33.8914, lng: 151.2743, yearsExp: 10, sessionMode: 'BOTH',
            serviceRadius: 'Eastern Suburbs Sydney',
            certifications: 'Tennis Australia Level 2 Coach, First Aid Certificate',
            skills: ['Tennis'],
            availability: JSON.stringify([
                { day: 'Monday', times: ['Morning', 'Afternoon'] },
                { day: 'Wednesday', times: ['Morning', 'Afternoon'] },
                { day: 'Saturday', times: ['Morning'] },
            ]),
        },
        {
            email: 'james.swim@example.com', name: 'James Walker',
            headline: 'Olympic-Trained Swimming Instructor',
            bio: 'Olympic-trained swimming instructor. Specialising in freestyle and butterfly techniques. I work with swimmers of all ages and abilities.',
            hourlyRate: 85, suburb: 'Manly', state: 'NSW', postcode: '2095',
            lat: -33.7972, lng: 151.2855, yearsExp: 15, sessionMode: 'IN_PERSON',
            serviceRadius: 'Northern Beaches',
            certifications: 'AUSTSWIM Accredited, Bronze Medallion',
            skills: ['Swimming'],
            availability: JSON.stringify([
                { day: 'Tuesday', times: ['Morning', 'Afternoon'] },
                { day: 'Thursday', times: ['Morning'] },
                { day: 'Saturday', times: ['Morning', 'Afternoon'] },
                { day: 'Sunday', times: ['Morning'] },
            ]),
        },
        {
            email: 'emma.piano@example.com', name: 'Emma Chen',
            headline: 'Classical & Contemporary Piano Teacher',
            bio: 'Conservatorium graduate. Teaching piano from beginner to advanced, all ages welcome. I offer structured lessons with a focus on technique and musical expression.',
            hourlyRate: 65, suburb: 'Surry Hills', state: 'NSW', postcode: '2010',
            lat: -33.8832, lng: 151.2107, yearsExp: 8, sessionMode: 'BOTH',
            serviceRadius: 'Inner Sydney',
            certifications: 'Bachelor of Music (USYD), AMEB Grade 8',
            skills: ['Piano', 'Guitar'],
            availability: JSON.stringify([
                { day: 'Monday', times: ['Afternoon', 'Evening'] },
                { day: 'Wednesday', times: ['Afternoon', 'Evening'] },
                { day: 'Friday', times: ['Afternoon'] },
            ]),
        },
        {
            email: 'david.yoga@example.com', name: 'David Kumar',
            headline: 'Experienced Yoga & Mindfulness Coach',
            bio: 'RYT-500 certified yoga instructor. Vinyasa, Hatha, and restorative yoga. I help you build a sustainable practice tailored to your body and goals.',
            hourlyRate: 55, suburb: 'Newtown', state: 'NSW', postcode: '2042',
            lat: -33.8966, lng: 151.1789, yearsExp: 6, sessionMode: 'BOTH',
            serviceRadius: 'Inner West Sydney',
            skills: ['Yoga'],
            availability: JSON.stringify([
                { day: 'Monday', times: ['Morning'] },
                { day: 'Tuesday', times: ['Morning', 'Evening'] },
                { day: 'Thursday', times: ['Morning', 'Evening'] },
                { day: 'Saturday', times: ['Morning'] },
            ]),
        },
        {
            email: 'lisa.photo@example.com', name: 'Lisa Thompson',
            headline: 'Professional Photography Educator',
            bio: 'Professional photographer turned educator. Learn composition, lighting, and post-processing. From beginners using their phone to advanced DSLR techniques.',
            hourlyRate: 70, suburb: 'Paddington', state: 'NSW', postcode: '2021',
            lat: -33.8843, lng: 151.2268, yearsExp: 12, sessionMode: 'BOTH',
            serviceRadius: 'Eastern Suburbs & CBD',
            certifications: 'AIPP Accredited Professional',
            skills: ['Photography'],
            availability: JSON.stringify([
                { day: 'Wednesday', times: ['Morning', 'Afternoon'] },
                { day: 'Friday', times: ['Morning', 'Afternoon'] },
                { day: 'Sunday', times: ['Morning'] },
            ]),
        },
        {
            email: 'anna.cook@example.com', name: 'Anna Petrova',
            headline: 'Private Chef & Cooking Instructor',
            bio: 'Professional chef offering private cooking lessons. Italian, French, and Asian cuisines. Learn to create restaurant-quality meals at home.',
            hourlyRate: 90, suburb: 'Mosman', state: 'NSW', postcode: '2088',
            lat: -33.8293, lng: 151.2444, yearsExp: 20, sessionMode: 'IN_PERSON',
            serviceRadius: 'Lower North Shore',
            certifications: 'Le Cordon Bleu Diploma, Commercial Cookery Certificate IV',
            skills: ['Cooking'],
            availability: JSON.stringify([
                { day: 'Tuesday', times: ['Morning', 'Afternoon'] },
                { day: 'Thursday', times: ['Morning', 'Afternoon'] },
                { day: 'Saturday', times: ['Afternoon', 'Evening'] },
            ]),
        },
        {
            email: 'tom.code@example.com', name: 'Tom Wilson',
            headline: 'Senior Software Engineer & Coding Tutor',
            bio: 'Senior software engineer. Teaching Python, JavaScript, and web development fundamentals. I focus on practical projects and real-world skills.',
            hourlyRate: 95, suburb: 'Ultimo', state: 'NSW', postcode: '2007',
            lat: -33.8785, lng: 151.1986, yearsExp: 9, sessionMode: 'ONLINE',
            serviceRadius: 'Online only',
            certifications: 'AWS Certified, Google Cloud Professional',
            linkedinUrl: 'https://linkedin.com/in/tomwilson',
            skills: ['Coding', 'Maths'],
            availability: JSON.stringify([
                { day: 'Monday', times: ['Evening'] },
                { day: 'Wednesday', times: ['Evening'] },
                { day: 'Friday', times: ['Evening'] },
                { day: 'Sunday', times: ['Afternoon', 'Evening'] },
            ]),
        },
        {
            email: 'mel.dance@example.com', name: 'Melissa Santos',
            headline: 'Latin Dance Instructor — Salsa, Bachata & More',
            bio: 'Passionate dance instructor specialising in Latin styles. Whether you want to learn for fun, fitness, or performance, I create fun lessons for all levels.',
            hourlyRate: 60, suburb: 'South Yarra', state: 'VIC', postcode: '3141',
            lat: -37.8384, lng: 144.9924, yearsExp: 7, sessionMode: 'IN_PERSON',
            serviceRadius: 'Inner Melbourne',
            skills: ['Dance'],
            availability: JSON.stringify([
                { day: 'Tuesday', times: ['Evening'] },
                { day: 'Thursday', times: ['Evening'] },
                { day: 'Saturday', times: ['Morning', 'Afternoon'] },
            ]),
        },
    ];

    for (const coachData of coaches) {
        const slug = coachData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

        const user = await prisma.user.upsert({
            where: { email: coachData.email },
            create: {
                email: coachData.email,
                password: hashedPassword,
                name: coachData.name,
                slug,
                isLearner: true,
                isCoach: true,
                emailVerified: true,
                coachProfile: {
                    create: {
                        status: 'APPROVED',
                        headline: coachData.headline,
                        bio: coachData.bio,
                        hourlyRate: coachData.hourlyRate,
                        sessionMode: coachData.sessionMode || 'BOTH',
                        suburb: coachData.suburb,
                        state: coachData.state,
                        postcode: coachData.postcode,
                        lat: coachData.lat,
                        lng: coachData.lng,
                        serviceRadius: coachData.serviceRadius || '',
                        yearsExp: coachData.yearsExp,
                        certifications: coachData.certifications || '',
                        linkedinUrl: coachData.linkedinUrl || '',
                        email: coachData.email,
                        availability: coachData.availability || '[]',
                    },
                },
            },
            update: {},
            include: { coachProfile: true },
        });

        // Add skills
        if (user.coachProfile) {
            for (const skillName of coachData.skills) {
                if (createdSkills[skillName]) {
                    await prisma.coachSkill.upsert({
                        where: {
                            coachProfileId_skillId: {
                                coachProfileId: user.coachProfile.id,
                                skillId: createdSkills[skillName].id,
                            },
                        },
                        create: {
                            coachProfileId: user.coachProfile.id,
                            skillId: createdSkills[skillName].id,
                        },
                        update: {},
                    });
                }
            }
        }
    }
    console.log(`Created ${coaches.length} approved coaches`);

    // Create a pending coach (for demo)
    const pendingCoach = await prisma.user.upsert({
        where: { email: 'pending.coach@example.com' },
        create: {
            email: 'pending.coach@example.com',
            password: hashedPassword,
            name: 'Mike Rodriguez',
            slug: 'mike-rodriguez',
            isLearner: true,
            isCoach: true,
            emailVerified: true,
            coachProfile: {
                create: {
                    status: 'PENDING',
                    headline: 'Tennis Coach — Beginners Welcome',
                    bio: 'Fun and energetic tennis coach. Great with kids and beginners.',
                    hourlyRate: 60,
                    suburb: 'Randwick',
                    state: 'NSW',
                    postcode: '2031',
                    lat: -33.9133,
                    lng: 151.2413,
                    yearsExp: 5,
                    sessionMode: 'IN_PERSON',
                    email: 'pending.coach@example.com',
                    availability: JSON.stringify([
                        { day: 'Saturday', times: ['Morning', 'Afternoon'] },
                        { day: 'Sunday', times: ['Morning'] },
                    ]),
                },
            },
        },
        update: {},
    });
    console.log('Created pending coach:', pendingCoach.email);

    // Create learners
    const learners = [
        { email: 'alex.learner@example.com', name: 'Alex Johnson' },
        { email: 'maria.learner@example.com', name: 'Maria Garcia' },
    ];

    for (const learnerData of learners) {
        const slug = learnerData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        await prisma.user.upsert({
            where: { email: learnerData.email },
            create: {
                email: learnerData.email,
                password: hashedPassword,
                name: learnerData.name,
                slug,
                isLearner: true,
                isCoach: false,
                emailVerified: true,
            },
            update: {},
        });
    }
    console.log(`Created ${learners.length} learners`);

    console.log('\nSeeding complete!');
    console.log('Admin login: admin@coachfinder.com / admin123');
    console.log('Learner login: alex.learner@example.com / password123');
    console.log('Coach login: sarah.tennis@example.com / password123');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
