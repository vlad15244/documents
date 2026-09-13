export class User{

    constructor(){

    }

    Login(name, password,group,id){
        this.name = name;
        this.ID = id;        
        this.password = password;
        this.group = group;
        this.active = this.ID > 0;
    }


}