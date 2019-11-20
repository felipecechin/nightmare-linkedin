var Nightmare = require('nightmare');
var vo = require('vo');
var account = require('./account.js');
const XLSX = require('xlsx');
const fs = require("fs");
const path = require("path");

var mongoose = require('mongoose');

const repo = require('./aluno-repo');

//mongoose connection
mongoose.connect('mongodb://localhost:27017/alunos', { useNewUrlParser: true, useUnifiedTopology: true });


const getAllFiles = function(dirPath, arrayOfFiles) {
    files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
        } else {
            arrayOfFiles.push(path.join(__dirname, dirPath, "/", file))
        }
    });

    return arrayOfFiles;
};
function toUpper(str) {
    return str
        .toLowerCase()
        .split(' ')
        .map(function(word) {
            return word[0].toUpperCase() + word.substr(1);
        })
        .join(' ');
}

console.log("Carregando planilhas da pasta planilhas...");
const result = getAllFiles("planilhas");

console.log("Carregando dados dos egressos...");
var alunos = [];
result.forEach(function (arquivo) {
    const workbook = XLSX.readFile(arquivo);
    const sheet_name_list = workbook.SheetNames;
    var json = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    json.forEach(function (linha) {
        if (linha.NOME_PESSOA) {
            var nomeCurso = {"nome" : linha.NOME_PESSOA.toLowerCase(), "curso" : linha.NOME_CURSO, "anoEvasao": linha.ANO_EVASAO};
            alunos.push(nomeCurso);
        } else if (linha.ALUNO) {
            var nomeCurso = {"nome" : linha.ALUNO.toLowerCase(), "curso" : "Pós-graduação", "anoEvasao": ""};
            alunos.push(nomeCurso);
        }
    });
});
//fs.writeFileSync("alunos.json", JSON.stringify(alunos, null, 4));

var email = account.linkedin.email;
var senha = account.linkedin.senha;

if (email=="") {
    console.log("Coloque seu email de login do Linkedin no arquivo account.js");
    process.exit();
}
if (senha=="") {
    console.log("Coloque sua senha de login do Linkedin no arquivo account.js");
    process.exit();
}

function executar() {
    vo(run)(function (err, result) {
        if (err) throw err;
    });
}

function *run() {

    var nightmare = Nightmare({ waitTimeout: 10000,
        show: false,
        frame: false,
        maxHeight:16384,
        maxWidth:16384,
        width: 1200,
        height: 1024
    });
    try {
        console.log("Logando no Linkedin...");
        yield nightmare
            .goto('https://www.linkedin.com/login')
            .wait('input[id=username]')
            .insert('input[id=username]', email)
            .insert('input[id=password]', senha)
            .click('button[type=submit]')
            .wait(2000);


        console.log("Executando consultas ao Linkedin...");
        for (var i = 0; i < alunos.length; i++) {
            var busca = yield nightmare
                .goto('https://www.linkedin.com/search/results/all/?keywords='+alunos[i].nome)
                // .goto('https://www.linkedin.com/search/results/all/?keywords=bibiana%20brasil%20missão')
                .wait('div.search-results.ember-view')
                .exists('div.search-result__info.pt3.pb4.ph0');
            if (busca) {
                var nomeCorreto = false;
                yield nightmare
                    .evaluate(function () {
                        var seletor = document.body.querySelector('span.actor-name');
                        if (seletor) {
                            return seletor.textContent;
                        } else {
                            return false;
                        }
                    }).then(function (nome) {
                        if (nome.toLowerCase() == alunos[i].nome) {
                            nomeCorreto = true;
                        }
                    });
                if (nomeCorreto) {
                    yield nightmare
                        .wait('div.search-result__info.pt3.pb4.ph0')
                        .click('a.search-result__result-link.ember-view')
                        .wait('section.pv-top-card-v3.artdeco-card.ember-view')
                        .evaluate(function () {

                            var seletor = document.body.querySelector('span.text-align-left.ml2.t-14.t-black.t-bold.full-width.lt-line-clamp.lt-line-clamp--multi-line.ember-view');
                            if (seletor) {
                                return seletor.textContent;
                            } else {
                                return false;
                            }
                        })
                        .then(function (empresa) {
                            if (empresa) {
                                console.log('['+(i+1)+' de ' + alunos.length + '] ' + toUpper(alunos[i].nome) + ': ' + empresa.trim());
                                var novoAluno = {
                                    nome: toUpper(alunos[i].nome),
                                    curso: alunos[i].curso,
                                    anoEvasao: alunos[i].anoEvasao,
                                    empresa: empresa.trim()
                                };
                                repo.insere(novoAluno);
                            } else {
                                console.log('['+(i+1)+' de ' + alunos.length + '] ' + toUpper(alunos[i].nome) + ': não encontrada empresa alguma');
                            }
                        });
                } else {
                    console.log('['+(i+1)+' de ' + alunos.length + '] ' + toUpper(alunos[i].nome) + ': usuário não encontrado');
                }
            } else {
                console.log('['+(i+1)+' de ' + alunos.length + '] ' + toUpper(alunos[i].nome) + ': usuário não encontrado');
            }
        }

    } catch (e) {
        yield nightmare
            .wait(1000)
            .screenshot('./linkedin.png');
        console.log("Ocorreu algum erro, verifique a imagem linkedin.png no diretório do projeto.");
        console.log("O erro pode ter ocorrido devido a:");
        console.log("1) Suas credenciais de acesso estão incorretas, verifique-as.");
        console.log("2) Você atingiu o limite de buscas no linkedin no dia de hoje. Tente novamente amanhã.");
        process.exit();
    }


    yield nightmare.end();
    process.exit();
}

executar();
