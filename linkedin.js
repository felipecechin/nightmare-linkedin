var Nightmare  = require('nightmare');
var vo         = require('vo');
var account    = require('./account.js');
var email = account.linkedin.email;
var senha = account.linkedin.senha;
var nomes = ["felipe cechin mello", "fernando vedoin garcia", "bruno frizzo trojahn", "bibiana brasil missão"];

if (email=="") {
    console.log("Coloque seu email de login do Linkedin no arquivo account.js");
    process.exit();
}
if (senha=="") {
    console.log("Coloque sua senha de login do Linkedin no arquivo account.js");
    process.exit();
}

vo(run)(function(err, result) {
    if (err) throw err;
});

function *run() {

    let nightmare = Nightmare({ waitTimeout: 10000,
        show: true,
        frame: false,
        maxHeight:16384,
        maxWidth:16384,
        width: 1200,
        height: 1024
    });
    var dimensoes = "";
    try {
        yield nightmare
            .goto('https://www.linkedin.com/login')
            .wait('input[id=username]')
            .insert('input[id=username]', email)
            .insert('input[id=password]', senha)
            .click('button[type=submit]')
            .wait('div[id=global-nav-typeahead]');

        for (var i = 0; i < nomes.length; i++) {
            var busca = yield nightmare
                .goto('https://www.linkedin.com/search/results/all/?keywords='+nomes[i])
                // .goto('https://www.linkedin.com/search/results/all/?keywords=bibiana%20brasil%20missão')
                .wait('div.search-results.ember-view')
                .exists('div.search-result__info.pt3.pb4.ph0');
            if (busca) {
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
                            console.log(nomes[i] + ': ' + body.trim());
                        } else {
                            console.log(nomes[i] + ": não encontrada empresa alguma");
                        }
                    });
            } else {
                console.log(nomes[i] + ': usuário não encontrado');
            }
        }

    } catch (e) {
        console.log("Ocorreu algum erro, provavelmente usuário e/ou senha incorretos para login do Linkedin");
    }


    yield nightmare.end();
}
