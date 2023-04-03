const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const http = require('http');
const { exec } = require('child_process');
const path = require('path');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

const upload = multer({
    dest: './demandas', // Destination directory for uploaded files
    fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|txt|xlsx|docx|doc|xls)$/)) {
            // Only allow files with certain extensions
            return cb(new Error('Solo se permite la subida de imágenes, PDFs, Word, Excel y archivos de Texto.'));
        }
        cb(null, true);
    },
});

//Pagina de Inicio
app.get('/', (req, res) => {
    //const folderPath = './demandas'; // Replace with your folder path
    res.sendFile(__dirname + '/index.html');

});


//Ver Demandas
app.get('/ver-demandas', (req, res) => {
            const folderPath = './demandas'; // Replace with your folder path
            fs.readdir(folderPath, (err, files) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Ocurrió un error.');
                        }

                        const fecha = new Date();

                        const year = fecha.getFullYear();
                        const month = ('0' + (fecha.getMonth() + 1)).slice(-2);
                        const day = ('0' + fecha.getDate()).slice(-2);

                        const fechaString = `${year}-${month}-${day}`;
                        // Filter files based on user input
                        const query = req.query.q || '';
                        const queryf = req.query.fromDate || '2000-01-01';
                        const queryt = req.query.toDate || fechaString;
                        const filteredFiles = files.filter((file) =>
                            file.toLowerCase().includes(query.toLowerCase())
                        );


                        const fechaInicio = new Date(queryf);
                        const fechaFin = new Date(queryt);

                        const listaFiltrada = filteredFiles.filter((elemento) => {
                            // Separamos el elemento en dos partes, la fecha y el dato
                            const [fechaString, dato] = elemento.split('---');

                            // Convertimos la fecha en un objeto Date
                            const fecha = new Date(fechaString);

                            // Verificamos si la fecha está dentro del rango especificado
                            return fecha >= fechaInicio && fecha <= fechaFin;
                        });
                        const html = `
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta charset="UTF-8">
                            <title>Listado de Demandas</title>
                            <style>
                              body {
                                font-family: sans-serif;
                              }
                              ul {
                                list-style-type: none;
                                padding: 0;
                                margin: 0;
                              }
                              li {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                background-color: #eee;
                                padding: 10px;
                                margin: 10px 0;
                                border-radius: 5px;
                                transition: all 0.3s ease;
                                text-align: left;
                              }
                              li:hover {
                                transform: scale(0.99);
                                box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
                              }
                              a {
                                display: inline-block;
                                text-align: left;
                                text-decoration: none;
                                color: #333;
                                padding-right: 50px;
                                flex: 1;
                              }
                              .btn {
                                display: inline-block;
                                background-color: #333;
                                color: #fff;
                                padding: 8px 16px;
                                border-radius: 5px;
                                text-decoration: none;
                                transition: all 0.3s ease;
                                
                              }
                              .btn:hover {
                                background-color: #555;
                              }
                              .btndelete {
                                text-align:center;
                                background-color: #FF0000;
                                color: #fff;
                                padding: 8px 16px ;
                                border-radius: 5px;
                                text-decoration: none;
                                transition: all 0.3s ease;
                                max-width: 32px;
                                margin-left: 10px;
                              }
                              .btndelete:hover {
                                background-color: #8B0000;
                              }
                              .filter-form {
                                margin-bottom: 20px;
                              }
                              .filter-input {
                                padding: 5px;
                                border-radius: 5px;
                                //border: none;
                              }
                              .filter-submit {
                                padding: 5px 10px;
                                border-radius: 5px;
                                border: none;
                                background-color: #333;
                                color: #fff;
                                margin-left: 10px;
                                cursor: pointer;
                              }
                              .badgeExp {
                                display: inline-block;
                                padding: 0.25em 0.4em;
                                font-size: 75%;
                                font-weight: 700;
                                line-height: 1;
                                text-align: center;
                                white-space: nowrap;
                                vertical-align: baseline;
                                border-radius: 0.25rem;
                                background-color: #155263;
                                color: #fff;
                              }
                              .badgeNum {
                                display: inline-block;
                                padding: 0.25em 0.4em;
                                font-size: 75%;
                                font-weight: 700;
                                line-height: 1;
                                text-align: center;
                                white-space: nowrap;
                                vertical-align: baseline;
                                border-radius: 0.25rem;
                                background-color: #ff6f3c;
                                color: #fff;
                              }
                              .badgeDate {
                                display: inline-block;
                                padding: 0.25em 0.4em;
                                font-size: 75%;
                                font-weight: 700;
                                line-height: 1;
                                text-align: center;
                                white-space: nowrap;
                                vertical-align: baseline;
                                border-radius: 0.25rem;
                                background-color: #aa6f3c;
                                color: #fff;
                              }
                              .icon{
                                font-size: 100%;
                                font-weight: 700;
                                line-height: 1;
                              }
                            </style>
                          </head>
                          <body>
                          <a class="btn" href="/">↙️ Volver a Inicio</a>
                            <h1>Demandas:</h1>
                            <form class="filter-form" method="GET">
                            <label for="filter-input">Filtrar:</label>
                            <input class="filter-input" type="text" name="q" id="filter-input" placeholder="Ingrese texto a buscar..." value="${query}">
                            <button class="filter-submit" type="submit">Filtrar</button>
                          </form>

                          <form class="filter-form" method="GET">
                          <label for="from-date">Desde:</label>
                          <input type="date" id="from-date" name="fromDate" value="${queryf}">
                          <label for="to-date">Hasta:</label>
                          <input type="date" id="to-date" name="toDate" value="${queryt}">
                          <button class="filter-submit" type="submit">Filtrar por Fecha</button>
                         </form>
                          
                          
                            ${listaFiltrada.length ? `
              <ul>
                ${listaFiltrada.map((file) => `
                <li>
                <a  href="/ver?file=${file}">
                
               <div class="badgeDate">${file.split('---')[0]}</div>
               <div class="badgeExp">${file.split('---')[1]}</div>
               <div class="badgeNum">${file.split('---')[2]}</div>
               
               <div>📁${file.split('---')[3]}</div>
               </a>
                <a class="btndelete" href="/delete?file=${file}" onclick="return deleteFile();" >❌</a>
              </li>
                `).join('')}
              </ul>
            ` : `
              <h2 style='color:red'>No hay demandas para ver.</h2>
            `}
                            </ul>
                            <script>
                            function deleteFile(){
                                // Display a confirm alert
                                var confirmed = window.confirm('Estas segura de borrar toda esta demanda incluyendo su documentación?');
                                // Check if the user clicked "OK"
                                if (confirmed) {
                                
                                  return true;
                                } else {
                                  return false;
                                }
                            }
                            
                            </script>
                          </body>
                        </html>
                      
      `;
        res.send(html);
    });
});


//Boton Borrar (dentro de Ver Demandas)
app.get('/delete', (req, res) => {
    const file = req.query.file;
    if (!file) {
      res.status(400).send('No file specified');
    } else {
      // Get the full path to the folder to delete
      const folderPath = path.join('./demandas', file);
  
      // Check if the folder exists
      if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
        // Delete the folder and all its files
        fs.rmdirSync(folderPath, { recursive: true });
  
        // Redirect back to the home page
        res.redirect('/ver-demandas');
      } else {
        res.status(400).send('Invalid file or folder specified');
      }
    }
  });

  //Boton Borrar (dentro de Detalle Demanda)
app.get('/deletefile', (req, res) => {
    const file = req.query.file;
    const fullpath = req.query.path;
    if (!file) {
      res.status(400).send('No especificaste el archivo');
    } else {
      // Get the full path to the folder to delete
      const folderPath = path.join( './demandas/'+fullpath, file);
  
      // Check if the folder exists
      if (fs.existsSync(folderPath)) {
        // Delete the folder and all its files
        fs.rmSync(folderPath, { recursive: true });
  
        // Redirect back to the home page
        res.redirect('/ver?file='+fullpath);
      } else {
        res.status(400).send('Invalid file or folder specified');
      }
    }
  });
  
//Boton Ver (Click en ListItem Demanda)
  app.get('/ver',(req,res) => {
    const folderPath = './demandas/'; // Replace with your folder path
    const file = req.query.file;
    const fullPath = folderPath + '/' + file;
    const folder = file;
    fs.readdir(fullPath, (err, files) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Ocurrió un error.');
                }

                // Filter files based on user input
                const query = req.query.q || '';
                const filteredFiles = files.filter((file) =>
                    file.toLowerCase().includes(query.toLowerCase())
                );
                const html = `
                <!DOCTYPE html>
                <html>
                  <head>
                    <meta charset="UTF-8">
                    <title>${file}</title>
                    <style>
                              body {
                                font-family: sans-serif;
                              }
                              ul {
                                list-style-type: none;
                                padding: 0;
                                margin: 0;
                              }
                              li {
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                background-color: #eee;
                                padding: 10px;
                                margin: 10px 0;
                                border-radius: 5px;
                                transition: all 0.3s ease;
                                text-align: left;
                              }
                              li:hover {
                                transform: scale(0.99);
                                box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
                              }
                              a {
                                display: inline-block;
                                text-align: left;
                                text-decoration: none;
                                color: #333;
                                padding-right: 50px;
                                flex: 1;
                              }
                              .btn {
                                display: inline-block;
                                background-color: #333;
                                color: #fff;
                                padding: 8px 16px;
                                border-radius: 5px;
                                text-decoration: none;
                                transition: all 0.3s ease;
                                
                              }
                              .btn:hover {
                                background-color: #555;
                              }
                              .btndelete {
                                text-align:center;
                                background-color: #FF0000;
                                color: #fff;
                                padding: 8px 16px ;
                                border-radius: 5px;
                                text-decoration: none;
                                transition: all 0.3s ease;
                                max-width: 32px;
                                margin-left: 10px;
                              }
                              .btndelete:hover {
                                background-color: #8B0000;
                              }
                              .filter-form {
                                margin-bottom: 20px;
                              }
                              .filter-input {
                                padding: 5px;
                                border-radius: 5px;
                                //border: none;
                              }
                              .filter-submit {
                                padding: 5px 10px;
                                border-radius: 5px;
                                border: none;
                                background-color: #333;
                                color: #fff;
                                margin-left: 10px;
                                cursor: pointer;
                              }
                              .badgeExp {
                                display: inline-block;
                                padding: 0.25em 0.4em;
                                font-size: 75%;
                                font-weight: 700;
                                line-height: 1;
                                text-align: center;
                                white-space: nowrap;
                                vertical-align: baseline;
                                border-radius: 0.25rem;
                                background-color: #155263;
                                color: #fff;
                              }
                              .badgeNum {
                                display: inline-block;
                                padding: 0.25em 0.4em;
                                font-size: 75%;
                                font-weight: 700;
                                line-height: 1;
                                text-align: center;
                                white-space: nowrap;
                                vertical-align: baseline;
                                border-radius: 0.25rem;
                                background-color: #ff6f3c;
                                color: #fff;
                              }
                              .badgeDate {
                                display: inline-block;
                                padding: 0.25em 0.4em;
                                font-size: 75%;
                                font-weight: 700;
                                line-height: 1;
                                text-align: center;
                                white-space: nowrap;
                                vertical-align: baseline;
                                border-radius: 0.25rem;
                                background-color: #aa6f3c;
                                color: #fff;
                              }
                              .icon{
                                font-size: 100%;
                                font-weight: 700;
                                line-height: 1;
                              }
                            </style>
                  </head>
                  <body>
                  <a class="btn" href="/ver-demandas">↙️ Volver a Demandas</a>
                    <h1>${file.split('---')[3]}</h1>
                    <h3>N° Exp: ${file.split('---')[2]}</h3>
                    <h4>Tipo Exp: ${file.split('---')[1]}</h4>
                    <h4>Fecha Creacion: ${file.split('---')[0]}</h4>
                  <form action="/upload" method="POST" enctype="multipart/form-data">
  <label for="file"></label>
  <input type="file" id="file" name="file" multiple>
  
  <label for="folder"></label>
  <input type="text" style="display:none;" id="folder" name="folder" value="${folder}">
  <button class="btn" type="submit">Grabar Archivos</button>
</form>
<form action="/viewinexplorer" method="POST">
      <input type="text" style="display:none;" id="folder-path" name="folder-path" value="${folder}">
      <button class="btn" type="submit">Abrir en Windows</button>
</form>
                    ${filteredFiles.length ? `
      <ul>
        ${filteredFiles.map((file) => `
        <li>
       <a  >${file}</a>
       <a class="btndelete" onclick="deleteFile(${file})" href="/deletefile?file=${file}&path=${folder}">❌</a>
      </li>
        `).join('')}
        
      </ul>
    ` : `
      <h2 style='color:red'>Esta demanda no tiene ningún archivo.</h2>
    `}
                    </ul>
                    <script>
                    function deleteFile(file){
                        if (confirm('Are you sure you want to delete ' + file + '?')) {
                            
                          }
                          else{
                              return 0
                          }
                    }
                    
                    </script>
                  </body>
                </html>
              
`;
res.send(html);
});
  });

  //boton nueva demanda (en inicio)
  //tipo de proceso
  //nro expediente
  //
  app.get('/nueva-demanda',(req,res) =>{
    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Nueva Demanda</title>
        <style>
          body {
            font-family: sans-serif;
          }
          ul {
            list-style-type: none;
            padding: 0;
            margin: 0;
          }
          li {
            background-color: #eee;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
            transition: all 0.3s ease;
            text-align: left;
          }
          li:hover {
            transform: scale(0.99);
            box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
          }
          a {
            display: inline-block;
            text-align: left;
            text-decoration: none;
            color: #333;
            padding-right: 50px;
          }
          .btn {
            display: inline-block;
            background-color: #333;
            color: #fff;
            padding: 8px 16px;
            border-radius: 5px;
            text-decoration: none;
            transition: all 0.3s ease;
            
          }
          .btn:hover {
            background-color: #555;
          }
          .filter-form {
            margin-bottom: 20px;
          }
          .filter-input {
            padding: 5px;
            border-radius: 5px;
            min-width:500px;
            //border: none;
          }
          .filter-submit {
            padding: 5px 10px;
            border-radius: 5px;
            border: none;
            background-color: #333;
            color: #fff;
            margin-left: 10px;
            cursor: pointer;
          }
        
        </style>
      </head>
      <body>
      <a class="btn" href="/">↙️ Volver a Inicio</a>
        <h1>Nuevo Expediente</h1>
       
        <form action="/" method="POST">
        <label for="folderName">Carátula:</label>
        <br>
        <input class="filter-input" type="text" id="folderName" placeholder="Carátula de la demanda (no se admiten caracteres \ / * . $ | : < >)..." name="folderName">
        
        <br>
        <br>
        <label for="tipoExpediente">Tipo Expediente:</label>
        <br>
        <input class="filter-input" type="text" id="tipoExpediente" placeholder="Ingrese el tipo de Expediente..." name="tipoExpediente">
        
        <br>
        <br>
        <label for="numExpediente">Nº Expediente:</label>
        <br>
        <input class="filter-input" type="text" id="numExpediente" placeholder="Ingrese el nùmero de Expediente..." name="numExpediente">
        <br>
        <br>
        <button class="btn" onclick="validateFolderName(event)" type="submit">Crear</button>
        <br>
        <p id="folderNameError" style="color: red; display: none;">Error: no puede contener caracteres inválidos ( \\ / * . $ | : "" < > ).</p>

      </form>
      <script>
function validateFolderName(event) {
  event.preventDefault(); // Prevent form submission

  const folderNameInput = document.getElementById('folderName');
  const folderNameError = document.getElementById('folderNameError');

  // Check if folder name contains any invalid characters
  if (/[<>:""/\\|?*\x00-\x1F]/.test(folderNameInput.value)) {
    folderNameInput.classList.add('is-invalid');
    folderNameError.style.display = 'block';
  } else {
    folderNameInput.classList.remove('is-invalid');
    folderNameError.style.display = 'none';
    event.target.form.submit(); // Submit the form if validation passes
  }
}
</script>
      </body>
    </html>
  
`;
res.send(html);
  })

  app.post('/viewinexplorer', (req, res) => {
    // Get the folder path from the form data
    //const folderPath = req.body['folder-path'];
    const folderPath = path.join('./demandas', req.body['folder-path']);

    // Use the "start" command on Windows to open the folder in explorer.exe
    const command = `start explorer.exe "${folderPath}"`;
  
    // Execute the command using the "exec" function from the "child_process" module
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        res.status(500).send('Error al abrir carpeta');
        return;
      }
    
    });
  });


  //Crear Carpeta
  // Handle the form submission
app.post('/', (req, res) => {
    // Get the folder name from the request body
    const date = new Date();
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');
const day = String(date.getDate()).padStart(2, '0');
const folderDate = `${year}-${month}-${day}`;
    const folderName = req.body.folderName;
    const expediente = req.body.tipoExpediente;
    const numero = req.body.numExpediente
  
    // Define the path for the new folder
  const folderPath = path.join('./demandas', (folderDate+'---'+expediente + '---'+numero+'---'+folderName));
    // Create the folder using the fs.mkdir() method
    fs.mkdir(folderPath, (err) => {
      if (err) {
        res.send('<a href="/nueva-demanda">Volver</a><br><h2>hubo un error al crear la carpeta, asegúrese de que no contenga caracteres inválidos ( \\ / * . $ | : "" < > )</h2>');
      } else {
        res.send('<a href="/nueva-demanda">Volver a crear otra demanda</a><br><a href="/ver-demandas">Ver todas las demandas</a> <h2>La demanda se creó correctamente</h2>');
      
      }
    });
  });

//subida de archivos
  app.post('/upload', upload.array('file'), (req, res) => {
    const uploadedFiles = req.files;
    const folderToUpload = req.body.folder;
    // Move the uploaded file to a different directory
    const targetDir = './demandas/' + req.body.folder;
    //const targetPath = path.join(__dirname, targetDir, uploadedFile.originalname);
    //fs.renameSync(uploadedFile.path, targetPath);
    for (const uploadedFile of uploadedFiles) {
        const targetPath = path.join(__dirname, targetDir, uploadedFile.originalname);
        fs.renameSync(uploadedFile.path, targetPath);
      }
    res.send(`<a href="/ver?file=${req.body.folder}">Volver a la demanda</a><br> Se subio el archivo!`);
  });
  
//STARTUP
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Lex Doctor Julián Encendido en http://localhost:${port}/`);
    console.log("Para cerrar el programa, cierre la ventana que se abrió del chrome")
    console.log("y luego cierre esta ventana")
});