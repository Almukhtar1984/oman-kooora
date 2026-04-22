import Sequelize from 'sequelize'
import DB from '../Config/DBContact.mjs'


// import models
import personModel       from './Person.mjs';
import userModel         from './User.mjs';
import clubModel         from './Club.mjs';
import teamModel         from './Team.mjs';
import membersModel             from './Members.mjs';
import playersModel             from './Players.mjs';
import technicalApparatusModel  from './TechnicalApparatus.mjs';
import clubManagementModel  from './ClubManagement.mjs';
import transferModel         from './Transfer.mjs';
import requestModel         from './Request.mjs';
import assemblyModel         from './Assembly.mjs';
import messageModel         from './Message.mjs';
import attachmentModel         from './Attachment.mjs';
import commentModel         from './Comment.mjs';
import expenseModel         from './Expense.mjs';
import meetingModel         from './Meeting.mjs';
import blogModel         from './Blog.mjs';
import attachmentBlogModel         from './AttachmentBlog.mjs';
import formModel         from './Form.mjs';
import permissionModel         from './Permission.mjs';
import stadiumModel         from './Stadium.mjs';
import reservationsModel         from './Reservations.mjs';
import leagueModel         from './League.mjs';
import participatingTeamsModel         from './ParticipatingTeams.mjs';
import matchModel         from './Match.mjs';
import matchCardModel         from './MatchCard.mjs';
import participatingPlayersModel         from './ParticipatingPlayers.mjs';
import participatingTechnicalStaffModel         from './ParticipatingTechnicalStaff.mjs';
import attachmentPersonModel         from './AttachmentPerson.mjs';
import scorerMatchModel         from './ScorerMatch.mjs';




// Definition models and set database config and orm sequelize
const Person     =     personModel(DB, Sequelize);
const User       =     userModel(DB, Sequelize);
const Club       =     clubModel(DB, Sequelize);
const Team       =     teamModel(DB, Sequelize);
const Members       =       membersModel(DB, Sequelize);
const Players       =       playersModel(DB, Sequelize);
const TechnicalApparatus =  technicalApparatusModel(DB, Sequelize);
const ClubManagement =  clubManagementModel(DB, Sequelize);
const Transfer =  transferModel(DB, Sequelize);
const Request =  requestModel(DB, Sequelize);
const Assembly =  assemblyModel(DB, Sequelize);
const Message =  messageModel(DB, Sequelize);
const Attachment =  attachmentModel(DB, Sequelize);
const Comment =  commentModel(DB, Sequelize);
const Expense =  expenseModel(DB, Sequelize);
const Meeting =  meetingModel(DB, Sequelize);
const Blog =  blogModel(DB, Sequelize);
const AttachmentBlog =  attachmentBlogModel(DB, Sequelize);
const Form =  formModel(DB, Sequelize);
const Permission =  permissionModel(DB, Sequelize);
const Stadium =  stadiumModel(DB, Sequelize);
const Reservations =  reservationsModel(DB, Sequelize);
const League =  leagueModel(DB, Sequelize);
const ParticipatingTeams =  participatingTeamsModel(DB, Sequelize);
const Match = matchModel(DB, Sequelize);
const MatchCard = matchCardModel(DB, Sequelize);
const ParticipatingPlayers = participatingPlayersModel(DB, Sequelize);
const ParticipatingTechnicalStaff = participatingTechnicalStaffModel(DB, Sequelize);
const AttachmentPerson = attachmentPersonModel(DB, Sequelize);
const ScorerMatch = scorerMatchModel(DB, Sequelize);



// Relationships between tables

// Person 1 * User
Person.hasOne(User, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
User.belongsTo(Person, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Person 1 * Members
Person.hasOne(Members, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Members.belongsTo(Person, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Person 1 * Players
Person.hasOne(Players, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Players.belongsTo(Person, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Person 1 * TechnicalApparatus
Person.hasOne(TechnicalApparatus, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
TechnicalApparatus.belongsTo(Person, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Person 1 * TechnicalApparatus
Person.hasOne(ClubManagement, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ClubManagement.belongsTo(Person, { foreignKey: { name: 'id_person' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Team
Club.hasOne(Team, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Team.belongsTo(Club, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Stadium
Team.hasOne(Stadium, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Stadium.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Stadium 1 * Reservations
Stadium.hasOne(Reservations, { foreignKey: { name: 'id_stadium' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Reservations.belongsTo(Stadium, { foreignKey: { name: 'id_stadium' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Members
Team.hasOne(Members, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Members.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Players
Team.hasOne(Players, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Players.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * TechnicalApparatus
Team.hasOne(TechnicalApparatus, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
TechnicalApparatus.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * TechnicalApparatus
Club.hasOne(ClubManagement, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ClubManagement.belongsTo(Club, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Transfer (from)
Team.hasOne(Transfer, { foreignKey: { name: 'id_team_from' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Transfer.belongsTo(Team, { foreignKey: { name: 'id_team_from' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Transfer (to)
Team.hasOne(Transfer, { foreignKey: { name: 'id_team_to' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Transfer.belongsTo(Team, { foreignKey: { name: 'id_team_to' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Transfer (to)
Club.hasOne(Transfer, { foreignKey: { name: 'id_club_to' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Transfer.belongsTo(Club, { foreignKey: { name: 'id_club_to' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Players 1 * Transfer
Players.hasOne(Transfer, { foreignKey: { name: 'id_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Transfer.belongsTo(Players, { foreignKey: { name: 'id_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Players 1 * Request
Players.hasOne(Request, { foreignKey: { name: 'id_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Request.belongsTo(Players, { foreignKey: { name: 'id_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Assembly
Club.hasOne(Assembly, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Assembly.belongsTo(Club, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Assembly
Team.hasOne(Assembly, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Assembly.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Message
Club.hasOne(Message, { foreignKey: { name: 'id_club_sender' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Message.belongsTo(Club, { foreignKey: { name: 'id_club_sender' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Message
Club.hasOne(Message, { foreignKey: { name: 'id_club_receiver' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Message.belongsTo(Club, { foreignKey: { name: 'id_club_receiver' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Message
Team.hasOne(Message, { foreignKey: { name: 'id_team_sender' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Message.belongsTo(Team, { foreignKey: { name: 'id_team_sender' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Message
Team.hasOne(Message, { foreignKey: { name: 'id_team_receiver' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Message.belongsTo(Team, { foreignKey: { name: 'id_team_receiver' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Message 1 * Attachment
Message.hasOne(Attachment, { foreignKey: { name: 'id_message' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Attachment.belongsTo(Message, { foreignKey: { name: 'id_message' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Message 1 * Comment
Message.hasOne(Comment, { foreignKey: { name: 'id_message' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Comment.belongsTo(Message, { foreignKey: { name: 'id_message' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Message 1 * Comment
Team.hasOne(Comment, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Comment.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Message 1 * Comment
Club.hasOne(Comment, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Comment.belongsTo(Club, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Expense
Club.hasOne(Expense, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Expense.belongsTo(Club, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Expense
Team.hasOne(Expense, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Expense.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Meeting
Club.hasOne(Meeting, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Meeting.belongsTo(Club, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Meeting
Team.hasOne(Meeting, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Meeting.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Meeting 1 * Attachment
Meeting.hasOne(Attachment, { foreignKey: { name: 'id_meeting' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Attachment.belongsTo(Meeting, { foreignKey: { name: 'id_meeting' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Blog
Club.hasOne(Blog, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Blog.belongsTo(Club, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * Blog
Team.hasOne(Blog, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Blog.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Blog 1 * AttachmentBlog
Blog.hasOne(AttachmentBlog, { foreignKey: { name: 'id_blog' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
AttachmentBlog.belongsTo(Blog, { foreignKey: { name: 'id_blog' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * Form
Club.hasOne(Form, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Form.belongsTo(Club, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// User 1 * Permission
User.hasOne(Permission, { foreignKey: { name: 'id_user' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Permission.belongsTo(User, { foreignKey: { name: 'id_user' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Club 1 * League
Club.hasOne(League, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
League.belongsTo(Club, { foreignKey: { name: 'id_club' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// League 1 * ParticipatingTeams
League.hasOne(ParticipatingTeams, { foreignKey: { name: 'id_league' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ParticipatingTeams.belongsTo(League, { foreignKey: { name: 'id_league' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Team 1 * ParticipatingTeams
Team.hasOne(ParticipatingTeams, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ParticipatingTeams.belongsTo(Team, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// League 1 * Match
League.hasOne(Match, { foreignKey: { name: 'id_league' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Match.belongsTo(League, { foreignKey: { name: 'id_league' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// ParticipatingTeams 1 * Match
ParticipatingTeams.hasOne(Match, { foreignKey: { name: 'first_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Match.belongsTo(ParticipatingTeams, { foreignKey: { name: 'first_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// ParticipatingTeams 1 * Match
ParticipatingTeams.hasOne(Match, { foreignKey: { name: 'second_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
Match.belongsTo(ParticipatingTeams, { foreignKey: { name: 'second_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });


// Match 1 * MatchCard
Match.hasOne(MatchCard, { foreignKey: { name: 'id_match' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
MatchCard.belongsTo(Match, { foreignKey: { name: 'id_match' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Match 1 * MatchCard
ParticipatingTeams.hasOne(MatchCard, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
MatchCard.belongsTo(ParticipatingTeams, { foreignKey: { name: 'id_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// ParticipatingTeams 1 * ParticipatingPlayers
ParticipatingTeams.hasOne(ParticipatingPlayers, { foreignKey: { name: 'id_participating_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ParticipatingPlayers.belongsTo(ParticipatingTeams, { foreignKey: { name: 'id_participating_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Players 1 * ParticipatingPlayers
Players.hasOne(ParticipatingPlayers, { foreignKey: { name: 'id_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ParticipatingPlayers.belongsTo(Players, { foreignKey: { name: 'id_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// ParticipatingTeams 1 * ParticipatingTechnicalStaff
ParticipatingTeams.hasOne(ParticipatingTechnicalStaff, { foreignKey: { name: 'id_participating_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ParticipatingTechnicalStaff.belongsTo(ParticipatingTeams, { foreignKey: { name: 'id_participating_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// TechnicalApparatus 1 * ParticipatingTechnicalStaff
TechnicalApparatus.hasOne(ParticipatingTechnicalStaff, { foreignKey: { name: 'id_technical_apparatus' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ParticipatingTechnicalStaff.belongsTo(TechnicalApparatus, { foreignKey: { name: 'id_technical_apparatus' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Players 1 * AttachmentPerson
Players.hasOne(AttachmentPerson, { foreignKey: { name: 'id_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
AttachmentPerson.belongsTo(Players, { foreignKey: { name: 'id_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// Match 1 * ScorerMatch
Match.hasOne(ScorerMatch, { foreignKey: { name: 'id_match' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ScorerMatch.belongsTo(Match, { foreignKey: { name: 'id_match' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// ParticipatingTeams 1 * ScorerMatch
ParticipatingTeams.hasOne(ScorerMatch, { foreignKey: { name: 'id_participating_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ScorerMatch.belongsTo(ParticipatingTeams, { foreignKey: { name: 'id_participating_team' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });

// ParticipatingPlayers 1 * ScorerMatch
ParticipatingPlayers.hasOne(ScorerMatch, { foreignKey: { name: 'id_participating_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
ScorerMatch.belongsTo(ParticipatingPlayers, { foreignKey: { name: 'id_participating_player' }, onDelete: 'CASCADE', onUpdate: 'CASCADE'  });



const shouldSyncModels = process.env.DB_SYNC_ALTER === "true" && process.env.NODE_ENV !== "production";

if (shouldSyncModels) {
    // Development-only escape hatch. Database changes should normally be applied through migrations.
    DB.sync({ alter: true, force: false })
    .then(() => {
        console.log('Tables are updated without being deleted.')
    })
    .catch ((error) => {
        console.error('Unable to update Tables:', error);
    })
}


export {
    User, Club, Team, Person, Members, Players, TechnicalApparatus, ClubManagement, Transfer, Request,
    Assembly, Message, Attachment, Comment, Expense, Meeting, Blog, AttachmentBlog, Form, Permission,
    Stadium, Reservations, League, ParticipatingTeams, Match, MatchCard, ParticipatingPlayers,
    ParticipatingTechnicalStaff, AttachmentPerson, ScorerMatch
}
