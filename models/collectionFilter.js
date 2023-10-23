export default class CollectionFilter{
    constructor(data, model, params = null) {
        this.data = data;
        this.params = params;
        if(this.params != null){
            //Va a travers tout les paramêtres entrer et prend en compte seulement ceux qui son pas en lien avec l'API pour filtrer les voulus.
            for(var param in this.params){
                if((param.toLowerCase() != "sort" || param.toLowerCase() != "limit" || param.toLowerCase() != "fields" || param.toLowerCase() != "offset") && model.isMember(param)){
                    this.data = this.data.filter((element) => this.selection(element[param], this.params[param]));
                }
            };
            //transforme les clées en clées un petit caractère pour mieux intéragir avec
            this.paramsLower = {};
            for(var param in params){
                this.paramsLower[param.toLowerCase()] = params[param];
            }
            //tri les donnés
            if(typeof this.paramsLower["sort"] !== 'undefined'){
                //déconstruit si il y a plusieurs type de trie et prend en compte si il est en ordre inverse
                let paramsSort = this.paramsLower["sort"].split(',');
                let reverse = paramsSort[paramsSort.length-1] == "desc";
                if(reverse)paramsSort.pop();
                this.data.sort((x, y) => {
                    let result = 0;
                    //tri les données selon le premier critaire et si il y a une égalité l'opération se répête pour chaque paramêtre de tri mis en place
                    for(let sortdepth = 0; sortdepth < paramsSort.length && 0 == result; sortdepth++){
                        result = this.innerCompare(x[paramsSort[sortdepth]],y[paramsSort[sortdepth]]);
                        if(reverse)
                            result *= -1
                    }
                    return result;
                });
            }
            //garde seulement les donné désirer selon les paramêtre placer dans le "fields"
            if(typeof this.paramsLower["fields"] !== 'undefined'){
                let fieldsToKeep = this.paramsLower["fields"].split(",");
                this.data = this.data.map((element) => {
                    let trimData = {};
                    for(var key in element){
                        if(fieldsToKeep.includes(key))
                            trimData[key] = element[key];
                    }
                    return trimData;
                })
            }
            //Donne un nombre d'éléments égal à la limit à partir de l'élément qui est égal a "limit" * "offset"
            //le nombre d'élement peux changer si vous ête en fin de "page"
            //Le point de départ peut changer si vous êtes en dehors de la table de donné
            if(typeof this.paramsLower["limit"] !== 'undefined'){
                let offset;
                if(isNaN(this.paramsLower["limit"]) || this.paramsLower["limit"] < 1){
                    this.paramsLower["limit"] = 1;}
                if(typeof this.paramsLower["offset"] === 'undefined' || isNaN(this.paramsLower["offset"]) || this.paramsLower["offset"] < 0){
                    this.paramsLower["offset"] = 0;}
                else{
                    offset = parseInt(this.paramsLower["offset"]);
                }
                let start = this.paramsLower["limit"] * offset;
                let end = null;
                if(start >= this.data.length){
                    for(let previousPages = 1;start >= this.data.length; previousPages++)
                        start = this.params["limit"] * (offset - previousPages)
                    end = this.data.length;
                }
                else{
                    end = this.paramsLower["limit"] * (offset + 1);
                    if(end > this.data.length)
                        end = this.data.length;
                }
                this.data = this.data.slice(start, end);
            }
        }
    }

    get(){
        return this.data;
    }

    valueMatch(value, searchValue) {
        try {
            let exp = '^' + searchValue.toLowerCase().replace(/\*/g, '.*') + '$';
            return new RegExp(exp).test(value.toString().toLowerCase());
        } catch (error) {
            console.log(error);
            return false;
        }
    }
    compareNum(x, y) {
        if (x === y) return 0;
        else if (x < y) return -1;
            return 1;
    }
    innerCompare(x, y) {
        if ((typeof x) === 'string')
            return x.localeCompare(y);
        else
            return this.compareNum(x, y);
    }

    //transform le * (wildcard) du paramêtre de recherche en expression regex utilisable pour trier les donnés
    selection(element, search){
        let regExpression = new RegExp("^" + search.split('*').join(".*") + "$");
        return element.toString().search(regExpression) != -1;
    }
        
}