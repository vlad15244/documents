import exceljs from 'exceljs';

export async function ExportToLogin(table, rows){
    // Создаем новую книгу
    const workbook = new exceljs.Workbook();

    // Лист
    const worksheet = workbook.addWorksheet('Заявки');

    let columns_name = [];
    let fields = []
    // Формируем массив с настрйоками Excel из таблицы SQL
    table.columns.forEach(col => {
        let headers = { header:col.ToString('', false), key: col.ToString('', false), size : 15};
        fields.push(headers);
        columns_name.push(col.ToString('', false));
    });

    worksheet.columns = fields.map(field => ({
            header: field.header,
            key: field.key,
            size: field.size        
        }));


    let json_draft = Object.fromEntries(
       columns_name.map(field => [field, null]) 
    );

    const keys = Object.keys(json_draft);   

    rows.forEach(row =>{
        //worksheet.addRow({ID: row.ID, NUMBER: row.NUMBER, STATUS:row.STATUS})  //Заменить на динамиечское создние из таблицы
        keys.forEach(k => {
            json_draft[k] = row[k];    
        })
        console.log(json_draft);
        worksheet.addRow(json_draft);
    }

    )    
    await workbook.xlsx.writeFile('orders.xlsx');
    console.log('файл создан');

}