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
app.use(express.urlencoded({ extended: true }));



(async () => {
    const connection = await pool.getConnection();

    table.AddColumn(new Column('ID', 'BIGINT','NOT NULL AUTO_INCREMENT'));
    table.AddColumn(new Column('NAME', 'VARCHAR(45)', 'NOT NULL'));
    table.AddColumn(new Column('CAR', 'VARCHAR(45)', 'NOT NULL'));
    table.Verification();


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

    try{
        const [rows] = await pool.query(table.SelectAll());

        res.render('index', {title : 'Пример работы с БД', rows : rows});
    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});



app.get('/update', async(req, res ) => {

    try{
        table.Update();
    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.get('/view/:id', async(req, res ) => {

    try{
        const row = await pool.query(table.SelectByID(), [req.params.id]); //Тут всегда массив

        res.render('view', {title : 'Получение одно  строки', row : row[0]}); 

    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});


app.post('/add', async(req, res) => {
    
        const text_from = req.body.name;
        const car_ = req.body.car;

        if (!text_from || typeof text_from !== 'string') {
            return res.status(400).json({ error: 'Отсутствует или неверное поле "text"' });
        }

        try{
            const [rows] = await pool.query(table.Insert(), [text_from, car_]);   
            
            
            res.redirect('/'); 
        }
        catch(err){
            console.error('Ошибка при добавлении данных:', err);
            res.status(500).send('Ошибка сервера: не удалось загрузить данные');            

        }

})

app.get('/add', async(req, res) => {
    
    try{
        
        res.render('add');

    }
    catch(err){
        console.error('Ошибка при добавлении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');                
    }  

})


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
