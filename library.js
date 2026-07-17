export function convert_data(date_in){
    const [day, month, year] = date_in.split('.');
    const output = `${year}-${month}-${day}`; 
    return output;   
}