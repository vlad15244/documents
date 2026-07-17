import { Table } from './database.js';
import { Column } from './database.js';
import {convert_data} from './library.js';
import mysql from 'mysql2/promise';
import http from 'http';
import express from 'express';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import console from 'console';
import moment from 'moment';

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
app.use(express.json()); 

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads')); // папка должна существовать
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // уникальное имя
  }
});

const upload = multer({ storage: storage });
app.use(express.static(path.join(__dirname, 'public')));
// Подключаем EJS как движок шаблонов
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));


const STATUS_ORDER = {
  ready: { label: 'Сделана', color: '#28a745', text : 'ready' },   // Зеленый
  pending: { label: 'В работе', color: '#ffc107', text : 'pending' }, // Желтый
  obsolete: { label: 'Изменена', color: '#bd2ca9', text : 'obsolete' }, //  
  not_ready: { label: 'Необработана', color: '#a74b15', text : 'not_ready' } //  
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

        let date_ = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (req.body.order_date){
            date_ = req.body.order_date;
        }       

        const [rows] = await pool.query(table.Update(), [req.body.name, req.body.orderStatus,date_, req.params.id]);
        res.redirect('/'); 
    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.get('/delete/:id', async(req, res ) => {

    try{
        const [rows] = await pool.query(table.Delete(), [req.params.id]);
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
        row[0].forEach(elem => {
            elem.formattedDate = convert_data(new Date(elem.DATESTAMP).toLocaleDateString('ru-RU')); 
        });
        res.render('view', {title : 'Изменение записи заявки', row : row[0], statuses : STATUS_ORDER}); 

    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});


app.post('/add', async(req, res) => {
    
        const text_from = req.body.name;
        const status_order = req.body.orderStatus;
        let date_ = new Date().toISOString().slice(0, 19).replace('T', ' ');

        if (req.body.order_date){
            date_ = req.body.order_date;
        }

        if (!text_from || typeof text_from !== 'string') {
            return res.status(400).json({ error: 'Отсутствует или неверное поле "text"' });
        }

        if (status_order == null) {
            return res.status(400).json({ error: 'Неуказан статус' });
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
    
        res.render('add', {title : 'Добавление новой заявки', statuses : STATUS_ORDER});

    }
    catch(err){
        console.error('Ошибка при добавлении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');                
    }  

})

app.post('/filter', async(req, res) => {
    
    try{

        const { status } = req.body;

        let rows = [];

        if (status){
            [rows] = await pool.query(table.Filter('status'), [status]);
        }
        else
        {
           [rows] = await pool.query(table.SelectAll());    
        }


        rows.forEach(row =>
            {
                row.formattedDate = new Date(row.DATESTAMP).toLocaleDateString('ru-RU');  
            }
        )
        res.send({rows : rows, length : rows.length, statuses : STATUS_ORDER});

    }
    catch(err){
        console.error('Ошибка при чтении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');                
    }  

})




app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});
