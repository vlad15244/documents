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
const table = new Table('my_orders');
const app = express();

// Подключаем EJS как движок шаблонов
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));

const STATUS_ORDER = {
  ready: { label: 'Сделана', color: '#28a745' },   // Зеленый
  pending: { label: 'В работе', color: '#ffc107' } // Желтый
};

(async () => {
    const connection = await pool.getConnection();

    table.AddColumn(new Column('ID', 'BIGINT','NOT NULL AUTO_INCREMENT'));
    table.AddColumn(new Column('NUMBER', 'BIGINT', 'NOT NULL')); //Номер заказ наряда
    table.AddColumn(new Column('STATUS', 'VARCHAR(45)', 'NOT NULL')); //Статус
    table.AddColumn(new Column('DATESTAMP', 'DATETIME', 'NOT NULL')); //Дата, когда сделана заявка   

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

        rows.forEach(row =>
            {
                row.formattedDate = new Date(row.DATESTAMP).toLocaleDateString('ru-RU');    
            }
        )

        res.render('index', {title : 'Список заявок на оборудование', rows : rows, data_yes : rows.length > 0, statuses : STATUS_ORDER});


    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});


app.post('/update/:id', async(req, res ) => {

    try{
        const [rows] = await pool.query(table.Update(), [req.body.name, req.body.car, req.params.id]);
        res.redirect('/'); 
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
        const status_order = req.body.orderStatus;
        const date_ = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (req.body.date){
            date_ = new Date().toISOString().slice(0, 19).replace('T', ' ');
        }

        if (!text_from || typeof text_from !== 'string') {
            return res.status(400).json({ error: 'Отсутствует или неверное поле "text"' });
        }

        try{
            const [rows] = await pool.query(table.Insert(), [text_from, status_order, date_]);   
            
            
            res.redirect('/'); 
        }
        catch(err){
            console.error('Ошибка при добавлении данных:', err);
            res.status(500).send('Ошибка сервера: не удалось загрузить данные');            

        }

})

app.get('/add', async(req, res) => {
    
    try{
        
        res.render('add', {statuses : STATUS_ORDER});

    }
    catch(err){
        console.error('Ошибка при добавлении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');                
    }  

})


app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
