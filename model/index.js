const db = require('../config');
const {hash, compare, hashSync} = require('bcrypt');
const {createToken} = require('../middleware/AuthenticatedUser');

class User { 
    login (req, res) {
       const {emailAdd, userPass} = req.body;
       const strQry =
       `
       SELECT firstName, lastName, gender, emailAdd, userPass, userRole, userProfile
       FROM Users
       WHERE emailAdd = '${emailAdd}';
       `;
       db.query(strQry, async (err, data) => {
        //   if(err) throw err;
          if((!data.length) || (data == null)) {
            res.status(401).json({
                err : 'you have provided a wrong email'
            });
          } else {
            await compare(userPass, data[0].userPass, (cErr, cResult) => {
                // if(cErr) throw cErr;
                const jwToken = createToken(
                    {
                        emailAdd, userPass
                    }
                );
                res.cookie('LegitUser', jwToken, {
                    maxAge: 3600000,
                    httpOnly: true
                })
                if(cResult) {
                    res.status(200).json({
                        msg: 'Logged in',
                        jwToken,
                        result: data[0]
                    })
                }else {
                    res.status(401).json({
                        err: 'You entered an invalid password or did not register. '
                    })
                }
            })
          }
       }) 

    } 

    fetchUsers(req, res) {
        const strQry = 
        `
        SELECT userID, firstName, lastName, gender, cellphoneNumber, emailAdd, userRole, userProfile, joinDate, cart
        FROM Users;
        `;
        //db
        db.query(strQry, (err, data)=>{
            if(err) {
                res.status(400).json({
                    err : 'hi'
                })
            }
            else res.status(200).json( 
                {results: data} );
        })
    }

    fetchUser(req, res) {
        const strQry = 
        `
        SELECT userID, firstName, lastName, gender, cellphoneNumber, emailAdd, userRole, userProfile, joinDate, cart
        FROM Users
        WHERE userID = ?;
        `;
        //db
        db.query(strQry,[req.params.id], 
            (err, data)=>{
            // if(err) throw err; 
            if(err) {
                res.status(400).json({
                    err : 'hi'
                })
            }
            else res.status(200).json( 
                {results: data} );
        })

    }

    async createUser(req, res) {
        // Payload
        let detail = req.body;
        // Hashing user password
        detail.userPass = await 
        hash(detail.userPass, 10);
        // This information will be used for authentication.
        let user = {
            emailAdd: detail.emailAdd,
            userPass: detail.userPass
        }
        // sql query
        const strQry = `INSERT INTO Users SET ?;`;
        db.query(strQry, [detail], (err)=> {
            if(err) {
                res.status(400).json({
                    err : 'hi wrong create'
                })
            }else {
                // Create a token
                const jwToken = createToken(user);
                // This token will be saved in the cookie. 
                // The duration is in milliseconds.
                res.cookie("LegitUser", jwToken, {
                    maxAge: 3600000,
                    httpOnly: true
                });
                res.status(200).json({msg: "A user record was saved."})
            }
        })    
    }

    updateUser(req, res) {
        let data = req.body;
        if(data.userPass !== null ||  data.userPass !== undefined)
        data.userPass = hashSync(data.userPass, 15);
        const strQry = ` UPDATE Users SET ?  WHERE userID = ?;`;
        //db
        db.query(strQry,[data, req.params.id], 
            (err)=>{
            if(err) throw err;
            res.status(200).json( {msg: 
                "A row was affected"} );
        })    
    }

    deleteUser(req, res) {
        const strQry = 
        `
        DELETE FROM Users
        WHERE userID = ?;
        `;
        //db
        db.query(strQry,[req.params.id], 
            (err)=>{
            if(err) throw err;
            res.status(200).json( {msg: 
                "A record was removed from a database"} );
        })    
    }
}
// Product
class Product {
    fetchProducts(req, res) {
        const strQry = `SELECT id, prodName, prodDescription, 
        levels, prodPrice, prodQuantity, imgURL
        FROM products;`;
        db.query(strQry, (err, results)=> {
            if(err) throw err;
            res.status(200).json({results: results})
        });
    }
    fetchProduct(req, res) {
        const strQry = `SELECT id, prodName, prodDescription, 
        levels, prodPrice, prodQuantity, imgURL
        FROM products
        WHERE id = ?;`;
        db.query(strQry, [req.params.id], (err, results)=> {
            // if(err) throw err;
            res.status(200).json({results: results})
        });

    }
    addProduct(req, res) {
        const strQry = 
        `
        INSERT INTO Products
        SET ?;
        `;
        db.query(strQry,[req.body],
            (err)=> {
                if(err){
                    res.status(400).json({err: "Unable to insert a new record."});
                }else {
                    res.status(200).json({msg: "Product saved"});
                }
            }
        );    

    }
    updateProduct(req, res) {
        const strQry = 
        `
        UPDATE Products
        SET ?
        WHERE id = ?
        `;
        db.query(strQry,[req.body, req.params.id],
            (err)=> {
                if(err){
                    res.status(400).json({err: "Unable to update a record."});
                }else {
                    res.status(200).json({msg: "Product updated"});
                }
            }
        );    

    }
    deleteProduct(req, res) {
        const strQry = 
        `
        DELETE FROM Products
        WHERE id = ?;
        `;
        db.query(strQry,[req.params.id], (err)=> {
            if(err) res.status(400).json({err: "The record was not found."});
            res.status(200).json({msg: "A product was deleted."});
        })
    }
};

module.exports = {
    User, 
    Product
}

