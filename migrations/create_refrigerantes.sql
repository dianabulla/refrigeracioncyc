-- ========================================================
-- MIGRACION: Crear tabla refrigerante
-- ========================================================

CREATE TABLE IF NOT EXISTS refrigerante (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL,
    refrigerante_temperatura VARCHAR(100) NOT NULL,
    referencia VARCHAR(150) NULL,
    codigo_empresa VARCHAR(50) NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL,
    UNIQUE KEY uq_refrigerante_codigo (codigo),
    INDEX idx_refrigerante_empresa (codigo_empresa),
    CONSTRAINT fk_refrigerante_empresa
        FOREIGN KEY (codigo_empresa) REFERENCES empresa(codigo)
        ON DELETE SET NULL ON UPDATE CASCADE
);
