'user strict';

var Aluno = require('./aluno');

exports.buscaTodos = async () => {
    var res = await Aluno.find();
    return res;
};

exports.insere = async (aluno) => {
    var novoAluno = await Aluno.create(aluno);
    return novoAluno;
};
