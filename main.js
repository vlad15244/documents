import { Table } from './database.js';
import { Column } from './database.js';
import mysql from 'mysql2/promise';
import http from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = 3000;

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'test'
};

const pool = mysql.createPool(dbConfig);
const table = new Table('node_ex');
const app = express();

// Подключаем EJS как движок шаблонов
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

(async () => {
    const connection = await pool.getConnection();



    table.AddColumn(new Column('ID', 'BIGINT',"UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY "));
    table.AddColumn(new Column('NAME', 'VARCHAR(45)', "NOT NULL"));    

    try {
        await connection.execute(table.CreateTable());
        console.log('Table created or already exists'); 
    } catch(err){
        console.log(`Error ${err} while connect with database`); 
    } finally{
        connection.end();
    }

})();


app.get('/', async(req, res ) => {
    console.log('This is way');
    try{
        const [rows] = await pool.query(table.SelectAll());
        console.log(rows);
        res.render('index', {title : 'Пример работы с БД', rows : rows});
    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
