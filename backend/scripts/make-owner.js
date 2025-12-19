const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../data/sakevanews.sqlite');
const db = new sqlite3.Database(dbPath);

db.run(
  "UPDATE users SET role = 'owner' WHERE nick = ?",
  ['Mexaaa'],
  function(err) {
    if (err) {
      console.error('❌ Ошибка:', err);
    } else {
      console.log('✅ Пользователь Mexaaa теперь владелец (owner)!');
      console.log(`   Обновлено строк: ${this.changes}`);
    }
    db.close();
  }
);
