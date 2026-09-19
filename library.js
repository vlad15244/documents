
import bcrypt from 'bcrypt';

/*формирование ХЕШа пароля*/
export async function hashPassword(password_from_db) {
    const saltRound = 10; //сложность хеширования
    try{
        const hash = await bcrypt.hash(password_from_db, saltRound);
        return hash;        
    } catch (error){
        console.error('Ошибка хеширования:', error);
        throw error;       
    }
}

/*функция проверки пароль по хеш*/
export async function isCorrectPassword(password, hash) {
    try{
        const isCorrect = await bcrypt.compare(password, hash);
        return isCorrect;
    } catch(error){
        console.error('Ошибка сравнения:', error);
        throw error;  
    }
}

/* приведение вида даты к HTML форме input */

export function convert_data(date_in){
    const [day, month, year] = date_in.split('.');
    const output = `${year}-${month}-${day}`; 
    return output;   
}

/* если вдруг придется добавить какое-то поле для передачи в на frontend
можно добавить просто тут
 */
export function bind_rows(rows){
        rows.forEach(row =>
            {
                row.formattedDate = new Date(row.DATESTAMP).toLocaleDateString('ru-RU'); //Добавляем к элементу поле форматированной даты
                row.file_yes = row.FILEPATH !== '';   //Добавляем флаг, что файл есть
            }
        )    
}

/*Текущее время в формате MySQL */
export function mysqlNow() {
  return new Date().toISOString().slice(0, 19).replace('T', ' ');
}

/*Текущее время для визулизации */
export function mysqlFormat(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}