    const express = require("express");
    const fs = require("fs");
    const path = require("path");
    const session = require("express-session");
    const app = express();

    // =====================
    // MIDDLEWARE
    // =====================
    app.use(express.urlencoded({ extended: true }));
    app.use(express.static("public"));

    app.use(session({
        secret: "miSecretoUltraPoderoso",
        resave: false,
        saveUninitialized: false
    }));

    // =====================
    // RUTAS JSON
    // =====================
    const rutaUsuarios = path.join(__dirname, "usuarios.json");
    const rutaPosts = path.join(__dirname, "posts.json");

    // =====================
    // UTILIDADES
    // =====================
    function generarId() {
        return Date.now() + Math.floor(Math.random() * 1000);
    }

    function obtenerUsuarios() {
        if (!fs.existsSync(rutaUsuarios)) fs.writeFileSync(rutaUsuarios, JSON.stringify([]));
        return JSON.parse(fs.readFileSync(rutaUsuarios, "utf8"));
    }

    function guardarUsuarios(data) {
        fs.writeFileSync(rutaUsuarios, JSON.stringify(data, null, 2));
    }

    function obtenerPosts() {
        if (!fs.existsSync(rutaPosts)) fs.writeFileSync(rutaPosts, JSON.stringify({ general: [], discusiones: [], preguntas: [] }, null, 2));
        return JSON.parse(fs.readFileSync(rutaPosts, "utf8"));
    }

    function guardarPosts(data) {
        fs.writeFileSync(rutaPosts, JSON.stringify(data, null, 2));
    }

    // =====================
    // MIDDLEWARE SESIÓN
    // =====================
    function verificarSesion(req, res, next) {
        if (!req.session.usuario) return res.redirect("/login");
        next();
    }

    // =====================
    // LOGIC REDDIT
    // =====================
    function buscarComentario(lista, id) {
        if (!lista) return null;
        for (let c of lista) {
            if (!c.respuestas) c.respuestas = [];
            if (c.id == id) return c;
            const encontrado = buscarComentario(c.respuestas, id);
            if (encontrado) return encontrado;
        }
        return null;
    }

    function buscarComentarioPadre(lista, id) {
        if (!lista) return null;
        for (let c of lista) {
            if (!c.respuestas) c.respuestas = [];
            if (c.id == id) return { comentario: c, padre: lista };
            const encontrado = buscarComentarioPadre(c.respuestas, id);
            if (encontrado) return encontrado;
        }
        return null;
    }

    // =====================
    // RENDER COMENTARIOS
    // =====================
    function renderComentarios(lista, padreDiv) {
        lista.forEach(c => {
            const cDiv = document.createElement("div");
            cDiv.className = "comentario";
            if (padreDiv !== div) cDiv.className += " respuesta";
            cDiv.dataset.id = c.id;

            // Contenido del comentario
            const contenidoDiv = document.createElement("div");
            contenidoDiv.innerHTML = `<b>${c.autor}</b>: ${c.contenido}`;
            cDiv.appendChild(contenidoDiv);

            // Contenedor de botones
            const botonesDiv = document.createElement("div");
            botonesDiv.style.display = "flex";
            botonesDiv.style.gap = "5px";
            botonesDiv.style.marginTop = "5px";

            // Botón Responder
            const btnResp = document.createElement("button");
            btnResp.type = "button";
            btnResp.innerText = "Responder";
            botonesDiv.appendChild(btnResp);

            // Botón Borrar (autor del comentario o del tema)
            if (c.autor === usuarioActual || tema.autor === usuarioActual) {
                const btnBorrar = document.createElement("button");
                btnBorrar.type = "button";
                btnBorrar.innerText = "Borrar";
                btnBorrar.onclick = e => {
                    e.stopPropagation();
                    if (!confirm("¿Seguro que quieres borrar este comentario?")) return;
                    fetch(`/api/${categoria}/tema/${id}/comentario/${c.id}/borrar`, { method: "POST" })
                        .then(res => res.json())
                        .then(respuesta => {
                            if (respuesta.ok) cDiv.remove();
                        });
                };
                botonesDiv.appendChild(btnBorrar);
            }

            cDiv.appendChild(botonesDiv);

            // Formulario de respuesta (oculto inicialmente)
            const formResp = document.createElement("form");
            formResp.style.display = "none";
            formResp.style.gap = "8px"; // separación adecuada
            formResp.style.marginTop = "5px";
            formResp.style.width = "100%";
            formResp.onsubmit = e => {
                e.preventDefault();
                const contenido = e.target.contenido.value;
                fetch(`/api/${categoria}/tema/${id}/responder`, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: "comentarioId=" + encodeURIComponent(c.id) + "&contenido=" + encodeURIComponent(contenido)
                }).then(res => res.json())
                .then(respuesta => {
                    if (respuesta.ok) cargarComentarios(categoria, id);
                });
                e.target.reset();
            };
    function cargarTemas(categoria){
        const div = document.getElementById("temas");
        div.innerHTML = `<h2>Temas en ${categoria.toUpperCase()}</h2>`;

        // Formulario nuevo tema
        const form = document.createElement("form");
        form.onsubmit = e=>{
            e.preventDefault();
            const titulo = e.target.titulo.value;
            fetch(`/api/${categoria}/nuevo`, {
                method:"POST",
                headers: {"Content-Type":"application/x-www-form-urlencoded"},
                body:"titulo="+encodeURIComponent(titulo)
            })
            .then(r=>r.json())
            .then(res=>{
                if(res.ok){
                    e.target.reset();
                    fetch(`/api/${categoria}`)
                        .then(r=>r.json())
                        .then(temas=>renderTemas(categoria, temas));
                }
            });
        };
        form.innerHTML = `<input type="text" name="titulo" placeholder="Nuevo tema" required>
                        <button>Crear</button>`;
        div.appendChild(form);

        // Traer temas iniciales
        fetch(`/api/${categoria}`)
            .then(r=>r.json())
            .then(temas=>renderTemas(categoria, temas));
    }

    function renderTemas(categoria, temas){
        const div = document.getElementById("temas");
        // Borra solo los temas antiguos (no el formulario)
        Array.from(div.querySelectorAll(".tema")).forEach(t => t.remove());

        temas.forEach(t=>{
            const temaDiv = document.createElement("div");
            temaDiv.className = "tema";
            temaDiv.dataset.id = t.id;
            temaDiv.innerHTML = `<b>${t.titulo}</b> | ${t.autor}`;

            if(t.autor===usuarioActual){
                const btnBorrar = document.createElement("button");
                btnBorrar.innerText = "Borrar Tema";
                btnBorrar.onclick = e=>{
                    e.stopPropagation();
                    if(!confirm("¿Seguro que quieres borrar este tema?")) return;
                    fetch(`/api/${categoria}/tema/${t.id}/borrar`, { method:"POST"})
                        .then(r=>r.json())
                        .then(res=>{ if(res.ok) temaDiv.remove() });
                };
                temaDiv.appendChild(btnBorrar);
            }

            temaDiv.onclick = ()=>cargarComentarios(categoria, t.id);
            div.appendChild(temaDiv);
        });
    }

            // Input y botón de respuesta
            const inputResp = document.createElement("input");
            inputResp.name = "contenido";
            inputResp.placeholder = "Responder...";
            inputResp.required = true;
            inputResp.style.flex = "1"; // ocupa el espacio disponible

            const btnEnviarResp = document.createElement("button");
            btnEnviarResp.type = "submit";
            btnEnviarResp.innerText = "Enviar";

            formResp.appendChild(inputResp);
            formResp.appendChild(btnEnviarResp);

            // Mostrar/ocultar formulario
            btnResp.onclick = e => {
                e.stopPropagation();
                formResp.style.display = formResp.style.display === "none" ? "flex" : "none";
            };

            cDiv.appendChild(formResp);
            padreDiv.appendChild(cDiv);

            // Renderizar respuestas recursivamente
            if (c.respuestas && c.respuestas.length > 0) {
                renderComentarios(c.respuestas, cDiv);
            }
        });
    }
// Servir todos los archivos de la carpeta Fronted
app.use(express.static(path.join(__dirname, "../Fronted")));

// Ruta para el index.html (inicio)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Fronted/index.html"));
});
    // =====================
    // RUTAS DE LOGIN / REGISTRO
    // =====================

    app.get("/", (req, res) => res.redirect("/login"));
    app.get("/login", (req, res) => res.sendFile(path.join(__dirname, "public/login.html")));
    app.get("/registro", (req, res) => res.sendFile(path.join(__dirname, "public/registro.html")));
    app.get("/foro-inicio", (req, res) => res.sendFile(path.join(__dirname, "public/foro-inicio.html")));
    app.get("/foro.html", verificarSesion, (req, res) => res.sendFile(path.join(__dirname, "public/foro.html")));

    // Registro
app.post("/registro", (req, res) => {
    const { usuario, password } = req.body;
    const usuarios = obtenerUsuarios();

    if (usuarios.find(u => u.usuario === usuario)) {
        return res.json({ ok: false, mensaje: "Ese usuario ya existe ❌" });
    }

    usuarios.push({ usuario, password });
    guardarUsuarios(usuarios);

    // Cambiado: devolver JSON para que el frontend haga la redirección
    res.json({ ok: true, mensaje: "Usuario registrado con éxito ✅" });
});
// =====================
// RUTA NUEVA: ELIMINAR USUARIO
// =====================
app.post("/api/eliminar-usuario", verificarSesion, (req, res) => {
    const usuario = req.session.usuario;

    // Eliminar usuario del JSON
    let usuarios = obtenerUsuarios();
    usuarios = usuarios.filter(u => u.usuario !== usuario);
    guardarUsuarios(usuarios);

    // Eliminar posts y comentarios del usuario
    let posts = obtenerPosts();
    for (const cat in posts) {
        // Eliminar temas del usuario
        posts[cat] = posts[cat].filter(t => t.autor !== usuario);
        // Eliminar comentarios del usuario en otros temas
        posts[cat].forEach(t => {
            t.comentarios = eliminarComentariosUsuario(t.comentarios, usuario);
        });
    }
    guardarPosts(posts);

    // Destruir sesión
    req.session.destroy(() => {
        res.json({ ok: true });
    });
});

function eliminarComentariosUsuario(lista, usuario) {
    return lista
        .filter(c => c.autor !== usuario)
        .map(c => {
            if (c.respuestas) c.respuestas = eliminarComentariosUsuario(c.respuestas, usuario);
            return c;
        });
}
    // Login
app.post("/login", (req, res) => {
    const { usuario, password } = req.body;
    const usuarios = obtenerUsuarios();
    const encontrado = usuarios.find(u => u.usuario === usuario && u.password === password);

    if (!encontrado) return res.json({ ok: false, mensaje: "Credenciales incorrectas ❌" });

    req.session.usuario = usuario;

    // Cambiado: devolver JSON para que el frontend haga la redirección
    res.json({ ok: true, mensaje: "Login exitoso ✅" });
});

    // Logout
    app.get("/logout", (req, res) => {
        req.session.destroy(() => res.redirect("/login"));
    });

    // =====================
    // API USUARIO
    // =====================
    app.get("/api/usuario", verificarSesion, (req, res) => {
        res.json({ usuario: req.session.usuario });
    });

    // =====================
    // API DEL FORO
    // =====================
    app.get("/api/categorias", verificarSesion, (req, res) => {
        res.json(Object.keys(obtenerPosts()));
    });

    app.get("/api/:categoria", verificarSesion, (req, res) => {
        const posts = obtenerPosts();
        const cat = posts[req.params.categoria];
        if (!cat) return res.status(404).json({ error: "Categoría no encontrada" });
        res.json(cat);
    });

    app.post("/api/:categoria/nuevo", verificarSesion, (req, res) => {
        const { titulo } = req.body;
        const posts = obtenerPosts();
        if (!posts[req.params.categoria]) return res.status(404).json({ error: "Categoría no válida" });
        posts[req.params.categoria].push({
            id: generarId(),
            titulo,
            autor: req.session.usuario,
            fecha: new Date().toLocaleString(),
            comentarios: []
        });
        guardarPosts(posts);
        res.json({ ok: true });
    });

    app.post("/api/:categoria/tema/:id/comentar", verificarSesion, (req, res) => {
        const { contenido } = req.body;
        const posts = obtenerPosts();
        const tema = posts[req.params.categoria]?.find(t => t.id == req.params.id);
        if (!tema) return res.status(404).json({ error: "Tema no encontrado" });
        tema.comentarios.push({ id: generarId(), autor: req.session.usuario, contenido, respuestas: [] });
        guardarPosts(posts);
        res.json({ ok: true });
    });

    app.post("/api/:categoria/tema/:id/responder", verificarSesion, (req, res) => {
        const { comentarioId, contenido } = req.body;
        const posts = obtenerPosts();
        const tema = posts[req.params.categoria]?.find(t => t.id == req.params.id);
        if (!tema) return res.status(404).json({ error: "Comentario no encontrado" });
        const padre = buscarComentario(tema.comentarios, comentarioId);
        if (!padre) return res.status(404).json({ error: "Comentario no encontrado" });
        padre.respuestas.push({ id: generarId(), autor: req.session.usuario, contenido, respuestas: [] });
        guardarPosts(posts);
        res.json({ ok: true });
    });

    app.post("/api/:categoria/tema/:id/borrar", verificarSesion, (req, res) => {
        const posts = obtenerPosts();
        const index = posts[req.params.categoria]?.findIndex(t => t.id == req.params.id);
        if (index === -1) return res.status(404).json({ error: "Tema no encontrado" });
        const tema = posts[req.params.categoria][index];
        if (tema.autor !== req.session.usuario) return res.status(403).json({ error: "No puedes borrar este tema" });
        posts[req.params.categoria].splice(index, 1);
        guardarPosts(posts);
        res.json({ ok: true });
    });

    // ✅ Ruta de borrado de comentario
    app.post("/api/:categoria/tema/:id/comentario/:comentarioId/borrar", verificarSesion, (req, res) => {
        const posts = obtenerPosts();
        const tema = posts[req.params.categoria]?.find(t => t.id == req.params.id);
        if (!tema) return res.status(404).json({ error: "Tema no encontrado" });

        const encontrado = buscarComentarioPadre(tema.comentarios, req.params.comentarioId);
        if (!encontrado) return res.status(404).json({ error: "Comentario no encontrado" });

        const { comentario, padre } = encontrado;

        if (comentario.autor !== req.session.usuario && tema.autor !== req.session.usuario) {
            return res.status(403).json({ error: "No puedes borrar este comentario" });
        }

        const idx = padre.indexOf(comentario);
        if (idx !== -1) padre.splice(idx, 1);

        guardarPosts(posts);
        res.json({ ok: true });
    });

    // =====================
    // INICIAR SERVIDOR
    // =====================
    app.listen(3000, () => console.log("Servidor corriendo en http://localhost:3000"));