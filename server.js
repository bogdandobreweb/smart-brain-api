const express = require('express');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex')({
    client: 'pg',
    connection: {
        host : '127.0.0.1',
        // port : 3306,
        user : 'bogdandobre',
        password : '',
        database : 'smart-brain'
    }
});

const app = express();

app.use(express.json());
app.use(cors());

const database = {
    users: [
        {
            id: '123',
            name: 'jhon',
            password: 'cookies',
            email: 'jhon@gmail.com',
            entries: 0,
            joined: new Date()
        },
        {
            id: '124',
            name: 'sally',
            password: 'bananas',
            email: 'sally@gmail.com',
            entries: 0,
            joined: new Date()
        }
    ],
}

app.get('/', (req, res) => {
    res.send(database.users);
})

app.post('/signin', (req, res) => {
    knex.select('email', 'hash').from('login')
    .where('email','=', req.body.email)
    .then(data => {
        const isValid=bcrypt.compareSync(req.body.password, data[0].hash);
        if(isValid){
            return knex.select('*').from('users')
                .where('email', '=', req.body.email)
                .then(user => {
                    res.json(user[0])
                })
        }
        else
            res.status(400).json("error loging in");
    })
    .catch(err => {
        res.status(400).json("can't login");
    })
    
})

app.post('/register', (req, res) => {

    const {email, name, password} = req.body;
    const hash = bcrypt.hashSync(password); 
    if(!email || !name || !password){
        return res.status(400).json('incorrect form submission');
    }

    knex.transaction( trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
    .then(loginEmail => {
        return trx('users')
        .returning('*')
        .insert({
            email: loginEmail[0].email,
            name: name,
            joined: new Date()
        })
        .then(user => {
        res.json(user[0])
    })
})
    .then(trx.commit)
    .catch(trx.rollback)
})
.catch(err => {
    res.status(400).json("unable to register")
})
})


app.get('/profile/:id', (req,res) => {
    const {id} = req.params;

    knex.select('*').from('users').where('id', id).then(user => {
        if(user.length){
        res.json(user[0]);
        }
        else{
            res.status(400).json("couldn't be found");
        }
    })
    .catch(err => {
        res.status(404).json("user getting user");
    })
    
})

app.put('/image', (req,res) => {
    const {id} = req.body;
    knex('users')
  .where('id', '=', id)
  .increment('entries', 1)
  .returning('entries')
  .then(entries => {
      res.json(entries)
  })
  .catch(err => {
    res.status(400).json("cannot get entries"); 
  })

})

app.listen(3000, () => {
    console.log("app is running on port 3000");
})
 








/*
/ --> res = this is working
/signin --> POST success /failed
/register --> POST = user
/profile/:userId --> GET = user
/image --> PUT  --> user 
*/