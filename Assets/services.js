// Se obtiene la dirección actual para validar que me servicios se usan.
const URLactual = window.location.toString();

// Se obtienen los inputs de los archivos
const input1 = document.getElementById("img_file1");
const input2 = document.getElementById("img_file2");
const input3 = document.getElementById("img_file3");
const input4 = document.getElementById("img_file4");

// Creación de variable
let canvas;
let ctx;
let archivo;
let reader;

let chatBox;
let messageInput;
let sendButton;

// Cración de los eventos para cada archivo
input1.addEventListener("change", async (event) => {
  callMethod(event, 1);
});
input2.addEventListener("change", async (event) => {
  callMethod(event, 2);
});

// Input para la usar la url de la imagen
input3.addEventListener("change", async (event) => {
  callMethod(event, 3);
});

input4.addEventListener("change", async (event) => {
  callMethod(event, 4);
});

/**
 * Método para mostrar la imagen y llamar el servicio correspondiente
 * @param {Event} event
 * @param {Number} number Identificador sección
 */
const callMethod = async (event, number) => {
  // Se obtiene el canvas asociado a cada input
  canvas = document.getElementById(`imagen${number}`);
  ctx = canvas.getContext("2d");
  canvas.width = 500
  canvas.height = 500

  // Creación de variables para el buffer y el código en base 64
  let arrayBuffer;
  let base64Code = "";

  // Si el input no es el de url se obtiene la imagen de manera local
  if (number != 3) {
    archivo = event.target.files[0];
    reader = new FileReader();

    reader.addEventListener("loadend", () => {
      base64Code = reader.result;
    });

    reader.readAsDataURL(archivo);

    // Se obtiene el valor en binario de la imagen
    arrayBuffer = await archivo.arrayBuffer();
  }

  // Se limpia el canvas para eliminar la imagen anterior e imprimir una nueva
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Creación de una nueva imagen
  const img = new Image();

  // Si el input no es de url se usa el código en base 64
  img.src = number != 3 ? base64Code : input3.value;

  // Se le asigna una tamaño predefinido a la imagen
  img.width = 500;
  img.height = 500;

  // Cuando la imagen se cargue, se dibuja en el canvas
  img.onload = async () => {
    ctx.drawImage(img, 0, 0, 500, 500);
    // const res = await fetch(ctx.canvas.toDataURL(archivo.type))
    // const buffer = await res.arrayBuffer()
    // const arrayBuffer = new Uint8Array(buffer)
    // await facesService(arrayBuffer, img, number);
  };

  // Se llama el servicio correspondiente a cada ruta
  if (URLactual.includes("faces.html")) {
    img.onload = async () => {
      ctx.drawImage(img, 0, 0, 500, 500);
      if(number != 3){
        const res = await fetch(ctx.canvas.toDataURL(archivo.type))
        const buffer = await res.arrayBuffer()
        const arrayBuffer = new Uint8Array(buffer)
      }
      await facesService(arrayBuffer, img, number);

    };
  } else if (URLactual.includes("detecting.html")) {
    await objectDetection(arrayBuffer, img, number);
    await imageAnalyze(arrayBuffer, number);
  }

  if (URLactual.includes("analize.html")) {
    await imageClassify(arrayBuffer, number);
  }
};

/**
 * Servicio de análisis de imagenes
 * @param {ArrayBuffer} arrayBuffer
 * @param {Number} number Identificador sección
 */
const imageAnalyze = async (arrayBuffer, number) => {
  // Creación del json para el input de url
  const data = { Url: "" + input3.value + "" };

  // Creación de la url
  const url =
    "https://compuitervisionforretoia.cognitiveservices.azure.com/vision/v3.2/analyze?visualFeatures=Categories,Description,Objects";

  // Se crea el header y se válida el tipo de contenido dependiendo del input
  // Si es url, se envía un json y en caso contrario una archivo binario
  const headers = {
    "Ocp-Apim-Subscription-Key": "20b98d0827694797a0ade6d16d261a79",
    "Content-Type":
      number == 3 ? "application/json" : "application/octet-stream",
  };

  // Se realiza la petición
  fetch(url, {
    method: "POST",
    headers: headers,
    // Si el input es de url se envia un JSON y sino el array buffer
    body: number == 3 ? JSON.stringify(data) : arrayBuffer,
  })
    .then((response) => response.json())
    .then(async (data) => {
      // Se realiza la desestructuración del json obtenido
      const {
        description: {
          captions: [{ text: imageDescription }],
        },
      } = data;

      // ctx.font = "bold 30px Arial";

      // if (objects.length > 0) {
      //   console.log(objects);
      //   objects.forEach(({ rectangle: { x, y, w, h } }) => {
      //     ctx.fillStyle = "#7cd9ab4c";
      //     ctx.fillRect(x, y, w, h);
      //   });
      // }

      // Si la ruta es la de detección de objetos se traduce la descripción de la imagen
      if (URLactual.includes("detecting.html")) {
        translateService(
          "en",
          imageDescription[0].toUpperCase() + imageDescription.slice(1),
          "tabla",
          number
        );
      }
    })
    .catch((e) => {
      console.error("Error: " + e);
      alert("Archivo no permitido");
    });
};

/**
 * Servicio de clasificación de imágenes
 * @param {ArrayBuffer} arrayBuffer
 * @param {Number} number Identificador sección
 */
const imageClassify = async (arrayBuffer, number) => {
  // Creación del json para el input de url
  const data = { Url: "" + input3.value + "" };

  // Se obtiene la tabla de probabilidades asociada a cada input
  const tablaProbabilidades = document.getElementById(`info${number}`);

  // Se obtienen los endpoints de cada servicio
  const classifyByurl =
    "https://retoiaservices.cognitiveservices.azure.com/customvision/v3.0/Prediction/f8e5a4ef-0bf6-4136-a545-f1a7cf4490bf/classify/iterations/Iteration8/url";
  const classifyByImage =
    "https://retoiaservices.cognitiveservices.azure.com/customvision/v3.0/Prediction/f8e5a4ef-0bf6-4136-a545-f1a7cf4490bf/classify/iterations/Iteration8/image";

  // Se crea el header y se válida el tipo de contenido dependiendo del input
  // Si es url, se envía un json y en caso contrario una archivo binario
  const headers = {
    "Prediction-Key": "3b2847d34e1b4f57a130116a64f3f45e",
    "Content-Type":
      number == 3 ? "application/json" : "application/octet-stream",
  };

  // Se realiza la petición
  fetch(number == 3 ? classifyByurl : classifyByImage, {
    method: "POST",
    headers: headers,
    // Si el input es de url se envia un JSON y sino el array buffer
    body: number == 3 ? JSON.stringify(data) : arrayBuffer,
  })
    .then((response) => response.json())
    .then((data) => {
      //  Desestructuración del json obtenido
      const { predictions } = data;

      // Inicialización del contenido de la tabla
      tablaProbabilidades.textContent = "";

      // Creación de una fila por cada prediction obtenida
      predictions.forEach(({ tagName, probability }) => {
        // Creación del elemento para la fila
        const registro = document.createElement("tr");

        // Creación del elemento para la columna
        const campoObjeto = document.createElement("td");

        // Se asigna el valor de la etiqueta a la columna de objeto

        campoObjeto.textContent = tagName == "Negative" ? "Otro" : tagName;

        // Creación del elemento para la columna
        const campoProbabilidad = document.createElement("td");

        // Se asigna el valor de la probabilidad a la columna de probabilidad y redondea el valor
        campoProbabilidad.textContent = Math.round(probability * 100) + "%";

        // Se asigna cada elemento creado a la fila
        registro.appendChild(campoObjeto);
        registro.appendChild(campoProbabilidad);

        // Se añade el registro a la tabla
        tablaProbabilidades.appendChild(registro);
      });

      // Validación de mensajes dependiendo del tagName, si el tagName no es negativo
      // se muestra muestra el mensaje que menciona el objeto encontrado,
      // en caso contrario muestra un mensaje de que no encontró ningun objeto
      const message =
        predictions[0].tagName != "Negative"
          ? `Hemos encontrado al menos un${
              (predictions[0].tagName != "Persona" ? " " : "a ") +
              predictions[0].tagName
            } en la imágen que nos proporcionaste`
          : "No hemos detectado una entidad conocida en la imágen que nos proporcionaste";

      // Se llama el servicio de traducción
      translateService("es", message, "tabla", number);
    })
    .catch((e) => {
      console.error("Error: " + e);
      // alert("Archivo no permitido");
    });
};

/**
 * Servicio de traducción
 * @param {String} from Lenguaje actual
 * @param {String} message
 * @param {String} llamada Tipo de llamada, si es "tabla" se muestra la tabla con las traducciones y el speech, sino retorna el valor de la traducción
 * @param {Number} number Identificador sección
 * @returns
 */
const translateService = async (from = "es", message, llamada, number) => {
  // Se obtiene la tabla de traducciones segun la sección
  const tablaTraducciones = document.getElementById(`tradu${number}`);

  // Creación de los array para los códigos iso-639-1 y los idiomas asociados ellos
  const toLanguage = ["en", "es", "fr", "zh-Hans", "pt"];
  const languages = ["English", "Español", "Français", "中国人", "Português"];

  try {
    // Se realiza la petición
    await fetch(
      `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${from}&to=${toLanguage.join(
        "&to="
      )}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": "da5ff499bf4347b69b8f01706e73b128",
          "Ocp-Apim-Subscription-Region": "eastus",
          "Content-Type": "application/json",
        },
        body: `[{"text": "${message}"}]`,
      }
    )
      .then((response) => response.json())
      .then((data) => {
        // Desestructuración del json obtenido
        const [{ translations }] = data;
        // Validación del tipo de llamada para la creación de la tabla de traducciones
        if (llamada == "tabla") {
          // Si la ruta es la de detección de objetos se muestra la descripción de la imagen
          if (URLactual.includes("detecting.html")) {
            const description = document.getElementById(
              `image_description${number}`
            );
            description.textContent = translations[1].text;
          }

          // Inicalización de la tabla
          tablaTraducciones.textContent = "";

          translations.forEach((translation, index) => {
            // Creación de filas, columas y asignación de valores a cada elemento correspondiente
            const registro = document.createElement("tr");
            const campoIdioma = document.createElement("td");
            campoIdioma.textContent =
              languages[toLanguage.indexOf(translation.to)];

            const campoTexto = document.createElement("td");
            campoTexto.textContent = translation.text;
            const campoButton = document.createElement("td");

            // Creación del botón para speech
            campoButton.innerHTML = `<button type="button" class="btn btn-secondary rounded" onclick='speech("${translation.text}",${index})'>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            viewBox="0 0 640 512"
          >
           <path
              d="M533.6 32.5C598.5 85.3 640 165.8 640 256s-41.5 170.8-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"
            />
          </svg>
          </button>`;

            // Se asigna cada campo a la fila
            registro.appendChild(campoIdioma);
            registro.appendChild(campoTexto);
            registro.appendChild(campoButton);

            // Se guarda el registro
            tablaTraducciones.appendChild(registro);
          });
        } else {
          // En caso de no requerir la tabla, se muestra la descripción
          const description = document.getElementById(
            `image_description${number}`
          );
          description.textContent = translations[1].text;
        }
      });
  } catch (err) {
    return console.log(err);
  }
};

/**
 * Servicio de speech
 * @param {*} mensaje
 * @param {*} index Posición del idioma
 */
const speech = async (mensaje, index) => {
  // Creación del endpoint
  const url = `https://eastus.tts.speech.microsoft.com/cognitiveservices/v1`;
  // Función para crear el audio
  const audio = (lang, name, message) => {
    return `<speak version='1.0' xml:lang='${lang}'>
    <voice xml:lang='${lang}' xml:gender='Female' name='${name}'>${mensaje} </voice>
  </speak>`;
  };
  let ssml = "";
  // Aignación del audio dependiendo de la posición del idioma
  switch (index) {
    case 0:
      ssml = audio("en-US", "en-US-EmmaNeural", mensaje);
      break;
    case 1:
      ssml = audio("es-Co", "es-CO-SalomeNeural", mensaje);
      break;
    case 2:
      ssml = audio("fr-FR", "fr-FR-BrigitteNeural", mensaje);
      break;
    case 3:
      ssml = audio("zh-CN-henan", "zh-CN-henan-YundengNeural", mensaje);
      break;
    case 4:
      ssml = audio("pt-P", "pt-PT-FernandaNeural", mensaje);
      break;
    default:
      break;
  }

  // Creación de los headers
  const headers = {
    "Ocp-Apim-Subscription-Key": `5b894e15f0e04b9e8453209c394e5ca7`,
    "Content-Type": "application/ssml+xml",
    "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
  };

  // Se realiza la petición
  await fetch(url, {
    method: "POST",
    headers,
    body: ssml,
  })
    .then((response) => response.blob())
    .then((data) => {
      // Asignación del audio al elemento de audio
      urlAudio = URL.createObjectURL(data);
      const audioTag = document.getElementById("audio");
      audioTag.src = urlAudio;
    });
};

/**
 *
 * @param {ArrayBuffer} arrayBuffer
 * @param {Element} img
 * @param {Number} number Identificador de la sección
 */
const facesService = async (arrayBuffer, img, number) => {
  const data = { Url: "" + input3.value + "" };
  // Creación del endpoint
  const url =
    "https://faceserviceforretoia.cognitiveservices.azure.com/face/v1.0/detect?detectionModel=detection_01";

  // Se crean los headers
  const headers = {
    "Ocp-Apim-Subscription-Key": "6850e40320da4781bd445c51f074ff6b",
    "Content-Type":
      number == 3 ? "application/json" : "application/octet-stream",
  };

  const image = img;
  // Se realiza la peticioón
  fetch(url, {
    method: "POST",
    headers: headers,
    body: number == 3 ? JSON.stringify(data) : arrayBuffer,
  })
    .then((response) => response.json())
    .then(async (data) => {
      console.log(data)
      const faces = data;

      // Se obtiene el canvas correspondiente a la sección
      const canvas = document.getElementById(`imagen${number}`);
      const ctx = canvas.getContext("2d");

      // Se dibuja la imagen
      ctx.drawImage(image, 0, 0, 500, 500);
console.log(image);
      // Se válida si hay rostros detectados
      if (faces.length > 0) {
        // Creación de un recuadro en cada rostro detectado
        faces.forEach(({ faceRectangle: { top, left, width, height } }) => {
          ctx.strokeStyle = "#00ff00";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.rect(left, top, width, height);
          ctx.stroke();
        });
      }
    })
    .catch((e) => {
      console.error("Error: " + e);
      alert("Archivo no permitido");
    });
};

/**
 *
 * @param {ArrayBuffer} arrayBuffer
 * @param {Element} img
 * @param {Number} number
 */
const objectDetection = async (arrayBuffer, img, number) => {
  // Creación del json para el input de url
  const data = { Url: "" + input3.value + "" };

  // Creación de una url dependiendo si es para enviar una url o un valor binario
  const url =
    "https://retoiaservices.cognitiveservices.azure.com/customvision/v3.0/Prediction/b7c5d5d1-1737-418a-aeae-52c07fdcf680/detect/iterations/Iteration1/";
  const detectByUrl = url + "url";

  const detectByImage = url + "image";

  // Creación de los headers
  const headers = {
    "Prediction-Key": "3b2847d34e1b4f57a130116a64f3f45e",
    "Content-Type":
      number == 3 ? "application/json" : "application/octet-stream",
  };

  const image = img;

  // Se realiza la petición
  fetch(number == 3 ? detectByUrl : detectByImage, {
    method: "POST",
    headers: headers,
    body: number == 3 ? JSON.stringify(data) : arrayBuffer,
  })
    .then((response) => response.json())
    .then(async (data) => {
      // Desestrucuración del json obtenido
      const { predictions } = data;

      // Se obtiene el canvas corerspondiente a la sección
      const canvas = document.getElementById(`imagen${number}`);
      const ctx = canvas.getContext("2d");

      // Se dibuja la imagen y se estiliza la fuente
      ctx.drawImage(image, 0, 0, 500, 500);
      ctx.font = "bold 20px sans-serif";

      // Se válida si hay predicciones
      if (predictions.length > 0) {
        // Se ordena el arreglo de mayor a menor según la probabilidad
        predictions.sort((a, b) => b.probability - a.probability);

        predictions.forEach(({ probability, boundingBox, tagName }) => {
          if (probability * 100 >= 70) {
            // Creación de un color diferente para cada etiqueta
            const color =
              tagName == "Persona"
                ? "#00ff00"
                : tagName == "Pato"
                ? "#0000ff"
                : "#ff00ff";

            // Se toma el ancho y alto del canvas
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;

            // Se realiza una operación para obtener la posición y tamaño del recuadro
            const x = boundingBox.left * canvasWidth;
            const y = boundingBox.top * canvasHeight;

            const width = boundingBox.width * canvasWidth;
            const height = boundingBox.height * canvasHeight;

            // Se crea el recuadro
            ctx.strokeStyle = color + "9c";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.rect(x, y, width, height);
            ctx.stroke();

            // Se posiciona el texto
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = color;

            ctx.fillText(tagName, x + width / 2, y + height / 2);
          }
        });
      }
    })
    .catch((e) => {
      console.error("Error: " + e);
      alert("Archivo no permitido");
    });
};

/**
 * Función para enviar el mensaje al chatbot
 */
function sendMessage() {
  const userMessage = messageInput.value.toLowerCase();
  // Validación de si el valor está vacío
  if (userMessage.trim() !== "") {
    // Se muestra el mensaje
    displayMessage("Tú: " + messageInput.value, "user");

    // Se envía el mensaje el chatbot
    botRequest(userMessage);

    // Se reinicia el valor del input
    messageInput.value = "";
  }
}

/**
 * Función para mostrar el mensaje
 * @param {String} message
 * @param {String} sender Es quien envía el mensaje, si el chatbot o el usuario
 */
function displayMessage(message, sender) {
  const messageElement = document.createElement("div");
  // Dependiendo del sender se muestra un estilo de mensaje
  messageElement.className =
    sender === "user"
      ? "alert alert-success text-right user"
      : "alert alert-info text-left bot";

  // Asignación del mensaje al elemento
  messageElement.textContent = message;

  // Asignación del mensaje al chatBox y se realiza un auto scroll hacía abajo
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Función para realizar la petición al chatbot
 * @param {String} userMessage
 */
async function botRequest(userMessage) {
  // Creación del JSON que será enviado
  const data = {
    top: 1,
    question: " " + userMessage + " ",
    includeUnstructuredSources: true,
    confidenceScorehreshold: 0,
    answerSpanRequest: {
      enable: true,
      topAnswersWithSpan: 0,
      confidenceScorehreshold: 1,
    },
    filters: {
      metadataFilter: {
        logicalOperation: "AND",
      },
    },
  };

  // Creación del endpoint
  const url =
    "https://chatbotforretoia.cognitiveservices.azure.com/language/:query-knowledgebases?projectName=chatbotretoia&api-version=2021-10-01&deploymentName=test";
  fetch(url, {
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": "e50b474a942b4fdf985f77c5a0f75408",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then((data) => {
      // Se obtiene el mesaje y se muestra la respuesta
      const botResponse = data.answers[0].answer;
      displayMessage("Bot: " + botResponse, "bot");
    });
}

/**
 * Función para mostrar u ocultar el bot
 */
function showBot() {
  const bot = document.getElementById("divBot");
  bot.classList.remove("hidden");
  bot.classList.add("show");

  chatBox = document.getElementById("chatBox");
  messageInput = document.getElementById("messageInput");
  sendButton = document.getElementById("sendButton");

  sendButton.addEventListener("click", sendMessage);
  messageInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      sendMessage();
    }
  });
}
