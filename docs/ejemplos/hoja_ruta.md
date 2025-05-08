Hoja de ruta 

Etapa 1. Cálculo directo con operadores aritméticos 

Etapa 2. Definición de constantes para legibilidad 

Etapa 3. Guion secuencial con entrada de usuario 

Etapa 4. Plantilla reutilizable (función/método) 

 

1. Contexto y objetivos: Este mini-proyecto guía al estudiante desde el cálculo básico hasta la creación de una función reusable para estimar costos, desarrollando competencias de aritmética aplicada y codificación. 

 

2. Resultados de Aprendizaje (RA) generales 

Al finalizar, el estudiante podrá: 

Emplear correctamente operadores aritméticos y constantes en Python y Java. 

Diseñar scripts que reciban entrada de usuario y produzcan cálculos precisos. 

Encapsular lógica en funciones/métodos reutilizables. 

Reflexionar sobre las ventajas de la modularidad y la legibilidad. 

Shape 

3. Etapas del Mini-Proyecto 

Etapa 1. Cálculo directo con operadores aritméticos 

RA asociado: 

“Aplica la sintaxis de +, -, *, / en Python y Java para calcular un costo total.” 

Tarea: 

En Python: 

# Etapa 1: cálculo directo 

costo_total = (72 * 0.15) + (500 * 0.02) + (2.5 * 5.0) 

print(costo_total) 

En Java: 

// Etapa 1: cálculo directo 

double costoTotal = (72 * 0.15) + (500 * 0.02) + (2.5 * 5.0); 

System.out.println(costoTotal); 

Mini-rúbrica de evaluación 

Criterio 

Nivel 1 (Básico) 

Nivel 2 (Intermedio) 

Nivel 3 (Avanzado) 

Uso de operadores 

Errores de sintaxis o de paréntesis 

Sintaxis correcta 

Sintaxis correcta y comentarios explicativos 

Legibilidad del código 

Código concentrado sin espacios ni líneas 

Estructura clara, identación adecuada 

Estructura clara + comentarios en cada paso 

Precisión del resultado 

Resultado incorrecto o ausente 

Resultado correcto 

Resultado correcto + formato amigable en la impresión 

Reflexión 

“¿Cómo cambia la claridad del cálculo cuando usas paréntesis y espacios descriptivos?” 

Shape 

Etapa 2. Definición de constantes para legibilidad 

RA asociado: 

“Define constantes en mayúsculas (Python) o final (Java) y reutilízalas en la expresión aritmética.” 

Tarea: 

En Python: 

COSTO_HORA = 0.15 

COSTO_GB   = 0.02 

COSTO_TB   = 5.0 

HORAS      = 72 

GB         = 500 

TB         = 2.5 

 

costo_total = (HORAS * COSTO_HORA) + (GB * COSTO_GB) + (TB * COSTO_TB) 

print(costo_total) 

En Java: 

final double COSTO_HORA = 0.15; 

final double COSTO_GB   = 0.02; 

final double COSTO_TB   = 5.0; 

int    horas           = 72; 

int    gb              = 500; 

double tb              = 2.5; 

 

double costoTotal = (horas * COSTO_HORA) + (gb * COSTO_GB) + (tb * COSTO_TB); 

System.out.println(costoTotal); 

Mini-rúbrica de evaluación 

Criterio 

Nivel 1 

Nivel 2 

Nivel 3 

Definición de constantes 

Valores inline 

Constantes definidas pero mal nombradas 

Constantes bien nombradas y usadas 

Legibilidad 

Código complejo 

Variables claras 

Variables claras + comentarios de propósito 

Reflexión de la mejora 

No reflexiona 

Identifica ventaja 

Explica con ejemplos la mejora en mantenimiento 

Reflexión 

“¿Qué beneficios aporta usar nombres descriptivos en lugar de literales numéricos?” 

Shape 

Etapa 3. Guion secuencial con entrada de usuario 

RA asociado: 

“Implementa input() (Python) o Scanner (Java) para recibir horas, GB y TB, y calcula el costo usando constantes.” 

Tarea: 

En Python: 

COSTO_HORA = 0.15; COSTO_GB = 0.02; COSTO_TB = 5.0 

horas = float(input("Horas de servidor: ")) 

gb    = float(input("GB transferidos: ")) 

tb    = float(input("TB almacenados: ")) 

print("Costo total:", (horas*COSTO_HORA)+(gb*COSTO_GB)+(tb*COSTO_TB)) 

En Java: 

final double COSTO_HORA = 0.15, COSTO_GB = 0.02, COSTO_TB = 5.0; 

Scanner sc = new Scanner(System.in); 

System.out.print("Horas de servidor: "); 

double horas = sc.nextDouble(); 

// ... similar para gb y tb 

double costoTotal = (horas*COSTO_HORA)+(gb*COSTO_GB)+(tb*COSTO_TB); 

System.out.println("Costo total: " + costoTotal); 

sc.close(); 

Mini-rúbrica de evaluación 

Criterio 

Nivel 1 

Nivel 2 

Nivel 3 

Lectura de entrada 

No valida o convierte 

Convierte pero sin mensajes 

Mensajes claros + validación de errores 

Flujo secuencial 

Lógico pero rígido 

Flujo lógico 

Flujo lógico + manejo de excepciones 

Precisión del cálculo 

Error en conversión/tipo 

Cálculo correcto 

Cálculo correcto + formato de salida claro 

Reflexión 

“¿Cómo harías para evitar que el programa falle si el usuario ingresa texto no numérico?” 

Shape 

Etapa 4. Plantilla reutilizable (función/método) 

RA asociado: 

“Encapsula la lógica de cálculo en una función o método que reciba parámetros y retorne el costo.” 

Tarea: 

En Python: 

COSTO_HORA = 0.15; COSTO_GB = 0.02; COSTO_TB = 5.0 

def calcular_costo(horas, gb, tb): 

    return (horas*COSTO_HORA)+(gb*COSTO_GB)+(tb*COSTO_TB) 

 

# Ejecución principal 

h = float(input("Horas: ")) 

g = float(input("GB: ")) 

t = float(input("TB: ")) 

print("Costo total:", calcular_costo(h, g, t)) 

En Java: 

final double COSTO_HORA = 0.15, COSTO_GB = 0.02, COSTO_TB = 5.0; 

public static double calcularCosto(double horas, double gb, double tb) { 

    return (horas*COSTO_HORA)+(gb*COSTO_GB)+(tb*COSTO_TB); 

} 

public static void main(String[] args) { 

    // Lectura de usuario... 

    System.out.println("Costo total: " + calcularCosto(horas, gb, tb)); 

} 

Mini-rúbrica de evaluación 

Criterio 

Nivel 1 

Nivel 2 

Nivel 3 

Diseño de la función 

Lógica en main 

Función creada pero sin parámetros genéricos 

Función genérica + reutilizable 

Reutilización 

No reutilizable 

Se muestra un uso único 

Se muestra múltiples llamadas con éxito 

Documentación mínima 

Ninguna 

Docstring o comentario breve 

Docstring completo + ejemplos de uso 

Reflexión 

“¿Cómo facilita la reutilización de esta función el mantenimiento y la extensión futura del programa?” 

Shape 

4. Conclusión 

Este diseño en cuatro etapas asegura una progresión clara desde el uso elemental de operadores hasta la creación de componentes de código reutilizables. Cada RA está vinculado a una mini-rúbrica formativa que orienta al estudiante y al docente, garantizando feedback concreto y rutas de mejora personalizadas. 