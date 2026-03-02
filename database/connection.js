const sqlite = require('sqlite3').verbose()
const path = require('node:path')

const db = new sqlite.Database(
    path.resolve('database', 'loja_musica.db'),
    (erro) => {
        if (erro) {
            console.log('Erro ao conectar com sqlite')
        } else {
            console.log('Conectado ao sqlite com sucesso')

            // habilitando foreign keys SQLITE
            db.run('PRAGMA foreign_keys = ON', (err) => {
                if (err) {
                    console.error('Erro ao habilitar foreign keys:', err);
                } else {
                    console.log('Foreign keys habilitadas com sucesso');
                }
            });
        }
    }
)

module.exports = db