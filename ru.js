var Nightmare  = require('nightmare');

vo(run)(function(err, result) {
    if (err) throw err;
});

function *run() {

    let nightmare = Nightmare({ waitTimeout: 10000,
        show: false,
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
            .wait('input[id=username]');



        dimensoes = yield nightmare.evaluate(function () {
            var body = document.querySelector('body');
            return {
                width: body.scrollWidth,
                height: body.scrollHeight
            }
        });
    } catch (e) {
        console.log("Ocorreu algum erro, visualize a imagem")
    }
    console.log("Salvando imagem");

    yield nightmare.viewport(dimensoes.width, dimensoes.height)
        .wait(1000)
        .screenshot('./images/ru.png');


    yield nightmare.end();
}
