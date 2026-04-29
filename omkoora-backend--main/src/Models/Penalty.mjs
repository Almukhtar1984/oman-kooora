export default (db, types) => {
  return db.define('penalty', {
    id: {
      type: types.UUID,
      defaultValue: types.UUIDV4,
      allowNull: false,
      primaryKey: true
    },
    firstTeamPenalty: {
      type: types.INTEGER,
      allowNull: false
    },
    secondTeamPenalty: {
      type: types.INTEGER,
      allowNull: false
    }
  }, {
    timestamps: true,
    createdAt: true,
    updatedAt: true,
    deletedAt: true,
    paranoid: true
  });
};
