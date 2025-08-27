const express = require('express');
const app = express();
const con = require('./db');
const bcrypt = require('bcrypt');


app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Hash password
// localhost:3000/password/(your password)
app.get('/password/:pass', (req, res) => {
    const password = req.params.pass;
    bcrypt.hash(password, 10, function (err, hash) {
        if (err) {
            return res.status(500).send('Hashing error');
        }
        res.send(hash);
    });
});


// Register
app.post('/register', (req, res) => {
    const { username, password } = req.body;
   
    const checkUserSql = 'SELECT * FROM users WHERE username = ?';
    con.query(checkUserSql, [username], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('DB error');
        }
        if (results.length > 0) {
            return res.status(400).send('Username already exists');
        }
       
        // Hash password
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Hashing error');
            }
           
            const insertSql = 'INSERT INTO users (username, password) VALUES (?, ?)';
            con.query(insertSql, [username, hash], (err, results) => {
                if (err) {
                    console.log(err);
                    return res.status(500).send('DB error');
                }
                res.send('User registered successfully');
            });
        });
    });
});


// Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
   
    if (!username || !password) {
        return res.status(400).send('Username and password are required');
    }
   
    const sql = 'SELECT id, password FROM users WHERE username = ?';
    con.query(sql, [username], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('DB error');
        }
        if (results.length != 1) {
            return res.status(400).send('Wrong username');
        }
       
        const hash = results[0].password;
        const userId = results[0].id.toString();
        bcrypt.compare(password, hash, (err, same) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Server error');
            }
            if (same) {
                res.json({ message: 'Login OK', user_id: userId });
            } else {
                res.status(401).send('Wrong password');
            }
        });
    });
});


// New route
app.get('/expenses', (req, res) => {
    const sql = 'SELECT * FROM expenses';
    con.query(sql, (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('DB error');
        }
        res.json(results);
    });
});


// Search expenses
app.get('/search', (req, res) => {
    const { item } = req.query;

    if (!item) {
        return res.status(400).send('Query parameter "item" is required');
    }

    const sql = 'SELECT * FROM expenses WHERE item LIKE ?';
    con.query(sql, [`%${item}%`], (err, results) => {
        if (err) {
            console.log(err);
            return res.status(500).send('DB error');
        }
        if (results.length === 0) {
            return res.status(404).send(`No items found for: ${item}`);
        }
        res.json(results);
    });
});



// Insert item
app.post('/expenses', (req, res) => {
    const { item, amount, userId } = req.body;  // แก้ชื่อ

    if (!item || !amount || !userId) {
        return res.status(400).send('Item, amount, and user ID are required');
    }

    const sql = 'INSERT INTO expenses (item, amount, userId, date) VALUES (?, ?, ?, NOW())';
    con.query(sql, [item, amount, userId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Failed to insert expense');
        }
        res.status(201).send('Inserted!');
    });
});


// Delete an expense
app.delete('/expenses/:id', (req, res) => {
    const { id } = req.params;


    const sql = 'DELETE FROM expenses WHERE id = ?';
    con.query(sql, [id], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Failed to delete expense');
        }
        if (result.affectedRows > 0) {
            res.status(200).send('Deleted!');
        } else {
            res.status(404).send('Expense not found');
        }
    });
});


// Run server
// npx nodemon server
const PORT = 3000;
app.listen(PORT, () => {
    console.log('Server is running at ' + PORT);
});
