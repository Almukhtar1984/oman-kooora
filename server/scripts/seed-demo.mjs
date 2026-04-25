import {DB, migrator} from "../src/Database/migrator.mjs";
import {
    Assembly,
    Attachment,
    AttachmentBlog,
    AttachmentPerson,
    Blog,
    Club,
    ClubManagement,
    Comment,
    Expense,
    Form,
    League,
    Match,
    MatchCard,
    Meeting,
    Members,
    Message,
    ParticipatingPlayers,
    ParticipatingTeams,
    ParticipatingTechnicalStaff,
    Permission,
    Person,
    Players,
    Request,
    Reservations,
    ScorerMatch,
    Stadium,
    Team,
    TechnicalApparatus,
    Transfer,
    User
} from "../src/Models/index.mjs";
import {hashPassword} from "../src/Helpers/Password.mjs";

const DEMO_PASSWORD = "Demo@12345";
const LEGACY_ADMIN_PASSWORD = "Admin@12345";
const ALL_PERMISSIONS = "view,create,update,delete";

const today = "2026-04-25";
const nextYear = "2027-04-25";

const asset = (name) => `demo/${name}`;

const upsert = async (model, where, values, transaction) => {
    const found = await model.findOne({where, transaction});
    if (found) {
        await found.update(values, {transaction});
        return found;
    }
    return await model.create({...where, ...values}, {transaction});
};

const upsertPerson = async (cardNumber, values, transaction) => {
    return await upsert(
        Person,
        {card_number: cardNumber},
        {
            personal_picture: asset(`${cardNumber}.jpg`),
            first_name: values.first_name,
            second_name: values.second_name,
            third_name: values.third_name,
            tribe: values.tribe,
            phone: values.phone,
            date_birth: values.date_birth
        },
        transaction
    );
};

const upsertUser = async ({email, password, role, person}, transaction) => {
    const passwordHash = await hashPassword(password);
    const user = await upsert(
        User,
        {email},
        {
            password: passwordHash,
            role,
            activation: true,
            email_verify: true,
            failed_login_attempts: 0,
            locked_until: null,
            last_failed_login_at: null,
            id_person: person.id
        },
        transaction
    );

    return user;
};

const upsertPermission = async (user, transaction) => {
    return await upsert(
        Permission,
        {id_user: user.id},
        {
            teams: ALL_PERMISSIONS,
            members: ALL_PERMISSIONS,
            technicals: ALL_PERMISSIONS,
            players: ALL_PERMISSIONS,
            transfer_players: ALL_PERMISSIONS,
            loan_players: ALL_PERMISSIONS,
            assembly: ALL_PERMISSIONS,
            inbox: ALL_PERMISSIONS,
            outbox: ALL_PERMISSIONS,
            meeting: ALL_PERMISSIONS,
            blogs: ALL_PERMISSIONS,
            forms: ALL_PERMISSIONS,
            permissions: ALL_PERMISSIONS,
            complaints: ALL_PERMISSIONS,
            expenses: ALL_PERMISSIONS
        },
        transaction
    );
};

const upsertMember = async ({person, team, occupation, classification, note}, transaction) => {
    return await upsert(
        Members,
        {id_person: person.id, id_team: team.id},
        {
            occupation,
            classification,
            membership_date: today,
            membership_date_end: nextYear,
            paid: true,
            status: "accepted",
            note
        },
        transaction
    );
};

const upsertPlayer = async ({person, team, center, job, playerClass, note}, transaction) => {
    return await upsert(
        Players,
        {id_person: person.id, id_team: team.id},
        {
            activity: "football",
            player_center: center,
            job,
            nationalID: asset(`${person.card_number}-front.jpg`),
            nationalIDBack: asset(`${person.card_number}-back.jpg`),
            parentApproval: asset(`${person.card_number}-approval.pdf`),
            status: "accepted",
            note,
            class: playerClass
        },
        transaction
    );
};

const upsertTechnical = async ({person, team, occupation, classification}, transaction) => {
    return await upsert(
        TechnicalApparatus,
        {id_person: person.id, id_team: team.id},
        {
            occupation,
            classification,
            membership_date: today,
            membership_date_end: nextYear,
            paid: true,
            testimony_experience: asset(`${person.card_number}-cv.pdf`),
            status: "accepted",
            note: "demo technical staff"
        },
        transaction
    );
};

const seed = async () => {
    await migrator.up();

    const result = await DB.transaction(async (transaction) => {
        const people = {};
        const personRows = [
            ["DEMO-SA-001", {first_name: "سعيد", second_name: "محمد", third_name: "علي", tribe: "البلوشي", phone: "90000001", date_birth: "1985-01-10"}],
            ["DEMO-CA-001", {first_name: "ناصر", second_name: "خالد", third_name: "سالم", tribe: "الحارثي", phone: "90000002", date_birth: "1988-02-12"}],
            ["DEMO-TA-001", {first_name: "حمود", second_name: "سعيد", third_name: "راشد", tribe: "العامري", phone: "90000003", date_birth: "1990-03-15"}],
            ["DEMO-PL-001", {first_name: "ماجد", second_name: "ناصر", third_name: "خميس", tribe: "الزيدي", phone: "90000004", date_birth: "2002-04-20"}],
            ["DEMO-SP-001", {first_name: "فهد", second_name: "عادل", third_name: "حسن", tribe: "الكندي", phone: "90000005", date_birth: "1986-05-18"}],
            ["DEMO-MB-001", {first_name: "علي", second_name: "سالم", third_name: "حمد", tribe: "الرواحي", phone: "90000006", date_birth: "1993-06-11"}],
            ["DEMO-MB-002", {first_name: "خالد", second_name: "مازن", third_name: "عمر", tribe: "الهاشمي", phone: "90000007", date_birth: "1994-07-13"}],
            ["DEMO-PL-002", {first_name: "راشد", second_name: "فهد", third_name: "سعيد", tribe: "العبري", phone: "90000008", date_birth: "2001-08-09"}],
            ["DEMO-PL-003", {first_name: "حسن", second_name: "علي", third_name: "ناصر", tribe: "المعمري", phone: "90000009", date_birth: "2000-09-22"}],
            ["DEMO-PL-004", {first_name: "يوسف", second_name: "حميد", third_name: "سالم", tribe: "البوسعيدي", phone: "90000010", date_birth: "2003-10-14"}],
            ["DEMO-PL-005", {first_name: "سالم", second_name: "راشد", third_name: "خميس", tribe: "السناني", phone: "90000011", date_birth: "2002-11-19"}],
            ["DEMO-PL-006", {first_name: "محمد", second_name: "فارس", third_name: "حمد", tribe: "الشحي", phone: "90000012", date_birth: "2004-12-08"}],
            ["DEMO-CO-001", {first_name: "عبدالله", second_name: "ناصر", third_name: "سعيد", tribe: "الغافري", phone: "90000013", date_birth: "1980-01-16"}],
            ["DEMO-CO-002", {first_name: "إبراهيم", second_name: "خالد", third_name: "علي", tribe: "المحروقي", phone: "90000014", date_birth: "1982-02-24"}]
        ];

        for (const [cardNumber, values] of personRows) {
            people[cardNumber] = await upsertPerson(cardNumber, values, transaction);
        }

        const adminPerson = await upsertPerson("DEMO-ADM-001", {
            first_name: "مدير",
            second_name: "النظام",
            third_name: "المحلي",
            tribe: "تجريبي",
            phone: "90000000",
            date_birth: "1984-01-01"
        }, transaction);

        const users = {
            legacyAdmin: await upsertUser({email: "admin@tomoh.local", password: LEGACY_ADMIN_PASSWORD, role: "1", person: adminPerson}, transaction),
            superAdmin: await upsertUser({email: "superadmin@tomoh.local", password: DEMO_PASSWORD, role: "1", person: people["DEMO-SA-001"]}, transaction),
            clubAdmin: await upsertUser({email: "club.admin@tomoh.local", password: DEMO_PASSWORD, role: "2", person: people["DEMO-CA-001"]}, transaction),
            teamAdmin: await upsertUser({email: "team.admin@tomoh.local", password: DEMO_PASSWORD, role: "3", person: people["DEMO-TA-001"]}, transaction),
            player: await upsertUser({email: "player@tomoh.local", password: DEMO_PASSWORD, role: "4", person: people["DEMO-PL-001"]}, transaction),
            sportsAdmin: await upsertUser({email: "sports.admin@tomoh.local", password: DEMO_PASSWORD, role: "1", person: people["DEMO-SP-001"]}, transaction)
        };

        for (const user of Object.values(users)) {
            await upsertPermission(user, transaction);
        }

        const clubA = await upsert(Club, {name: "نادي الطموح التجريبي"}, {
            governorate: "مسقط",
            logo: asset("club-tomoh.png"),
            phone: "24500001",
            account_status: true
        }, transaction);

        const clubB = await upsert(Club, {name: "نادي الساحل التجريبي"}, {
            governorate: "ظفار",
            logo: asset("club-sahil.png"),
            phone: "24500002",
            account_status: true
        }, transaction);

        const teamA = await upsert(Team, {name: "فريق الطموح الأول"}, {
            logo: asset("team-tomoh-first.png"),
            phone: "24510001",
            manager_name: "ناصر خالد",
            activities: "football",
            account_status: true,
            code: "TOMOH-01",
            category: 1,
            enableAddPlayer: true,
            id_club: clubA.id
        }, transaction);

        const teamB = await upsert(Team, {name: "فريق الطموح الناشئين"}, {
            logo: asset("team-tomoh-youth.png"),
            phone: "24510002",
            manager_name: "حمود سعيد",
            activities: "football",
            account_status: true,
            code: "TOMOH-02",
            category: 2,
            enableAddPlayer: true,
            id_club: clubA.id
        }, transaction);

        const teamC = await upsert(Team, {name: "فريق الساحل الأول"}, {
            logo: asset("team-sahil-first.png"),
            phone: "24510003",
            manager_name: "فهد عادل",
            activities: "football",
            account_status: true,
            code: "SAHIL-01",
            category: 1,
            enableAddPlayer: true,
            id_club: clubB.id
        }, transaction);

        await upsert(ClubManagement, {id_person: people["DEMO-CA-001"].id, id_club: clubA.id}, {
            role: "1",
            membership_date: today,
            membership_date_end: nextYear
        }, transaction);

        await upsert(ClubManagement, {id_person: people["DEMO-SP-001"].id, id_club: clubB.id}, {
            role: "2",
            membership_date: today,
            membership_date_end: nextYear
        }, transaction);

        await upsertMember({person: people["DEMO-TA-001"], team: teamA, occupation: "team-admin", classification: "manager", note: "demo team admin"}, transaction);
        await upsertMember({person: people["DEMO-MB-001"], team: teamA, occupation: "secretary", classification: "member", note: "demo accepted member"}, transaction);
        await upsertMember({person: people["DEMO-MB-002"], team: teamB, occupation: "accountant", classification: "member", note: "demo youth member"}, transaction);

        const playerA = await upsertPlayer({person: people["DEMO-PL-001"], team: teamA, center: "striker", job: "student", playerClass: "firstDegree", note: "login demo player"}, transaction);
        const playerB = await upsertPlayer({person: people["DEMO-PL-002"], team: teamA, center: "keeper", job: "student", playerClass: "firstDegree", note: "demo goalkeeper"}, transaction);
        const playerC = await upsertPlayer({person: people["DEMO-PL-003"], team: teamA, center: "midfielder", job: "employee", playerClass: "firstDegree", note: "demo midfielder"}, transaction);
        const playerD = await upsertPlayer({person: people["DEMO-PL-004"], team: teamB, center: "defender", job: "student", playerClass: "young", note: "demo youth player"}, transaction);
        const playerE = await upsertPlayer({person: people["DEMO-PL-005"], team: teamC, center: "striker", job: "employee", playerClass: "firstDegree", note: "demo opponent player"}, transaction);
        const playerF = await upsertPlayer({person: people["DEMO-PL-006"], team: teamC, center: "winger", job: "student", playerClass: "young", note: "demo reserve player"}, transaction);

        const coachA = await upsertTechnical({person: people["DEMO-CO-001"], team: teamA, occupation: "coach", classification: "head-coach"}, transaction);
        const coachB = await upsertTechnical({person: people["DEMO-CO-002"], team: teamC, occupation: "coach", classification: "assistant"}, transaction);

        await upsert(AttachmentPerson, {id_player: playerA.id, content: asset("player-contract.pdf")}, {}, transaction);
        await upsert(AttachmentPerson, {id_player: playerB.id, content: asset("keeper-contract.pdf")}, {}, transaction);

        await upsert(Assembly, {card_number: "DEMO-AS-001"}, {
            personal_picture: asset("assembly-1.jpg"),
            first_name: "مريم",
            second_name: "سعيد",
            third_name: "ناصر",
            tribe: "الحضرمي",
            date_birth: "1991-04-15",
            phone: "90000020",
            nationalID: asset("assembly-1-front.jpg"),
            nationalIDBack: asset("assembly-1-back.jpg"),
            membership_date: today,
            gender: "female",
            type: "board",
            subscription_date: today,
            id_club: clubA.id,
            id_team: teamA.id
        }, transaction);

        await upsert(Assembly, {card_number: "DEMO-AS-002"}, {
            personal_picture: asset("assembly-2.jpg"),
            first_name: "طارق",
            second_name: "خالد",
            third_name: "عمر",
            tribe: "العلوي",
            date_birth: "1989-05-21",
            phone: "90000021",
            nationalID: asset("assembly-2-front.jpg"),
            nationalIDBack: asset("assembly-2-back.jpg"),
            membership_date: today,
            gender: "male",
            type: "member",
            subscription_date: today,
            id_club: clubA.id,
            id_team: teamB.id
        }, transaction);

        const stadium = await upsert(Stadium, {name: "ملعب الطموح الرئيسي"}, {
            about: "ملعب تجريبي للتأكد من عرض تفاصيل الملاعب والحجوزات.",
            type: "artificial",
            attachments: "parking,water,changing-room",
            rent: 35,
            images: asset("stadium-main.jpg"),
            id_team: teamA.id
        }, transaction);

        await upsert(Reservations, {phone: "91234567", booking_date: "2026-05-01", booking_start: "18:00:00", id_stadium: stadium.id}, {
            booking_end: "19:30:00"
        }, transaction);

        await upsert(Reservations, {phone: "92345678", booking_date: "2026-05-02", booking_start: "20:00:00", id_stadium: stadium.id}, {
            booking_end: "21:30:00"
        }, transaction);

        const league = await upsert(League, {name: "دوري الطموح التجريبي"}, {
            numberTeams: 3,
            numberGroups: 1,
            description: "دوري تجريبي لاختبار صفحات البطولات والمباريات والإحصائيات.",
            startDate: "2026-05-01",
            expiryDate: "2026-06-15",
            id_club: clubA.id
        }, transaction);

        const participantA = await upsert(ParticipatingTeams, {id_league: league.id, id_team: teamA.id}, {group: "A"}, transaction);
        const participantB = await upsert(ParticipatingTeams, {id_league: league.id, id_team: teamB.id}, {group: "A"}, transaction);
        const participantC = await upsert(ParticipatingTeams, {id_league: league.id, id_team: teamC.id}, {group: "A"}, transaction);

        const participatingPlayerA = await upsert(ParticipatingPlayers, {id_participating_team: participantA.id, id_player: playerA.id}, {number: "9"}, transaction);
        await upsert(ParticipatingPlayers, {id_participating_team: participantA.id, id_player: playerB.id}, {number: "1"}, transaction);
        await upsert(ParticipatingPlayers, {id_participating_team: participantA.id, id_player: playerC.id}, {number: "8"}, transaction);
        await upsert(ParticipatingPlayers, {id_participating_team: participantB.id, id_player: playerD.id}, {number: "5"}, transaction);
        const participatingPlayerC = await upsert(ParticipatingPlayers, {id_participating_team: participantC.id, id_player: playerE.id}, {number: "10"}, transaction);
        await upsert(ParticipatingPlayers, {id_participating_team: participantC.id, id_player: playerF.id}, {number: "11"}, transaction);

        await upsert(ParticipatingTechnicalStaff, {id_participating_team: participantA.id, id_technical_apparatus: coachA.id}, {}, transaction);
        await upsert(ParticipatingTechnicalStaff, {id_participating_team: participantC.id, id_technical_apparatus: coachB.id}, {}, transaction);

        const match = await upsert(Match, {id_league: league.id, first_team: participantA.id, second_team: participantC.id}, {
            date: "2026-05-05 19:00",
            type: "groups",
            firstTeamGoal: 2,
            secondTeamGoal: 1,
            manOfMatch: playerA.id
        }, transaction);

        await upsert(MatchCard, {id_match: match.id, id_team: participantC.id, player: playerE.id, type: "yellow"}, {
            date: "55"
        }, transaction);

        await upsert(ScorerMatch, {id_match: match.id, id_participating_team: participantA.id, id_participating_player: participatingPlayerA.id, time: "23"}, {}, transaction);
        await upsert(ScorerMatch, {id_match: match.id, id_participating_team: participantC.id, id_participating_player: participatingPlayerC.id, time: "61"}, {}, transaction);

        const blog = await upsert(Blog, {subject: "انطلاق دوري الطموح التجريبي"}, {
            short_description: "خبر تجريبي للتأكد من عرض الأخبار.",
            description: "تمت إضافة هذا الخبر ضمن بيانات seed التجريبية لفحص صفحة الأخبار والتفاصيل والمرفقات.",
            status: "accepted",
            id_club: clubA.id,
            id_team: teamA.id
        }, transaction);

        await upsert(AttachmentBlog, {id_blog: blog.id, content: asset("blog-league.jpg")}, {}, transaction);

        await upsert(Form, {subject: "نموذج تسجيل لاعب تجريبي", id_club: clubA.id}, {
            file: asset("player-form.pdf")
        }, transaction);

        await upsert(Expense, {id_club: clubA.id, id_team: teamA.id, note: "كرات وتجهيزات تدريب تجريبية"}, {
            value: 125.5,
            attachment: asset("expense-receipt.pdf")
        }, transaction);

        const meeting = await upsert(Meeting, {subject: "اجتماع تحضيري تجريبي", id_club: clubA.id, id_team: teamA.id}, {
            names_attending: "ناصر خالد, حمود سعيد, عبدالله ناصر",
            description: "اجتماع تجريبي لفحص صفحة الاجتماعات والمرفقات."
        }, transaction);

        await upsert(Attachment, {id_meeting: meeting.id, content: asset("meeting-minutes.pdf")}, {}, transaction);

        const message = await upsert(Message, {subject: "رسالة اعتماد مشاركة تجريبية"}, {
            content: "رسالة تجريبية بين النادي والفريق للتأكد من البريد الداخلي والتعليقات.",
            priority: "urgent",
            logo: asset("message-logo.png"),
            id_club_sender: clubA.id,
            id_team_sender: teamA.id,
            id_club_receiver: clubB.id,
            id_team_receiver: teamC.id
        }, transaction);

        await upsert(Attachment, {id_message: message.id, content: asset("message-attachment.pdf")}, {}, transaction);
        await upsert(Comment, {id_message: message.id, id_club: clubB.id, id_team: teamC.id}, {
            content: "تم استلام الرسالة التجريبية.",
            note: "demo inbox comment"
        }, transaction);

        await upsert(Request, {id_player: playerA.id, type: "request"}, {
            content: "طلب تجريبي لتحديث بيانات اللاعب.",
            note: "ready for review",
            status: "waiting"
        }, transaction);

        await upsert(Request, {id_player: playerB.id, type: "complaint"}, {
            content: "شكوى تجريبية لفحص صفحة الشكاوى.",
            note: "demo complaint",
            status: "done"
        }, transaction);

        await upsert(Transfer, {id_player: playerD.id, id_team_from: teamB.id, id_team_to: teamA.id}, {
            status: "waiting",
            type: "internal",
            transition_type: "loan",
            date_start: "2026-05-10",
            date_end: "2026-08-10",
            id_club_to: clubA.id
        }, transaction);

        return {
            clubs: [clubA, clubB].length,
            teams: [teamA, teamB, teamC].length,
            users: Object.keys(users).length,
            people: Object.keys(people).length + 1,
            players: [playerA, playerB, playerC, playerD, playerE, playerF].length,
            league: league.name
        };
    });

    console.log("Demo seed completed.");
    console.log(JSON.stringify({
        ...result,
        credentials: [
            {email: "admin@tomoh.local", password: LEGACY_ADMIN_PASSWORD, role: "super admin"},
            {email: "superadmin@tomoh.local", password: DEMO_PASSWORD, role: "super admin"},
            {email: "club.admin@tomoh.local", password: DEMO_PASSWORD, role: "club admin"},
            {email: "team.admin@tomoh.local", password: DEMO_PASSWORD, role: "team admin"},
            {email: "player@tomoh.local", password: DEMO_PASSWORD, role: "player"},
            {email: "sports.admin@tomoh.local", password: DEMO_PASSWORD, role: "sports admin"}
        ]
    }, null, 2));
};

try {
    await seed();
} finally {
    await DB.close();
}
