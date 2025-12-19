import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { User } from './User';

export enum NewsStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected'
}

interface NewsAttributes {
  id: number;
  title: string;
  content: string;
  authorId: number;
  status: NewsStatus;
  imageUrl?: string;
  isHidden?: boolean;
  approvedById?: number;
  createdAt?: Date;
  approvedAt?: Date;
  updatedAt?: Date;
}

interface NewsCreationAttributes extends Optional<NewsAttributes, 'id' | 'status' | 'imageUrl' | 'isHidden' | 'approvedById' | 'createdAt' | 'approvedAt' | 'updatedAt'> {}

export class News extends Model<NewsAttributes, NewsCreationAttributes> implements NewsAttributes {
  public id!: number;
  public title!: string;
  public content!: string;
  public authorId!: number;
  public status!: NewsStatus;
  public imageUrl?: string;
  public isHidden?: boolean;
  public approvedById?: number;
  public readonly createdAt!: Date;
  public approvedAt?: Date;
  public readonly updatedAt!: Date;

  // Ассоциации
  public readonly author?: User;
  public readonly approvedBy?: User;
}

News.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: [5, 200],
      },
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 5000],
      },
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM(...Object.values(NewsStatus)),
      defaultValue: NewsStatus.PENDING,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    isHidden: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
    approvedById: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'news',
    timestamps: true,
  }
);

// Определение связей
News.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
News.belongsTo(User, { foreignKey: 'approvedById', as: 'approvedBy' });
User.hasMany(News, { foreignKey: 'authorId', as: 'news' });
