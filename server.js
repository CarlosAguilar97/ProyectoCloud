const azure = require('azure-storage');
const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

// Cargar configuración desde el archivo config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));

// Configuración de Azure Storage
const blobService = azure.createBlobService(config.AzureStorageConnectionString);
const containerName = config.ContainerName;

// Configuración de Multer para la carga de archivos
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Ruta para redirigir a la página de inicio
app.get('/', (req, res) => {
    const indexPath = path.join(__dirname, 'index.html');
    res.sendFile(indexPath);
});
// Ruta para subir archivos
app.post('/subirArchivo', upload.single('archivo'), (req, res) => {
    // Validar y procesar el archivo
    if (req.file) {
        // Guardar el archivo en Azure Storage (reemplazar esto con la lógica real)
        const blobName = req.file.originalname;
        const stream = getStream(req.file.buffer);

        blobService.createBlockBlobFromStream(containerName, blobName, stream, req.file.size, err => {
            if (err) {
                console.error(err);
                res.status(500).send('Error al subir el archivo a Azure Storage');
            } else {
                // Mensaje de éxito
                const successMessage = 'Archivo subido con éxito';
                
                // Enviar respuesta con script de alerta
                res.send(`
                    <script>
                        alert('${successMessage}');
                        window.location.href = '/';
                    </script>
                `);
            }
        });
    } else {
        res.status(400).send('No se proporcionó ningún archivo');
    }
});
// Ruta para listar archivos
app.get('/listarArchivos', (req, res) => {
    blobService.listBlobsSegmented(containerName, null, (err, result) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error al obtener la lista de archivos');
        } else {
            const archivos = result.entries.map(entry => entry.name);
            res.json(archivos);
        }
    });
});
// Función auxiliar para convertir un búfer en un flujo
function getStream(buffer) {
    const { Duplex } = require('stream');
    const stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
}

app.listen(port, () => {
    console.log(`Aplicación escuchando en http://localhost:${port}`);
});