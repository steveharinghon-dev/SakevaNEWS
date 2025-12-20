import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';
import { News } from './News';

interface CommentAttributes {
  id: number;
  newsId: number;
  userId: number;
  username: string;
  content: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface CommentCreationAttributes extends Optional<CommentAttributes, 'id'> {}

export class Comment extends Model<CommentAttributes, CommentCreationAttributes> implements CommentAttributes {
  public id!: number;
  public newsId!: number;
  public userId!: number;
  public username!: string;
  public content!: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  // Ассоциации
  public readonly user?: User;
  public readonly news?: News;
}

Comment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
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
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000],
        notEmpty: true,
      },
    },
  },
  {
    sequelize,
    tableName: 'comments',
    timestamps: true,
    indexes: [
      // Индекс для получения комментариев по новости
      {
        name: 'idx_comments_news',
        fields: ['newsId', 'createdAt'],
      },
      // Индекс для поиска по пользователю
      {
        name: 'idx_comments_user',
        fields: ['userId'],
      },
    ],
  }
);

// Связи
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Comment.belongsTo(News, { foreignKey: 'newsId', as: 'news' });
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
News.hasMany(Comment, { foreignKey: 'newsId', as: 'comments' });

export default Comment;
