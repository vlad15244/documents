export class Table{
    constructor(name){
        this.name = name;
        this.columns = [];
    }

    AddColumn(tableColumn){
        this.columns.push(tableColumn);
    }

    CreateTable(){

        let Query = `CREATE TABLE IF NOT EXISTS ${this.name} (`;
        
        this.columns.forEach(element => {
            Query += element.ToString('');
            Query += ',';
        });
        Query = Query.slice(0, -1);
        Query += ');';

        return Query;

    }

    SelectAll(){
        let Query = `SELECT * FROM ${this.name};`;
        return Query;        
    }

}

export class Column {
    constructor(name, params, add){
        this.name = name;
        this.params = params;
        this.add = add;
    }

    ToString(separator){
        return `${this.name} ${separator} ${this.params} ${separator} ${this.add}`;
    }
}

