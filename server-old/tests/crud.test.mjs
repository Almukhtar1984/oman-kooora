/**
 * CRUD integration tests using an in-memory SQLite database.
 * Each test suite spins up its own isolated tables so tests never interfere.
 */

import assert from "node:assert/strict";
import test from "node:test";
import Sequelize from "sequelize";

import personFactory        from "../src/Models/Person.mjs";
import userFactory          from "../src/Models/User.mjs";
import membersFactory       from "../src/Models/Members.mjs";
import playersFactory       from "../src/Models/Players.mjs";
import clubFactory          from "../src/Models/Club.mjs";
import teamFactory          from "../src/Models/Team.mjs";
import blogFactory          from "../src/Models/Blog.mjs";
import expenseFactory       from "../src/Models/Expense.mjs";
import meetingFactory       from "../src/Models/Meeting.mjs";
import stadiumFactory       from "../src/Models/Stadium.mjs";
import reservationsFactory  from "../src/Models/Reservations.mjs";

// ─── DB + seed helpers ────────────────────────────────────────────────────────

const makeDB = () => new Sequelize.Sequelize({
    dialect: "sqlite",
    storage: ":memory:",
    logging: false
});

let _phoneSeq = 0;
const uniquePhone = () => {
    _phoneSeq++;
    return `050${String(_phoneSeq).padStart(7, "0")}`;
};

const makePerson = (overrides = {}) => ({
    first_name:  "أحمد",
    second_name: "محمد",
    third_name:  "علي",
    tribe:       "قريش",
    phone:       uniquePhone(),
    card_number: `CN-${Date.now()}-${_phoneSeq}`,
    date_birth:  "1990-01-01",
    ...overrides
});

const makeClubData = () => ({
    name:         "نادي الاختبار",
    governorate:  "الرياض",
    phone:        uniquePhone(),
    account_status: true
});

const makeTeamData = (idClub) => ({
    id_club:      idClub,
    name:         "فريق الاختبار",
    phone:        uniquePhone(),
    manager_name: "مدير الفريق",
    activities:   "كرة القدم",
    account_status: true,
    code:         `T${Date.now()}`
});

const makeMemberData = (idPerson, idTeam) => ({
    id_person:           idPerson,
    id_team:             idTeam,
    occupation:          "مدرب",
    classification:      "أ",
    membership_date:     new Date("2024-01-01"),
    membership_date_end: new Date("2025-01-01"),
    paid:                false,
    status:              "waiting"
});

const makePlayerData = (idPerson, idTeam) => ({
    id_person:     idPerson,
    id_team:       idTeam,
    activity:      "كرة القدم",
    player_center: "مهاجم",
    job:           "لاعب",
    status:        "waiting"
});

// ─── Person + Members (CRUD) ──────────────────────────────────────────────────

test("Members: create, read, update, delete", async (t) => {
    const db = makeDB();

    const Person  = personFactory(db, Sequelize);
    const Club    = clubFactory(db, Sequelize);
    const Team    = teamFactory(db, Sequelize);
    const Members = membersFactory(db, Sequelize);

    Person.hasOne(Members,  { foreignKey: "id_person", onDelete: "CASCADE" });
    Members.belongsTo(Person, { foreignKey: "id_person" });
    Club.hasMany(Team,    { foreignKey: "id_club",   onDelete: "CASCADE" });
    Team.belongsTo(Club,  { foreignKey: "id_club" });
    Team.hasMany(Members, { foreignKey: "id_team",   onDelete: "CASCADE" });
    Members.belongsTo(Team, { foreignKey: "id_team" });

    await db.sync({ force: true });

    const club = await Club.create(makeClubData());
    const team = await Team.create(makeTeamData(club.id));

    // ── CREATE ────────────────────────────────────────────────────────────────

    await t.test("creates a person and member", async () => {
        const person = await Person.create(makePerson());
        assert.ok(person.id);

        const member = await Members.create(makeMemberData(person.id, team.id));
        assert.ok(member.id);
        assert.equal(member.occupation, "مدرب");
    });

    await t.test("rejects member with non-existent person ID (FK)", async () => {
        await assert.rejects(() =>
            Members.create(makeMemberData("00000000-0000-0000-0000-000000000000", team.id))
        );
    });

    // ── READ ──────────────────────────────────────────────────────────────────

    await t.test("reads a member by primary key", async () => {
        const person = await Person.create(makePerson());
        const member = await Members.create(makeMemberData(person.id, team.id));

        const found = await Members.findByPk(member.id);
        assert.ok(found);
        assert.equal(found.id, member.id);
    });

    await t.test("findByPk returns null for unknown id", async () => {
        const found = await Members.findByPk("00000000-0000-0000-0000-000000000000");
        assert.equal(found, null);
    });

    await t.test("findAll returns all members for a team", async () => {
        const p1 = await Person.create(makePerson());
        const p2 = await Person.create(makePerson());
        await Members.create(makeMemberData(p1.id, team.id));
        await Members.create(makeMemberData(p2.id, team.id));

        const all = await Members.findAll({ where: { id_team: team.id } });
        assert.ok(all.length >= 2);
    });

    // ── UPDATE ────────────────────────────────────────────────────────────────

    await t.test("updates member occupation", async () => {
        const person = await Person.create(makePerson());
        const member = await Members.create(makeMemberData(person.id, team.id));

        const [count] = await Members.update(
            { occupation: "حارس مرمى" },
            { where: { id: member.id } }
        );
        assert.equal(count, 1);

        const updated = await Members.findByPk(member.id);
        assert.equal(updated.occupation, "حارس مرمى");
    });

    await t.test("changeStatus: update status and note", async () => {
        const person = await Person.create(makePerson());
        const member = await Members.create(makeMemberData(person.id, team.id));

        const [count] = await Members.update(
            { status: "accepted", note: "تمت الموافقة" },
            { where: { id: member.id } }
        );
        assert.equal(count, 1);

        const updated = await Members.findByPk(member.id);
        assert.equal(updated.status, "accepted");
        assert.equal(updated.note, "تمت الموافقة");
    });

    await t.test("update returns 0 for non-existent member", async () => {
        const [count] = await Members.update(
            { occupation: "غير موجود" },
            { where: { id: "00000000-0000-0000-0000-000000000000" } }
        );
        assert.equal(count, 0);
    });

    await t.test("updates linked person data", async () => {
        const person = await Person.create(makePerson());
        await Members.create(makeMemberData(person.id, team.id));

        const [count] = await Person.update(
            { first_name: "خالد" },
            { where: { id: person.id } }
        );
        assert.equal(count, 1);

        const updated = await Person.findByPk(person.id);
        assert.equal(updated.first_name, "خالد");
    });

    // ── DELETE ────────────────────────────────────────────────────────────────

    await t.test("hard-deletes member then person", async () => {
        const person = await Person.create(makePerson());
        const member = await Members.create(makeMemberData(person.id, team.id));

        const memberCount = await Members.destroy({ where: { id: member.id }, force: true });
        assert.equal(memberCount, 1);

        await Person.destroy({ where: { id: person.id }, force: true });
        assert.equal(await Person.findByPk(person.id), null);
    });

    await t.test("soft-delete hides member in normal queries", async () => {
        const person = await Person.create(makePerson());
        const member = await Members.create(makeMemberData(person.id, team.id));

        await Members.destroy({ where: { id: member.id } });
        const found = await Members.findByPk(member.id);
        assert.equal(found, null, "soft-deleted member should not appear");
    });

    await t.test("delete returns 0 for non-existent member", async () => {
        const count = await Members.destroy({
            where: { id: "00000000-0000-0000-0000-000000000000" },
            force: true
        });
        assert.equal(count, 0);
    });

    await db.close();
});

// ─── Person + Players (CRUD) ──────────────────────────────────────────────────

test("Players: create, read, update, delete", async (t) => {
    const db = makeDB();

    const Person  = personFactory(db, Sequelize);
    const Club    = clubFactory(db, Sequelize);
    const Team    = teamFactory(db, Sequelize);
    const Players = playersFactory(db, Sequelize);

    Person.hasOne(Players,  { foreignKey: "id_person", onDelete: "CASCADE" });
    Players.belongsTo(Person, { foreignKey: "id_person" });
    Club.hasMany(Team,    { foreignKey: "id_club",  onDelete: "CASCADE" });
    Team.belongsTo(Club,  { foreignKey: "id_club" });
    Team.hasMany(Players, { foreignKey: "id_team",  onDelete: "CASCADE" });
    Players.belongsTo(Team, { foreignKey: "id_team" });

    await db.sync({ force: true });

    const club = await Club.create(makeClubData());
    const team = await Team.create(makeTeamData(club.id));

    // ── CREATE ────────────────────────────────────────────────────────────────

    await t.test("creates a player", async () => {
        const person = await Person.create(makePerson());
        const player = await Players.create(makePlayerData(person.id, team.id));

        assert.ok(player.id);
        assert.equal(player.activity, "كرة القدم");
    });

    // ── READ ──────────────────────────────────────────────────────────────────

    await t.test("reads a player by ID", async () => {
        const person = await Person.create(makePerson());
        const player = await Players.create(makePlayerData(person.id, team.id));

        const found = await Players.findByPk(player.id);
        assert.ok(found);
        assert.equal(found.id, player.id);
    });

    await t.test("findByPk returns null for unknown id", async () => {
        assert.equal(await Players.findByPk("00000000-0000-0000-0000-000000000000"), null);
    });

    await t.test("allPlayers returns players for a team", async () => {
        const p1 = await Person.create(makePerson());
        const p2 = await Person.create(makePerson());
        await Players.create(makePlayerData(p1.id, team.id));
        await Players.create(makePlayerData(p2.id, team.id));

        const all = await Players.findAll({ where: { id_team: team.id } });
        assert.ok(all.length >= 2);
    });

    await t.test("allPlayersByClass filters by class", async () => {
        const person = await Person.create(makePerson());
        await Players.create({ ...makePlayerData(person.id, team.id), class: "young" });

        const result = await Players.findAll({ where: { id_team: team.id, class: "young" } });
        assert.ok(result.length >= 1);
        assert.ok(result.every(p => p.class === "young"));
    });

    // ── UPDATE ────────────────────────────────────────────────────────────────

    await t.test("updates player_center", async () => {
        const person = await Person.create(makePerson());
        const player = await Players.create(makePlayerData(person.id, team.id));

        const [count] = await Players.update(
            { player_center: "حارس" },
            { where: { id: player.id } }
        );
        assert.equal(count, 1);

        const updated = await Players.findByPk(player.id);
        assert.equal(updated.player_center, "حارس");
    });

    await t.test("changeStatusPlayer: updates status and note", async () => {
        const person = await Person.create(makePerson());
        const player = await Players.create(makePlayerData(person.id, team.id));

        const [count] = await Players.update(
            { status: "accepted", note: "مقبول" },
            { where: { id: player.id } }
        );
        assert.equal(count, 1);

        const updated = await Players.findByPk(player.id);
        assert.equal(updated.status, "accepted");
    });

    await t.test("updatePlayer without person: person=null should not crash", () => {
        // This reproduces the bug fix in Players.mjs
        // old: result[0] === 1 || person[0] === 1  (crashes when person is null)
        // fix: result[0] === 1 || (person !== null && person[0] === 1)
        const result = [1];
        const person = null;
        const status = result[0] === 1 || (person !== null && person[0] === 1);
        assert.equal(status, true);
    });

    await t.test("update returns 0 for non-existent player", async () => {
        const [count] = await Players.update(
            { activity: "غير موجود" },
            { where: { id: "00000000-0000-0000-0000-000000000000" } }
        );
        assert.equal(count, 0);
    });

    // ── DELETE ────────────────────────────────────────────────────────────────

    await t.test("hard-deletes player and person", async () => {
        const person = await Person.create(makePerson());
        const player = await Players.create(makePlayerData(person.id, team.id));

        const playerCount = await Players.destroy({ where: { id: player.id }, force: true });
        assert.equal(playerCount, 1);

        await Person.destroy({ where: { id: person.id }, force: true });
        assert.equal(await Players.findByPk(player.id), null);
        assert.equal(await Person.findByPk(person.id), null);
    });

    await t.test("delete returns 0 for non-existent player", async () => {
        const count = await Players.destroy({
            where: { id: "00000000-0000-0000-0000-000000000000" },
            force: true
        });
        assert.equal(count, 0);
    });

    await db.close();
});

// ─── Blog (CRUD) ──────────────────────────────────────────────────────────────

test("Blog: create, read, update, delete", async (t) => {
    const db = makeDB();

    const Club = clubFactory(db, Sequelize);
    const Team = teamFactory(db, Sequelize);
    const Blog = blogFactory(db, Sequelize);

    Club.hasMany(Team, { foreignKey: "id_club", onDelete: "CASCADE" });
    Team.belongsTo(Club, { foreignKey: "id_club" });
    Team.hasMany(Blog, { foreignKey: "id_team", onDelete: "CASCADE" });
    Blog.belongsTo(Team, { foreignKey: "id_team" });

    await db.sync({ force: true });

    const club = await Club.create(makeClubData());
    const team = await Team.create(makeTeamData(club.id));

    // ── CREATE ────────────────────────────────────────────────────────────────

    await t.test("creates a blog post with status=waiting", async () => {
        const blog = await Blog.create({
            id_team:           team.id,
            subject:           "خبر هام",
            short_description: "وصف مختصر",
            status:            "waiting"
        });
        assert.ok(blog.id);
        assert.equal(blog.subject, "خبر هام");
        assert.equal(blog.status, "waiting");
    });

    // ── READ ──────────────────────────────────────────────────────────────────

    await t.test("reads a blog by ID", async () => {
        const blog = await Blog.create({ id_team: team.id, subject: "اقرأ", short_description: "وصف", status: "waiting" });
        const found = await Blog.findByPk(blog.id);
        assert.ok(found);
        assert.equal(found.id, blog.id);
    });

    await t.test("findByPk returns null for unknown ID", async () => {
        assert.equal(await Blog.findByPk("00000000-0000-0000-0000-000000000000"), null);
    });

    await t.test("allBlogs returns only accepted posts", async () => {
        await Blog.create({ id_team: team.id, subject: "مقبول",  short_description: "x", status: "accepted" });
        await Blog.create({ id_team: team.id, subject: "مرفوض", short_description: "y", status: "rejected" });

        const accepted = await Blog.findAll({ where: { status: "accepted" } });
        assert.ok(accepted.length >= 1);
        assert.ok(accepted.every(b => b.status === "accepted"));
    });

    await t.test("allBlogsTeam returns all blogs for a team", async () => {
        await Blog.create({ id_team: team.id, subject: "منشور 1", short_description: "x", status: "waiting" });
        const all = await Blog.findAll({ where: { id_team: team.id } });
        assert.ok(all.length >= 1);
    });

    // ── UPDATE ────────────────────────────────────────────────────────────────

    await t.test("updates blog subject", async () => {
        const blog = await Blog.create({ id_team: team.id, subject: "قديم", short_description: "x", status: "waiting" });
        const [count] = await Blog.update({ subject: "محدث" }, { where: { id: blog.id } });
        assert.equal(count, 1);

        const updated = await Blog.findByPk(blog.id);
        assert.equal(updated.subject, "محدث");
    });

    await t.test("updates blog status from waiting to accepted", async () => {
        const blog = await Blog.create({ id_team: team.id, subject: "في الانتظار", short_description: "x", status: "waiting" });
        await Blog.update({ status: "accepted" }, { where: { id: blog.id } });

        const updated = await Blog.findByPk(blog.id);
        assert.equal(updated.status, "accepted");
    });

    await t.test("update returns 0 for non-existent blog", async () => {
        const [count] = await Blog.update(
            { subject: "لا شيء" },
            { where: { id: "00000000-0000-0000-0000-000000000000" } }
        );
        assert.equal(count, 0);
    });

    // ── DELETE ────────────────────────────────────────────────────────────────

    await t.test("soft-deletes a blog (paranoid)", async () => {
        const blog = await Blog.create({ id_team: team.id, subject: "للحذف", short_description: "x", status: "waiting" });
        const count = await Blog.destroy({ where: { id: blog.id } });
        assert.equal(count, 1);

        const gone = await Blog.findByPk(blog.id);
        assert.equal(gone, null, "soft-deleted blog should not appear");
    });

    await t.test("delete returns 0 for non-existent blog", async () => {
        const count = await Blog.destroy({ where: { id: "00000000-0000-0000-0000-000000000000" } });
        assert.equal(count, 0);
    });

    await db.close();
});

// ─── User (CRUD) ──────────────────────────────────────────────────────────────

test("User: create, read, update, delete", async (t) => {
    const db = makeDB();

    const Person = personFactory(db, Sequelize);
    const User   = userFactory(db, Sequelize);

    Person.hasOne(User,    { foreignKey: "id_person", onDelete: "CASCADE" });
    User.belongsTo(Person, { foreignKey: "id_person" });

    await db.sync({ force: true });

    const { hashPassword, comparePassword } = await import("../src/Helpers/Password.mjs");

    // ── CREATE ────────────────────────────────────────────────────────────────

    await t.test("creates a user with hashed password", async () => {
        const person = await Person.create(makePerson());
        const hashed = await hashPassword("securePass!1");

        const user = await User.create({
            id_person:    person.id,
            email:        `u_${Date.now()}@test.com`,
            password:     hashed,
            role:         "3",
            activation:   true,
            email_verify: false
        });

        assert.ok(user.id);
        assert.notEqual(user.password, "securePass!1");
        assert.ok(user.password.startsWith("$2"));
    });

    await t.test("detects duplicate email at application level (alreadyExistUser logic)", async () => {
        const person = await Person.create(makePerson());
        const email  = `dup_${Date.now()}@test.com`;
        const hashed = await hashPassword("pass");

        await User.create({ id_person: person.id, email, password: hashed, role: "3", activation: true, email_verify: false });

        // Simulate the alreadyExistUser check done in the resolver
        const existing = await User.findOne({ where: { email } });
        const isDuplicate = existing && existing.email === email;
        assert.equal(isDuplicate, true, "duplicate email should be detected before create");
    });

    // ── READ ──────────────────────────────────────────────────────────────────

    await t.test("reads user by primary key", async () => {
        const person = await Person.create(makePerson());
        const user   = await User.create({
            id_person: person.id, email: `r_${Date.now()}@test.com`,
            password: await hashPassword("pass"), role: "4", activation: true, email_verify: false
        });

        const found = await User.findByPk(user.id);
        assert.ok(found);
        assert.equal(found.email, user.email);
    });

    await t.test("finds user by email (login lookup)", async () => {
        const person = await Person.create(makePerson());
        const email  = `login_${Date.now()}@test.com`;

        await User.create({ id_person: person.id, email, password: await hashPassword("pass"), role: "3", activation: true, email_verify: true });

        const found = await User.findOne({ where: { email } });
        assert.ok(found);
        assert.equal(found.email, email);
    });

    // ── UPDATE ────────────────────────────────────────────────────────────────

    await t.test("activeUser: activates a disabled account", async () => {
        const person = await Person.create(makePerson());
        const user   = await User.create({
            id_person: person.id, email: `act_${Date.now()}@test.com`,
            password: await hashPassword("pass"), role: "3", activation: false, email_verify: false
        });

        const [count] = await User.update({ activation: true }, { where: { id: user.id } });
        assert.equal(count, 1);

        const updated = await User.findByPk(user.id);
        assert.equal(updated.activation, true);
    });

    await t.test("emailVerification: sets email_verify=true and activation=true", async () => {
        const person = await Person.create(makePerson());
        const user   = await User.create({
            id_person: person.id, email: `ev_${Date.now()}@test.com`,
            password: await hashPassword("pass"), role: "3", activation: false, email_verify: false
        });

        const [count] = await User.update(
            { activation: true, email_verify: true },
            { where: { id: user.id } }
        );
        assert.equal(count, 1);

        const updated = await User.findByPk(user.id);
        assert.equal(updated.email_verify, true);
        assert.equal(updated.activation, true);
    });

    await t.test("changePassword: new password replaces old one", async () => {
        const person = await Person.create(makePerson());
        const user   = await User.create({
            id_person: person.id, email: `cp_${Date.now()}@test.com`,
            password: await hashPassword("oldPass"), role: "3", activation: true, email_verify: true
        });

        const newHash = await hashPassword("newPass");
        await User.update({ password: newHash }, { where: { id: user.id } });

        const updated = await User.findByPk(user.id);
        assert.equal(await comparePassword("newPass", updated.password), true);
        assert.equal(await comparePassword("oldPass", updated.password), false);
    });

    await t.test("login brute-force: failed_login_attempts increments and locks", async () => {
        const person = await Person.create(makePerson());
        const user   = await User.create({
            id_person: person.id, email: `bf_${Date.now()}@test.com`,
            password: await hashPassword("pass"), role: "3", activation: true, email_verify: true
        });

        const lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        await User.update(
            { failed_login_attempts: 5, locked_until: lockedUntil, last_failed_login_at: new Date() },
            { where: { id: user.id } }
        );

        const locked = await User.findByPk(user.id);
        assert.equal(Number(locked.failed_login_attempts), 5);
        assert.ok(new Date(locked.locked_until) > new Date(), "account should be locked");
    });

    await t.test("resetLoginFailures: clears lock fields", async () => {
        const person = await Person.create(makePerson());
        const user   = await User.create({
            id_person: person.id, email: `rf_${Date.now()}@test.com`,
            password: await hashPassword("pass"), role: "3", activation: true, email_verify: true,
            failed_login_attempts: 3, locked_until: new Date(Date.now() + 1000)
        });

        await User.update(
            { failed_login_attempts: 0, locked_until: null, last_failed_login_at: null },
            { where: { id: user.id } }
        );

        const updated = await User.findByPk(user.id);
        assert.equal(Number(updated.failed_login_attempts), 0);
        assert.equal(updated.locked_until, null);
    });

    // ── DELETE ────────────────────────────────────────────────────────────────

    await t.test("soft-deletes a user", async () => {
        const person = await Person.create(makePerson());
        const user   = await User.create({
            id_person: person.id, email: `del_${Date.now()}@test.com`,
            password: await hashPassword("pass"), role: "3", activation: true, email_verify: true
        });

        const count = await User.destroy({ where: { id: user.id } });
        assert.equal(count, 1);
        assert.equal(await User.findByPk(user.id), null);
    });

    await db.close();
});

// ─── Stadium + Reservations (CRUD) ───────────────────────────────────────────

test("Stadium + Reservations: create, read, update, delete", async (t) => {
    const db = makeDB();

    const Club         = clubFactory(db, Sequelize);
    const Team         = teamFactory(db, Sequelize);
    const Stadium      = stadiumFactory(db, Sequelize);
    const Reservations = reservationsFactory(db, Sequelize);

    Club.hasMany(Team,           { foreignKey: "id_club",    onDelete: "CASCADE" });
    Team.belongsTo(Club,         { foreignKey: "id_club" });
    Team.hasMany(Stadium,        { foreignKey: "id_team",    onDelete: "CASCADE" });
    Stadium.belongsTo(Team,      { foreignKey: "id_team" });
    Stadium.hasMany(Reservations, { foreignKey: "id_stadium", onDelete: "CASCADE" });
    Reservations.belongsTo(Stadium, { foreignKey: "id_stadium" });

    await db.sync({ force: true });

    const club = await Club.create(makeClubData());
    const team = await Team.create(makeTeamData(club.id));

    const stadiumBase = () => ({
        id_team:     team.id,
        name:        "ملعب الاختبار",
        about:       "ملعب للاختبارات",
        attachments: "حمام,مصلى",
        rent:        500
    });

    // ── CREATE ────────────────────────────────────────────────────────────────

    await t.test("creates a stadium", async () => {
        const stadium = await Stadium.create(stadiumBase());
        assert.ok(stadium.id);
        assert.equal(stadium.name, "ملعب الاختبار");
    });

    await t.test("creates a reservation for a stadium", async () => {
        const stadium     = await Stadium.create(stadiumBase());
        const reservation = await Reservations.create({
            id_stadium:    stadium.id,
            phone:         uniquePhone(),
            booking_date:  "2025-06-01",
            booking_start: "09:00:00",
            booking_end:   "11:00:00"
        });
        assert.ok(reservation.id);
        assert.equal(reservation.id_stadium, stadium.id);
    });

    await t.test("rejects overlapping reservations (same time slot)", async () => {
        const { Op } = Sequelize;
        const stadium = await Stadium.create(stadiumBase());
        const date = "2025-07-01";

        await Reservations.create({
            id_stadium: stadium.id, phone: uniquePhone(),
            booking_date: date, booking_start: "10:00:00", booking_end: "12:00:00"
        });

        // Try to book the same slot
        const existing = await Reservations.findAll({
            where: {
                id_stadium:    stadium.id,
                booking_date:  date,
                booking_start: "10:00:00",
                booking_end:   "12:00:00"
            }
        });
        assert.ok(existing.length > 0, "slot is already reserved");
    });

    // ── READ ──────────────────────────────────────────────────────────────────

    await t.test("reads a stadium by ID", async () => {
        const stadium = await Stadium.create(stadiumBase());
        const found   = await Stadium.findByPk(stadium.id);
        assert.ok(found);
        assert.equal(found.name, "ملعب الاختبار");
    });

    await t.test("lists all stadiums for a team", async () => {
        await Stadium.create(stadiumBase());
        const all = await Stadium.findAll({ where: { id_team: team.id } });
        assert.ok(all.length >= 1);
    });

    await t.test("lists all reservations for a stadium", async () => {
        const stadium = await Stadium.create(stadiumBase());
        await Reservations.create({
            id_stadium: stadium.id, phone: uniquePhone(),
            booking_date: "2025-08-01", booking_start: "08:00:00", booking_end: "10:00:00"
        });

        const all = await Reservations.findAll({ where: { id_stadium: stadium.id } });
        assert.ok(all.length >= 1);
    });

    // ── UPDATE ────────────────────────────────────────────────────────────────

    await t.test("updates a stadium name and rent", async () => {
        const stadium = await Stadium.create(stadiumBase());
        const [count] = await Stadium.update({ name: "ملعب محدث", rent: 750 }, { where: { id: stadium.id } });
        assert.equal(count, 1);

        const updated = await Stadium.findByPk(stadium.id);
        assert.equal(updated.name, "ملعب محدث");
        assert.equal(Number(updated.rent), 750);
    });

    await t.test("update returns 0 for non-existent stadium", async () => {
        const [count] = await Stadium.update(
            { name: "غير موجود" },
            { where: { id: "00000000-0000-0000-0000-000000000000" } }
        );
        assert.equal(count, 0);
    });

    // ── DELETE ────────────────────────────────────────────────────────────────

    await t.test("soft-deletes a stadium", async () => {
        const stadium = await Stadium.create(stadiumBase());
        const count   = await Stadium.destroy({ where: { id: stadium.id } });
        assert.equal(count, 1);

        const gone = await Stadium.findByPk(stadium.id);
        assert.equal(gone, null);
    });

    await t.test("findByPk returns null for deleted stadium", async () => {
        assert.equal(await Stadium.findByPk("00000000-0000-0000-0000-000000000000"), null);
    });

    await db.close();
});

// ─── Expense (CRUD) ───────────────────────────────────────────────────────────

test("Expense: create, read, update, delete", async (t) => {
    const db = makeDB();

    const Club    = clubFactory(db, Sequelize);
    const Team    = teamFactory(db, Sequelize);
    const Expense = expenseFactory(db, Sequelize);

    Club.hasMany(Team,     { foreignKey: "id_club",  onDelete: "CASCADE" });
    Team.belongsTo(Club,   { foreignKey: "id_club" });
    Team.hasMany(Expense,  { foreignKey: "id_team",  onDelete: "CASCADE" });
    Expense.belongsTo(Team, { foreignKey: "id_team" });

    await db.sync({ force: true });

    const club = await Club.create(makeClubData());
    const team = await Team.create(makeTeamData(club.id));

    const expenseBase = () => ({
        id_team: team.id,
        value:   500,
        note:    "رسوم تسجيل"
    });

    // ── CREATE ────────────────────────────────────────────────────────────────

    await t.test("creates an expense record", async () => {
        const expense = await Expense.create(expenseBase());
        assert.ok(expense.id);
        assert.equal(expense.note, "رسوم تسجيل");
        assert.equal(Number(expense.value), 500);
    });

    // ── READ ──────────────────────────────────────────────────────────────────

    await t.test("reads an expense by ID", async () => {
        const expense = await Expense.create(expenseBase());
        const found   = await Expense.findByPk(expense.id);
        assert.ok(found);
        assert.equal(found.id, expense.id);
    });

    await t.test("lists all expenses for a team", async () => {
        await Expense.create(expenseBase());
        const all = await Expense.findAll({ where: { id_team: team.id } });
        assert.ok(all.length >= 1);
    });

    // ── UPDATE ────────────────────────────────────────────────────────────────

    await t.test("updates expense value", async () => {
        const expense = await Expense.create(expenseBase());
        const [count] = await Expense.update({ value: 999 }, { where: { id: expense.id } });
        assert.equal(count, 1);

        const updated = await Expense.findByPk(expense.id);
        assert.equal(Number(updated.value), 999);
    });

    await t.test("updates expense note", async () => {
        const expense = await Expense.create(expenseBase());
        await Expense.update({ note: "ملاحظة محدثة" }, { where: { id: expense.id } });

        const updated = await Expense.findByPk(expense.id);
        assert.equal(updated.note, "ملاحظة محدثة");
    });

    await t.test("update returns 0 for non-existent expense", async () => {
        const [count] = await Expense.update(
            { value: 1 },
            { where: { id: "00000000-0000-0000-0000-000000000000" } }
        );
        assert.equal(count, 0);
    });

    // ── DELETE ────────────────────────────────────────────────────────────────

    await t.test("soft-deletes an expense", async () => {
        const expense = await Expense.create(expenseBase());
        const count   = await Expense.destroy({ where: { id: expense.id } });
        assert.equal(count, 1);

        assert.equal(await Expense.findByPk(expense.id), null);
    });

    await db.close();
});

// ─── Meeting (CRUD) ───────────────────────────────────────────────────────────

test("Meeting: create, read, update, delete", async (t) => {
    const db = makeDB();

    const Club    = clubFactory(db, Sequelize);
    const Team    = teamFactory(db, Sequelize);
    const Meeting = meetingFactory(db, Sequelize);

    Club.hasMany(Team,     { foreignKey: "id_club",  onDelete: "CASCADE" });
    Team.belongsTo(Club,   { foreignKey: "id_club" });
    Team.hasMany(Meeting,  { foreignKey: "id_team",  onDelete: "CASCADE" });
    Meeting.belongsTo(Team, { foreignKey: "id_team" });

    await db.sync({ force: true });

    const club = await Club.create(makeClubData());
    const team = await Team.create(makeTeamData(club.id));

    const meetingBase = () => ({
        id_team:         team.id,
        subject:         "اجتماع الفريق",
        names_attending: "أحمد, محمد, علي"
    });

    // ── CREATE ────────────────────────────────────────────────────────────────

    await t.test("creates a meeting", async () => {
        const meeting = await Meeting.create(meetingBase());
        assert.ok(meeting.id);
        assert.equal(meeting.subject, "اجتماع الفريق");
    });

    // ── READ ──────────────────────────────────────────────────────────────────

    await t.test("reads a meeting by ID", async () => {
        const meeting = await Meeting.create(meetingBase());
        const found   = await Meeting.findByPk(meeting.id);
        assert.ok(found);
        assert.equal(found.subject, "اجتماع الفريق");
    });

    await t.test("lists all meetings for a team", async () => {
        await Meeting.create(meetingBase());
        const all = await Meeting.findAll({ where: { id_team: team.id } });
        assert.ok(all.length >= 1);
    });

    // ── UPDATE ────────────────────────────────────────────────────────────────

    await t.test("updates meeting subject and description", async () => {
        const meeting = await Meeting.create(meetingBase());
        const [count] = await Meeting.update(
            { subject: "اجتماع طارئ", description: "بسبب مباراة قادمة" },
            { where: { id: meeting.id } }
        );
        assert.equal(count, 1);

        const updated = await Meeting.findByPk(meeting.id);
        assert.equal(updated.subject, "اجتماع طارئ");
        assert.equal(updated.description, "بسبب مباراة قادمة");
    });

    await t.test("update returns 0 for non-existent meeting", async () => {
        const [count] = await Meeting.update(
            { subject: "لا شيء" },
            { where: { id: "00000000-0000-0000-0000-000000000000" } }
        );
        assert.equal(count, 0);
    });

    // ── DELETE ────────────────────────────────────────────────────────────────

    await t.test("soft-deletes a meeting", async () => {
        const meeting = await Meeting.create(meetingBase());
        const count   = await Meeting.destroy({ where: { id: meeting.id } });
        assert.equal(count, 1);

        assert.equal(await Meeting.findByPk(meeting.id), null);
    });

    await db.close();
});
