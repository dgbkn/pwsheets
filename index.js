// inlcude express 
const express = require("express");
var bodyParser = require('body-parser');
const formidable = require('express-formidable');
var cors = require('cors')

//googleapis
const { google } = require("googleapis");
const { promisfy, waitFor } = require('promisfy');
const { GoogleSpreadsheet } = require('google-spreadsheet');

const creds = require('./keys.json');


//initilize express
const app = express();

// app.use(bodyParser.json());
// app.use(bodyParser.urlencoded({ extended: true }));
app.use(formidable());
app.use(cors())


const fs = require('fs');

TOKEN_PATH = './token.json';
//set app view engine
app.set("view engine", "ejs");

const auth = new google.auth.GoogleAuth({
    keyFile: "keys.json", //the key file
    //url to spreadsheets API
    scopes: "https://www.googleapis.com/auth/spreadsheets",
});

//Auth client Object
// const authClientObject = auth.getClient().then(resp => {

//     fs.writeFile(TOKEN_PATH, JSON.stringify(resp), (err) => {
//         if (err) return console.error(err);
//         console.log('Token stored to', TOKEN_PATH);
//       });


// });

app.get("/", function (req, res) {
  res.send("Welcome 🤗😁");
});

app.get("/getAllBatches", async (req, res) => {

    var authobj = fs.readFileSync('token.json');
    authobj = JSON.parse(authobj);

    const authClientObject = Object.create(authobj);
    // const authClientObject = await auth.getClient();


    //Google sheets instance
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });


    var readData = await googleSheetsInstance.spreadsheets.get({
        auth, //auth object
        spreadsheetId: "1rwkKRFMCl2-iZxnJg1yY7NcEa4z_HtGOEFuByTOZ5Lg", // spreadsheet id
        ranges: ["APIBASE!O2:P"], //range of cells to read from.,
        includeGridData: true
    })


    readData = readData.data.sheets[0].data;
    var rowData = readData[0].rowData;


    var the_real_row_data = rowData.filter((item) => {
        if (0 in item.values && "formattedValue" in item.values[0]) {
            return true; // skip
        }
        return false;
      })
      .map((item) => { 
        var finalObj = {};

        if (0 in item.values && "formattedValue" in item.values[0]) {
            var lec = item.values[0];
            finalObj.batchName = lec.formattedValue;
        }
    
        if (1 in item.values) {
            var subparts = item.values[1].formattedValue.split("-");
            var subparts = subparts.filter((item)=>{
                if(item == ""){
                    return false;
                }
                return true;
            });
        }else{
            var subparts = null;
        }

        if(subparts){
            finalObj.subjects=[];
            subparts.forEach((item)=>{
            var d = item.split(",");
            finalObj.subjects.push({"name":d[0],"range":d[1]});
            });
        }
    
    
        return finalObj;
    });




    
    res.send(the_real_row_data);
});



app.get("/getSubjectData", async (req, res) => {
    // console.log(req.body);
    const range = req.fields?.range || req.query?.range;

    var authobj = fs.readFileSync('token.json');
    authobj = JSON.parse(authobj);

    const authClientObject = Object.create(authobj);
    // const authClientObject = await auth.getClient();


    //Google sheets instance
    const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });


    var readData = await googleSheetsInstance.spreadsheets.get({
        auth, //auth object
        spreadsheetId: "1rwkKRFMCl2-iZxnJg1yY7NcEa4z_HtGOEFuByTOZ5Lg", // spreadsheet id
        ranges: [range], //range of cells to read from.,
        includeGridData: true
    })


    readData = readData.data.sheets[0].data;
    var rowData = readData[0].rowData;

    var the_real_row_data = rowData.filter((item) => {
        if ((0 in item.values && "formattedValue" in item.values[0]) && item.values[0].formattedValue != "Class Cancelled") {
            return true; // skip
        }
        return false;
      }).map((item) => {

        // return item.values?.map((singleitem) => {

        //     if(singleitem.formattedValue == "NOTES" || singleitem.formattedValue == "DPP"){
        //      var ret = {"type": singleitem.formattedValue, "link" : singleitem.hyperlink}
        //     }else{
        //         var ret = {"name": singleitem.formattedValue,"type":"LECTURE", "link" : singleitem.hyperlink};
        //     }

        //     return ret;
        // });



        var finalObj = {};


        if (0 in item.values && "formattedValue" in item.values[0]) {
            var lec = item.values[0];
            finalObj.name = lec.formattedValue;
            finalObj.lecture = lec.hyperlink;
        }
        else{
            return false;
        }

        if (1 in item.values) {
            var note = item.values[1];
            finalObj.notes = note.hyperlink;
        }else{
            finalObj.notes = "";
        }

        if (2 in item.values) {
            var dpp = item.values[2];
            finalObj.dpp = dpp.hyperlink;
        }else{
            finalObj.dpp = "";
        }

        return finalObj;
    });


    var finalData = the_real_row_data.map(item => {
        if (item) {
            return item;
        }
    });

    res.send(JSON.stringify(finalData));

});


app.get("/getByRangeDataSheet1PWnew", async (req, res) => {
    const { range } = req.query;

    const doc = new GoogleSpreadsheet('1rwkKRFMCl2-iZxnJg1yY7NcEa4z_HtGOEFuByTOZ5Lg');


    // Initialize Auth - see https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
    await doc.useServiceAccountAuth(creds);

    await doc.loadInfo(); // loads document properties and worksheets

    const sheet = doc.sheetsByIndex[0]; // or use doc.sheetsById[id] or doc.sheetsByTitle[title]

    // var cells = await sheet.getCe(range);
    const c6 = sheet.getCellByA1('C39'); // or A1 style notation
    var hg = c6.hyperlink;
    res.send(JSON.stringify(cells));



})



//Read front the spreadsheet
// const readData = await googleSheetsInstance.spreadsheets.values.get({
//     auth, //auth object
//     spreadsheetId, // spreadsheet id
//     range: "Sheet1!A:A", //range of cells to read from.
// })

// //send the data reae with the response
// response.send(readData.data)



// //write data into the google sheets
// await googleSheetsInstance.spreadsheets.values.append({
//     auth, //auth object
//     spreadsheetId, //spreadsheet id
//     range: "Sheet1!A:B", //sheet name and range of cells
//     valueInputOption: "USER_ENTERED", // The information will be passed according to what the usere passes in as date, number or text
//     resource: {
//         values: [["Git followers tutorial", "Mia Roberts"]],
//     },
// });


app.use((req, res, next) => {
    const error = new Error("Not found");
    error.status = 404;
    next(error);
  });
  
  // error handler middleware
  app.use((error, req, res, next) => {
    res.status(error.status || 500).send({
      error: {
        status: error.status || 500,
        message: error.message || "Internal Server Error",
      },
    });
  });

  
app.listen(process.env.PORT || 3000, () => {

    console.log(`server started on ${process.env.PORT || 3000}`)
});
