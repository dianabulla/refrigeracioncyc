const API_LOGIN = "../api/login.php";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formLogin");
  const btn  = document.getElementById("btnLogin");
  const msg  = document.getElementById("loginMensaje");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) msg.textContent = "";
    if (btn) {
      btn.disabled = true;
      btn.innerText = "Ingresando...";
    }

    const email    = document.getElementById("email")?.value.trim()    || "";
    const password = document.getElementById("password")?.value.trim() || "";

    if (!email || !password) {
      if (msg) msg.textContent = "Debe ingresar correo y contraseña.";
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Ingresar";
      }
      return;
    }

    try {
      const res = await fetch(API_LOGIN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        if (msg) msg.textContent = data.error || "Credenciales inválidas.";
        if (btn) {
          btn.disabled = false;
          btn.innerText = "Ingresar";
        }
        return;
      }

      // Login OK → redirigimos al panel
      window.location.href = "admin.html";

    } catch (err) {
      console.error("Error en login:", err);
      if (msg) msg.textContent = "Error de conexión con el servidor.";
      if (btn) {
        btn.disabled = false;
        btn.innerText = "Ingresar";
      }
    }
  });
});
