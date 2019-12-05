const csv = require('fast-csv');
const fs = require('fs')

const PNF = require('google-libphonenumber').PhoneNumberFormat;
const phoneUtil = require('google-libphonenumber').PhoneNumberUtil.getInstance();
 

const toArray = (string) => string.split(/,|\//)
                                .filter(obj => obj != "");

const removeSpaces = (array) =>{ 
    array.forEach((value,index) => {
        array[index] = value.trim()
    });

    return array;
}

let index = 1; // used to find the heading
let jsonResult = []; // result

let type = {} //save the types defined in the heading

let tag = {} //save the tags defined in the heading

let isPhone = /^[\(]?[1-9]{2}[\)]?[ ]?(?:[2-8]|9[1-9])[0-9]{3}[\- ]?[0-9]{4}$/; //phone regex
let isEmail = /^[^:)(*&%¨$#]*$/; // simple email regex only to avoid some characters

fs.createReadStream('input.csv')
    .pipe(csv.parse())
    .on('error', error => console.error(error))
    .on('data', (row) => {
        if (index === 1){
            //headline
            row.filter(column => row.indexOf(column) >= 4 && row.indexOf(column) <= 9)
                    .forEach(column =>{
                        val = column.replace(",","").split(" ");
                        type[row.indexOf(column)] = val[0]
                        tag[row.indexOf(column)] = val.slice(1)
                    })
        }else{
            //not headline
            let fullname = row[0];
            let eid = row[1];
            
            let classes = toArray(row[2]);
            classes = removeSpaces(classes.concat(toArray(row[3])));
            
            let addresses = []
            for(let index=4; index<=9; index++){
                separedValue = row[index].split(/,|\//)
                
                separedValue.forEach(address => {
                    
                    if (type[index] === "email" && address.length>0 && isEmail.test(address) 
                                                && !isPhone.test(address)){
                        addresses.push({
                            "type": type[index],
                            "tags": tag[index],
                            "address": address
                        })
                                    
                    }else if (type[index] === "phone" && address.length>0 && isPhone.test(address)){
                        try{
                            const number = phoneUtil.parseAndKeepRawInput(address, 'BR');
            
                            addresses.push({
                                "type": type[index],
                                "tags": tag[index],
                                "address": phoneUtil.format(number, PNF.E164).replace("+","")
                            })
                        }catch (err){
                            console.log("the string: " + address + " is not a phone number, ignoring it...")
                        }
                    }
                })
            }
            
            let invisible = false
            if(row[10].length > 0 && (row[10] == '1' || row[10] == "yes")){
                invisible = true;
            }
            
            let seeAll = false
            if(row[11].length > 0 && (row[11] == '1' || row[11] == "yes")){
                seeAll = true;
            }
            
            let repeated = jsonResult.filter(obj => obj.eid === eid)
            if(repeated.length === 0){
                //create new
                jsonResult.push({
                    "fullname": fullname,
                    "eid": eid,
                    "classes": classes.length == 1 ? classes[0]:classes,
                    "addresses": addresses,
                    "invisible": invisible,
                    "see_all": seeAll
                })
            }else{
                //updating existing one
                let student = repeated[0]
                
                newClasses = student.classes.concat(classes)
                student.classes = newClasses.length == 1 ? newClasses[0] : newClasses
                
                student.addresses = student.addresses.concat(addresses);

                //there is some new info
                if(row[10].length != 0){
                    student.invisible = invisible;
                }

                //there is some new info
                if(row[11].length != 0){
                    student.see_all = seeAll;
                }
            }
        }

        index += 1
    })
    .on('end', () => {
        fs.writeFile('myjsonfile.json', JSON.stringify(jsonResult), 'utf8', () =>{
            console.log("JSON file created");
        });
    })
