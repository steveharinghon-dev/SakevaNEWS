import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import { sequelize } from '../src/config/database';
import { User, UserRole } from '../src/models/User';
import '../src/models/News'; // Импортируем для инициализации связей

dotenv.config();

const initDatabase = async () => {
  try {
    // Подключаемся к БД
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    // Синхронизируем модели
    await sequelize.sync({ alter: true });
    console.log('✅ Database tables synchronized');

    // Проверяем существование owner аккаунта
    const existingOwner = await User.findOne({ where: { nick: 'Mexa' } });

    if (existingOwner) {
      console.log('ℹ️  Owner account already exists');
      console.log(`   Nick: Mexa`);
      console.log(`   Role: ${existingOwner.role}`);
    } else {
      // Создаем owner аккаунт
      const hashedPassword = await bcrypt.hash('GL2200Gl!@', 10);

      const owner = await User.create({
        nick: 'Mexa',
        password: hashedPassword,
        role: UserRole.OWNER,
        isBlocked: false
      });

      console.log('\n🎉 Owner account created successfully!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('   Nick:     Mexa');
      console.log('   Password: GL2200Gl!@');
      console.log('   Role:     owner');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('⚠️  Please change the password after first login!\n');
    }

    await sequelize.close();
    console.log('✅ Database initialization completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization error:', error);
    process.exit(1);
  }
};

initDatabase();
