/**
 * auth-check.js
 * Sistema de verificación de sesión automático para todas las páginas protegidas
 * Se ejecuta al cargar cualquier vista administrativa
 */

(function() {
    'use strict';

    // Detectar base URL dinámicamente
    function getBaseUrl() {
        const path = window.location.pathname;
        // En local XAMPP: /refrigeracioncyc/views/admin.html → base es /refrigeracioncyc
        // En producción: /views/admin.html → base es ""
        if (path.includes('/refrigeracioncyc/')) {
            return '/refrigeracioncyc';
        }
        return '';
    }

    const BASE_URL = getBaseUrl();

    /**
     * Verifica si el usuario tiene una sesión activa
     * Si no está autenticado, redirige al login
     */
    async function verificarSesion() {
        try {
            const response = await fetch(`${BASE_URL}/api/session.php`, {
                method: 'GET',
                credentials: 'include', // Incluir cookies de sesión
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok || !data.ok || !data.user) {
                // No hay sesión válida: redirigir al login
                window.location.href = `${BASE_URL}/views/login.html`;
                return false;
            }

            // Sesión válida: almacenar datos del usuario
            sessionStorage.setItem('currentUser', JSON.stringify(data.user));
            
            // Actualizar UI con información del usuario si existe el elemento
            actualizarInfoUsuario(data.user);
            
            return true;

        } catch (error) {
            // En caso de error, redirigir al login por seguridad
            window.location.href = `${BASE_URL}/views/login.html`;
            return false;
        }
    }

    /**
     * Actualiza la interfaz con la información del usuario logueado
     */
    function actualizarInfoUsuario(user) {
        // Actualizar nombre de usuario si existe el elemento
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = user.nombre || user.email || 'Usuario';
        }

        // Actualizar email si existe el elemento
        const userEmailElement = document.getElementById('userEmail');
        if (userEmailElement) {
            userEmailElement.textContent = user.email || '';
        }

        // Actualizar rol si existe el elemento
        const userRoleElement = document.getElementById('userRole');
        if (userRoleElement) {
            const rol = user.rol || user.tipo || 'Usuario';
            userRoleElement.textContent = rol.charAt(0).toUpperCase() + rol.slice(1);
        }
    }

    /**
     * Obtiene el usuario actual desde sessionStorage
     */
    function obtenerUsuarioActual() {
        const userStr = sessionStorage.getItem('currentUser');
        return userStr ? JSON.parse(userStr) : null;
    }

    /**
     * Cierra la sesión del usuario
     */
    async function cerrarSesion() {
        try {
            await fetch(`${BASE_URL}/api/logout.php`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            // Error silencioso
        } finally {
            // Limpiar sessionStorage
            sessionStorage.clear();
            // Redirigir al login
            window.location.href = `${BASE_URL}/views/login.html`;
        }
    }

    /**
     * Configura el botón de cerrar sesión si existe
     */
    function configurarBotonCerrarSesion() {
        const btnLogout = document.getElementById('btnLogout');
        if (btnLogout) {
            btnLogout.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('¿Está seguro que desea cerrar sesión?')) {
                    cerrarSesion();
                }
            });
        }
    }

    /**
     * Verifica la sesión periódicamente (cada 5 minutos)
     */
    function iniciarVerificacionPeriodica() {
        setInterval(() => {
            verificarSesion();
        }, 5 * 60 * 1000); // 5 minutos
    }

    // Exportar funciones globales
    window.AuthCheck = {
        verificar: verificarSesion,
        obtenerUsuario: obtenerUsuarioActual,
        cerrarSesion: cerrarSesion
    };
    // Compatibilidad con enlaces inline: onclick="cerrarSesion()"
    window.cerrarSesion = cerrarSesion;

    // Ejecutar verificación al cargar la página
    document.addEventListener('DOMContentLoaded', () => {
        // Verificar sesión inmediatamente
        verificarSesion();
        
        // Configurar botón de logout
        configurarBotonCerrarSesion();
        
        // Iniciar verificación periódica
        iniciarVerificacionPeriodica();
    });

})();
