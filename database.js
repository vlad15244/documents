export class Table{
    constructor(name){
        this.name = name;
        this.columns = [];
    }

    getFullColumnName(){
        let col_name = '';// надо точно указывать, иначе undefined, если по условиям ссылка ни на что не ссылается, что логично

        this.columns.forEach(element => {

            if (element.ToString('', false) == 'ID' ){

            }
            else{
                col_name += element.ToString('', false);
                col_name += ',';
            }

        });

        col_name = col_name.slice(0, -1);
  
        return col_name;

    }

    getFullPlaceholders(){
        let col_name = '';
        
        this.columns.forEach(element => {

            if (element.ToString('', false) == 'ID' ){

            }
            else{
                col_name += '?';
                col_name += ',';
            }

        });
        
        col_name = col_name.slice(0, -1);

        return col_name;   

    }


    AddColumn(tableColumn){
        this.columns.push(tableColumn);
    }

    CreateTable(){

        let Query = `CREATE TABLE IF NOT EXISTS ${this.name} (`;
        
        this.columns.forEach(element => {
            Query += element.ToString('', true);
            Query += ',';
        });
        Query += ` PRIMARY KEY (${this.columns[0].ToString('', false)}))`;
        
        return Query;

    }

    SelectAll(){
        let Query = `SELECT * FROM ${this.name};`;
        return Query;        
    }

    SelectByID(){
        let Query = `SELECT * FROM ${this.name} WHERE ${this.columns[0].ToString('', false)} = ?;`;
        return Query;        
    } 
    
    Filter(...args){
        let Query = `SELECT * FROM ${this.name} WHERE `;

        for (const agr of args){
            Query += `${agr} = ? AND`;
        }
        
        Query = Query.slice(0, -3);

        return Query;             
    }


    Insert(){
        let Query = `INSERT INTO ${this.name} (${this.getFullColumnName()}) VALUES (${this.getFullPlaceholders()})`;

        return Query;

    }

    Delete(){
        let Query = `DELETE FROM ${this.name} WHERE ID = ?`;
        return Query;
    }    

    Update(){
        let Query = `UPDATE ${this.name} SET `;

        let params = [];

        this.columns.forEach(element => {
            if (element.ToString('', false) == 'ID')
            {

            }
            else    
            {
                params.push([element.ToString('', false), ' = ?']);
            }

        })

        params.forEach(element => {
            Query += element.join(' ');
            Query += ',';
            
        })

        Query = Query.slice(0, -1);
        Query += ` WHERE ${this.columns[0].ToString('', false)} = ?;`;


        return Query;
    }


    Verification(){

        try{
            if (this.columns == null){
                throw new Error("Void table columns: null value");
            }

            if (this.columns.length == 0){
                throw new Error("Void table columns: empty array");
            }

            let name = this.columns[0].ToString('', false);
            if (!name.includes('ID')){
                console.error(`First column is not ID. Found: "${name}`);
                return false;
            } 

            return true;

            } catch (err) {
                console.error("Validation failed:", err.message);
                return false;
            }
    }
}

export class Column {
    constructor(name, params, add){
        this.name = name;
        this.params = params;
        this.add = add;
    }

    ToString(separator, with_params){


        if (with_params){
            return `${this.name} ${separator} ${this.params} ${separator} ${this.add}`;
        }
        else{
            return `${this.name}`; 
        }

    }
}

