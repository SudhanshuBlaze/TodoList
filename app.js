const express = require("express");
const mongoose=require("mongoose");
const _ = require('lodash');

const Date=require( __dirname+"/Date.js")

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true })); //body-parser
app.use(express.static("public"));

connect().catch(err=>console.log("Could not connect"+err));
async function connect(){
  await mongoose.connect(
    "mongodb+srv://admin-Sudhanshu:dEInzbP7mFedyL2M@todocluster.byrl4.mongodb.net/todolistDB?retryWrites=true&w=majority", 
  {useNewUrlParser: true, useUnifiedTopology: true})
}

const itemSchema =new mongoose.Schema({ 
  name: String
});
const Item= mongoose.model("Item",itemSchema); 

const listSchema=new mongoose.Schema({
  name:String,
  items:[itemSchema]
});

const List= mongoose.model("List", listSchema);

// create dummy items
const item1=new Item({
  name: "Practice DSA"
});
const item2=new Item({
  name: "Build Projects"
});
const item3=new Item({
  name: "Do Internship"
});
const dummyItems=[item1,item2,item3];

const day=Date.getDay();
app.get("/", (req, res)=>{
 
  Item.find({}, function(err, foundItems){
    if (foundItems.length === 0) {
      
      Item.insertMany(dummyItems).then(()=>{
          console.log("Successfully saved dummy items to DB.");
      }).catch(err=>console.log("Could not insert Dummy items"+err));
      
      res.redirect("/");
    } else{
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  });
});

//Dynamic params
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}).then(foundList=>{
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: dummyItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list

        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }).catch(err=>
        console.log("Exception caught in app.get('/:customListName'"+err));
});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.listName;

  const item = new Item({
    name: itemName
  });

  if (listName === day){
    item.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}).then(foundList=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    }).catch(err=>console.log("Could Not push in foundList"+err));
  }
});


app.post("/delete",(req,res)=>{
  const checkItemId=req.body.checkbox;
  const listName=req.body.listName; //listName=current Collection name
  console.log("listName "+listName);
  
  if(listName===day){
    Item.deleteOne({_id:checkItemId}).then(()=>console.log("Successfully Deleted Item"))
    .catch(err=>console.log("Failed to delete"+err));
    res.redirect("/");
  } 
  else{
    List.findOneAndUpdate({name: listName},{$pull:{items: {_id: checkItemId}}})
      .then(()=> res.redirect("/"+listName))
      .catch(err=>console.log(err));
  } 
});

app.get("/about", (req, res)=>{
  res.render("about");
});

app.listen(3000, ()=>{
  console.log("Server started on port 3000");
});

//Using async-await
// app.get("/:customListName", function(req, res){
//   const customListName = req.params.customListName;
//   async function find1() {
//     const foundList=await List.findOne({name:customListName});
//     if (!foundList){
//         //create a new list
//          const list=new List({
//            name:customListName,
//            items: dummyItems
//          });
//          list.save();
//          res.redirect("/"+customListName);
//       } 
//       else {
//         //show an existing list
//         res.render("list",{listTitle: customListName,newListItems: foundList.items});
//       }
//   }
//   find1().catch(err=>console.log("Error in Dynamic params"+err));
// });

//async-await-2.0
// app.get("/:customListName",async function(req, res){
//   const customListName = req.params.customListName;
//   const foundList= await List.findOne({name:customListName});

//   if (!foundList){
//       //create a new list
//       const list=new List({
//         name:customListName,
//         items: dummyItems
//       });
//       list.save();
//       res.redirect("/"+customListName);
//     } 
//     else {
//       //show an existing list
//       res.render("list",{listTitle: customListName,newListItems: foundList.items});
//     }
// });
