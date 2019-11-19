var mongoose = require("mongoose");

var aluno = new mongoose.Schema({
  nome: { type: String, required: true },
  curso: { type: String, required: true },
  empresa: { type: String, required: true },
  anoEvasao: { type: String, required: false }
});

module.exports = mongoose.model("Alunos", aluno);
