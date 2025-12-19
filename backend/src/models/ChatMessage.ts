import { DataTypes, Model, Optional } from 'sequelize';
import sequelize from '../config/database';
import { User } from './User';

interface ChatMessageAttributes {
  id: number;
  userId: number | null;
  username: string;
  message: string;
  isAnonymous: boolean;
  userRole?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

interface ChatMessageCreationAttributes extends Optional<ChatMessageAttributes, 'id'> {}

class ChatMessage extends Model<ChatMessageAttributes, ChatMessageCreationAttributes> implements ChatMessageAttributes {
  public id!: number;
  public userId!: number | null;
  public username!: string;
  public message!: string;
  public isAnonymous!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ChatMessage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 1000],
      },
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    userRole: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'chat_messages',
    timestamps: true,
  }
);

// Связь с User
ChatMessage.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default ChatMessage;
