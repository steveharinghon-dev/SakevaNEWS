import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import { User } from './User';
import { News } from './News';

export enum ActionType {
  CREATED = 'created',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  DELETED = 'deleted',
  HIDDEN = 'hidden',
  SHOWN = 'shown'
}

interface NewsLogAttributes {
  id?: number;
  action: ActionType;
  newsId: number;
  userId: number;
  createdAt?: Date;
}

class NewsLog extends Model<NewsLogAttributes> implements NewsLogAttributes {
  public id!: number;
  public action!: ActionType;
  public newsId!: number;
  public userId!: number;
  public readonly createdAt!: Date;
}

NewsLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    action: {
      type: DataTypes.ENUM(...Object.values(ActionType)),
      allowNull: false,
    },
    newsId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'news',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'news_logs',
    timestamps: true,
    updatedAt: false,
  }
);

// Связи
NewsLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });
NewsLog.belongsTo(News, { foreignKey: 'newsId', as: 'news' });

export default NewsLog;
