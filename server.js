const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3000;


app.use(express.json());

// Conexión a MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mlb_db';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Conectado exitosamente a MongoDB'))
  .catch(err => console.error('Error conectando a MongoDB:', err));

// Definición del Modelo/Esquema para los Equipos
const TeamSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    liga: { type: String, required: true, enum: ['liga_americana', 'liga_nacional'] },
    division: { type: String, required: true, enum: ['este', 'central', 'oeste'] }
});

const Team = mongoose.model('Team', TeamSchema);


// RUTAS DEL CRUD
// ==========================================

// 1. OBTENER TODOS LOS EQUIPOS
// 1.2 OBTENER UN EQUIPO ESPECÍFICO POR ID
app.get('/api/equipos/:id', async (req, res) => {
    try {
        const { id } = req.params; // Captura el ID que viene en la URL de Postman
        const team = await Team.findById(id); // Lo busca directamente en MongoDB

        // Si el formato del ID es válido pero no existe en la base de datos
        if (!team) {
            return res.status(404).json({ status: "error", message: "Equipo no encontrado en la base de datos" });
        }

        res.json({ status: "success", data: team });
    } catch (error) {
        // Si el ID está mal escrito o tiene menos caracteres de los que pide Mongo
        res.status(400).json({ status: "error", message: "ID inválido: " + error.message });
    }
});

// 2. CREAR UN NUEVO EQUIPO (Modificado para ver el detalle real del error 400)
app.post('/api/equipos', async (req, res) => {
    try {
        const { nombre, liga, division } = req.body;
        const newTeam = new Team({ nombre, liga, division });
        await newTeam.save();
        res.status(201).json({ status: "success", data: newTeam });
    } catch (error) {
        // Devolvemos el error_detalle exacto para saber qué falló en Mongoose o la BD
        res.status(400).json({ status: "error", error_detalle: error.message });
    }
});

// 3. ACTUALIZAR UN EQUIPO EXISTENTE
app.put('/api/equipos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, liga, division } = req.body;
        
        const updatedTeam = await Team.findByIdAndUpdate(
            id, 
            { nombre, liga, division }, 
            { new: true, runValidators: true }
        );

        if (!updatedTeam) return res.status(404).json({ status: "error", message: "Equipo no encontrado" });

        res.json({ status: "success", data: updatedTeam });
    } catch (error) {
        res.status(400).json({ status: "error", message: error.message });
    }
});

// 4. ELIMINAR UN EQUIPO
app.delete('/api/equipos/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedTeam = await Team.findByIdAndDelete(id);

        if (!deletedTeam) return res.status(404).json({ status: "error", message: "Equipo no encontrado" });

        res.json({ status: "success", message: `Equipo '${deletedTeam.nombre}' eliminado correctamente` });
    } catch (error) {
        res.status(500).json({ status: "error", message: error.message });
    }
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({ status: "UP", db_status: mongoose.connection.readyState === 1 ? "CONNECTED" : "DISCONNECTED", timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Microservicio de la MLB corriendo en http://localhost:${PORT}`);
});

