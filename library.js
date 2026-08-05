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