import { db } from './src/config/db.js';
db('usuarios').select('id_usuario', 'nombre').then(res => {
  console.log(res);
  process.exit(0);
});
