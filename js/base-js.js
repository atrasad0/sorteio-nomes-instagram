//Constantes Banco de dados
const DB_NAME = 'sorteioDb';
const OBJECT_STORE_NAME = 'instaNames';
const READ_WRITE_SCOPE = 'readwrite';
const READ_SCOPE = 'readonly'

//Banco de dados
var dataBase;

//Lista com os sorteaods atuais
var sorteados = [];

//Mensagens Genericas
var MSG_ERROR_CONNECTION =  "Não foi possivel abrir uma transação com indexedDb";

$(document).ready(function() {
    criarBanco(1);
    
});

function cancelaSubmit(e) {
    e.preventDefault();
    salvaNome();
}

function help() {
    var text = '';
    text+= '- Os nomes são salvos na máquina do usuário até que o mesmo limpe os dados do navegador.\n\n';
    text+= '- Uma pessoa poderá ser sorteada apenas uma vez por turno, ou a menos que o usuário atualize a pagina.\n\n';
    text+= '- Um ganhador será movido para uma da lista de sorteados deste turno.\n\n';
    text+= '- Uma pessoa não será removida da lista ao ser sorteada, pois o mesmo poderá não ter cumprido os requisitos mínimos para ganhar o sorteio, podendo assim ser sorteada no próximo mês.\n\n';
    text+= '- A remoção de um ganhador "real" da lista de sorteados ficará por conta do usuário.\n\n';
    swal({
        title: "Help",
        text: text,
        icon: "warning",
        dangerMode: false,
      })
}

/**
 * Carrega em uma tabela todos os nomes salvos no indexedDB.
 * @returns A tabela no index.html.
 */
function carregaRecursos() {
    var connection = getConnectionObjectStore(OBJECT_STORE_NAME, READ_SCOPE);

    if (!connection) {
        errorAlert(MSG_ERROR_CONNECTION);
        console.log(MSG_ERROR_CONNECTION);
        return;
    }

    var objStore = connection.objectStore(OBJECT_STORE_NAME);

    var reqNames = objStore.getAll();
    var tabela = $("#tBodytblNomes");

    connection.oncomplete = e => {
        if (reqNames.result.length == 0) {
            var tabela = $("#tBodytblNomes").html('');
            return;
        }

        var names = reqNames.result;

        var tabela = $("#tBodytblNomes");
        var row ='';
        for (let i = 0; i < names.length; i++) {
             row += `<tr>
                        <th scope="row"> 
                            ${names[i].id}
                        </th>
                        <td> 
                            ${names[i].Keyname}
                        </td>
                        <td>
                            <button type="button" name="btnExcluir" class="btn btn-danger center-block" onclick="excluiNome(${names[i].id})"> Excluir </button>
                        </td>
                    </tr>`
        }
        tabela.html(row);
    }


    connection.onerror = e => {
        errorAlert(e.target.error);
        console.log(e.target.error)
    }

}

/**
 * Adiciona uma pessoa a tabela de sorteados.
 * @param {*} winner A pessoa sorteada.
 */
function appendToWinners(winner) {

    var tabela = $("#tBodytblGanhadores");
    var spam = $("#ganhadoresData");
    var data = new Date().toLocaleDateString();

    var row = `<tr>
                  <th scope="row"> 
                    ${winner.id}
                  </th>
                  <td> 
                    ${winner.Keyname}
                  </td>
                </tr>`;

    tabela.append(row);
    spam.html(data);
}

/**
 * 'Scrolla' a tela até a tabela de ganhadores.
 */
function scrollToWinners () {
    document.getElementById("tBodytblGanhadores").scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Adiciona uma mensagem de erro na tela.
 * @param {*} msg a mensagem a ser exibida.
 */
function errorAlert(msg) {
    var error = $("#errorAlert");

    error.css("display", "block");

    error.html(msg)
}

/**
 * Salva um nome no indexedDB
 */
function salvaNome() {

    var connection = getConnectionObjectStore(OBJECT_STORE_NAME, READ_WRITE_SCOPE);

    if (!connection) {
        errorAlert(MSG_ERROR_CONNECTION);
        console.log(MSG_ERROR_CONNECTION);
        return;
    }

    let elem = document.getElementById("btnAdd");
    let name = elem.value;
    name = name.replace(/\s/g, '');

    if (name.length < 3) {
        swal("Atenção!", "Um @ deve ter 2 ou mais caracteres", "warning")
        return;
    }

    var objStore = connection.objectStore(OBJECT_STORE_NAME);

    objStore.add({Keyname: name});

    connection.oncomplete = e => {
        console.log('saved name');
        carregaRecursos();
       
    }
    
    connection.onerror = e => {
        errorAlert(e.target.error);
        console.log(e.target.error);
    }

    elem.value = '@';

}

/**
 * Exclui um nome do indexedDB.
 * @param {string} value O ID de identificação do nome no indexedDB.
 */
function excluiNome(value) {

    let index = parseInt(value);
    
    var connection = getConnectionObjectStore(OBJECT_STORE_NAME, READ_WRITE_SCOPE);

    if (!connection) {
        errorAlert(MSG_ERROR_CONNECTION)
        console.log(MSG_ERROR_CONNECTION);
        return; 
    }

    var objStore = connection.objectStore(OBJECT_STORE_NAME);
    objStore.delete(index);

    connection.oncomplete = e => {
        console.log('deleted name');
        carregaRecursos();
       
    }
    
    connection.onerror = e => {
        errorAlert(e.target.error);
        console.log(e.target.error)
    }
    
}

/**
 * Sorteia um índice em um array de nomes, onde o mesmo não poderá ser sorteado mais de uma vez. 
 *
 */
function sortear() {
    var connection = getConnectionObjectStore(OBJECT_STORE_NAME, READ_SCOPE);

    if (!connection) {
        errorAlert(MSG_ERROR_CONNECTION);
        console.log(MSG_ERROR_CONNECTION);
        return;
    }

    var objStore = connection.objectStore(OBJECT_STORE_NAME);
    
    let names =  objStore.getAll();

    connection.oncomplete = e => {
        if (names.result.length == 0) {
            swal("Atenção!", "Cadastre alguns nomes para realizar o sorteio.", "warning");
            return;
        }

        if (names.result.length == sorteados.length) {
            swal("Atenção!", "Todos os nomes ja foram sorteados!", "warning");
            return;
        }
        
        let range = names.result.length;

        let index = getIndex(range);

        let win = names.result[index];

        console.log('indice sorteado: ' + index);

        swal("Parabéns "+ win.Keyname, "você é o ganhador!", "success");
        
        appendToWinners(win);
       
    }
    
    connection.onerror = e => {
        errorAlert(e.target.error);
        console.log(e.target.error)
    }

}

/**
 * Sorteia um índice 'novo', que ainda não tenha sido sorteado.
 * @param {*} range O intervalo máximo de numeros aleatórios
 * @returns Um índice ainda não sorteado.
 */
function getIndex(range) {
    let continua = true;

    let index = getRandom(range);
    
    if (sorteados.length == 0) {
        sorteados.push(index);
        return index;
    }

    while (continua) {
        if (sorteados.includes(index)) {
            index = getRandom(range)
        } else {
            sorteados.push(index);
            continua = false;
        }

    }
    return index;
    
}


/**
 * Gera um número aleatório, entre 0 e um valor especificado.
 * @param {*} range O intervalo máximo.
 * @returns O numero aleatório.
 */
function getRandom (range) {
    return Math.floor(Math.random() * (range - 0) + 0);
}

/**
 * Cria um novo banco de dados.
 * @param {int} value A versao deste novo banco de dados.
 */
function criarBanco (value) {
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    if (!window.indexedDB) {
        errorAlert("Seu Navegador não suporta o IndexedDb");
    }

    var openReq = window.indexedDB.open(DB_NAME, value);

    openReq.onupgradeneeded = e => {
        console.log("Created/Updated indexedDB.");

        var indexConnection = e.target.result;
        indexConnection.createObjectStore(OBJECT_STORE_NAME, { keyPath: "id", autoIncrement : true })
    };

    openReq.onsuccess = e => {
        console.log("indexedDb Ready.");
        dataBase = e.target.result;
        carregaRecursos();
    };

    openReq.onerror = e => {
        errorAlert(MSG_ERROR_CONNECTION);
        console.log(e.target.error())

    };
}

/**
 * Abre uma transação com um objectStore.
 * @param {*} object O nome do objectStore.
 * @param {*} object O Scopo do objectStore.
 * @returns A transação com o objectStore.
 */
function getConnectionObjectStore(object, scope) {
    var connection = dataBase.transaction([object], scope);
    return connection;

}


