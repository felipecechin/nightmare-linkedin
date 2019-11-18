var Nightmare = require('nightmare');
var vo = require('vo');
var account = require('./account.js');
var moment = require('moment');
const XLSX = require('xlsx');
const fs = require("fs");
const path = require("path");

//console.log(moment().utcOffset(-180).format("DD/MM/YYYY HH:mm:ss"));


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

const result = getAllFiles("planilhas");

var alunos = [];
result.forEach(function (arquivo) {
    const workbook = XLSX.readFile(arquivo);
    const sheet_name_list = workbook.SheetNames;
    var json = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);
    json.forEach(function (linha) {
        if (linha.NOME_PESSOA) {
            var nomeCurso = {"nome" : linha.NOME_PESSOA.toLowerCase(), "curso" : linha.NOME_CURSO};
            alunos.push(nomeCurso);
        } else if (linha.ALUNO) {
            var nomeCurso = {"nome" : linha.ALUNO.toLowerCase(), "curso" : "Pós-graduação"};
            alunos.push(nomeCurso);
        }
    });
});
fs.writeFileSync("alunos.json", JSON.stringify(alunos, null, 4));

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
console.log("Executando");

function executar() {
    vo(run)(function (err, result) {
        if (err) throw err;
    });
}

executar();

function *run() {

    var nightmare = Nightmare({ waitTimeout: 10000,
        show: true,
        frame: false,
        maxHeight:16384,
        maxWidth:16384,
        width: 1200,
        height: 1024
    });
    try {
        yield nightmare
            .goto('https://www.linkedin.com/login')
            .wait('input[id=username]')
            .insert('input[id=username]', email)
            .insert('input[id=password]', senha)
            .click('button[type=submit]')
            .wait('div[id=global-nav-typeahead]');

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
                            console.log(toUpper(alunos[i].nome) + ': ' + nome.toLowerCase());
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
                        .then(function (body) {
                            if (body) {
                                console.log(toUpper(alunos[i].nome) + ': ' + body.trim());
                            } else {
                                console.log(toUpper(alunos[i].nome) + ": não encontrada empresa alguma");
                            }
                        });
                } else {
                    console.log(toUpper(alunos[i].nome) + ': usuário não encontrado');
                }
            } else {
                console.log(toUpper(alunos[i].nome) + ': usuário não encontrado');
            }
        }

    } catch (e) {
        yield nightmare
            .wait(1000)
            .screenshot('./linkedin.png');
        console.log("Ocorreu algum erro, verifique a imagem linkedin.png no diretório do projeto");
    }


    yield nightmare.end();
}
