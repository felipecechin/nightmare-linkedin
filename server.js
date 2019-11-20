var express = require('express');
var app = express();
var path = require("path");
var mongoose = require('mongoose');

const repo = require('./aluno-repo');

// view engine setup
app.use(express.static('./public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//mongoose connection
mongoose.connect('mongodb://localhost:27017/alunos', { useNewUrlParser: true , useUnifiedTopology: true });

app.get('/', async function (req, res) {
    alunos = await repo.buscaTodos();
    res.render('index', {alunos: alunos});
});

app.listen(3000, function () {
    console.log('Rodando na porta 3000');
    console.log('Acesse http://localhost:3000/');
});
