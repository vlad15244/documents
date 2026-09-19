import { Table } from './database.js';
import { Column } from './database.js';
import { ExportToLogin } from './excel.js';
import {convert_data} from './library.js';
import {bind_rows} from './library.js';
import {hashPassword} from './library.js';
import {isCorrectPassword} from './library.js';
import mysql from 'mysql2/promise';
import http from 'http';
import express from 'express';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import console from 'console';
import moment from 'moment';
import fs from 'fs';
import session from 'express-session';
import cookieParser from 'cookie-parser';


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const __filename = fileURLToPath(import.meta.url);

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Папка uploads создана:', uploadsDir);
}
else{
  console.log('Папка uploads была уже создана');    
}

const PORT = 3000;

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '1234',
  database: 'test'
};


const rawData = fs.readFileSync(`${__dirname}/api.json`, 'utf8');
const apiConfig = JSON.parse(rawData);

const env = fs.readFileSync(`${__dirname}/env.json`, 'utf8');
const envConfig = JSON.parse(env);

const pool = mysql.createPool(dbConfig);
const table = new Table('my_orders');
const users_table = new Table('users');

const app = express();
app.use(express.json());
app.use(cookieParser()); 
app.use(session({
  secret: envConfig.SECRET_KEY, // 
  resave: false,                 
  saveUninitialized: false,      
  cookie: { 
    secure: false,               
    httpOnly: true,              
    maxAge: 24 * 60 * 60 * 1000 
  }
}));

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

const TYPE_ORDER = {
  plc: { label: 'ПЛК', color: '#28a745', text : 'plc' },   
  pc_with_scada: { label: 'ПК + SCADA', color: '#ffc107', text : 'pc_with_scada' },
  only_scada: { label: 'SCADA', color: '#bd2ca9', text : 'SCADA' },   
  devices: { label: 'Другое', color: '#a74b15', text : 'devices' }   
};

const TYPE_GROUP_USER = {
  1: { label: 'Администратор', text : 'admin' },   
  2: { label: 'Пользователь', text : 'user' }
};


(async () => {
    const connection = await pool.getConnection();

    table.AddColumn(new Column('ID', 'BIGINT','NOT NULL AUTO_INCREMENT', true));
    table.AddColumn(new Column('NUMBER', 'BIGINT', 'NOT NULL', false)); //Номер заказ наряда
    table.AddColumn(new Column('STATUS', 'VARCHAR(45)', 'NOT NULL', false)); //Статус
    table.AddColumn(new Column('DATESTAMP', 'DATETIME', 'NOT NULL', false)); //Дата, когда сделана заявка 
    table.AddColumn(new Column('FILEPATH', 'VARCHAR(500)', 'NULL', true)); //Наименование заявки 
    table.AddColumn(new Column('TYPE_ORDER', 'VARCHAR(20)', 'NULL', true)); //Тип заявки - делаем не обновляемой.
    table.AddColumn(new Column('COMMENTS', 'VARCHAR(500)', 'NULL', true)); //Просто комментарии                   

    table.Verification();

    users_table.AddColumn(new Column('ID', 'BIGINT','NOT NULL AUTO_INCREMENT', true));
    users_table.AddColumn(new Column('USER_NAME', 'VARCHAR(45)', 'NOT NULL', false)); //Пользователь
    users_table.AddColumn(new Column('USER_PASSWORD', 'VARCHAR(45)', 'NOT NULL', false)); //ПАРОЛЬ
    users_table.AddColumn(new Column('GROUP_USER', 'TINYINT', 'NOT NULL', false)); //Группа пользователей    

    users_table.Verification();

    try {
        await connection.execute(table.CreateTable());
        await connection.execute(users_table.CreateTable());        
        console.log('Table created or already exists'); 
    } catch(err){
        console.log(`Error ${err} while connect with database`); 
    } finally{
        connection.end();
    }

})();


app.get('/', async(req, res ) => {

    try{

        if (req.session.user){
            const [rows] = await pool.query(table.SelectAll());

            bind_rows(rows);

            res.render('index', {title : 'Список заявок на оборудование', rows : rows, data_yes : rows.length > 0, statuses : STATUS_ORDER, api : apiConfig, user: req.session.user });
        }
        else
        {
            res.render('login', {title : 'Страница авторизации', error : false, message : ""});            
        }


    }
    catch(err){
        console.error('Ошибка при получении данных ----:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.get('/login', async(req, res ) => {

    try{

        res.render('login', {title : 'Страница авторизации', error : false, message : ""});

    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.get('/admin', async(req, res ) => {

    try{
        const [rows] = await pool.query(users_table.Fields('ID','USER_NAME','GROUP_USER'));

        res.render('admin', {title : 'Администрирование', rows : rows, user : req.session.user, type : TYPE_GROUP_USER});

    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.post('/add_user', async(req, res ) => {

    try{
        //добавляем нового пользователя
        const user_name = req.body.name_user;
        const user_password = await hashPassword(req.body.password_user);
        const group = req.body.UserGroup;
        const [rows] = await pool.query(users_table.Insert(), [user_name, user_password,group]);   

        res.redirect('/admin'); //перенаправляем на список пользователей

    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.get('/add_user', async(req, res ) => {

    try{

        res.render('add_user', {title : 'Добавление нового пользователя', type : TYPE_GROUP_USER}); 

    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.get('/export', async(req, res) => {
    try{
        const [rows] = await pool.query(table.SelectAll());
        ExportToLogin(table, rows);

        res.redirect('/'); 
    }
    catch(err){
        console.error('Ошибка при формировании файла:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
})

app.post('/login', async(req, res ) => {

    try{

        const user = req.body.user_name;
        const password = req.body.user_password;

        // Если зашли суперпользователем
        if (user == envConfig.superuser){
            if (password == envConfig.password){
                res.redirect('/admin'); //перенаправляем на список пользователей                
            }
        }
        else
        {
            const query =  users_table.Filter('USER_NAME');
            const [rows] = await pool.query(query, [user]); 


            if (!(rows.length == 0)){

                const isCheck = await isCorrectPassword(password, rows[0].USER_PASSWORD);

                if(isCheck){
                    req.session.user = {
                        USER_NAME : rows[0].USER_NAME,
                        GROUP_USER : rows[0].GROUP_USER,
                        ACTIVE : true, 
                    }
                    res.redirect('/'); 
                }
                else{
                    res.render('login', {title : 'Страница авторизации', error : true, message : "Некорректные имя пользователя и/или пароль"});                
                }

            }
            else
            {
                console.log("Пользователь не найден");
                res.render('login', {title : 'Страница авторизации', error : true, message : "Некорректные имя пользователя и/или пароль"});   
            }
        }


    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.get('/delete_all', async(req, res ) => {

    try{
        res.render('confirm', {title : 'Удаление всех записей'});
    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});


app.post('/api/request', async(req, res) =>
    {

        const { prompt } = req.body;
        const apiKey = apiConfig.api_key;
        const url_k = apiConfig.url;

        const response = await fetch(
            'https://ai.api.cloud.yandex.net/v1/responses',{
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Api-Key ${apiKey}`
                    },
                    body: JSON.stringify({
                        modelUri: `${url_k}`,
                        messages: [
                            { role: 'user', text: prompt }
                        ]})             
                }
        )

        if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        return res.status(response.status).json({ error: errData.message || 'Ошибка API' });
        }

        const data = await response.json();
        const answer = data.result?.alternatives?.[0]?.message?.text || 'Нет ответа';
        res.json({ answer });
    }

);


app.get('/dowloand_file/:filename', async(req, res ) => {

    try{
        const fileName = req.params.filename;
        const filePath = path.join(__dirname, 'uploads', fileName);

        res.download(filePath, fileName, (err) => {
            if (err) {
            // Ошибка, если файл не найден или оборвалось соединение
            res.status(404).send('Файл не найден');
            }
        });      
    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});


app.post('/delete_all', async(req, res ) => {

    try{
        const [rows] = await pool.query(table.DelteAll());
        res.redirect('/');         
    }
    catch(err){
        console.error('Ошибка при удалении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});

app.get('/delete_user/:id', async(req, res ) => {

    try{
        res.render('confirm_delete_user', {title : 'Удаление пользователя', id : req.params.id});       
    }
    catch(err){
        console.error('Ошибка при удалении данных:', err);
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
        res.render('view', {title : 'Изменение записи заявки', row : row[0], statuses : STATUS_ORDER, type:TYPE_ORDER}); 

    }
    catch(err){
        console.error('Ошибка при получении данных:', err);
        res.status(500).send('Ошибка сервера: не удалось загрузить данные');
    }
});


app.post('/add',upload.single('file'), async(req, res) => {
    
        const text_from = req.body.name;
        const status_order = req.body.orderStatus;
        const type_order = req.body.orderType;
        const comments = req.body.text_field;

        let date_ = new Date().toISOString().slice(0, 19).replace('T', ' ');
        let filedata = req.file;

        if (!filedata) {
            console.error('Файл не загружен: req.file === undefined');
            return res.status(400).json({
            error: 'Файл не загружен',
            debug: {
                contentType: req.headers['content-type'],
                body: req.body
            }
            });
        }

        console.log('Файл получен:', {
            originalName: filedata.originalname,
            filename: filedata.filename,
            path: filedata.path,
            size: filedata.size,
            mimetype: filedata.mimetype
        });




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
            const [rows] = await pool.query(table.Insert(), [text_from, status_order, date_, filedata.filename, type_order, comments]);   
            
            
            res.redirect('/'); 
        }
        catch(err){
            console.error('Ошибка при добавлении данных:', err);
            res.status(500).send('Ошибка сервера: не удалось загрузить данные');            

        }

})

app.get('/add', async(req, res) => {
    
    try{
    
        res.render('add', {title : 'Добавление новой заявки', statuses : STATUS_ORDER,  type:TYPE_ORDER});

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

        bind_rows(rows);

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
