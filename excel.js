import exceljs from 'exceljs';

async function ExportToLogin(table, rows){
    // Создаем новую книгу
    const workbook = new exceljs.Workbook();

    // Лист
    const worksheet = workbook.addWorksheet('Заявки');

    let fields = []
    // Формируем массив с настрйоками Excel из таблицы SQL
    table.columns.forEach(col => {
        let headers = { header:col.ToString('', false), key: col.ToString('', false), size : 15};
        fields.push(headers);
    });

    worksheet.columns = fields.map(field => ({
            header: field.header,
            key: field.key,
            size: field.size        
        }));



}