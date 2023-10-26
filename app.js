const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');

const app = express();

require('dotenv').config();

const port = process.env.PORT;

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE || process.env.DB_NAME
});

// app.use(async function(req, res, next){ //to check my connection 
//   res.json("pool is ready")
// })

app.use(async function(req, res, next) {
  try {
    req.db = await pool.getConnection();
    req.db.connection.config.namedPlaceholders = true;

    await req.db.query(`SET SESSION sql_mode = "TRADITIONAL"`);
    await req.db.query(`SET time_zone = '-8:00'`);

    await next();//runs endpoint and returns to this point

    req.db.release();//then releases and closes connection with the database
  } catch (err) {
    console.log(err);

    if (req.db) req.db.release();
    throw err;
  }
});


// app.use(async function(req, res, next){ //to check my connection 
//   res.json("New message")
// })

app.use(cors());

app.use(express.json());

app.get('/cars-5', async function(req, res) {
  try {
    // console.log('hello world')
    // res.json("front end res")//front end response to the user
    const [myCars] = await req.db.query(
      `SELECT * FROM car WHERE deleted_flag = 0;
      `);
      res.json({myCars})//json has to make this request as an object to the user or front end
  } catch (err) {
    
  }
});

//We can use this for authentication using JWT verification
// app.use(async function(req, res, next) {
//   try {
//     console.log('Middleware after the get /cars');
  
//     await next();

//   } catch (err) {

//   }
// });
//post modifies our database, in this case, we're adding a new car, in insomnia, we're adding it through json
//format via "key": "value" pairs, this adds it to the end of our database, thus triggering the AUTO_INCREMENT
app.post('/car', async function(req, res) {
  try {
    const { make, model, year } = req.body;
  
    const query = await req.db.query(
      `INSERT INTO car (make, model, year) 
       VALUES (:make, :model, :year)`,//the code used here is only used in express (:make, :model,)
      {
        make,
        model,
        year,
      }
    );
  console.log(query)
    res.json({ success: true, message: 'Car successfully created', data: null });
  } catch (err) {
    res.json({ success: false, message: err, data: null })
  }
});

//the delete method is similar to the put method in that we can match ids and use conditional statements to handle our different outputs
app.delete('/car/:id', async function (req, res) {
    try {
        // console.log('req.params /car/:id', req.params)

        const id = parseInt(req.params.id); //this variable is being parsed into an integer
        //the myCars variable is taking the value from our "SELECT * FROM car" database
        const [myCars] = await req.db.query(`
        SELECT * FROM car;
        `);
        //the some() method of arrays is checking to see if any elements in the myCars array satisfies
        //a specific condition
        const foundId = myCars.some(car => car.id === id);
        if (foundId) {
            try {

                const query = await req.db.query(`
                    UPDATE car
                    SET deleted_flag = '1'
                    WHERE id = ${id}
                 `);
                //the response below to the query above will be in json format
                res.json(`Success, my car was modified and the deleted_flag from row with id:${id} now is = 1`)
            } catch (error) {
                res.json(error.message)
            }
        } else {
            res.status(400).json({ msg: `The Car with the id of ${req.params.id} does not exist in Car DB` })
        }

    } catch (err) {
        console.log(err)
        res.json({ err });
    }
});

//PUT will modify an existing part of our database, in this case, where replacing car/2 with a different key
//value pair info
app.put('/car/:id', async function (req, res) { //in this line, where replacing car/:id in insomnia with
  //car/1, or whichever id we wenat to modify

  try {
      const id = parseInt(req.params.id); //this line of code parses through the string and converts it to an integer
      const [allCars] = await req.db.query(`
      SELECT * FROM car;
      `)
    console.log(allCars)

      const found = allCars.some(car => car.id === id);//this line of code is seeing if the id from the request matches
      //with the id from our database.

      if (found) { //this is saying that if found is truthy, then run the below code
          const { make: updMake, model: updModel, year: updYear } = req.body;
          try {
              const query = await req.db.query(`
                  UPDATE car
                  SET make = :make, model = :model, year = :year, deleted_flag = '0'
                  WHERE id = :id
          `, {
                  make: updMake,
                  model: updModel,
                  year: updYear,
                  id: id
              });

              res.json({ msg: `Car with id ${id} was updated`, info: `${query[0].info}` });

          } catch (error) {
              res.json(error.message)
          }

      } else {
          res.status(400).json({ msg: `Car with the id of ${req.params.id} does not exist in Car DB` })
      }
  } catch (err) {
      res.json(err)
  }
});


// app.put('/car:id', async function(req,res) {
//   try {
//     const updatedValues = req.body;
//     const parseCarId = parseInt(req.params.id);
//     const [myCars] = await req.db.query(`SELECT * FROM car;`)

//     //then we'll write our conditional statement so that we can handle whether or not it finds the 
//     //user's id requested through this put
//     const ifFound = 
//   } catch (err) {

//   }
// });


app.listen(port, () => console.log(`212 API Example listening on http://localhost:${port}`));