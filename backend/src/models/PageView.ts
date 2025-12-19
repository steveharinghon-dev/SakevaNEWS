import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';

interface PageViewAttributes {
  id?: string;
  path: string;
  userAgent?: string;
  ip?: string;
  createdAt?: Date;
}

class PageView extends Model<PageViewAttributes> implements PageViewAttributes {
  public id!: string;
  public path!: string;
  public userAgent?: string;
  public ip?: string;
  public readonly createdAt!: Date;
}

PageView.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    path: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    userAgent: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ip: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'page_views',
    timestamps: true,
    updatedAt: false,
  }
);

export default PageView;
