<?php
// confing/validators.php

/**
 * Valida que un campo obligatorio no esté vacío
 */
function validateRequired($fieldName, $value) {
    if (empty($value) && $value !== "0") {
        throw new Exception("El campo '$fieldName' es obligatorio.");
    }
}

/**
 * Valida que el campo sea un email válido
 */
function validateEmail($fieldName, $value) {
    if (!filter_var($value, FILTER_VALIDATE_EMAIL)) {
        throw new Exception("El campo '$fieldName' debe ser un email válido.");
    }
}

/**
 * Valida longitud mínima
 */
function validateMinLength($fieldName, $value, $min) {
    if (strlen($value) < $min) {
        throw new Exception("El campo '$fieldName' debe tener al menos $min caracteres.");
    }
}

/**
 * Valida longitud máxima
 */
function validateMaxLength($fieldName, $value, $max) {
    if (strlen($value) > $max) {
        throw new Exception("El campo '$fieldName' no debe superar los $max caracteres.");
    }
}

/**
 * Valida que sea numérico
 */
function validateNumeric($fieldName, $value) {
    if (!is_numeric($value)) {
        throw new Exception("El campo '$fieldName' debe ser un número.");
    }
}

/**
 * Valida que esté en un rango
 */
function validateRange($fieldName, $value, $min, $max) {
    if ($value < $min || $value > $max) {
        throw new Exception("El campo '$fieldName' debe estar entre $min y $max.");
    }
}
