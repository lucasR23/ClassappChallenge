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

//mapping of indexes
let heading = {"fullname": 0, "eid": 0, "class": [], "email": [],"phone": [],"invisible":0,"see_all":0};

let isPhone = /^[\(]?[1-9]{2}[\)]?[ ]?(?:[2-8]|9[1-9])[0-9]{3}[\- ]?[0-9]{4}$/; //phone regex
let isEmail = /^[^:)(*&%¨$#]*$/; // simple email regex only to avoid some characters

fs.createReadStream('input.csv')
    .pipe(csv.parse())
    .on('error', error => console.error(error))
    .on('data', (row) => {
        if (index === 1){
            //headline - create mapping 
            row.forEach((column,index) =>{
                val = column.replace(",","").split(" ");
                
                if(val[0] === "fullname"){
                    heading.fullname = index;
                }else if(val[0] === "eid"){
                    heading.eid = index;
                }else if(val[0] === "class"){
                    heading.class.push(index);
                }else if (val[0] === "email" ){
                    heading.email.push({
                        "tags": val.slice(1),
                        "index": index
                    });   
                }else if (val[0] ==="phone"){
                    heading.phone.push({
                        "tags": val.slice(1),
                        "index": index
                    });
                }else if(val[0] === "invisible"){
                    heading.invisible =index;
                }else if(val[0] === "see_all"){
                    heading.see_all =index;
                }             
            })

            console.log(heading);
        }else{
            //not headline
            let fullname = row[heading.fullname];
            let eid = row[heading.eid];
            
            let classes = []
            heading.class.forEach((ele) => {
                classes = classes.concat(toArray(row[ele]));
            });
            classes = removeSpaces(classes);
            
            let addresses = []
            heading.email.forEach(emailAddr => {
                separedValue = row[emailAddr.index].split(/,|\//);
                separedValue.forEach(address => {
                    if (address.length>0 && isEmail.test(address) && !isPhone.test(address)){
                        addresses.push({
                            "type": "email",
                            "tags": emailAddr.tags,
                            "address": address
                        });
                    }
                });
            });

            heading.phone.forEach(phoneAddr => {
                separedValue = row[phoneAddr.index].split(/,|\//);
                separedValue.forEach(address => {
                    
                    if (address.length>0 && isPhone.test(address)){
                        try{
                            
                            let number = phoneUtil.parseAndKeepRawInput(address, 'BR');
            
                            addresses.push({
                                "type": "phone",
                                "tags": phoneAddr.tags,
                                "address": phoneUtil.format(number, PNF.E164).replace("+","")
                            })
                        }catch (err){
                            console.log(err + "the string: " + address + " is not a phone number, ignoring it...")
                        }
                    }
                });
            })
            
            let invisible = false
            if(row[heading.invisible].length > 0 && (row[heading.invisible] == '1' 
                                                    || row[heading.invisible] == "yes")){
                invisible = true;
            }
            
            let seeAll = false
            if(row[heading.see_all].length > 0 && (row[heading.see_all] == '1' 
                                                || row[heading.see_all] == "yes")){
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
                if(row[heading.invisible].length != 0){
                    student.invisible = invisible;
                }

                //there is some new info
                if(row[heading.see_all].length != 0){
                    student.see_all = seeAll;
                }
            }
        }

        index += 1 //represent going to the next line - used to know when we are in the heading
    })
    .on('end', () => {
        fs.writeFile('output.json', JSON.stringify(jsonResult), 'utf8', () =>{
            console.log("JSON file created");
        });
    })
